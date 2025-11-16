import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat.js';
import documentRoutes from './routes/documents.js';
import profileRoutes from './routes/profile.js';
import statsRoutes from './routes/stats.js';
import historyRoutes from './routes/history.js';
import { sanitizeInput, validateApiKey } from './middleware/security.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { secureLog } from './utils/logger.js';

dotenv.config();

// Suppress harmless PDF parsing warnings
const originalWarn = console.warn;
console.warn = function(...args) {
  const message = args.join(' ');
  // Filter out TT (TrueType) font warnings from pdf-parse
  if (message.includes('TT:') || message.includes('Warning: TT')) {
    return; // Suppress these specific warnings
  }
  originalWarn.apply(console, args); // Show other warnings
};

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(rateLimiter);
app.use(sanitizeInput);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API key validation for chat routes
app.use('/api/chat', validateApiKey);

// Routes
app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/history', historyRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.listen(PORT, () => {
  secureLog.info(`Server running on port ${PORT}`);
  secureLog.info(`CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  secureLog.info(`Gemini API: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Missing'}`);
  secureLog.info('Security middleware enabled');
});