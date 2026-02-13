import express from 'express';
import { getSubscriptionStatus } from '../controllers/subscription.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Status endpoint (Protected)
router.get('/status', protect, getSubscriptionStatus);

export default router;
