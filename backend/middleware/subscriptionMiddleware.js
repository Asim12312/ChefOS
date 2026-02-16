import Restaurant from '../models/Restaurant.js';

/**
 * Middleware to check if restaurant has premium subscription
 */
export const requirePremium = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id })
            .populate('subscription');

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        const subscription = restaurant.subscription;

        // Check if subscription exists, is premium, and active
        const isPremium = subscription &&
            subscription.plan?.name === 'PREMIUM' &&
            subscription.isActive();

        if (!isPremium) {
            return res.status(403).json({
                success: false,
                message: 'Premium subscription required for this feature',
                code: 'PREMIUM_REQUIRED'
            });
        }

        req.restaurant = restaurant;
        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error checking subscription' });
    }
};

/**
 * Middleware to enforce table limits based on plan
 */
export const checkTableLimit = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id })
            .populate('subscription');

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        const subscription = restaurant.subscription;
        const currentTables = restaurant.tables?.length || 0;

        // Default limit for FREE plan
        const FREE_LIMIT = 2;

        const isPremium = subscription &&
            subscription.plan?.name === 'PREMIUM' &&
            subscription.isActive();

        if (!isPremium && currentTables >= FREE_LIMIT) {
            return res.status(403).json({
                success: false,
                message: `Free plan is limited to ${FREE_LIMIT} tables. Upgrade to Premium for unlimited tables.`,
                code: 'TABLE_LIMIT_REACHED'
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error checking limits' });
    }
};

/**
 * Middleware factory to check feature access
 */
export const checkFeatureAccess = (featureName) => async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id })
            .populate('subscription');

        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        const subscription = restaurant.subscription;

        // Define feature requirements (could be moved to config)
        const PREMIUM_FEATURES = [
            'ai_assistant',
            'advanced_analytics',
            'inventory_management',
            'white_label',
            'voice_ordering'
        ];

        if (PREMIUM_FEATURES.includes(featureName)) {
            const isPremium = subscription &&
                subscription.plan?.name === 'PREMIUM' &&
                subscription.isActive();

            if (!isPremium) {
                return res.status(403).json({
                    success: false,
                    message: `feature ${featureName} requires Premium subscription`,
                    code: 'PREMIUM_REQUIRED'
                });
            }
        }

        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error checking feature access' });
    }
};
