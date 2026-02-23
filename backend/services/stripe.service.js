import Stripe from 'stripe';
import logger from '../utils/logger.js';

class StripeService {
    constructor() {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }

    /**
     * Create payment intent for one-time payments (orders)
     */
    async createPaymentIntent(params) {
        try {
            const {
                amount,
                currency = 'usd',
                orderId,
                orderNumber,
                restaurantId,
                metadata = {}
            } = params;

            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: currency.toLowerCase(),
                automatic_payment_methods: {
                    enabled: true,
                },
                metadata: {
                    orderId,
                    orderNumber,
                    restaurantId,
                    ...metadata
                }
            });

            logger.info(`Stripe payment intent created: ${paymentIntent.id}`);

            return {
                success: true,
                paymentIntentId: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                amount: paymentIntent.amount / 100
            };
        } catch (error) {
            logger.error(`Stripe payment intent creation failed: ${error.message}`);
            throw new Error(`Stripe Error: ${error.message}`);
        }
    }

    /**
     * Create or retrieve Stripe customer
     */
    async createOrGetCustomer(email, name, metadata = {}) {
        try {
            // Check if customer exists
            const customers = await this.stripe.customers.list({
                email: email,
                limit: 1
            });

            if (customers.data.length > 0) {
                logger.info(`Existing Stripe customer found: ${customers.data[0].id}`);
                return customers.data[0];
            }

            // Create new customer
            const customer = await this.stripe.customers.create({
                email,
                name,
                metadata
            });

            logger.info(`New Stripe customer created: ${customer.id}`);
            return customer;
        } catch (error) {
            logger.error(`Stripe customer creation failed: ${error.message}`);
            throw new Error(`Stripe Error: ${error.message}`);
        }
    }

    /**
     * Create subscription
     */
    async createSubscription(params) {
        try {
            const {
                customerId,
                priceId,
                trialDays = 0,
                metadata = {}
            } = params;

            const subscriptionParams = {
                customer: customerId,
                items: [{ price: priceId }],
                payment_behavior: 'default_incomplete',
                payment_settings: { save_default_payment_method: 'on_subscription' },
                expand: ['latest_invoice.payment_intent'],
                metadata
            };

            if (trialDays > 0) {
                subscriptionParams.trial_period_days = trialDays;
            }

            const subscription = await this.stripe.subscriptions.create(subscriptionParams);

            logger.info(`Stripe subscription created: ${subscription.id}`);

            return {
                success: true,
                subscriptionId: subscription.id,
                clientSecret: subscription.latest_invoice.payment_intent.client_secret,
                status: subscription.status
            };
        } catch (error) {
            logger.error(`Stripe subscription creation failed: ${error.message}`);
            throw new Error(`Stripe Error: ${error.message}`);
        }
    }

    /**
     * Create subscription checkout session
     */
    async createSubscriptionCheckoutSession(params) {
        try {
            const {
                customerId,
                priceId,
                successUrl,
                cancelUrl,
                metadata = {},
                trialDays = 0
            } = params;

            const sessionParams = {
                customer: customerId,
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: successUrl,
                cancel_url: cancelUrl,
                metadata: metadata,
                subscription_data: {
                    metadata: metadata
                }
            };

            if (trialDays > 0) {
                sessionParams.subscription_data.trial_period_days = trialDays;
            }

            const session = await this.stripe.checkout.sessions.create(sessionParams);

            logger.info(`Stripe subscription checkout session created: ${session.id}`);

            return {
                success: true,
                sessionId: session.id,
                url: session.url
            };
        } catch (error) {
            logger.error(`Stripe subscription checkout session creation failed: ${error.message}`);
            throw new Error(`Stripe Error: ${error.message}`);
        }
    }

    /**
     * Cancel subscription
     */
    async cancelSubscription(subscriptionId, immediately = false) {
        try {
            const subscription = immediately
                ? await this.stripe.subscriptions.cancel(subscriptionId)
                : await this.stripe.subscriptions.update(subscriptionId, {
                    cancel_at_period_end: true
                });

            logger.info(`Stripe subscription ${immediately ? 'cancelled' : 'scheduled for cancellation'}: ${subscriptionId}`);

            return {
                success: true,
                subscriptionId: subscription.id,
                status: subscription.status,
                cancelAt: subscription.cancel_at
            };
        } catch (error) {
            logger.error(`Stripe subscription cancellation failed: ${error.message}`);
            throw new Error(`Stripe Error: ${error.message}`);
        }
    }

    /**
     * List active subscriptions for a customer
     */
    async listActiveSubscriptions(customerId) {
        try {
            const subscriptions = await this.stripe.subscriptions.list({
                customer: customerId,
                status: 'active',
                limit: 1,
                expand: ['data.items.data.price']
            });

            return {
                success: true,
                subscriptions: subscriptions.data
            };
        } catch (error) {
            logger.error(`Failed to list subscriptions: ${error.message}`);
            throw new Error(`Stripe Error: ${error.message}`);
        }
    }

    /**
     * Get subscription details
     */
    async getSubscription(subscriptionId) {
        try {
            const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

            return {
                success: true,
                subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    currentPeriodStart: new Date(subscription.current_period_start * 1000),
                    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                    cancelAtPeriodEnd: subscription.cancel_at_period_end,
                    priceId: subscription.items.data[0].price.id,
                    amount: subscription.items.data[0].price.unit_amount / 100
                }
            };
        } catch (error) {
            logger.error(`Failed to retrieve subscription: ${error.message}`);
            throw new Error(`Stripe Error: ${error.message}`);
        }
    }

    /**
     * Create billing portal session
     */
    async createBillingPortalSession(customerId, returnUrl) {
        try {
            const session = await this.stripe.billingPortal.sessions.create({
                customer: customerId,
                return_url: returnUrl
            });

            return {
                success: true,
                url: session.url
            };
        } catch (error) {
            logger.error(`Stripe billing portal creation failed: ${error.message}`);
            throw new Error(`Stripe Error: ${error.message}`);
        }
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload, signature, secret) {
        try {
            return this.stripe.webhooks.constructEvent(payload, signature, secret);
        } catch (error) {
            logger.error(`Stripe webhook verification failed: ${error.message}`);
            throw new Error('Invalid webhook signature');
        }
    }

    /**
     * Create refund
     */
    async createRefund(paymentIntentId, amount = null) {
        try {
            const refundParams = { payment_intent: paymentIntentId };
            if (amount) {
                refundParams.amount = Math.round(amount * 100);
            }

            const refund = await this.stripe.refunds.create(refundParams);

            logger.info(`Stripe refund created: ${refund.id}`);

            return {
                success: true,
                refundId: refund.id,
                amount: refund.amount / 100,
                status: refund.status
            };
        } catch (error) {
            logger.error(`Stripe refund failed: ${error.message}`);
            throw new Error(`Stripe Error: ${error.message}`);
        }
    }

    /**
     * Map Stripe status to internal payment status
     */
    mapStripeStatus(stripeStatus) {
        const statusMap = {
            'succeeded': 'COMPLETED',
            'processing': 'PROCESSING',
            'requires_payment_method': 'PENDING',
            'requires_confirmation': 'PENDING',
            'requires_action': 'PENDING',
            'canceled': 'FAILED',
            'failed': 'FAILED'
        };

        return statusMap[stripeStatus] || 'PENDING';
    }
}

export default new StripeService();
