import express from 'express';
import {
    createReview,
    getReviews,
    replyToReview,
    markAsSpam,
    deleteReview
} from '../controllers/review.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', createReview);
router.get('/', getReviews);
router.post('/:id/reply', protect, authorize('OWNER', 'ADMIN'), replyToReview);
router.patch('/:id/spam', protect, authorize('OWNER', 'ADMIN'), markAsSpam);
router.delete('/:id', protect, authorize('ADMIN'), deleteReview);

export default router;
