import crypto from 'crypto';
import { logger } from '../utils/logger.js';

export function securityHeaders(req, res, next) {
  const nonce = crypto.randomBytes(16).toString('base64');
  
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ${process.env.FRONTEND_URL || 'http://localhost:5173'}`
  );
  
  req.nonce = nonce;
  next();
}

export function sanitizeResponse(data) {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitive = ['password', 'token', 'secret', 'apiKey', 'privateKey', 'sessionToken'];
  const sanitized = Array.isArray(data) ? [] : {};

  for (const key in data) {
    if (sensitive.some(s => key.toLowerCase().includes(s.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      sanitized[key] = sanitizeResponse(data[key]);
    } else {
      sanitized[key] = data[key];
    }
  }

  return sanitized;
}

export function validateFileUpload(file) {
  const maxSize = parseInt(process.env.MAX_FILE_SIZE_MB) * 1024 * 1024 || 50 * 1024 * 1024;
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,docx,pptx,txt').split(',');
  const allowedMimes = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain'
  };

  if (!file) {
    throw new Error('No file provided');
  }

  if (file.size > maxSize) {
    throw new Error(`File size exceeds maximum allowed size of ${process.env.MAX_FILE_SIZE_MB || 50}MB`);
  }

  const fileExt = file.originalname.split('.').pop().toLowerCase();
  if (!allowedTypes.includes(fileExt)) {
    throw new Error(`File type .${fileExt} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  if (file.mimetype && !Object.values(allowedMimes).includes(file.mimetype)) {
    throw new Error('Invalid MIME type');
  }

  const suspiciousPatterns = [/\.exe$/, /\.bat$/, /\.sh$/, /\.cmd$/, /\.com$/];
  if (suspiciousPatterns.some(pattern => pattern.test(file.originalname.toLowerCase()))) {
    throw new Error('Suspicious file name pattern detected');
  }

  return true;
}

export function calculateChecksum(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function scanFile(buffer) {
  const executableSignatures = [
    Buffer.from([0x4D, 0x5A]),
    Buffer.from([0x7F, 0x45, 0x4C, 0x46])
  ];

  for (const signature of executableSignatures) {
    if (buffer.slice(0, signature.length).equals(signature)) {
      throw new Error('Executable file detected and rejected');
    }
  }

  if (buffer.length === 0) {
    throw new Error('Empty file detected');
  }

  const executableExtensions = ['.exe', '.dll', '.so', '.dylib', '.bat', '.sh', '.cmd'];
  
  return { safe: true, checksum: calculateChecksum(buffer) };
}
