import Order from '../models/Order.js';

// @desc    Get KDS orders (active kitchen orders)
// @route   GET /api/kds/orders?restaurant=:id
// @access  Private (Chef/Owner)
export const getKDSOrders = async (req, res, next) => {
    try {
        const { restaurant } = req.query;

        if (!restaurant) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID is required'
            });
        }

        // Get active orders (not served or cancelled)
        const orders = await Order.find({
            restaurant,
            status: { $in: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] }
        })
            .populate('table', 'name location')
            .populate('items.menuItem', 'name preparationTime')
            .sort({ createdAt: 1 }); // FIFO - oldest first

        // Add time elapsed since order creation
        const ordersWithTime = orders.map(order => {
            const timeElapsed = Math.floor((Date.now() - order.createdAt.getTime()) / 1000 / 60); // minutes

            return {
                ...order.toObject(),
                timeElapsed,
                priority: timeElapsed > 15 ? 'HIGH' : timeElapsed > 10 ? 'MEDIUM' : 'NORMAL'
            };
        });

        res.status(200).json({
            success: true,
            count: ordersWithTime.length,
            data: ordersWithTime
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get KDS statistics
// @route   GET /api/kds/stats?restaurant=:id
// @access  Private (Chef/Owner)
export const getKDSStats = async (req, res, next) => {
    try {
        const { restaurant } = req.query;

        if (!restaurant) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID is required'
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stats = {
            pending: await Order.countDocuments({ restaurant, status: 'PENDING' }),
            preparing: await Order.countDocuments({ restaurant, status: 'PREPARING' }),
            ready: await Order.countDocuments({ restaurant, status: 'READY' }),
            todayCompleted: await Order.countDocuments({
                restaurant,
                status: 'SERVED',
                servedAt: { $gte: today }
            }),
            todayTotal: await Order.countDocuments({
                restaurant,
                createdAt: { $gte: today }
            })
        };

        // Calculate average preparation time for today
        const completedOrders = await Order.find({
            restaurant,
            status: 'SERVED',
            servedAt: { $gte: today }
        }).select('createdAt servedAt');

        if (completedOrders.length > 0) {
            const totalPrepTime = completedOrders.reduce((sum, order) => {
                return sum + (order.servedAt - order.createdAt);
            }, 0);
            stats.avgPrepTime = Math.floor(totalPrepTime / completedOrders.length / 1000 / 60); // minutes
        } else {
            stats.avgPrepTime = 0;
        }

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
};
