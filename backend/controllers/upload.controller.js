import cloudinary from '../config/cloudinary.js';

// @desc    Upload single image to Cloudinary
// @route   POST /api/upload/image
// @access  Private
export const uploadImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // File is already uploaded to Cloudinary by multer middleware
        const imageUrl = req.file.path;

        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                url: imageUrl,
                publicId: req.file.filename
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete image from Cloudinary
// @route   DELETE /api/upload/image/:publicId
// @access  Private
export const deleteImage = async (req, res, next) => {
    try {
        const { publicId } = req.params;

        // Delete from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === 'ok') {
            res.status(200).json({
                success: true,
                message: 'Image deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }
    } catch (error) {
        next(error);
    }
};
