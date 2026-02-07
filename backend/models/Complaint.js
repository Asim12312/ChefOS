import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    contact: {
        type: String, // Phone or Email
        required: true
    },
    type: {
        type: String, // FOOD, SERVICE, AMBIANCE, OTHER
        required: true,
        enum: ['FOOD', 'SERVICE', 'AMBIANCE', 'CLEANLINESS', 'OTHER']
    },
    severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM'
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    voiceNoteUrl: String, // Optional voice complaint

    status: {
        type: String,
        enum: ['OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED'],
        default: 'OPEN'
    },
    resolution: String,
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    resolvedAt: Date,

    isDeleted: {
        type: Boolean,
        default: false,
        select: false
    }
}, {
    timestamps: true
});

complaintSchema.index({ restaurant: 1, status: 1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
