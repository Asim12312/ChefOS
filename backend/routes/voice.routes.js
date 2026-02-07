import express from 'express';
import { processVoiceOrder } from '../controllers/voice.controller.js';
import { orderRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/order', orderRateLimiter, processVoiceOrder);

export default router;
