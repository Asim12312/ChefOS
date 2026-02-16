import stripeService from '../services/stripe.service.js';
import safepayService from '../services/safepay.service.js';
import paymentGatewayService from '../services/paymentGateway.service.js';
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import logger from '../utils/logger.js';

// @desc    Create payment intent (Multi-gateway)
// @route   POST /api/payments/create
// @access  Public
export const createPaymentIntent = async (req, res, next) => {
    try {
        const { orderId } = req.body;

        const order = await Order.findById(orderId).populate('restaurant');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.paymentStatus === 'PAID') {
            return res.status(400).json({
                success: false,
                message: 'Order is already paid'
            });
        }

        const currency = order.restaurant.currency || 'USD';
        const preferredGateway = order.restaurant.paymentGateway;

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        // Create payment using gateway service
        const paymentResult = await paymentGatewayService.createPayment({
            amount: order.total,
            currency,
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            restaurantId: order.restaurant._id.toString(),
            successUrl: `${frontendUrl}/order/${order._id}/success`,
            cancelUrl: `${frontendUrl}/order/${order._id}/cancel`,
            preferredGateway
        });

        // Determine gateway used
        const gateway = paymentGatewayService.selectGateway(currency, preferredGateway);

        // Create payment record
        const paymentData = {
            order: order._id,
            restaurant: order.restaurant._id,
            amount: order.total,
            currency,
            paymentMethod: gateway,
            paymentType: 'ORDER',
            status: 'PENDING'
        };

        if (gateway === 'STRIPE') {
            paymentData.paymentIntentId = paymentResult.paymentIntentId;
        } else if (gateway === 'SAFEPAY') {
            paymentData.safepayTracker = paymentResult.tracker;
            paymentData.safepayCheckoutUrl = paymentResult.checkoutUrl;
        }

        const payment = await Payment.create(paymentData);

        res.status(200).json({
            success: true,
            data: {
                gateway,
                paymentId: payment._id,
                amount: order.total,
                currency,
                // Stripe
                ...(gateway === 'STRIPE' && { clientSecret: paymentResult.clientSecret }),
                // Safepay
                ...(gateway === 'SAFEPAY' && {
                    checkoutUrl: paymentResult.checkoutUrl,
                    tracker: paymentResult.tracker
                })
            }
        });
    } catch (error) {
        logger.error(`Payment creation error: ${error.message}`);
        next(error);
    }
};

// @desc    Stripe webhook handler
// @route   POST /api/payments/webhook/stripe
// @access  Public (Stripe)
export const handleStripeWebhook = async (req, res, next) => {
    const sig = req.headers['stripe-signature'];

    try {
        const event = stripeService.verifyWebhookSignature(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        logger.info(`Stripe webhook received: ${event.type}`);

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event.data.object, req);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentIntentFailed(event.data.object);
                break;

            case 'checkout.session.completed':
                // Handle create subscription success
                await handleCheckoutSessionCompleted(event.data.object);
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionUpdate(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object);
                break;

            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object);
                break;

            default:
                logger.info(`Unhandled Stripe event type: ${event.type}`);
        }

        res.json({ received: true });
    } catch (err) {
        logger.error(`Stripe webhook error: ${err.message}`);
        if (process.env.NODE_ENV === 'development') {
            console.error(err);
        }
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
};

// @desc    Safepay webhook handler
// @route   POST /api/payments/webhook/safepay
// @access  Public (Safepay)
export const handleSafepayWebhook = async (req, res, next) => {
    const signature = req.headers['x-sfpy-signature'];

    try {
        // Verify signature
        const isValid = safepayService.verifyWebhookSignature(signature, req.body);

        if (!isValid) {
            logger.warn('Invalid Safepay webhook signature');
            return res.status(401).json({ success: false, message: 'Invalid signature' });
        }

        logger.info(`Safepay webhook received: ${req.body.event}`);

        const webhookData = await safepayService.processWebhook(req.body);

        // Find payment by tracker
        const payment = await Payment.findOne({ safepayTracker: webhookData.tracker });

        if (payment) {
            payment.status = webhookData.status;
            payment.transactionId = webhookData.tracker;
            await payment.save();

            // Update order if payment completed
            if (webhookData.status === 'COMPLETED') {
                const order = await Order.findById(payment.order);
                if (order) {
                    order.paymentStatus = 'PAID';
                    order.paymentMethod = 'ONLINE';
                    await order.save();

                    // Emit real-time notification
                    const io = req.app.get('io');
                    if (io) {
                        io.to(`restaurant:${order.restaurant}`).emit('payment:success', {
                            orderId: order._id,
                            orderNumber: order.orderNumber,
                            amount: payment.amount
                        });

                        io.to(`order:${order._id}`).emit('payment:confirmed', {
                            status: 'PAID',
                            amount: payment.amount
                        });
                    }
                }
            }
        }

        res.json({ received: true });
    } catch (error) {
        logger.error(`Safepay webhook error: ${error.message}`);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }
};

// @desc    Create subscription
// @route   POST /api/payments/subscription/create
// @access  Private (Owner)
export const createSubscription = async (req, res, next) => {
    try {
        const { restaurantId, planName, priceId } = req.body;

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: 'Restaurant not found' });
        }

        // Check if subscription already exists
        if (restaurant.subscription) {
            return res.status(400).json({ success: false, message: 'Restaurant already has an active subscription' });
        }

        let subscriptionData = {
            restaurant: restaurant._id,
            plan: getPlanDetails(planName, priceId),
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        };

        let clientSecret = null;

        // Skip Stripe for FREE plan
        if (planName !== 'FREE') {
            // Create or get Stripe customer
            const customer = await stripeService.createOrGetCustomer(
                restaurant.contact.email || req.user.email,
                restaurant.name,
                { restaurantId: restaurant._id.toString() }
            );

            // Create subscription
            const subscriptionResult = await stripeService.createSubscription({
                customerId: customer.id,
                priceId,
                metadata: {
                    restaurantId: restaurant._id.toString(),
                    plan: planName
                }
            });

            subscriptionData.stripeCustomerId = customer.id;
            subscriptionData.stripeSubscriptionId = subscriptionResult.subscriptionId;
            subscriptionData.stripePriceId = priceId;
            subscriptionData.status = subscriptionResult.status.toUpperCase();
            clientSecret = subscriptionResult.clientSecret;

            restaurant.stripeCustomerId = customer.id;
        }

        // Create subscription record
        const subscription = await Subscription.create(subscriptionData);

        // Update restaurant
        restaurant.subscription = subscription._id;
        await restaurant.save();

        logger.info(`Subscription created for restaurant ${restaurant._id}: ${subscription._id} (${planName})`);

        res.status(201).json({
            success: true,
            data: {
                subscription,
                clientSecret
            }
        });
    } catch (error) {
        logger.error(`Subscription creation error: ${error.message}`);
        next(error);
    }
};

// @desc    Cancel subscription
// @route   POST /api/payments/subscription/cancel
// @access  Private (Owner)
export const cancelSubscription = async (req, res, next) => {
    try {
        const { restaurantId, immediately = false } = req.body;

        const restaurant = await Restaurant.findById(restaurantId).populate('subscription');
        if (!restaurant || !restaurant.subscription) {
            return res.status(404).json({ success: false, message: 'No active subscription found' });
        }

        const subscription = restaurant.subscription;

        // Cancel in Stripe
        await stripeService.cancelSubscription(subscription.stripeSubscriptionId, immediately);

        // Update subscription record
        subscription.status = immediately ? 'CANCELLED' : 'ACTIVE';
        subscription.cancelAtPeriodEnd = !immediately;
        subscription.canceledAt = new Date();
        if (immediately) {
            subscription.endedAt = new Date();
        }
        await subscription.save();

        logger.info(`Subscription cancelled for restaurant ${restaurant._id}`);

        res.status(200).json({
            success: true,
            message: immediately ? 'Subscription cancelled immediately' : 'Subscription will cancel at period end'
        });
    } catch (error) {
        logger.error(`Subscription cancellation error: ${error.message}`);
        next(error);
    }
};

// @desc    Get billing portal session
// @route   GET /api/payments/subscription/portal
// @access  Private (Owner)
export const getBillingPortal = async (req, res, next) => {
    try {
        const { restaurantId } = req.query;

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant || !restaurant.stripeCustomerId) {
            return res.status(404).json({ success: false, message: 'No billing account found' });
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const portalSession = await stripeService.createBillingPortalSession(
            restaurant.stripeCustomerId,
            `${frontendUrl}/dashboard/subscription`
        );

        res.status(200).json({
            success: true,
            url: portalSession.url
        });
    } catch (error) {
        logger.error(`Billing portal error: ${error.message}`);
        next(error);
    }
};

// @desc    Verify payment status
// @route   POST /api/payments/verify
// @access  Public
export const verifyPayment = async (req, res, next) => {
    try {
        const { paymentId } = req.body;

        const payment = await Payment.findById(paymentId).populate('order');

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                status: payment.status,
                order: payment.order,
                amount: payment.amount,
                gateway: payment.paymentMethod
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get payment history
// @route   GET /api/payments/history/:restaurantId
// @access  Private (Owner)
export const getPaymentHistory = async (req, res, next) => {
    try {
        const { restaurantId } = req.params;
        const { startDate, endDate, status } = req.query;

        const query = { restaurant: restaurantId };

        if (status) {
            query.status = status;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const payments = await Payment.find(query)
            .populate('order', 'orderNumber total')
            .sort({ createdAt: -1 })
            .limit(100);

        const totalAmount = await Payment.aggregate([
            { $match: { ...query, status: 'COMPLETED' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.status(200).json({
            success: true,
            count: payments.length,
            totalAmount: totalAmount[0]?.total || 0,
            data: payments
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get available payment methods
// @route   GET /api/payments/methods
// @access  Public
export const getPaymentMethods = async (req, res, next) => {
    try {
        const { currency = 'USD' } = req.query;

        const methods = paymentGatewayService.getAvailablePaymentMethods(currency);

        res.status(200).json({
            success: true,
            data: methods
        });
    } catch (error) {
        next(error);
    }
};

// ========== Helper Functions ==========

async function handlePaymentIntentSucceeded(paymentIntent, req) {
    const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
    if (payment) {
        payment.status = 'COMPLETED';
        payment.transactionId = paymentIntent.id;
        await payment.save();

        // Update order payment status
        const order = await Order.findById(payment.order);
        if (order) {
            order.paymentStatus = 'PAID';
            order.paymentMethod = 'ONLINE';
            await order.save();

            // Emit real-time notification
            const io = req.app.get('io');
            if (io) {
                io.to(`restaurant:${order.restaurant}`).emit('payment:success', {
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    amount: payment.amount
                });

                io.to(`order:${order._id}`).emit('payment:confirmed', {
                    status: 'PAID',
                    amount: payment.amount
                });
            }
        }
    }
}

async function handlePaymentIntentFailed(paymentIntent) {
    const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
    if (payment) {
        payment.status = 'FAILED';
        payment.failureReason = paymentIntent.last_payment_error?.message;
        await payment.save();
    }
}

async function handleCheckoutSessionCompleted(session) {
    if (session.mode === 'subscription') {
        const { restaurantId, planId } = session.metadata;
        const subscriptionId = session.subscription;

        logger.info(`Processing subscription checkout for restaurant: ${restaurantId}`);

        try {
            // Fetch full subscription details from Stripe
            const subDetails = await stripeService.getSubscription(subscriptionId);

            if (subDetails.success) {
                const stripeSub = subDetails.subscription;

                // 1. Get Plan Details
                const planDetails = getPlanDetails(planId, stripeSub.priceId);

                // 2. Find or Create Subscription Record
                let subscription = await Subscription.findOne({ restaurant: restaurantId });

                if (subscription) {
                    // Update existing
                    subscription.stripeSubscriptionId = subscriptionId;
                    subscription.stripePriceId = stripeSub.priceId;
                    subscription.stripeCustomerId = session.customer;
                    subscription.status = stripeSub.status.toUpperCase();
                    subscription.currentPeriodStart = stripeSub.currentPeriodStart;
                    subscription.currentPeriodEnd = stripeSub.currentPeriodEnd;
                    subscription.cancelAtPeriodEnd = stripeSub.cancelAtPeriodEnd;
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
                    // Create new
                    subscription = await Subscription.create({
                        restaurant: restaurantId,
                        stripeCustomerId: session.customer,
                        stripeSubscriptionId: subscriptionId,
                        stripePriceId: stripeSub.priceId,
                        status: stripeSub.status.toUpperCase(),
                        currentPeriodStart: stripeSub.currentPeriodStart,
                        currentPeriodEnd: stripeSub.currentPeriodEnd,
                        cancelAtPeriodEnd: stripeSub.cancelAtPeriodEnd,
                        plan: {
                            name: planDetails.name,
                            displayName: planDetails.displayName,
                            price: planDetails.price,
                            currency: planDetails.currency,
                            interval: planDetails.interval,
                            features: planDetails.features
                        }
                    });
                }

                // 3. Link to restaurant
                await Restaurant.findByIdAndUpdate(restaurantId, {
                    subscription: subscription._id,
                    stripeCustomerId: session.customer
                });

                logger.info(`Subscription activated for restaurant ${restaurantId}`);
            }
        } catch (error) {
            logger.error(`Error handling subscription checkout: ${error.message}`);
        }
    }
}

async function handleSubscriptionUpdate(subscription) {
    const sub = await Subscription.findOne({ stripeSubscriptionId: subscription.id });
    if (sub) {
        sub.status = subscription.status.toUpperCase();
        sub.currentPeriodStart = new Date(subscription.current_period_start * 1000);
        sub.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        sub.cancelAtPeriodEnd = subscription.cancel_at_period_end;
        await sub.save();
    }
}

async function handleSubscriptionDeleted(subscription) {
    const sub = await Subscription.findOne({ stripeSubscriptionId: subscription.id });
    if (sub) {
        sub.status = 'CANCELLED';
        sub.endedAt = new Date();
        await sub.save();
    }
}

async function handleInvoicePaymentSucceeded(invoice) {
    logger.info(`Invoice payment succeeded: ${invoice.id}`);
}

async function handleInvoicePaymentFailed(invoice) {
    const subscription = await Subscription.findOne({ stripeSubscriptionId: invoice.subscription });
    if (subscription) {
        subscription.status = 'PAST_DUE';
        await subscription.save();
    }
}

function getPlanDetails(planName, priceId) {
    const plans = {
        'FREE': {
            name: 'FREE',
            displayName: 'Free Plan',
            price: 0,
            currency: 'USD',
            interval: 'month',
            features: ['Up to 2 tables', 'Basic QR Menu', 'Digital Ordering']
        },
        'PREMIUM': {
            name: 'PREMIUM',
            displayName: 'Premium Plan',
            price: 25,
            currency: 'USD',
            interval: 'month',
            features: [
                'Unlimited tables',
                'Advanced analytics',
                'Priority support',
                'Voice ordering',
                'Custom theming',
                'Inventory management',
                'White-label solution'
            ]
        }
    };

    return plans[planName] || plans['FREE'];
}
