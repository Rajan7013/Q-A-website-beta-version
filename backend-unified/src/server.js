import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { securityHeaders } from './middleware/security.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Import routes - Legacy (for backward compatibility)
import chatRoutes from './routes/chat.js';
import documentRoutes from './routes/documents.js';
import profileRoutes from './routes/profile.js';
import statsRoutes from './routes/stats.js';
import historyRoutes from './routes/history.js';

// Import production routes
import uploadRoutes from './routes/upload.js';
import queryRoutes from './routes/query.js';
import presignedRoutes from './routes/presigned.js';
import userRoutes from './routes/user.js';

dotenv.config();

// Suppress harmless PDF parsing warnings
const originalWarn = console.warn;
console.warn = function(...args) {
  const message = args.join(' ');
  if (message.includes('TT:') || message.includes('Warning: TT')) {
    return;
  }
  originalWarn.apply(console, args);
};

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(securityHeaders);

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
app.use('/api/', apiLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Request logging
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    path: req.path,
    ip: req.ip
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Production API Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/doc', presignedRoutes);
app.use('/api/me', userRoutes);

// Legacy API Routes (for backward compatibility)
app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/history', historyRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path
  });
  
  res.status(err.statusCode || 500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing server gracefully...');
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📡 CORS enabled for: ${process.env.CORS_ORIGIN}`);
  logger.info(`🤖 Gemini API: ${process.env.GEMINI_API_KEY ? 'Configured ✓' : 'Missing ✗'}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
