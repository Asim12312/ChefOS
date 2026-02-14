import stripeService from './stripe.service.js';
import safepayService from './safepay.service.js';
import logger from '../utils/logger.js';

/**
 * Payment Gateway Strategy Service
 * Routes payments to appropriate gateway based on currency, location, and preferences
 */
class PaymentGatewayService {
    /**
     * Determine which gateway to use
     */
    selectGateway(currency, preferredGateway = null) {
        // If restaurant has a preferred gateway, use it
        if (preferredGateway === 'SAFEPAY' && currency === 'PKR') {
            return 'SAFEPAY';
        }
        if (preferredGateway === 'STRIPE') {
            return 'STRIPE';
        }

        // Default logic: Safepay for PKR, Stripe for everything else
        if (currency === 'PKR') {
            return 'SAFEPAY';
        }

        return 'STRIPE';
    }

    /**
     * Create payment checkout
     */
    async createPayment(params) {
        const {
            amount,
            currency,
            orderId,
            orderNumber,
            restaurantId,
            successUrl,
            cancelUrl,
            preferredGateway,
            metadata = {}
        } = params;

        const gateway = this.selectGateway(currency, preferredGateway);

        logger.info(`Using ${gateway} for payment - Amount: ${amount} ${currency}`);

        try {
            if (gateway === 'SAFEPAY') {
                return await safepayService.createCheckout({
                    amount: Math.round(amount * 100), // Convert to paisas
                    currency,
                    orderId,
                    orderReference: orderNumber,
                    successUrl,
                    cancelUrl,
                    metadata: {
                        restaurantId,
                        ...metadata
                    }
                });
            } else {
                return await stripeService.createPaymentIntent({
                    amount,
                    currency,
                    orderId,
                    orderNumber,
                    restaurantId,
                    metadata
                });
            }
        } catch (error) {
            logger.error(`Payment creation failed with ${gateway}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verify payment status
     */
    async verifyPayment(gateway, identifier) {
        try {
            if (gateway === 'SAFEPAY') {
                return await safepayService.getPaymentStatus(identifier);
            } else {
                // For Stripe, the identifier is the payment intent ID
                // Status is typically verified via webhooks
                return { success: true, message: 'Use webhook for Stripe verification' };
            }
        } catch (error) {
            logger.error(`Payment verification failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create refund
     */
    async createRefund(gateway, identifier, amount = null) {
        try {
            if (gateway === 'SAFEPAY') {
                return await safepayService.createRefund(identifier, amount);
            } else {
                return await stripeService.createRefund(identifier, amount);
            }
        } catch (error) {
            logger.error(`Refund creation failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get available payment methods for a currency
     */
    getAvailablePaymentMethods(currency) {
        if (currency === 'PKR') {
            return {
                gateway: 'SAFEPAY',
                methods: ['Card', 'JazzCash', 'EasyPaisa', 'Bank Transfer']
            };
        }

        return {
            gateway: 'STRIPE',
            methods: ['Card', 'Apple Pay', 'Google Pay']
        };
    }
}

export default new PaymentGatewayService();
