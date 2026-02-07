import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    customerName: String,
    customerEmail: String,
    ownerReply: {
        message: String,
        repliedAt: Date,
        repliedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    isSpam: {
        type: Boolean,
        default: false
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false,
        select: false
    }
}, {
    timestamps: true
});

// Indexes
reviewSchema.index({ restaurant: 1, isPublished: 1 });
reviewSchema.index({ order: 1 }, { unique: true }); // One review per order
reviewSchema.index({ rating: 1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
