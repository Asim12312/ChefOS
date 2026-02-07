import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    table: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table'
    },
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    customerPhone: {
        type: String,
        required: true
    },
    customerEmail: String,

    date: {
        type: Date,
        required: true
    },
    timeSlot: {
        startTime: { type: String, required: true }, // "19:00"
        endTime: { type: String, required: true }    // "21:00"
    },
    guestCount: {
        type: Number,
        required: true,
        min: 1
    },

    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'],
        default: 'PENDING'
    },

    specialRequests: String,

    source: {
        type: String,
        enum: ['WEB', 'PHONE', 'WHATSAPP', 'WALK_IN'],
        default: 'WEB'
    }
}, {
    timestamps: true
});

reservationSchema.index({ restaurant: 1, date: 1 });
reservationSchema.index({ customerPhone: 1 });

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;
