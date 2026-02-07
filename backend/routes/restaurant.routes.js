import express from 'express';
import {
    createRestaurant,
    getRestaurant,
    updateRestaurant,
    updateRestaurantSettings,
    getMyRestaurants,
    getMyPrimaryRestaurant,
    deleteRestaurant
} from '../controllers/restaurant.controller.js';
import { protect, authorize, verifyRestaurantOwnership } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, authorize('OWNER', 'ADMIN'), createRestaurant);
router.get('/my-restaurants', protect, authorize('OWNER'), getMyRestaurants);
router.get('/my-primary', protect, authorize('OWNER'), getMyPrimaryRestaurant);
router.get('/:id', getRestaurant);
router.patch('/:id', protect, authorize('OWNER', 'ADMIN'), verifyRestaurantOwnership, updateRestaurant);
router.patch('/:id/settings', protect, authorize('OWNER', 'ADMIN'), verifyRestaurantOwnership, updateRestaurantSettings);
router.delete('/:id', protect, authorize('OWNER', 'ADMIN'), verifyRestaurantOwnership, deleteRestaurant);

export default router;
