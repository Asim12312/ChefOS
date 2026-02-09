import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Item name is required'],
        trim: true
    },
    sku: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Produce', 'Meat', 'Dairy', 'Dry Goods', 'Beverages', 'Spices', 'Packaging', 'Other']
    },
    stockQuantity: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        min: 0,
        default: 0
    },
    lowStockThreshold: {
        type: Number,
        default: 10
    },
    maxStock: {
        type: Number,
        default: 100
    },
    unit: {
        type: String,
        default: 'units'
    },
    costPrice: {
        type: Number,
        default: 0
    },
    supplier: {
        type: String,
        trim: true
    },
    image: {
        type: String
    },
    isLowStock: {
        type: Boolean,
        default: false
    },
    lastRestockDate: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false,
        select: false
    }
}, {
    timestamps: true
});

// Middleware to update isLowStock before saving
inventoryItemSchema.pre('save', function (next) {
    this.isLowStock = this.stockQuantity <= this.lowStockThreshold;
    next();
});

// Indexes
inventoryItemSchema.index({ restaurant: 1, isLowStock: 1 }); // Optimized for dashboard alerts
inventoryItemSchema.index({ restaurant: 1, category: 1 });
inventoryItemSchema.index({ restaurant: 1, sku: 1 });

const InventoryItem = mongoose.model('InventoryItem', inventoryItemSchema);

export default InventoryItem;
