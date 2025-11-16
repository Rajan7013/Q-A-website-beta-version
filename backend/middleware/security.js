// Security middleware to protect against vulnerabilities
export const sanitizeInput = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    // Remove potential XSS patterns
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  };

  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// API key validation middleware
export const validateApiKey = (req, res, next) => {
  const { userApiKey } = req.body;
  
  if (userApiKey) {
    // Validate API key format (basic validation)
    if (typeof userApiKey !== 'string' || userApiKey.length < 10) {
      return res.status(400).json({
        error: 'Invalid API key format'
      });
    }
    
    // Remove any potential malicious content
    req.body.userApiKey = userApiKey.replace(/[^a-zA-Z0-9_-]/g, '');
  }
  
  next();
};