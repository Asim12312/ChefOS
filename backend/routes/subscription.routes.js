import express from 'express';
import { handlePaddleWebhook, getSubscriptionStatus } from '../controllers/subscription.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Webhook endpoint (Public, but checked by signature)
router.post('/webhook', express.raw({ type: 'application/json' }), handlePaddleWebhook);

// Status endpoint (Protected)
router.get('/status', protect, getSubscriptionStatus);

export default router;
