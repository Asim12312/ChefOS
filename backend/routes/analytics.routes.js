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
import { protect, authorize, verifyRestaurantOwnership } from '../middleware/auth.js';
import { checkPremium } from '../middleware/checkPremium.js';

const router = express.Router();

router.get('/orders/:restaurantId', protect, authorize(['OWNER', 'ADMIN'], ['analytics']), checkPremium, getOrdersAnalytics);
router.get('/revenue/:restaurantId', protect, authorize(['OWNER', 'ADMIN'], ['analytics']), checkPremium, getRevenueAnalytics);
router.get('/peak-hours/:restaurantId', protect, authorize(['OWNER', 'ADMIN'], ['analytics']), checkPremium, getPeakHoursAnalytics);
router.get('/top-items/:restaurantId', protect, authorize(['OWNER', 'ADMIN'], ['analytics']), getTopMenuItems);
router.get('/table-usage/:restaurantId', protect, authorize(['OWNER', 'ADMIN'], ['analytics']), checkPremium, getTableUsageAnalytics);
router.get('/dashboard/:restaurantId', protect, authorize(['OWNER', 'ADMIN'], ['dashboard']), getDashboardSummary);
router.get('/notifications/:restaurantId', protect, authorize(['OWNER', 'CHEF', 'WAITER', 'ADMIN'], ['dashboard', 'orders']), verifyRestaurantOwnership, getNotifications);

export default router;
