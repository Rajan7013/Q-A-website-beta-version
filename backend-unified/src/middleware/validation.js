/**
 * Request Validation Middleware
 * Validates and sanitizes incoming requests
 */

import { logger } from '../utils/logger.js';

/**
 * Validate file upload
 */
export function validateFileUpload(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({
                error: 'No file uploaded',
                message: 'Please select a file to upload'
            });
        }

        const file = req.file;
        const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
        const ALLOWED_TYPES = ['.pdf', '.docx', '.pptx', '.txt'];
        const ALLOWED_MIMES = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain'
        ];

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            return res.status(400).json({
                error: 'File too large',
                message: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
                maxSize: MAX_FILE_SIZE
            });
        }

        // Check file extension
        const ext = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
        if (!ext || !ALLOWED_TYPES.includes(ext)) {
            return res.status(400).json({
                error: 'Invalid file type',
                message: `Only ${ALLOWED_TYPES.join(', ')} files are allowed`,
                allowedTypes: ALLOWED_TYPES
            });
        }

        // Check MIME type
        if (!ALLOWED_MIMES.includes(file.mimetype)) {
            return res.status(400).json({
                error: 'Invalid MIME type',
                message: 'File type does not match its extension',
                detectedType: file.mimetype
            });
        }

        logger.info('✅ File validation passed', {
            filename: file.originalname,
            size: file.size,
            type: file.mimetype
        });

        next();
    } catch (error) {
        logger.error('File validation error', { error: error.message });
        res.status(500).json({
            error: 'Validation failed',
            message: 'An error occurred during file validation'
        });
    }
}

/**
 * Validate query request
 */
export function validateQuery(req, res, next) {
    try {
        const { query, documentIds, language } = req.body;

        // Validate query
        if (!query || typeof query !== 'string') {
            return res.status(400).json({
                error: 'Invalid query',
                message: 'Query must be a non-empty string'
            });
        }

        if (query.trim().length === 0) {
            return res.status(400).json({
                error: 'Empty query',
                message: 'Please enter a question'
            });
        }

        if (query.length > 1000) {
            return res.status(400).json({
                error: 'Query too long',
                message: 'Query must be less than 1000 characters',
                maxLength: 1000
            });
        }

        // Sanitize query (remove potential injection attempts)
        const sanitized = query
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, '')
            .trim();

        if (sanitized !== query) {
            logger.warn('⚠️ Query sanitized', {
                original: query.substring(0, 50),
                sanitized: sanitized.substring(0, 50)
            });
        }

        req.body.query = sanitized;

        // Validate documentIds (optional)
        if (documentIds !== undefined) {
            if (!Array.isArray(documentIds)) {
                return res.status(400).json({
                    error: 'Invalid documentIds',
                    message: 'documentIds must be an array'
                });
            }

            if (documentIds.length > 50) {
                return res.status(400).json({
                    error: 'Too many documents',
                    message: 'Maximum 50 documents allowed per query',
                    maxDocuments: 50
                });
            }
        }

        // Validate language (optional)
        if (language !== undefined) {
            const ALLOWED_LANGUAGES = ['en', 'hi', 'te', 'ta', 'ml', 'bn', 'ne', 'mai'];
            if (!ALLOWED_LANGUAGES.includes(language)) {
                return res.status(400).json({
                    error: 'Invalid language',
                    message: `Language must be one of: ${ALLOWED_LANGUAGES.join(', ')}`,
                    allowedLanguages: ALLOWED_LANGUAGES
                });
            }
        }

        logger.info('✅ Query validation passed', {
            queryLength: sanitized.length,
            documentCount: documentIds?.length || 0
        });

        next();
    } catch (error) {
        logger.error('Query validation error', { error: error.message });
        res.status(500).json({
            error: 'Validation failed',
            message: 'An error occurred during query validation'
        });
    }
}

/**
 * Validate user ID
 */
export function validateUserId(req, res, next) {
    try {
        const userId = req.userId || req.body.userId;

        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User ID is required'
            });
        }

        // UUID format validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
            return res.status(400).json({
                error: 'Invalid user ID',
                message: 'User ID must be a valid UUID'
            });
        }

        next();
    } catch (error) {
        logger.error('User ID validation error', { error: error.message });
        res.status(500).json({
            error: 'Validation failed',
            message: 'An error occurred during user validation'
        });
    }
}

/**
 * Sanitize text input
 */
export function sanitizeText(text) {
    if (!text || typeof text !== 'string') return '';

    return text
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
}
