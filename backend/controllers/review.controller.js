import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Order from '../models/Order.js';

// @desc    Create review
// @route   POST /api/reviews
// @access  Public
export const createReview = async (req, res, next) => {
    try {
        const { orderId, restaurantId, rating, comment, customerName, customerEmail } = req.body;

        // Sanitize inputs - handle string "null" or empty strings from client
        const cleanOrderId = orderId && orderId !== 'null' && orderId !== 'undefined' ? orderId : null;
        const cleanRestaurantId = restaurantId && restaurantId !== 'null' && restaurantId !== 'undefined' ? restaurantId : null;

        let finalRestaurantId = cleanRestaurantId;

        // If orderId is provided, validate it and use its restaurant context
        if (cleanOrderId) {
            const order = await Order.findById(cleanOrderId);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }
            finalRestaurantId = order.restaurant;

            // Check if review already exists for this order
            const existingReview = await Review.findOne({ order: cleanOrderId });
            if (existingReview) {
                return res.status(400).json({
                    success: false,
                    message: 'Review already submitted for this order'
                });
            }
        }

        if (!finalRestaurantId) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant context is required to leave a review.'
            });
        }

        // Prepare review data
        const reviewData = {
            restaurant: finalRestaurantId,
            rating: Number(rating),
            comment,
            customerName: customerName || 'Guest Customer',
            customerEmail,
            isPublished: true
        };

        // Only include order if it exists (partial index handles nulls if we omit the key)
        if (cleanOrderId) {
            reviewData.order = cleanOrderId;
        }

        const review = await Review.create(reviewData);

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: review
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get reviews for restaurant
// @route   GET /api/reviews?restaurant=:id
// @access  Public
export const getReviews = async (req, res, next) => {
    try {
        const { restaurant, rating } = req.query;

        if (!restaurant || restaurant === 'null') {
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID is required'
            });
        }

        const query = {
            restaurant: new mongoose.Types.ObjectId(restaurant),
            isPublished: true,
            isSpam: false,
            isDeleted: false
        };

        if (rating) {
            query.rating = parseInt(rating);
        }

        const reviews = await Review.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        // Calculate average rating with explicit ObjectId casting
        const stats = await Review.aggregate([
            {
                $match: {
                    restaurant: new mongoose.Types.ObjectId(restaurant),
                    isPublished: true,
                    isSpam: false,
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: '$restaurant',
                    avgRating: { $avg: '$rating' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            count: reviews.length,
            averageRating: stats[0]?.avgRating || 0,
            totalReviews: stats[0]?.count || 0,
            data: reviews
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reply to review
// @route   POST /api/reviews/:id/reply
// @access  Private (Owner)
export const replyToReview = async (req, res, next) => {
    try {
        const { message } = req.body;

        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        review.ownerReply = {
            message,
            repliedAt: new Date(),
            repliedBy: req.user._id
        };

        await review.save();

        res.status(200).json({
            success: true,
            message: 'Reply added successfully',
            data: review
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark review as spam
// @route   PATCH /api/reviews/:id/spam
// @access  Private (Owner/Admin)
export const markAsSpam = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        review.isSpam = true;
        review.isPublished = false;
        await review.save();

        res.status(200).json({
            success: true,
            message: 'Review marked as spam'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (Admin)
export const deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        review.isDeleted = true;
        await review.save();

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
