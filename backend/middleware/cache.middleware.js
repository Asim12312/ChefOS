import { redisClient } from '../config/redis.js';
import logger from '../utils/logger.js';

/**
 * Cache middleware
 * @param {number} duration - Cache duration in seconds
 */
export const cacheMiddleware = (duration = 3600) => {
    return async (req, res, next) => {
        if (!redisClient?.isReady) return next();

        // Only cache GET requests
        if (req.method !== 'GET') return next();

        const key = `cache:${req.originalUrl || req.url}`;

        try {
            const cachedResponse = await redisClient.get(key);

            if (cachedResponse) {
                // logger.info(`Cache Hit: ${key}`);
                return res.json(JSON.parse(cachedResponse));
            }

            // If not in cache, override res.json to store the response
            res.originalJson = res.json;
            res.json = (body) => {
                redisClient.setEx(key, duration, JSON.stringify(body)).catch(err => {
                    logger.error(`Redis set error: ${err}`);
                });
                res.originalJson(body);
            };

            next();
        } catch (error) {
            logger.error(`Cache middleware error: ${error}`);
            next();
        }
    };
};

/**
 * Clear cache by pattern/prefix
 * @param {string} pattern - Prefix to clear (e.g., 'menu:')
 */
export const clearCache = async (prefix) => {
    if (!redisClient?.isReady) return;

    try {
        const keys = await redisClient.keys(`cache:*${prefix}*`);
        if (keys.length > 0) {
            await redisClient.del(keys);
            logger.info(`Cleared ${keys.length} cache keys for prefix: ${prefix}`);
        }
    } catch (error) {
        logger.error(`Clear cache error: ${error}`);
    }
};
