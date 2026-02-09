import { Environment, Paddle } from '@paddle/paddle-node-sdk';
import Restaurant from '../models/Restaurant.js';

const paddle = new Paddle(process.env.PADDLE_API_KEY, {
    environment: process.env.PADDLE_ENVIRONMENT === 'production' ? Environment.production : Environment.sandbox,
});

/**
 * @desc    Handle Paddle Webhooks
 * @route   POST /api/subscriptions/webhook
 * @access  Public (Paddle)
 */
export const handlePaddleWebhook = async (req, res, next) => {
    const signature = req.headers['paddle-signature'] || '';
    const rawBody = req.body.toString(); // Ensure you're using express.raw() for this route

    try {
        if (!signature || !process.env.PADDLE_WEBHOOK_SECRET) {
            return res.status(400).send('Webhook Secret or Signature missing');
        }

        const authenticated = paddle.webhooks.unmarshal(rawBody, process.env.PADDLE_WEBHOOK_SECRET, signature);

        if (!authenticated) {
            return res.status(401).send('Invalid signature');
        }

        const eventData = authenticated.data;
        const eventType = authenticated.eventType;

        console.log(`Paddle Webhook Received: ${eventType}`);

        switch (eventType) {
            case 'subscription.created':
            case 'subscription.updated': {
                const restaurantId = eventData.customData?.restaurantId;
                if (restaurantId) {
                    await Restaurant.findByIdAndUpdate(restaurantId, {
                        'subscription.plan': 'PREMIUM',
                        'subscription.status': eventData.status,
                        'subscription.paddleSubscriptionId': eventData.id,
                        'subscription.paddleCustomerId': eventData.customerId,
                        'subscription.premiumUntil': eventData.nextBilledAt || null
                    });
                }
                break;
            }

            case 'subscription.canceled': {
                const restaurantId = eventData.customData?.restaurantId;
                if (restaurantId) {
                    await Restaurant.findByIdAndUpdate(restaurantId, {
                        'subscription.plan': 'FREE',
                        'subscription.status': 'canceled',
                        'subscription.premiumUntil': null
                    });
                }
                break;
            }

            default:
                console.log(`Unhandled event type: ${eventType}`);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Paddle Webhook Error:', error);
        res.status(500).send('Webhook Internal Error');
    }
};

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
