import express from 'express';
import { getInventory, createInventoryItem, updateStock, updateInventoryItem, deleteInventoryItem } from '../controllers/inventory.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/:restaurantId', protect, authorize(['OWNER', 'CHEF', 'ADMIN'], ['inventory']), getInventory);
router.post('/', protect, authorize(['OWNER', 'CHEF', 'ADMIN'], ['inventory']), createInventoryItem);
router.patch('/:itemId', protect, authorize(['OWNER', 'CHEF', 'ADMIN'], ['inventory']), updateStock);
router.put('/:itemId', protect, authorize(['OWNER', 'CHEF', 'ADMIN'], ['inventory']), updateInventoryItem);
router.delete('/:itemId', protect, authorize(['OWNER', 'CHEF', 'ADMIN'], ['inventory']), deleteInventoryItem);

export default router;
