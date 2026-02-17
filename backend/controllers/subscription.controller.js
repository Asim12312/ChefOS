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

        if (subscriptionData) {
            logger.info(`Checking subscription for ${req.user._id}: Status=${subscriptionData.status}, Plan=${subscriptionData.plan?.name}`);
        } else {
            logger.info(`No subscription found for ${req.user._id}`);
        }

        if (subscriptionData && subscriptionData.currentPeriodEnd) {
            const now = new Date();
            const end = new Date(subscriptionData.currentPeriodEnd);
            const diffTime = Math.max(0, end - now);
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        const isPremium = subscriptionData?.plan?.name === 'PREMIUM' && subscriptionData?.isActive();

        res.status(200).json({
            success: true,
            data: {
                ...subscriptionData?.toObject(),
                daysRemaining,
                isPremium
            }
        });
    } catch (error) {
        logger.error(`Error in getSubscriptionStatus: ${error.message}`);
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
            priceId = process.env.STRIPE_PRICE_ID_PREMIUM;
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
            successUrl: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${process.env.FRONTEND_URL}/subscription?canceled=true`,
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
            `${process.env.FRONTEND_URL}/subscription`
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

/**
 * @desc    Sync subscription status with Stripe
 * @route   POST /api/subscriptions/sync
 * @access  Private (Owner)
 */
export const syncSubscription = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });

        if (!restaurant || !restaurant.stripeCustomerId) {
            return res.status(404).json({ success: false, message: 'No billing account found to sync' });
        }

        // Fetch active subscriptions from Stripe
        const result = await stripeService.listActiveSubscriptions(restaurant.stripeCustomerId);

        if (result.success && result.subscriptions.length > 0) {
            const stripeSub = result.subscriptions[0];
            const priceId = stripeSub.items.data[0].price.id;

            // Determine plan based on price ID
            // Ideally we check if priceId matches our premium price ID
            let planName = 'FREE';
            if (priceId === process.env.STRIPE_PRICE_ID_PREMIUM) {
                planName = 'PREMIUM';
            }

            const planDetails = getPlanDetails(planName, priceId);

            // Update or create subscription record
            let subscription = await Subscription.findOne({ restaurant: restaurant._id });

            if (subscription) {
                subscription.stripeSubscriptionId = stripeSub.id;
                subscription.stripePriceId = priceId;
                subscription.status = stripeSub.status.toUpperCase();
                subscription.currentPeriodStart = new Date(stripeSub.current_period_start * 1000);
                subscription.currentPeriodEnd = new Date(stripeSub.current_period_end * 1000);
                subscription.cancelAtPeriodEnd = stripeSub.cancel_at_period_end;
                subscription.plan = {
                    name: planDetails.name,
                    displayName: planDetails.displayName,
                    price: planDetails.price,
                    currency: planDetails.currency,
                    interval: planDetails.interval,
                    features: planDetails.features
                };
                await subscription.save();
            } else {
                subscription = await Subscription.create({
                    restaurant: restaurant._id,
                    stripeCustomerId: restaurant.stripeCustomerId,
                    stripeSubscriptionId: stripeSub.id,
                    stripePriceId: priceId,
                    status: stripeSub.status.toUpperCase(),
                    currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
                    currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
                    cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
                    plan: {
                        name: planDetails.name,
                        displayName: planDetails.displayName,
                        price: planDetails.price,
                        currency: planDetails.currency,
                        interval: planDetails.interval,
                        features: planDetails.features
                    }
                });

                restaurant.subscription = subscription._id;
                await restaurant.save();
            }

            return res.status(200).json({
                success: true,
                message: 'Subscription synced successfully',
                data: {
                    isPremium: planName === 'PREMIUM',
                    status: subscription.status
                }
            });
        } else {
            // No active subscription found in Stripe
            // Determine if we should cancel local subscription
            const subscription = await Subscription.findOne({ restaurant: restaurant._id });
            if (subscription && subscription.isActive()) {
                subscription.status = 'CANCELLED';
                subscription.endedAt = new Date();
                await subscription.save();
            }

            return res.status(200).json({
                success: true,
                message: 'No active subscription found in Stripe',
                data: { isPremium: false }
            });
        }

    } catch (error) {
        logger.error(`Sync subscription error: ${error.message}`);
        next(error);
    }
};
