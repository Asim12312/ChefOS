import Table from '../models/Table.js';
import QRCode from 'qrcode';

// @desc    Create table
// @route   POST /api/tables
// @access  Private (Owner)
// @desc    Create table
// @route   POST /api/tables
// @access  Private (Owner)
export const createTable = async (req, res, next) => {
    try {
        const { restaurant, name, capacity, location } = req.body;

        // Security check: Ensure owner is creating table for their own restaurant
        if (req.user.role !== 'ADMIN' && req.user.restaurant?.toString() !== restaurant) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to add tables to this restaurant'
            });
        }

        const table = await Table.create({
            restaurant,
            name,
            capacity,
            location
        });

        // Generate QR code image with full URL
        const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const fullQrUrl = `${frontendUrl}${table.qrCode}`;
        const qrCodeDataUrl = await QRCode.toDataURL(fullQrUrl);

        res.status(201).json({
            success: true,
            message: 'Table created successfully',
            data: {
                ...table.toObject(),
                qrCodeImage: qrCodeDataUrl
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all tables for a restaurant
// @route   GET /api/tables?restaurant=:restaurantId
// @access  Public
export const getTables = async (req, res, next) => {
    try {
        const { restaurant } = req.query;

        if (!restaurant) {
            return res.status(400).json({
                success: false,
                message: 'Restaurant ID is required'
            });
        }

        const tables = await Table.find({ restaurant, isActive: true });

        res.status(200).json({
            success: true,
            count: tables.length,
            data: tables
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single table
// @route   GET /api/tables/:id
// @access  Public
export const getTable = async (req, res, next) => {
    try {
        const table = await Table.findById(req.params.id).populate('restaurant');

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Generate QR code image with full URL
        const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const fullQrUrl = `${frontendUrl}${table.qrCode}`;
        const qrCodeDataUrl = await QRCode.toDataURL(fullQrUrl);

        res.status(200).json({
            success: true,
            data: {
                ...table.toObject(),
                qrCodeImage: qrCodeDataUrl
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update table
// @route   PATCH /api/tables/:id
// @access  Private (Owner)
export const updateTable = async (req, res, next) => {
    try {
        const table = await Table.findById(req.params.id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Security check
        if (req.user.role !== 'ADMIN' && req.user.restaurant?.toString() !== table.restaurant.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this table'
            });
        }

        if (req.body.status === 'OCCUPIED' && table.status !== 'OCCUPIED') {
            if (!table.currentSession) table.currentSession = {};
            table.currentSession.occupiedAt = new Date();
        }

        Object.assign(table, req.body);
        await table.save();

        res.status(200).json({
            success: true,
            message: 'Table updated successfully',
            data: table
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete table
// @route   DELETE /api/tables/:id
// @access  Private (Owner)
export const deleteTable = async (req, res, next) => {
    try {
        const table = await Table.findById(req.params.id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Security check
        if (req.user.role !== 'ADMIN' && req.user.restaurant?.toString() !== table.restaurant.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this table'
            });
        }

        table.isActive = false;
        await table.save();

        res.status(200).json({
            success: true,
            message: 'Table deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Download QR code
// @route   GET /api/tables/:id/qr
// @access  Private (Owner)
export const downloadQRCode = async (req, res, next) => {
    try {
        const table = await Table.findById(req.params.id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Security check
        if (req.user.role !== 'ADMIN' && req.user.restaurant?.toString() !== table.restaurant.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to download this QR code'
            });
        }

        // Generate QR code as buffer with full URL
        const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const fullQrUrl = `${frontendUrl}${table.qrCode}`;
        const qrCodeBuffer = await QRCode.toBuffer(fullQrUrl, {
            width: 500,
            margin: 2
        });

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="table-${table.name}-qr.png"`);
        res.send(qrCodeBuffer);
    } catch (error) {
        next(error);
    }
};

// @desc    Reset table (Mark as FREE)
// @route   PATCH /api/tables/:id/reset
// @access  Private (Owner/Waiter)
export const resetTable = async (req, res, next) => {
    try {
        const table = await Table.findById(req.params.id);

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'Table not found'
            });
        }

        // Security check (Allow waiters too)
        if (req.user.role !== 'ADMIN' &&
            req.user.restaurant?.toString() !== table.restaurant.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to reset this table'
            });
        }

        table.status = 'FREE';
        table.currentSession = {}; // Clear session data
        await table.save();

        res.status(200).json({
            success: true,
            message: 'Table reset successfully',
            data: table
        });
    } catch (error) {
        next(error);
    }
};
