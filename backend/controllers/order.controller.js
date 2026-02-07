import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';

// @desc    Create order
// @route   POST /api/orders
// @access  Public
export const createOrder = async (req, res, next) => {
    try {
        const { restaurant, table, items, customerName, customerPhone, specialInstructions, paymentMethod } = req.body;

        // Validate restaurant
        const restaurantDoc = await Restaurant.findById(restaurant);
        if (!restaurantDoc || !restaurantDoc.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant not found or inactive'
            });
        }

        if (!restaurantDoc.features.orderingEnabled) {
            return res.status(400).json({
                success: false,
                message: 'Ordering is currently disabled for this restaurant'
            });
        }

        // Validate Table (if provided)
        if (table) {
            const tableDoc = await import('../models/Table.js').then(m => m.default.findById(table));
            if (!tableDoc) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Table ID'
                });
            }
            if (tableDoc.restaurant.toString() !== restaurant) {
                return res.status(400).json({
                    success: false,
                    message: 'Table does not belong to this restaurant'
                });
            }
        }

        // Validate and process items
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const menuItem = await MenuItem.findById(item.menuItem);

            if (!menuItem || menuItem.isDeleted) {
                return res.status(400).json({
                    success: false,
                    message: `Menu item ${item.menuItem} not found`
                });
            }

            if (!menuItem.isAvailable) {
                return res.status(400).json({
                    success: false,
                    message: `${menuItem.name} is currently unavailable`
                });
            }

            // Stock Check
            if (menuItem.stockQuantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${menuItem.name}. Only ${menuItem.stockQuantity} left.`
                });
            }

            const itemTotal = menuItem.price * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                menuItem: menuItem._id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: item.quantity,
                specialInstructions: item.specialInstructions
            });
        }

        // Calculate tax and total
        const tax = (subtotal * restaurantDoc.taxRate) / 100;
        const total = subtotal + tax;

        // Create order
        const order = await Order.create({
            restaurant,
            table,
            items: orderItems,
            subtotal,
            tax,
            total,
            customerName,
            customerPhone,
            specialInstructions,
            paymentMethod: paymentMethod || 'CASH',
            orderSource: 'MANUAL'
        });

        // Populate order details
        await order.populate('table');

        // Update Table Status if it's a dine-in order
        if (table) {
            try {
                const Table = await import('../models/Table.js').then(m => m.default);
                const tableDoc = await Table.findById(table);
                if (tableDoc && tableDoc.status === 'FREE') {
                    tableDoc.status = 'OCCUPIED';
                    tableDoc.currentSession = {
                        occupiedAt: new Date(),
                        startTime: new Date(),
                        orderId: order._id
                    };
                    await tableDoc.save();

                    // Emit table update event
                    io.to(`restaurant:${restaurant}`).emit('table:updated', tableDoc);
                }
            } catch (tableError) {
                console.error('Failed to update table status:', tableError);
            }
        }

        // Emit real-time event via Socket.IO
        const io = req.app.get('io');
        io.to(`restaurant:${restaurant}`).emit('order:created', {
            order,
            message: `New order #${order.orderNumber} from ${order.table?.name || 'Takeout'}`
        });

        io.to(`kds:${restaurant}`).emit('kds:new-order', order);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get orders
// @route   GET /api/orders?restaurant=:id&status=:status&table=:tableId
// @access  Private (Owner/Chef)
export const getOrders = async (req, res, next) => {
    try {
        let { restaurant, status, table, startDate, endDate } = req.query;

        // Support for /restaurant/:restaurantId param style
        if (req.params.restaurantId) {
            restaurant = req.params.restaurantId;
        }

        const query = {};

        if (restaurant) {
            query.restaurant = restaurant;
        }

        if (status) {
            query.status = status;
        }

        if (table) {
            query.table = table;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const orders = await Order.find(query)
            .populate('table', 'name')
            .populate('items.menuItem', 'name image')
            .sort({ createdAt: -1 })
            .limit(100);

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Public
export const getOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('restaurant', 'name logo')
            .populate('table', 'name')
            .populate('items.menuItem', 'name image');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private (Owner/Chef)
export const updateOrderStatus = async (req, res, next) => {
    try {
        const { status, cancellationReason } = req.body;

        const order = await Order.findById(req.params.id).populate('table');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Validate status transition
        const validTransitions = {
            PENDING: ['ACCEPTED', 'CANCELLED'],
            ACCEPTED: ['PREPARING', 'CANCELLED'],
            PREPARING: ['READY', 'CANCELLED'],
            READY: ['SERVED'],
            SERVED: [],
            CANCELLED: []
        };

        if (!validTransitions[order.status].includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot transition from ${order.status} to ${status}`
            });
        }

        order.status = status;

        if (status === 'CANCELLED' && cancellationReason) {
            order.cancellationReason = cancellationReason;
        }

        // Add to status history
        order.statusHistory.push({
            status,
            timestamp: new Date(),
            updatedBy: req.user?._id
        });

        await order.save();

        // Stock Deduction Logic - Only when order is SERVED
        const io = req.app.get('io');

        if (status === 'SERVED') {
            for (const item of order.items) {
                const menuItem = await MenuItem.findById(item.menuItem);
                if (menuItem) {
                    // Deduct stock
                    menuItem.stockQuantity -= item.quantity;

                    // Low stock check
                    if (menuItem.stockQuantity <= menuItem.lowStockThreshold) {
                        menuItem.isLowStock = true;
                        // Emit low stock alert
                        io.to(`restaurant:${order.restaurant}`).emit('inventory:low-stock', {
                            itemId: menuItem._id,
                            name: menuItem.name,
                            remaining: menuItem.stockQuantity
                        });
                    }

                    // Auto-disable if out of stock
                    if (menuItem.stockQuantity <= 0) {
                        menuItem.stockQuantity = 0;
                        menuItem.isAvailable = false;
                        // Emit out-of-stock alert
                        io.to(`restaurant:${order.restaurant}`).emit('inventory:out-of-stock', {
                            itemId: menuItem._id,
                            name: menuItem.name
                        });
                    }

                    await menuItem.save();
                }
            }
        }

        // Stock Restoration Logic - When order is CANCELLED after being SERVED
        if (status === 'CANCELLED') {
            // Check if order was previously served
            const wasServed = order.statusHistory.some(history => history.status === 'SERVED');

            if (wasServed) {
                for (const item of order.items) {
                    const menuItem = await MenuItem.findById(item.menuItem);
                    if (menuItem) {
                        // Restore stock
                        menuItem.stockQuantity += item.quantity;

                        // Re-enable if it was disabled
                        if (!menuItem.isAvailable && menuItem.stockQuantity > 0) {
                            menuItem.isAvailable = true;
                            io.to(`restaurant:${order.restaurant}`).emit('inventory:back-in-stock', {
                                itemId: menuItem._id,
                                name: menuItem.name,
                                quantity: menuItem.stockQuantity
                            });
                        }

                        // Update low stock flag
                        menuItem.isLowStock = menuItem.stockQuantity <= menuItem.lowStockThreshold;

                        await menuItem.save();
                    }
                }
            }
        }

        // Emit real-time event
        io.to(`restaurant:${order.restaurant}`).emit('order:status-changed', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            status: order.status,
            tableName: order.table.name
        });

        io.to(`order:${order._id}`).emit('order:updated', order);
        io.to(`kds:${order.restaurant}`).emit('kds:order-updated', order);

        res.status(200).json({
            success: true,
            message: `Order status updated to ${status}`,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel order
// @route   DELETE /api/orders/:id
// @access  Private (Owner/Chef) or Public (within 5 minutes)
export const cancelOrder = async (req, res, next) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if order can be cancelled
        if (['SERVED', 'CANCELLED'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'Order cannot be cancelled'
            });
        }

        // If not authenticated, check if within 5 minutes
        if (!req.user) {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            if (order.createdAt < fiveMinutesAgo) {
                return res.status(403).json({
                    success: false,
                    message: 'Order can only be cancelled within 5 minutes of creation'
                });
            }
        }

        order.status = 'CANCELLED';
        order.cancellationReason = req.body.reason || 'Cancelled by customer';
        await order.save();

        // Emit real-time event
        const io = req.app.get('io');
        io.to(`restaurant:${order.restaurant}`).emit('order:cancelled', {
            orderId: order._id,
            orderNumber: order.orderNumber
        });

        res.status(200).json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats/:restaurantId
// @access  Private (Owner)
export const getOrderStats = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        const { startDate, endDate } = req.query;

        const matchQuery = { restaurant: restaurantId };

        if (startDate || endDate) {
            matchQuery.createdAt = {};
            if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
            if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
        }

        const stats = await Order.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$total' }
                }
            }
        ]);

        const totalOrders = await Order.countDocuments(matchQuery);
        const totalRevenue = await Order.aggregate([
            { $match: { ...matchQuery, paymentStatus: 'PAID' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
                statusBreakdown: stats
            }
        });
    } catch (error) {
        next(error);
    }
};
// @desc    Update order payment status
// @route   PATCH /api/orders/:id/payment
// @access  Private (Owner/Cashier)
export const updateOrderPayment = async (req, res, next) => {
    try {
        const { paymentStatus, paymentMethod } = req.body;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.paymentStatus = paymentStatus || 'PAID';
        if (paymentMethod) order.paymentMethod = paymentMethod;

        await order.save();

        // If paid and served, free the table
        if (order.paymentStatus === 'PAID' && order.table) {
            try {
                const Table = await import('../models/Table.js').then(m => m.default);
                const tableDoc = await Table.findById(order.table);

                // Only free if this order occupies it
                if (tableDoc && tableDoc.status === 'OCCUPIED' && tableDoc.currentSession?.orderId?.toString() === order._id.toString()) {
                    tableDoc.status = 'FREE';
                    tableDoc.currentSession = {}; // Clear session
                    await tableDoc.save();

                    // Emit table update event
                    const io = req.app.get('io');
                    io.to(`restaurant:${order.restaurant}`).emit('table:updated', tableDoc);
                }
            } catch (tableError) {
                console.error('Failed to free table:', tableError);
            }
        }

        // Emit real-time event
        const io = req.app.get('io');
        io.to(`restaurant:${order.restaurant}`).emit('order:payment-updated', {
            orderId: order._id,
            paymentStatus: order.paymentStatus
        });

        res.status(200).json({
            success: true,
            message: 'Payment status updated',
            data: order
        });
    } catch (error) {
        next(error);
    }
};
