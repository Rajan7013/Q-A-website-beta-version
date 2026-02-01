import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { uploadRateLimiter } from '../middleware/rateLimiter.js';
import { validateFileUpload, calculateChecksum, scanFile } from '../middleware/security.js';
import { uploadToR2, generateFileKey } from '../utils/r2Storage.js';
import { createDocument, saveDocumentPages, ensureUser } from '../utils/supabase.js';
import { processDocument } from '../utils/documentProcessorLangChain.js'; // Use LangChain processor
import { logger } from '../utils/logger.js';
import embeddingClient from '../utils/embeddingClient.js';
import supabase from '../utils/supabase.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE_MB) * 1024 * 1024 || 50 * 1024 * 1024
  }
});

router.post('/', requireAuth, uploadRateLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    validateFileUpload(req.file);

    await ensureUser(req.userId, req.user.email, req.user.firstName, req.user.lastName);

    const scanResult = await scanFile(req.file.buffer);
    logger.info('File scanned', { safe: scanResult.safe, checksum: scanResult.checksum });

    const fileKey = generateFileKey(req.userId, req.file.originalname);

    await uploadToR2(req.file.buffer, fileKey, req.file.mimetype);

    const fileType = '.' + req.file.originalname.split('.').pop().toLowerCase();
    const processedDoc = await processDocument(req.file.buffer, fileType);

    const document = await createDocument(req.userId, {
      filename: req.file.originalname,
      file_key: fileKey,
      file_size: req.file.size,
      file_type: fileType,
      checksum: scanResult.checksum,
      page_count: processedDoc.totalPages,
      word_count: processedDoc.wordCount,
      status: 'processed'
    });

    const savedPages = await saveDocumentPages(document.id, processedDoc.pages);

    // Generate embeddings for each page (async, don't block response)
    (async () => {
      try {
        const embeddingServiceHealthy = await embeddingClient.checkHealth();
        if (embeddingServiceHealthy) {
          logger.info('🧮 Generating embeddings for document pages...', { documentId: document.id, pageCount: savedPages.length });

          for (const page of savedPages) {
            try {
              const embedding = await embeddingClient.generateEmbedding(page.content);
              if (embedding && embedding.length === (parseInt(process.env.EMBEDDING_DIMENSION) || 384)) {
                await supabase
                  .from('document_pages')
                  .update({ embedding })
                  .eq('id', page.id);
              }
            } catch (err) {
              logger.warn('Failed to generate embedding for page', { pageId: page.id, error: err.message });
            }
          }

          logger.info('✅ Embeddings generated', { documentId: document.id });
        } else {
          logger.warn('⚠️ Embedding service unavailable, skipping embeddings', { documentId: document.id });
        }
      } catch (error) {
        logger.error('Embedding generation failed', { documentId: document.id, error: error.message });
      }
    })();

    logger.info('Document uploaded and indexed', {
      documentId: document.id,
      userId: req.userId,
      filename: req.file.originalname
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded and processed successfully',
      document: {
        id: document.id,
        name: document.filename, // Map to 'name' for frontend
        filename: document.filename,
        size: document.file_size, // Map to 'size' for frontend
        fileSize: document.file_size,
        pageCount: document.page_count,
        wordCount: document.word_count,
        status: document.status
      }
    });

  } catch (error) {
    logger.error('Upload error', { error: error.message, userId: req.userId });

    if (error.message.includes('size exceeds') || error.message.includes('not allowed')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({
      error: 'Failed to upload file',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;
