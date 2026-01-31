import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
(async () => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create upload directory:', err);
  }
})();

export function generateFileKey(userId, filename) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${userId}_${timestamp}_${random}_${sanitizedFilename}`;
}

export async function uploadToR2(fileBuffer, fileKey, contentType) {
  try {
    const filePath = path.join(UPLOAD_DIR, fileKey);
    await fs.writeFile(filePath, fileBuffer);

    logger.info('File saved locally', { fileKey, size: fileBuffer.length });

    return {
      success: true,
      fileKey,
      size: fileBuffer.length
    };
  } catch (error) {
    logger.error('Local save failed', { error: error.message, fileKey });
    throw new Error(`Failed to save file locally: ${error.message}`);
  }
}

export async function getPresignedDownloadUrl(fileKey) {
  // Return a direct URL to the static file server
  // Assuming express serves /uploads directory
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${baseUrl}/uploads/${fileKey}`;
}

export async function getPresignedUploadUrl(fileKey) {
  // Not needed for local upload via multer, but returning null or throwing if called
  throw new Error('Presigned upload URLs not supported for local storage');
}

export async function deleteFromR2(fileKey) {
  try {
    const filePath = path.join(UPLOAD_DIR, fileKey);
    await fs.unlink(filePath);
    logger.info('File deleted locally', { fileKey });
    return { success: true };
  } catch (error) {
    // Ignore if file doesn't exist
    if (error.code === 'ENOENT') return { success: true };

    logger.error('Local delete failed', { error: error.message, fileKey });
    throw new Error(`Failed to delete file locally: ${error.message}`);
  }
}

export async function getFileMetadata(fileKey) {
  try {
    const filePath = path.join(UPLOAD_DIR, fileKey);
    const stats = await fs.stat(filePath);

    return {
      size: stats.size,
      contentType: 'application/octet-stream', // Generic
      lastModified: stats.mtime,
      metadata: {}
    };
  } catch (error) {
    logger.error('Failed to get local file metadata', { error: error.message, fileKey });
    throw new Error(`Failed to get file metadata: ${error.message}`);
  }
}
