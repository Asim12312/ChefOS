import express from 'express';
import {
    createTable,
    getTables,
    getTable,
    updateTable,
    deleteTable,
    downloadQRCode,
    resetTable
} from '../controllers/table.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize(['OWNER', 'ADMIN'], ['tables']), createTable);
router.get('/', getTables);
router.get('/:id', getTable);
router.get('/:id/qr', protect, authorize(['OWNER', 'ADMIN'], ['tables']), downloadQRCode);
router.patch('/:id', protect, authorize(['OWNER', 'ADMIN'], ['tables']), updateTable);
router.patch('/:id/reset', protect, authorize(['OWNER', 'ADMIN', 'WAITER'], ['tables']), resetTable);
router.delete('/:id', protect, authorize(['OWNER', 'ADMIN'], ['tables']), deleteTable);

export default router;
