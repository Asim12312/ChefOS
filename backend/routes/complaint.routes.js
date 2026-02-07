import express from 'express';
import { createComplaint, getComplaints, updateComplaint } from '../controllers/complaint.controller.js';
import { protect, authorize, verifyRestaurantOwnership } from '../middleware/auth.js';

const router = express.Router();

router.post('/', createComplaint);

// Protected routes
router.use(protect);
router.use(verifyRestaurantOwnership);

router.get('/', authorize('OWNER', 'ADMIN'), getComplaints);
router.patch('/:id', authorize('OWNER', 'ADMIN'), updateComplaint);

export default router;
