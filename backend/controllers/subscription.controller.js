import Restaurant from '../models/Restaurant.js';
import logger from '../utils/logger.js';

/**
 * @desc    Get current subscription status
 * @route   GET /api/subscriptions/status
 * @access  Private
 */
export const getSubscriptionStatus = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        res.status(200).json({
            success: true,
            data: restaurant.subscription
        });
    } catch (error) {
        next(error);
    }
};
