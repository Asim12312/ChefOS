import Stripe from 'stripe';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create payment intent
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

        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(order.total * 100), // Convert to cents
            currency: order.restaurant.currency.toLowerCase() || 'usd',
            metadata: {
                orderId: order._id.toString(),
                restaurantId: order.restaurant._id.toString(),
                orderNumber: order.orderNumber
            }
        });

        // Create payment record
        const payment = await Payment.create({
            order: order._id,
            restaurant: order.restaurant._id,
            amount: order.total,
            currency: order.restaurant.currency || 'USD',
            paymentMethod: 'STRIPE',
            status: 'PENDING',
            paymentIntentId: paymentIntent.id
        });

        res.status(200).json({
            success: true,
            data: {
                clientSecret: paymentIntent.client_secret,
                paymentId: payment._id,
                amount: order.total
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Stripe webhook handler
// @route   POST /api/payments/webhook
// @access  Public (Stripe)
export const handleStripeWebhook = async (req, res, next) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;

            // Update payment status
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
            break;

        case 'payment_intent.payment_failed':
            const failedIntent = event.data.object;

            const failedPayment = await Payment.findOne({ paymentIntentId: failedIntent.id });
            if (failedPayment) {
                failedPayment.status = 'FAILED';
                failedPayment.failureReason = failedIntent.last_payment_error?.message;
                await failedPayment.save();
            }
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
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
                amount: payment.amount
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
