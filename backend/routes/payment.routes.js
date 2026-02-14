import express from 'express';
import {
    createPaymentIntent,
    handleStripeWebhook,
    handleSafepayWebhook,
    verifyPayment,
    getPaymentHistory,
    getPaymentMethods,
    createSubscription,
    cancelSubscription,
    getBillingPortal
} from '../controllers/payment.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Payment routes
router.post('/create', createPaymentIntent);
router.post('/verify', verifyPayment);
router.get('/methods', getPaymentMethods);
router.get('/history/:restaurantId', protect, authorize('OWNER', 'ADMIN'), getPaymentHistory);

// Webhook routes (raw body parsing)
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);
router.post('/webhook/safepay', express.json(), handleSafepayWebhook);

// Subscription routes
router.post('/subscription/create', protect, authorize('OWNER'), createSubscription);
router.post('/subscription/cancel', protect, authorize('OWNER'), cancelSubscription);
router.get('/subscription/portal', protect, authorize('OWNER'), getBillingPortal);

export default router;
