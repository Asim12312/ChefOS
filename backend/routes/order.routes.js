import express from 'express';
import {
    createOrder,
    getOrders,
    getOrder,
    updateOrderStatus,
    updateOrderPayment,
    cancelOrder,
    getOrderStats
} from '../controllers/order.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { orderRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/', orderRateLimiter, createOrder);
router.get('/', protect, authorize('OWNER', 'CHEF', 'ADMIN'), getOrders); // Query param style
router.get('/restaurant/:restaurantId', protect, authorize('OWNER', 'CHEF', 'ADMIN'), getOrders); // Params style (Prompt requirement)
router.get('/stats/:restaurantId', protect, authorize('OWNER', 'ADMIN'), getOrderStats);
router.get('/:id', getOrder);
router.patch('/:id/status', protect, authorize('OWNER', 'CHEF', 'ADMIN'), updateOrderStatus);
router.patch('/:id/payment', protect, authorize('OWNER', 'CHEF', 'ADMIN'), updateOrderPayment);
router.delete('/:id', cancelOrder);

export default router;
