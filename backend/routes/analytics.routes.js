import express from 'express';
import {
    getOrdersAnalytics,
    getRevenueAnalytics,
    getPeakHoursAnalytics,
    getTopMenuItems,
    getTableUsageAnalytics,
    getDashboardSummary,
    getNotifications
} from '../controllers/analytics.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/orders/:restaurantId', protect, authorize('OWNER', 'ADMIN'), getOrdersAnalytics);
router.get('/revenue/:restaurantId', protect, authorize('OWNER', 'ADMIN'), getRevenueAnalytics);
router.get('/peak-hours/:restaurantId', protect, authorize('OWNER', 'ADMIN'), getPeakHoursAnalytics);
router.get('/top-items/:restaurantId', protect, authorize('OWNER', 'ADMIN'), getTopMenuItems);
router.get('/table-usage/:restaurantId', protect, authorize('OWNER', 'ADMIN'), getTableUsageAnalytics);
router.get('/dashboard/:restaurantId', protect, authorize('OWNER', 'ADMIN'), getDashboardSummary);
router.get('/notifications/:restaurantId', protect, authorize('OWNER', 'ADMIN'), getNotifications);

export default router;
