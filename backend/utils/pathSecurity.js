import path from 'path';

// Secure path validation to prevent directory traversal attacks
export const validatePath = (filePath, allowedDirectory) => {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path');
  }

  // Normalize the path to resolve any .. or . components
  const normalizedPath = path.normalize(filePath);
  
  // Check for directory traversal attempts
  if (normalizedPath.includes('..') || normalizedPath.includes('~')) {
    throw new Error('Directory traversal attempt detected');
  }
  
  // Ensure path is within allowed directory
  if (allowedDirectory) {
    const resolvedPath = path.resolve(normalizedPath);
    const resolvedAllowedDir = path.resolve(allowedDirectory);
    
    if (!resolvedPath.startsWith(resolvedAllowedDir)) {
      throw new Error('Path outside allowed directory');
    }
  }
  
  return normalizedPath;
};

// Validate file extension
export const validateFileExtension = (filename, allowedExtensions = []) => {
  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename');
  }
  
  const ext = path.extname(filename).toLowerCase();
  
  if (allowedExtensions.length > 0 && !allowedExtensions.includes(ext)) {
    throw new Error(`File type ${ext} not allowed`);
  }
  
  return ext;
};

// Sanitize filename
export const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename');
  }
  
  // Remove dangerous characters and patterns
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/^\.+/, '')
    .replace(/\.+$/, '')
    .trim();
};