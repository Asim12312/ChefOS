import express from 'express';
import { register, login, refreshToken, logout, getMe, forgotPassword, verifyOTP, resetPassword, verifyEmail, resendVerificationEmail, googleAuthCallback } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import passport from 'passport';
import {
    registerValidation,
    loginValidation,
    refreshTokenValidation,
    forgotPasswordValidation,
    verifyOTPValidation,
    resetPasswordValidation,
    verifyEmailValidation,
    resendVerificationValidation
} from '../middleware/validators/auth.validator.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Rate limiters
const authLimiter = createRateLimiter(20, 15); // 20 requests per 15 minutes
const generalLimiter = createRateLimiter(50, 15); // 50 requests per 15 minutes

// Public routes
router.post('/register', generalLimiter, registerValidation, register);
router.post('/login', generalLimiter, loginValidation, login);
router.post('/refresh', refreshTokenValidation, refreshToken);

// Password reset routes
router.post('/forgot-password', authLimiter, forgotPasswordValidation, forgotPassword);
router.post('/verify-otp', authLimiter, verifyOTPValidation, verifyOTP);
router.post('/reset-password', authLimiter, resetPasswordValidation, resetPassword);

// Email verification routes
router.post('/verify-email', generalLimiter, verifyEmailValidation, verifyEmail);
router.post('/resend-verification', authLimiter, resendVerificationValidation, resendVerificationEmail);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            const message = info?.message || 'Authentication failed';
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(message)}`);
        }
        req.user = user;
        googleAuthCallback(req, res);
    })(req, res, next);
});

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
