// Secure logging utility to prevent sensitive data exposure

export const secureLog = {
  info: (message, data = {}) => {
    const sanitizedData = sanitizeLogData(data);
    console.log(`ℹ️ ${message}`, sanitizedData);
  },
  
  error: (message, error = {}) => {
    const sanitizedError = {
      message: error.message || 'Unknown error',
      status: error.status,
      code: error.code
      // Stack trace and other details removed for security
    };
    console.error(`❌ ${message}`, sanitizedError);
  },
  
  warn: (message, data = {}) => {
    const sanitizedData = sanitizeLogData(data);
    console.warn(`⚠️ ${message}`, sanitizedData);
  }
};

// Remove sensitive data from logs
const sanitizeLogData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  
  // Remove sensitive fields
  const sensitiveFields = [
    'apiKey', 'api_key', 'password', 'token', 'secret', 'key',
    'authorization', 'auth', 'credential', 'private'
  ];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  // Truncate long strings that might contain sensitive data
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string' && sanitized[key].length > 100) {
      sanitized[key] = sanitized[key].substring(0, 50) + '...[TRUNCATED]';
    }
  });
  
  return sanitized;
};