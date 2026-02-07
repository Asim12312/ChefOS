import Reservation from '../models/Reservation.js';
import Table from '../models/Table.js';

// @desc    Create reservation
// @route   POST /api/reservations
// @access  Public
export const createReservation = async (req, res, next) => {
    try {
        const { restaurant, customerName, customerPhone, date, timeSlot, guestCount, specialRequests } = req.body;

        // Basic conflict check (Logic can be enhanced for strict slot management)
        // Find if we have tables available for this time? (Simplified for now: Just create booking)

        const reservation = await Reservation.create({
            restaurant,
            customerName,
            customerPhone,
            date,
            timeSlot,
            guestCount,
            specialRequests
        });

        // Emit socket event
        const io = req.app.get('io');
        io.to(`restaurant:${restaurant}`).emit('reservation:new', reservation);

        res.status(201).json({
            success: true,
            data: reservation
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get reservations
// @route   GET /api/reservations
// @access  Private (Owner/Staff)
export const getReservations = async (req, res, next) => {
    try {
        if (!req.restaurantId) {
            return res.status(400).json({ success: false, message: 'Restaurant ID not found in request' });
        }

        const { date, status } = req.query;
        const query = { restaurant: req.restaurantId };

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.date = { $gte: startOfDay, $lte: endOfDay };
        }

        if (status) query.status = status;

        const reservations = await Reservation.find(query)
            .populate('table', 'name')
            .sort({ 'timeSlot.startTime': 1 }); // Ensure timeSlot exists in schema

        res.status(200).json({
            success: true,
            count: reservations.length,
            data: reservations
        });
    } catch (error) {
        console.error('Error in getReservations:', error);
        next(error);
    }
};

// @desc    Update reservation status
// @route   PATCH /api/reservations/:id
// @access  Private (Owner/Staff)
export const updateReservation = async (req, res, next) => {
    try {
        const { status, table } = req.body;
        const updateData = { status };

        if (table) updateData.table = table;

        const reservation = await Reservation.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('table');

        // Logic: specific updates (like marking table RESERVED if confirmed) can be added here
        if (status === 'CONFIRMED' && reservation.table) {
            await Table.findByIdAndUpdate(reservation.table, { status: 'RESERVED' });
        }

        res.status(200).json({
            success: true,
            data: reservation
        });
    } catch (error) {
        next(error);
    }
};
