/**
 * Health Check Route
 * Monitors system health and dependencies
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Create Supabase client for health checks
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

/**
 * GET /api/health
 * Basic health check
 */
router.get('/', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0'
        };

        res.status(200).json(health);
    } catch (error) {
        logger.error('Health check failed', { error: error.message });
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

/**
 * GET /api/health/detailed
 * Detailed health check with dependency status
 */
router.get('/detailed', async (req, res) => {
    const checks = {
        server: { status: 'healthy', responseTime: 0 },
        database: { status: 'unknown', responseTime: 0 },
        gemini: { status: 'unknown', responseTime: 0 },
        cohere: { status: 'unknown', responseTime: 0 }
    };

    let overallStatus = 'healthy';

    try {
        // Check server
        const serverStart = Date.now();
        checks.server.status = 'healthy';
        checks.server.responseTime = Date.now() - serverStart;

        // Check database connection
        const dbStart = Date.now();
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id')
                .limit(1);

            if (error) throw error;

            checks.database.status = 'healthy';
            checks.database.responseTime = Date.now() - dbStart;
        } catch (error) {
            checks.database.status = 'unhealthy';
            checks.database.error = error.message;
            overallStatus = 'degraded';
        }

        // Check Gemini API
        const geminiStart = Date.now();
        try {
            if (process.env.GEMINI_API_KEY) {
                checks.gemini.status = 'configured';
                checks.gemini.responseTime = Date.now() - geminiStart;
            } else {
                checks.gemini.status = 'not_configured';
                overallStatus = 'degraded';
            }
        } catch (error) {
            checks.gemini.status = 'unhealthy';
            checks.gemini.error = error.message;
            overallStatus = 'degraded';
        }

        // Check Cohere API
        const cohereStart = Date.now();
        try {
            if (process.env.COHERE_API_KEY) {
                checks.cohere.status = 'configured';
                checks.cohere.responseTime = Date.now() - cohereStart;
            } else {
                checks.cohere.status = 'not_configured';
                // Cohere is optional, don't degrade status
            }
        } catch (error) {
            checks.cohere.status = 'unhealthy';
            checks.cohere.error = error.message;
        }

        const response = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: process.env.npm_package_version || '1.0.0',
            checks
        };

        const statusCode = overallStatus === 'healthy' ? 200 : 503;
        res.status(statusCode).json(response);

    } catch (error) {
        logger.error('Detailed health check failed', { error: error.message });
        res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            checks
        });
    }
});

/**
 * GET /api/health/ready
 * Readiness probe for Kubernetes/Railway
 */
router.get('/ready', async (req, res) => {
    try {
        // Check if database is accessible
        const { error } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (error) throw error;

        res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Readiness check failed', { error: error.message });
        res.status(503).json({
            status: 'not_ready',
            error: error.message
        });
    }
});

/**
 * GET /api/health/live
 * Liveness probe for Kubernetes/Railway
 */
router.get('/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

export default router;
