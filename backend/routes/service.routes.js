import express from 'express';
import { createServiceRequest, getServiceRequests, updateServiceRequest } from '../controllers/service.controller.js';
import { protect, authorize, verifyRestaurantOwnership } from '../middleware/auth.js';

const router = express.Router();

router.post('/request', createServiceRequest);

// Protected routes
router.use(protect);
router.use(verifyRestaurantOwnership); // Ensures req.restaurant is set

router.get('/', authorize(['OWNER', 'CHEF', 'WAITER', 'ADMIN'], ['service']), getServiceRequests);
router.patch('/:id', authorize(['OWNER', 'CHEF', 'WAITER', 'ADMIN'], ['service']), updateServiceRequest);

export default router;
