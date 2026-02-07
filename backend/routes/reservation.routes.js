import express from 'express';
import { createReservation, getReservations, updateReservation } from '../controllers/reservation.controller.js';
import { protect, authorize, verifyRestaurantOwnership } from '../middleware/auth.js';

const router = express.Router();

router.post('/', createReservation);

// Protected routes
router.use(protect);
router.use(verifyRestaurantOwnership);

router.get('/', authorize('OWNER', 'CHEF', 'WAITER', 'ADMIN'), getReservations);
router.patch('/:id', authorize('OWNER', 'CHEF', 'WAITER', 'ADMIN'), updateReservation);

export default router;
