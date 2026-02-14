import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    stripeCustomerId: {
        type: String,
        required: false
    },
    stripeSubscriptionId: {
        type: String,
        required: false,
        unique: true,
        sparse: true
    },
    stripePriceId: {
        type: String,
        required: false
    },
    plan: {
        name: {
            type: String,
            enum: ['FREE', 'PREMIUM'],
            required: true
        },
        displayName: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'USD'
        },
        interval: {
            type: String,
            enum: ['month', 'year'],
            default: 'month'
        },
        features: [String]
    },
    status: {
        type: String,
        enum: ['TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'UNPAID'],
        default: 'ACTIVE'
    },
    currentPeriodStart: {
        type: Date,
        required: true
    },
    currentPeriodEnd: {
        type: Date,
        required: true
    },
    cancelAtPeriodEnd: {
        type: Boolean,
        default: false
    },
    canceledAt: Date,
    endedAt: Date,
    trialStart: Date,
    trialEnd: Date,
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

// Indexes
subscriptionSchema.index({ restaurant: 1, status: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

// Instance methods
subscriptionSchema.methods.isActive = function () {
    return ['ACTIVE', 'TRIAL'].includes(this.status);
};

subscriptionSchema.methods.isExpired = function () {
    return this.currentPeriodEnd < new Date();
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
