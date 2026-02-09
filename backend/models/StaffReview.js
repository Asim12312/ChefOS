import mongoose from 'mongoose';

const staffReviewSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    staff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customerName: {
        type: String,
        default: 'Guest Customer'
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 500
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    isPublished: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
staffReviewSchema.index({ restaurant: 1, staff: 1 });
staffReviewSchema.index({ createdAt: -1 });

const StaffReview = mongoose.model('StaffReview', staffReviewSchema);

export default StaffReview;
