import Restaurant from '../models/Restaurant.js';
import Subscription from '../models/Subscription.js';
import stripeService from '../services/stripe.service.js';
import logger from '../utils/logger.js';

/**
 * @desc    Get current subscription status
 * @route   GET /api/subscriptions/status
 * @access  Private
 */
export const getSubscriptionStatus = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id })
            .populate('subscription');

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        // Calculate days remaining if subscription exists
        let daysRemaining = 0;
        let subscriptionData = restaurant.subscription;

        if (subscriptionData && subscriptionData.currentPeriodEnd) {
            const now = new Date();
            const end = new Date(subscriptionData.currentPeriodEnd);
            const diffTime = Math.max(0, end - now);
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        res.status(200).json({
            success: true,
            data: {
                ...subscriptionData?.toObject(),
                daysRemaining,
                isPremium: subscriptionData?.plan?.name === 'PREMIUM' && subscriptionData?.isActive()
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create checkout session for subscription
 * @route   POST /api/subscriptions/create-checkout
 * @access  Private (Owner)
 */
export const createCheckoutSession = async (req, res, next) => {
    try {
        const { planId, interval = 'month' } = req.body;

        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        // 1. Ensure Stripe Customer Exists
        let customerId = restaurant.stripeCustomerId;
        if (!customerId) {
            const customer = await stripeService.createOrGetCustomer(
                req.user.email,
                restaurant.name,
                { restaurantId: restaurant._id.toString() }
            );
            customerId = customer.id;
            restaurant.stripeCustomerId = customerId;
            await restaurant.save();
        }

        // 2. Determine Price ID based on Plan
        // In production, these should come from environment variables or a config file
        let priceId;
        if (planId === 'PREMIUM') {
            priceId = interval === 'year'
                ? process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID
                : process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid plan selected' });
        }

        if (!priceId) {
            return res.status(500).json({
                success: false,
                message: 'Price ID not configured. Please contact support.'
            });
        }

        // 3. Create Checkout Session
        const session = await stripeService.createSubscriptionCheckoutSession({
            customerId,
            priceId,
            successUrl: `${process.env.FRONTEND_URL}/owner/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${process.env.FRONTEND_URL}/owner/subscription?canceled=true`,
            metadata: {
                restaurantId: restaurant._id.toString(),
                planId,
                interval
            }
        });

        res.status(200).json({
            success: true,
            url: session.url
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get Billing Portal URL
 * @route   GET /api/subscriptions/portal
 * @access  Private (Owner)
 */
export const getBillingPortal = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });

        if (!restaurant || !restaurant.stripeCustomerId) {
            return res.status(404).json({ success: false, message: 'No billing account found' });
        }

        const session = await stripeService.createBillingPortalSession(
            restaurant.stripeCustomerId,
            `${process.env.FRONTEND_URL}/owner/subscription`
        );

        res.status(200).json({
            success: true,
            url: session.url
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Cancel Subscription (Immediate or End of Period)
 * @route   POST /api/subscriptions/cancel
 * @access  Private (Owner)
 */
export const cancelSubscription = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id }).populate('subscription');

        if (!restaurant || !restaurant.subscription || !restaurant.subscription.stripeSubscriptionId) {
            return res.status(400).json({ success: false, message: 'No active subscription found' });
        }

        await stripeService.cancelSubscription(restaurant.subscription.stripeSubscriptionId);

        res.status(200).json({
            success: true,
            message: 'Subscription has been scheduled for cancellation at the end of the billing period.'
        });
    } catch (error) {
        next(error);
    }
};
