/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

import { logger } from '../utils/logger.js';

/**
 * Custom error class
 */
export class AppError extends Error {
    constructor(message, statusCode = 500, details = {}) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Async handler wrapper
 * Catches errors in async route handlers
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, next) {
    let error = { ...err };
    error.message = err.message;
    error.stack = err.stack;

    // Log error
    logger.error('❌ Error occurred', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        userId: req.userId
    });

    // Mongoose/MongoDB errors
    if (err.name === 'CastError') {
        error = new AppError('Resource not found', 404);
    }

    // Duplicate key error
    if (err.code === 11000) {
        error = new AppError('Duplicate field value', 400);
    }

    // Validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(e => e.message).join(', ');
        error = new AppError(message, 400);
    }

    // Supabase errors
    if (err.code && err.code.startsWith('PGRST')) {
        error = new AppError('Database error', 500, { code: err.code });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = new AppError('Invalid token', 401);
    }

    if (err.name === 'TokenExpiredError') {
        error = new AppError('Token expired', 401);
    }

    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        error = new AppError('File too large', 400, {
            maxSize: '100MB'
        });
    }

    // Network errors
    if (err.code === 'ECONNREFUSED') {
        error = new AppError('Service unavailable', 503, {
            service: err.address
        });
    }

    // Timeout errors
    if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
        error = new AppError('Request timeout', 408);
    }

    // Send response
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && {
            stack: error.stack,
            details: error.details
        })
    });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req, res, next) {
    const error = new AppError(`Route not found: ${req.originalUrl}`, 404);
    next(error);
}

/**
 * Unhandled rejection handler
 */
export function unhandledRejectionHandler() {
    process.on('unhandledRejection', (err) => {
        logger.error('💥 UNHANDLED REJECTION! Shutting down...', {
            error: err.message,
            stack: err.stack
        });
        process.exit(1);
    });
}

/**
 * Uncaught exception handler
 */
export function uncaughtExceptionHandler() {
    process.on('uncaughtException', (err) => {
        logger.error('💥 UNCAUGHT EXCEPTION! Shutting down...', {
            error: err.message,
            stack: err.stack
        });
        process.exit(1);
    });
}
