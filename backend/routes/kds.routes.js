import express from 'express';
import { getKDSOrders, getKDSStats } from '../controllers/kds.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/orders', protect, authorize('CHEF', 'OWNER', 'ADMIN'), getKDSOrders);
router.get('/stats', protect, authorize('CHEF', 'OWNER', 'ADMIN'), getKDSStats);

export default router;
