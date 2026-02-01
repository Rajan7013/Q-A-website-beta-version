import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from './logger.js';

// Initialize S3 Client for Cloudflare R2
let r2Client = null;

if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    }
  });
  logger.info('✅ Cloudflare R2 Client Initialized');
} else {
  logger.warn('⚠️ R2 Credentials missing, falling back to local storage (NOT recommended for production)');
}

export function generateFileKey(userId, filename) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  // Sanitize filename to be S3/URL safe
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${userId}_${timestamp}_${random}_${sanitizedFilename}`;
}

export async function uploadToR2(fileBuffer, fileKey, contentType) {
  if (!r2Client) {
    // FALLBACK: Local Storage (Copied from previous mock)
    // Only use for dev or if config is broken
    const fs = (await import('fs/promises')).default;
    const path = (await import('path')).default;
    const UPLOAD_DIR = './uploads';
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, fileKey), fileBuffer);
    return { success: true, fileKey, size: fileBuffer.length, location: 'local' };
  }

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await r2Client.send(command);
    logger.info('File uploaded to R2', { fileKey });

    return {
      success: true,
      fileKey,
      size: fileBuffer.length,
      location: 'r2'
    };
  } catch (error) {
    logger.error('R2 Upload failed', { error: error.message, fileKey });
    throw new Error(`Failed to upload to R2: ${error.message}`);
  }
}

export async function getPresignedDownloadUrl(fileKey) {
  if (!r2Client) {
    // Local fallback
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    return `${baseUrl}/uploads/${fileKey}`;
  }

  try {
    // If we have a public URL configured, use it (cheaper/faster)
    if (process.env.R2_PUBLIC_URL) {
      // Ensure no double slashes
      const baseUrl = process.env.R2_PUBLIC_URL.replace(/\/$/, '');
      return `${baseUrl}/${fileKey}`;
    }

    // Otherwise generate signed URL (private buckets)
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
    });

    // Valid for 1 hour
    return await getSignedUrl(r2Client, command, { expiresIn: 3600 });
  } catch (error) {
    logger.error('Failed to generate presigned URL', { error: error.message, fileKey });
    throw error;
  }
}

export async function deleteFromR2(fileKey) {
  if (!r2Client) {
    // Local fallback
    const fs = (await import('fs/promises')).default;
    const path = (await import('path')).default;
    await fs.unlink(path.join('./uploads', fileKey)).catch(() => { });
    return { success: true };
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
    });

    await r2Client.send(command);
    logger.info('File deleted from R2', { fileKey });
    return { success: true };
  } catch (error) {
    logger.error('R2 Delete failed', { error: error.message, fileKey });
    // Don't throw if it's just missing
    return { success: false, error: error.message };
  }
}
