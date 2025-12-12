import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

let redisClient = null;
let redisStore = null;

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected for rate limiting');
    });

    redisStore = new RedisStore({
      client: redisClient,
      prefix: 'rate-limit:'
    });
  } catch (error) {
    logger.warn('Redis not available, using in-memory rate limiting', { error: error.message });
  }
}

export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { 
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore || undefined,
  keyGenerator: (req) => {
    return req.userId || req.ip;
  }
});

export const geminiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.GEMINI_RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  max: parseInt(process.env.GEMINI_RATE_LIMIT_MAX_REQUESTS) || 10,
  message: { 
    error: 'Too many AI requests',
    message: 'AI query rate limit exceeded. Please wait before trying again.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore || undefined,
  keyGenerator: (req) => {
    return req.userId || req.ip;
  }
});

export const uploadRateLimiter = rateLimit({
  windowMs: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000,
  max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX_REQUESTS) || 20,
  message: { 
    error: 'Too many uploads',
    message: 'Upload rate limit exceeded. Please try again later.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: redisStore || undefined,
  keyGenerator: (req) => {
    return req.userId || req.ip;
  }
});
