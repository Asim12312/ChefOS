import express from 'express';
import { chatWithChef } from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.js';
import { checkPremiumPublic } from '../middleware/checkPremium.js';

const router = express.Router();

router.post('/chat', checkPremiumPublic, chatWithChef);

export default router;
