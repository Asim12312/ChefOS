import ServiceRequest from '../models/ServiceRequest.js';
import Table from '../models/Table.js';

// @desc    Create service request
// @route   POST /api/service/request
// @access  Public
export const createServiceRequest = async (req, res, next) => {
    try {
        const { restaurant, table, type, comment } = req.body;

        // Check active request from same table of same type
        const existingRequest = await ServiceRequest.findOne({
            table,
            type,
            status: { $in: ['PENDING', 'IN_PROGRESS'] }
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'A request of this type is already pending for this table'
            });
        }

        const request = await ServiceRequest.create({
            restaurant,
            table,
            type,
            comment
        });

        const tableDoc = await Table.findById(table);

        // Emit socket event
        const io = req.app.get('io');
        io.to(`restaurant:${restaurant}`).emit('service:new', {
            request,
            tableName: tableDoc ? tableDoc.name : 'Unknown Table',
            message: `New ${type.replace('_', ' ')} from ${tableDoc ? tableDoc.name : 'table'}`
        });

        res.status(201).json({
            success: true,
            data: request
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get service requests
// @route   GET /api/service
// @access  Private (Staff)
export const getServiceRequests = async (req, res, next) => {
    try {
        const { status } = req.query;
        const query = { restaurant: req.restaurantId }; // verifyRestaurantOwnership sets this

        if (status) query.status = status;
        else query.status = { $ne: 'COMPLETED' }; // Default only active

        const requests = await ServiceRequest.find(query)
            .populate('table', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update request status
// @route   PATCH /api/service/:id
// @access  Private (Staff)
export const updateServiceRequest = async (req, res, next) => {
    try {
        const { status } = req.body;

        const request = await ServiceRequest.findByIdAndUpdate(
            req.params.id,
            {
                status,
                handledBy: req.user._id
            },
            { new: true }
        ).populate('table', 'name');

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }

        // Emit update
        const io = req.app.get('io');
        io.to(`restaurant:${request.restaurant}`).emit('service:updated', request);

        res.status(200).json({
            success: true,
            data: request
        });
    } catch (error) {
        next(error);
    }
};
