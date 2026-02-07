import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user || !req.user.isActive) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found or inactive'
                });
            }

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            });
        }
    } catch (error) {
        next(error);
    }
};

// Role-based authorization
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};

// Restaurant ownership verification
export const verifyRestaurantOwnership = async (req, res, next) => {
    try {
        let restaurantId = req.params.restaurantId || req.params.id || req.body.restaurant || req.query.restaurant;

        // Fallback for OWNER/CHEF/WAITER if restaurantId is missing from request
        if (!restaurantId && ['OWNER', 'CHEF', 'WAITER'].includes(req.user.role)) {
            restaurantId = req.user.restaurant?.toString();
        }

        if (!restaurantId) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID is required'
            });
        }

        // Set restaurantId on request for controllers to use
        req.restaurantId = restaurantId;

        // Admin can access all restaurants
        if (req.user.role === 'ADMIN') {
            return next();
        }

        // Check if user is associated with the restaurant
        const userRestaurantId = req.user.restaurant?.toString();

        if (['OWNER', 'CHEF', 'WAITER'].includes(req.user.role) && userRestaurantId !== restaurantId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this restaurant'
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};
