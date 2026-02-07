import express from 'express';
import { uploadImage, deleteImage } from '../controllers/upload.controller.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Upload single image to Cloudinary
router.post('/image', protect, upload.single('image'), uploadImage);

// Delete image from Cloudinary
router.delete('/image/:publicId', protect, deleteImage);

export default router;
