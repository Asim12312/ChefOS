import express from 'express';
import {
    createMenuItem,
    getMenuItems,
    getMenuItem,
    updateMenuItem,
    toggleAvailability,
    deleteMenuItem,
    getCategories
} from '../controllers/menu.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('OWNER', 'ADMIN'), createMenuItem);
router.get('/', getMenuItems);
router.get('/categories/:restaurantId', getCategories);
router.get('/:id', getMenuItem);
router.patch('/:id', protect, authorize('OWNER', 'ADMIN'), updateMenuItem);
router.patch('/:id/availability', protect, authorize('OWNER', 'CHEF', 'ADMIN'), toggleAvailability);
router.delete('/:id', protect, authorize('OWNER', 'ADMIN'), deleteMenuItem);

export default router;
