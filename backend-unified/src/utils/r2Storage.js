import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from './logger.js';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'ai-doc-analyzer';

export function generateFileKey(userId, filename) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileExt = sanitizedFilename.split('.').pop();
  const baseName = sanitizedFilename.substring(0, sanitizedFilename.lastIndexOf('.'));
  const truncatedBase = baseName.substring(0, 50);
  
  return `${userId}/${timestamp}-${random}-${truncatedBase}.${fileExt}`;
}

export async function uploadToR2(fileBuffer, fileKey, contentType) {
  try {
    logger.info('Attempting R2 upload', { 
      bucket: BUCKET_NAME, 
      fileKey, 
      size: fileBuffer.length,
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    });

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: {
        uploadedAt: new Date().toISOString()
      }
    });

    await s3Client.send(command);
    
    logger.info('File uploaded to R2', { fileKey, size: fileBuffer.length });
    
    return {
      success: true,
      fileKey,
      size: fileBuffer.length
    };
  } catch (error) {
    logger.error('R2 upload failed', { 
      error: error.message, 
      code: error.Code,
      statusCode: error.$metadata?.httpStatusCode,
      fileKey,
      bucket: BUCKET_NAME
    });
    throw new Error(`Failed to upload file to R2: ${error.message}`);
  }
}

export async function getPresignedDownloadUrl(fileKey, expiresIn = 300) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    
    logger.info('Presigned download URL generated', { fileKey, expiresIn });
    
    return url;
  } catch (error) {
    logger.error('Failed to generate presigned URL', { error: error.message, fileKey });
    throw new Error(`Failed to generate download URL: ${error.message}`);
  }
}

export async function getPresignedUploadUrl(fileKey, contentType, expiresIn = 600) {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    
    logger.info('Presigned upload URL generated', { fileKey, expiresIn });
    
    return url;
  } catch (error) {
    logger.error('Failed to generate presigned upload URL', { error: error.message, fileKey });
    throw new Error(`Failed to generate upload URL: ${error.message}`);
  }
}

export async function deleteFromR2(fileKey) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    await s3Client.send(command);
    
    logger.info('File deleted from R2', { fileKey });
    
    return { success: true };
  } catch (error) {
    logger.error('R2 delete failed', { error: error.message, fileKey });
    throw new Error(`Failed to delete file from R2: ${error.message}`);
  }
}

export async function getFileMetadata(fileKey) {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    const response = await s3Client.send(command);
    
    return {
      size: response.ContentLength,
      contentType: response.ContentType,
      lastModified: response.LastModified,
      metadata: response.Metadata
    };
  } catch (error) {
    logger.error('Failed to get file metadata', { error: error.message, fileKey });
    throw new Error(`Failed to get file metadata: ${error.message}`);
  }
}
