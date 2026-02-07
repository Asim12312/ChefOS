import express from 'express';
import { getInventory, updateStock } from '../controllers/inventory.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/:restaurantId', protect, authorize('OWNER', 'CHEF', 'ADMIN'), getInventory);
router.patch('/:itemId', protect, authorize('OWNER', 'CHEF', 'ADMIN'), updateStock);

export default router;
