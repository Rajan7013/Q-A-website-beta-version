import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
// [!code --] import fs from 'fs/promises';
import path from 'path';

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Upload file to R2
// We changed filePath to fileBuffer
export const uploadToR2 = async (fileBuffer, fileName) => { // [!code ++]
  try {
    // [!code --] const fileBuffer = await fs.readFile(filePath);
    const fileExtension = path.extname(fileName);
    const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    
    const uploadParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: uniqueFileName,
      Body: fileBuffer, // Pass the buffer directly
      ContentType: getContentType(fileExtension),
    };

    await r2Client.send(new PutObjectCommand(uploadParams));
    
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${uniqueFileName}`;
    
    console.log('✅ File uploaded to R2:', publicUrl);
    return {
      success: true,
      fileName: uniqueFileName,
      publicUrl: publicUrl
    };
  } catch (error) {
    console.error('❌ R2 upload failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete file from R2
export const deleteFromR2 = async (fileName) => {
  try {
    const deleteParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
    };

    await r2Client.send(new DeleteObjectCommand(deleteParams));
    console.log('✅ File deleted from R2:', fileName);
    return { success: true };
  } catch (error) {
    console.error('❌ R2 delete failed:', error);
    return { success: false, error: error.message };
  }
};

// Get content type based on file extension
const getContentType = (extension) => {
  const contentTypes = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
  };
  return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
};
