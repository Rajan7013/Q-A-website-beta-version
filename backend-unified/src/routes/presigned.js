import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getPresignedDownloadUrl, deleteFromR2 } from '../utils/r2Storage.js';
import { getDocument, getUserDocuments, deleteDocument } from '../utils/supabase.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.get('/:documentId', requireAuth, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await getDocument(documentId, req.userId);

    if (!document) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    const presignedUrl = await getPresignedDownloadUrl(document.file_key, 300);

    logger.info('Presigned URL generated', {
      documentId,
      userId: req.userId,
      expiresIn: 300
    });

    res.json({
      url: presignedUrl,
      expiresIn: 300,
      document: {
        id: document.id,
        filename: document.filename,
        fileSize: document.file_size,
        fileType: document.file_type
      }
    });

  } catch (error) {
    logger.error('Failed to generate presigned URL', {
      error: error.message,
      documentId: req.params.documentId,
      userId: req.userId
    });

    res.status(500).json({
      error: 'Failed to generate download URL',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const documents = await getUserDocuments(req.userId);

    res.json({
      documents: documents.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        fileSize: doc.file_size,
        fileType: doc.file_type,
        pageCount: doc.page_count,
        wordCount: doc.word_count,
        status: doc.status,
        createdAt: doc.created_at
      }))
    });

  } catch (error) {
    logger.error('Failed to get documents', { error: error.message, userId: req.userId });
    res.status(500).json({ error: 'Failed to retrieve documents' });
  }
});

router.delete('/:documentId', requireAuth, async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await getDocument(documentId, req.userId);

    if (!document) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    await deleteFromR2(document.file_key);
    await deleteDocument(documentId, req.userId);

    logger.info('Document deleted', {
      documentId,
      userId: req.userId
    });

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    logger.error('Failed to delete document', {
      error: error.message,
      documentId: req.params.documentId,
      userId: req.userId
    });

    res.status(500).json({
      error: 'Failed to delete document',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;
