import express from 'express';
import {
    createPaymentIntent,
    handleStripeWebhook,
    verifyPayment,
    getPaymentHistory
} from '../controllers/payment.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/create', createPaymentIntent);
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
router.post('/verify', verifyPayment);
router.get('/history/:restaurantId', protect, authorize('OWNER', 'ADMIN'), getPaymentHistory);

export default router;
