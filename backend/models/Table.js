import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Table name is required'],
        trim: true
    },
    capacity: {
        type: Number,
        min: 1,
        default: 4
    },
    qrCode: {
        type: String // QR code data or URL
    },
    location: {
        type: String,
        enum: ['Indoor', 'Outdoor', 'VIP', 'Patio', 'Bar'],
        default: 'Indoor'
    },
    status: {
        type: String,
        enum: ['FREE', 'OCCUPIED', 'RESERVED', 'CLEANING'],
        default: 'FREE'
    },
    currentSession: {
        sessionId: String, // Unique ID for current occupation session
        securityToken: String, // Secret token for placing orders (Prevents remote abuse)
        startTime: Date,
        occupiedAt: Date, // Track when table became occupied
        customerCount: Number,
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        waiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index for restaurant and table name uniqueness
tableSchema.index({ restaurant: 1, name: 1 }, { unique: true });

// Generate QR code data before saving
tableSchema.pre('save', function (next) {
    if (!this.qrCode) {
        // Store relative path: /menu/:restaurantId?table=:tableId
        this.qrCode = `/menu/${this.restaurant}?table=${this._id}`;
    }
    next();
});

const Table = mongoose.model('Table', tableSchema);

export default Table;
