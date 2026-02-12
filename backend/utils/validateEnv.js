import logger from './logger.js';

/**
 * Validate critical environment variables on server startup
 */
const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'NODE_ENV'
];

const optionalEnvVars = [
    'REDIS_URL',
    'GEMINI_API_KEY',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
];

export const validateEnvironment = () => {
    const missing = [];
    const warnings = [];

    // Check required variables
    requiredEnvVars.forEach(varName => {
        if (!process.env[varName]) {
            missing.push(varName);
        }
    });

    // Check optional but recommended variables
    optionalEnvVars.forEach(varName => {
        if (!process.env[varName]) {
            warnings.push(varName);
        }
    });

    // Fatal errors for missing required vars
    if (missing.length > 0) {
        logger.error('❌ Missing required environment variables:', missing.join(', '));
        logger.error('Please check your .env file and ensure all required variables are set.');
        process.exit(1);
    }

    // Warnings for missing optional vars
    if (warnings.length > 0) {
        logger.warn('⚠️  Missing optional environment variables:', warnings.join(', '));
        logger.warn('Some features may not work correctly.');
    }

    // Validate NODE_ENV
    const validEnvs = ['development', 'production', 'test'];
    if (!validEnvs.includes(process.env.NODE_ENV)) {
        logger.warn(`⚠️  NODE_ENV=${process.env.NODE_ENV} is not standard. Expected: ${validEnvs.join(', ')}`);
    }

    logger.info('✅ Environment validation passed');
};
