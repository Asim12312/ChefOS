import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import logger from './utils/logger.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import restaurantRoutes from './routes/restaurant.routes.js';
import tableRoutes from './routes/table.routes.js';
import menuRoutes from './routes/menu.routes.js';
import orderRoutes from './routes/order.routes.js';
import voiceRoutes from './routes/voice.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import kdsRoutes from './routes/kds.routes.js';
import reviewRoutes from './routes/review.routes.js';
import serviceRoutes from './routes/service.routes.js';
import complaintRoutes from './routes/complaint.routes.js';
import reservationRoutes from './routes/reservation.routes.js';
import whatsappRoutes from './routes/whatsapp.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';

import inventoryRoutes from './routes/inventory.routes.js';
import uploadRoutes from './routes/upload.routes.js';

// Load environment variables
console.log('Starting server...');
dotenv.config();
console.log('Environment variables reloaded. Email User:', process.env.EMAIL_USER ? 'Set' : 'Not Set');
console.log('Env loaded, Connecting to DB...');

// Connect to database
connectDB();
console.log('Initialization sequence triggered...');

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Make io accessible to routes
app.set('io', io);

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } })); // Logging

// Rate limiting
app.use('/api/', rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/kds', kdsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use('/api/inventory', inventoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/uploads', express.static('uploads')); // Serve uploaded files statically

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Socket.IO connection handling
io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join restaurant room
    socket.on('join:restaurant', (restaurantId) => {
        socket.join(`restaurant:${restaurantId}`);
        logger.info(`Socket ${socket.id} joined restaurant:${restaurantId}`);
    });

    // Join KDS room
    socket.on('join:kds', (restaurantId) => {
        socket.join(`kds:${restaurantId}`);
        logger.info(`Socket ${socket.id} joined KDS for restaurant:${restaurantId}`);
    });

    // Join order tracking room
    socket.on('join:order', (orderId) => {
        socket.join(`order:${orderId}`);
        logger.info(`Socket ${socket.id} joined order:${orderId}`);
    });

    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    logger.info(`📡 WebSocket server ready`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    httpServer.close(() => process.exit(1));
});

export { io };
