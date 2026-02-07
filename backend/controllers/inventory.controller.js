import MenuItem from '../models/MenuItem.js';

// @desc    Get inventory (simplified menu items)
// @route   GET /api/inventory/:restaurantId
// @access  Private (Owner/Chef/Admin)
export const getInventory = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;

        // Security check
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CHEF' && req.user.restaurant?.toString() !== restaurantId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view inventory for this restaurant'
            });
        }

        const items = await MenuItem.find({ restaurant: restaurantId, isDeleted: false })
            .select('name category stockQuantity lowStockThreshold isLowStock isAvailable image')
            .sort({ isLowStock: -1, stockQuantity: 1 }); // Low stock items first

        res.status(200).json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update stock quantity
// @route   PATCH /api/inventory/:itemId
// @access  Private (Owner/Chef/Admin)
export const updateStock = async (req, res, next) => {
    try {
        const { quantity } = req.body;
        const menuItem = await MenuItem.findById(req.params.itemId);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        // Security
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CHEF' && req.user.restaurant?.toString() !== menuItem.restaurant.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this item'
            });
        }

        menuItem.stockQuantity = quantity;

        // Auto-update status based on new quantity
        if (menuItem.stockQuantity <= 0) {
            menuItem.stockQuantity = 0;
            menuItem.isAvailable = false;
        } else if (!menuItem.isAvailable && menuItem.stockQuantity > 0) {
            // Optional: Auto-enable if stock added? Let's keep it manual or user preference
            // For now, let's just update the low stock flag
        }

        menuItem.isLowStock = menuItem.stockQuantity <= menuItem.lowStockThreshold;

        await menuItem.save();

        res.status(200).json({
            success: true,
            data: menuItem,
            message: 'Stock updated successfully'
        });
    } catch (error) {
        next(error);
    }
};
