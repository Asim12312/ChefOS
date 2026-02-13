import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const configurePassport = () => {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.API_URL || 'https://chefos.pro/api'}/auth/google/callback`,
        proxy: true
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists
            let user = await User.findOne({
                $or: [
                    { googleId: profile.id },
                    { email: profile.emails[0].value }
                ]
            });

            if (user) {
                // Update googleId if it wasn't there
                let isModified = false;
                if (!user.googleId) {
                    user.googleId = profile.id;
                    user.emailVerified = true; // Auto-verify if coming from Google
                    isModified = true;
                }

                // If user exists but is just a CUSTOMER, upgrade them to OWNER
                // This allows diners who decide to sign up as owners to proceed
                if (user.role === 'CUSTOMER') {
                    user.role = 'OWNER';
                    isModified = true;
                }

                if (isModified) {
                    await user.save();
                }
                return done(null, user);
            }

            // Create new user if not exists
            user = await User.create({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                emailVerified: true, // Google accounts are verified
                avatar: profile.photos[0]?.value,
                password: Math.random().toString(36).slice(-10) + 'A1!', // Random dummy password
                role: 'OWNER' // Default to OWNER for Google Sign-Ups so they can create restaurants
            });

            logger.info(`New user registered via Google: ${user.email}`);
            return done(null, user);
        } catch (error) {
            logger.error(`Google Strategy Error: ${error.message}`);
            return done(error, null);
        }
    }));

    // Serialize/Deserialize
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};

export default configurePassport;
