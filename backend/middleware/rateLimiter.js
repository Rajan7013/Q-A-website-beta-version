// Rate limiting to prevent abuse and API key exhaustion

const requestCounts = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // per window

export const rateLimiter = (req, res, next) => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  
  // Clean old entries
  for (const [id, data] of requestCounts.entries()) {
    if (now - data.windowStart > WINDOW_MS) {
      requestCounts.delete(id);
    }
  }
  
  // Get or create client data
  let clientData = requestCounts.get(clientId);
  if (!clientData || now - clientData.windowStart > WINDOW_MS) {
    clientData = {
      count: 0,
      windowStart: now
    };
    requestCounts.set(clientId, clientData);
  }
  
  // Check rate limit
  if (clientData.count >= MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((WINDOW_MS - (now - clientData.windowStart)) / 1000)
    });
  }
  
  // Increment counter
  clientData.count++;
  
  next();
};