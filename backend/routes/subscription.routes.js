import express from 'express';
import {
    getSubscriptionStatus,
    createCheckoutSession,
    cancelSubscription,
    getBillingPortal,
    syncSubscription
} from '../controllers/subscription.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Status endpoint (Protected)
router.get('/status', protect, getSubscriptionStatus);

// Subscription management endpoints (Owner only)
router.post('/create-checkout', protect, authorize('OWNER'), createCheckoutSession);
router.post('/cancel', protect, authorize('OWNER'), cancelSubscription);
router.post('/sync', protect, authorize('OWNER'), syncSubscription);
router.get('/portal', protect, authorize('OWNER'), getBillingPortal);

export default router;
