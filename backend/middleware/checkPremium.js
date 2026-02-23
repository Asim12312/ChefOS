import Restaurant from '../models/Restaurant.js';

/**
 * Middleware to check if the restaurant has an active Premium subscription
 * This version is for Private (logged-in) routes using req.user
 * Allows ADMIN role to bypass
 */
export const checkPremium = async (req, res, next) => {
    try {
        // Bypass for Global Admins
        if (req.user.role === 'ADMIN') {
            return next();
        }

        const restaurantId = req.user.restaurant;
        if (!restaurantId) {
            return res.status(403).json({
                success: false,
                message: 'No restaurant associated with this user'
            });
        }

        const restaurant = await Restaurant.findById(restaurantId).populate('subscription');

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        if (restaurant.subscription?.plan?.name !== 'PREMIUM') {
            return res.status(403).json({
                success: false,
                message: 'This feature is only available for Premium subscribers',
                premiumRequired: true
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Public version of premium check (e.g. for customers using Chef AI)
 * Checks premium status based on restaurantId in body or query
 */
export const checkPremiumPublic = async (req, res, next) => {
    try {
        const restaurantId = req.body.restaurantId || req.query.restaurantId;

        if (!restaurantId) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID is required'
            });
        }

        const restaurant = await Restaurant.findById(restaurantId).populate('subscription');

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        if (restaurant.subscription?.plan?.name !== 'PREMIUM') {
            return res.status(403).json({
                success: false,
                message: 'This feature is currently disabled for this restaurant (Premium required)',
                premiumRequired: true
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};
