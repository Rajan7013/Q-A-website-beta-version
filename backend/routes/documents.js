import express from 'express';
import multer from 'multer';
import path from 'path';
// [!code --] import fs from 'fs/promises'; // No longer need fs for most operations
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import unzipper from 'unzipper';
import xml2js from 'xml2js';
import { setDocumentsStore } from './chat.js';
import { uploadToR2, deleteFromR2 } from '../utils/r2Storage.js';
// [!code --] import { validatePath, validateFileExtension, sanitizeFilename } from '../utils/pathSecurity.js';
// We only need extension validation and sanitize now
import { validateFileExtension, sanitizeFilename } from '../utils/pathSecurity.js'; // [!code ++]


const router = express.Router();

// [!code --] const DOCUMENTS_FILE = './documents.json';
// [!code --] // Load documents from file on startup
// [!code --] let documents = [];
// [!code --] const loadDocuments = async () => { ... };
// [!code --] // Save documents to file
// [!code --] const saveDocuments = async () => { ... };
// [!code --] // Initialize documents on startup
// [!code --] loadDocuments();

// =================================================================
// !! IMPORTANT !!
// Using a local variable for documents WILL NOT WORK on Vercel.
// Every time your serverless function sleeps, this array will be erased.
// This is a TEMPORARY fix to get uploads working.
// You MUST replace this with a real database (like Supabase).
let documents = []; // [!code ++]
console.log('Warning: Using in-memory document store. Data will not persist.'); // [!code ++]
setDocumentsStore(documents); // [!code ++]
// =================================================================


// Configure multer for file uploads
// [!code --] const storage = multer.diskStorage({ ... });
// We use memoryStorage() to hold the file in RAM, not on disk
const storage = multer.memoryStorage(); // [!code ++]

const upload = multer({
  storage: storage, // [!code ++]
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt', '.pptx'];
    // We sanitize and validate the extension from originalname
    try { // [!code ++]
      const sanitizedName = sanitizeFilename(file.originalname); // [!code ++]
      const ext = validateFileExtension(sanitizedName, allowedTypes); // [!code ++]
      if (ext) { // [!code ++]
        cb(null, true); // [!code ++]
      } else { // [!code ++]
        cb(new Error('Invalid file type.')); // [!code ++]
      } // [!code ++]
    } catch (error) { // [!code ++]
      cb(error); // [!code ++]
    } // [!code ++]
  }
});

// Upload document
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Get user ID from request (should be sent from frontend)
    const userId = req.body.userId || 'anonymous';
    console.log('📁 Document upload for user:', userId.substring(0, 20) + '...');

    const fileInfo = {
      id: Date.now(),
      userId: userId, // Associate document with user
      name: req.file.originalname,
      size: formatFileSize(req.file.size),
      // [!code --] path: req.file.path, // We no longer have a local path
      uploaded: new Date().toISOString(),
      status: 'processing',
      type: path.extname(req.file.originalname).toLowerCase()
    };

    // Process file and extract text (from buffer)
    const extractedText = await extractTextFromFile(req.file.buffer, fileInfo.type); // [!code ++]
    fileInfo.pages = Math.ceil(extractedText.length / 3000);
    fileInfo.textContent = extractedText; // KEEPS AI WORKING 100%

    // Upload to R2 (from buffer)
    const r2Result = await uploadToR2(req.file.buffer, req.file.originalname); // [!code ++]
    
    if (r2Result.success) {
      fileInfo.r2Url = r2Result.publicUrl;
      fileInfo.r2FileName = r2Result.fileName;
      fileInfo.storageType = 'r2';
      console.log('✅ Document stored in R2:', r2Result.publicUrl);
    } else {
      // This case should probably throw an error, as local storage isn't an option
      // [!code --] fileInfo.storageType = 'local';
      // [!code --] console.log('⚠️ R2 failed, using local storage');
      throw new Error('R2 upload failed, and local storage is not supported.'); // [!code ++]
    }

    fileInfo.status = 'processed';
    documents.push(fileInfo);
    
    // Save to file and update chat store
    // [!code --] await saveDocuments(); // We cannot save to a JSON file
    setDocumentsStore(documents);

    res.json({
      message: 'File uploaded successfully',
      document: fileInfo
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload file',
      message: error.message 
    });
  }
});

// Get all documents for a specific user
router.get('/list', async (req, res) => {
  try {
    const userId = req.query.userId || 'anonymous';
    console.log('📂 Fetching documents for user:', userId.substring(0, 20) + '...');
    
    // Filter documents by user ID
    const userDocuments = documents.filter(doc => doc.userId === userId);
    
    // Return user's documents with proper metadata (excluding textContent to save bandwidth)
    const docsWithMetadata = userDocuments.map(doc => ({
      id: doc.id,
      name: doc.name,
      size: doc.size,
      pages: doc.pages,
      uploaded: doc.uploaded,
      status: doc.status,
      type: doc.type,
      r2Url: doc.r2Url, // NEW - for frontend viewing
      storageType: doc.storageType // NEW - shows where stored
      // textContent is kept on backend only, not sent to frontend
    }));
    
    console.log(`📁 Returning ${docsWithMetadata.length} documents for user`);
    res.json({
      documents: docsWithMetadata
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate document ID
    if (!id || typeof id !== 'string' || id.length > 50) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }
    
    const docToDelete = documents.find(doc => doc.id.toString() === id);
    
    if (!docToDelete) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Delete from R2 if stored there
    if (docToDelete.r2FileName) {
      await deleteFromR2(docToDelete.r2FileName);
    }
    
    // [!code --] // Validate local file path before deletion
    // [!code --] if (docToDelete.path) {
    // [!code --]  try {
    // [!code --]    const validatedPath = validatePath(docToDelete.path, './uploads');
    // [!code --]    await fs.unlink(validatedPath).catch(() => {});
    // [!code --]  } catch (pathError) {
    // [!code --]    console.error('Path validation error:', pathError.message);
    // [!code --]  }
    // [!code --] }
    
    documents = documents.filter(doc => doc.id.toString() !== id);
    
    // Save to file and update chat store
    // [!code --] await saveDocuments(); // Cannot save to JSON file
    setDocumentsStore(documents);
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error.message);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// [!code --] async function extractTextFromFile(filePath, fileType) {
async function extractTextFromFile(fileBuffer, fileType) { // [!code ++]
  try {
    if (fileType === '.pdf') {
      // [!code --] const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(fileBuffer); // [!code ++]
      return data.text;
    } else if (fileType === '.docx') {
      // [!code --] const result = await mammoth.extractRawText({ path: filePath });
      const result = await mammoth.extractRawText({ buffer: fileBuffer }); // [!code ++]
      return result.value;
    } else if (fileType === '.txt') {
      // [!code --] return await fs.readFile(filePath, 'utf-8');
      return fileBuffer.toString('utf-8'); // [!code ++]
    } else if (fileType === '.pptx') {
      // [!code --] const directory = await unzipper.Open.file(filePath);
      const directory = await unzipper.Open.buffer(fileBuffer); // [!code ++]
      let text = '';
      for (const file of directory.files) {
        if (file.path.startsWith('ppt/slides/') && file.path.endsWith('.xml')) {
          const content = await file.buffer();
          const parser = new xml2js.Parser();
          const result = await parser.parseStringPromise(content.toString());
          if (result['p:sld'] && result['p:sld']['p:cSld'] && result['p:sld']['p:cSld'][0]['p:spTree']) {
            const spTree = result['p:sld']['p:cSld'][0]['p:spTree'][0];
            if (spTree['p:sp']) {
              for (const sp of spTree['p:sp']) {
                if (sp['p:txBody']) {
                  for (const txBody of sp['p:txBody']) {
                    if (txBody['a:p']) {
                      for (const p of txBody['a:p']) {
                        if (p['a:r']) {
                          for (const r of p['a:r']) {
                            if (r['a:t']) {
                              text += r['a:t'][0] + ' ';
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      return text;
    }
    return '';
  } catch (error) {
    console.error('Text extraction error:', error);
    return '';
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default router;
