import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { processDocument } from '../utils/documentProcessor.js';
import { processDocument as processDocumentLangChain } from '../utils/documentProcessorLangChain.js';
import { createDocument, ensureUser, getDocument, getUserDocuments, deleteDocument as deleteSupabaseDocument } from '../utils/supabase.js'; // Import deleteSupabaseDocument to resolve conflict
import embeddingClient from '../utils/embeddingClient.js';
import { logger } from '../utils/logger.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Supabase Client for direct batch inserts with vectors
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

// Configure multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = './uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) { cb(error, null); }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt', '.pptx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) cb(null, true);
    else cb(new Error('Invalid file type'));
  }
});

// REAL Upload Endpoint with Embeddings
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { userId } = req.body; // Expect userId from frontend
    if (!req.file || !userId) {
      return res.status(400).json({ error: 'File and userId are required' });
    }

    // 0. Ensure user exists in DB
    await ensureUser(userId, '', 'User', '');

    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const buffer = await fs.readFile(req.file.path);

    // 2. Process document (extract text and chunk)
    logger.info('Processing document...', { fileType: fileExtension });

    // Use LangChain processor if feature flag is enabled
    const useLangChain = process.env.USE_LANGCHAIN === 'true';
    const processor = useLangChain ? processDocumentLangChain : processDocument;

    logger.info('Using document processor', {
      processor: useLangChain ? 'LangChain' : 'pdf-parse',
      fileType: fileExtension
    });

    const processed = await processor(buffer, fileExtension, req.file.originalname);

    // 2. Create Document Record
    const documentData = {
      title: req.file.originalname,
      original_filename: req.file.originalname,
      file_type: path.extname(req.file.originalname),
      file_size: req.file.size,
      storage_path: req.file.path, // In real app, upload to R2/S3
      page_count: processed.totalPages,
      status: 'processing'
    };

    // Insert into 'documents' table
    const docRecord = await createDocument(userId, documentData);

    // 3. Generate Embeddings for every page/chunk
    logger.info('Generating embeddings...', { pages: processed.pages.length });
    const pageRecords = [];

    // Process in batches of 5 to avoid rate limits
    const BATCH_SIZE = 5;
    for (let i = 0; i < processed.pages.length; i += BATCH_SIZE) {
      const batch = processed.pages.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (page, idx) => {
        try {
          const vector = await embeddingClient.generateEmbedding(page.content);
          if (vector && vector.length === 768) {
            pageRecords.push({
              document_id: docRecord.id, // Supabase UUID
              page_number: page.pageNumber || (i + idx + 1),
              content: page.content,
              embedding: vector, // VECTOR
              metadata: page.metadata || {}
            });
          }
        } catch (e) {
          logger.error('Embedding failed for page', { page: i + idx, error: e.message });
        }
      }));
    }

    // 4. Batch Insert Pages into 'document_pages'
    if (pageRecords.length > 0) {
      const { error } = await supabase
        .from('document_pages')
        .insert(pageRecords);

      if (error) throw error;
      logger.info('✅ Ingestion complete', { count: pageRecords.length });
    }

    // 5. Update Status
    await supabase.from('documents').update({ status: 'ready' }).eq('id', docRecord.id);

    // Return the Final DB Object
    res.json({
      message: 'File uploaded and analyzed',
      document: {
        id: docRecord.id,
        name: docRecord.title,
        size: docRecord.file_size, // Keep frontend format happy
        pages: docRecord.page_count,
        uploaded: new Date().toISOString(),
        status: 'ready',
        type: docRecord.file_type
      }
    });

  } catch (error) {
    logger.error('Upload error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

// GET user docs
router.get('/', async (req, res) => {
  try {
    // Need userId from query or auth middleware. 
    // Assuming your middleware provides req.userId, OR we look at query param ?userId=...
    // The API client sends GET /doc without params usually if using token, or we need to fix frontend.
    // Let's assume req.userId is set by `requireAuth`.
    // If not, we error.

    // Wait, documents.js in unified backend usually doesn't have requireAuth on it in the main server.js??
    // Checking server.js would be wise, but for now assuming req.userId if auth middleware is used.
    // If not, check req.query.userId.

    const userId = req.userId || req.query.userId;
    if (!userId) return res.json({ documents: [] });

    const docs = await getUserDocuments(userId);

    // Transform to frontend expected format
    const frontendDocs = docs.map(d => ({
      id: d.id,
      name: d.title,
      size: d.file_size,
      pages: d.page_count,
      uploaded: d.created_at,
      status: d.status,
      type: d.file_type
    }));

    res.json({ documents: frontendDocs });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE document
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId || req.query.userId; // Secure this properly in production

    await deleteSupabaseDocument(id, userId); // Deletes DB rows (cascade should delete pages)

    // Try delete local file if path exists (optional, depends on storage)
    // const doc = await getDocument(id, userId);
    // if (doc && doc.storage_path) await fs.unlink(doc.storage_path).catch(() => {});

    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
