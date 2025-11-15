import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import unzipper from 'unzipper';
import xml2js from 'xml2js';
import { setDocumentsStore } from './chat.js';
import { uploadToR2, deleteFromR2 } from '../utils/r2Storage.js';

const router = express.Router();
const DOCUMENTS_FILE = './documents.json';

// Load documents from file on startup
let documents = [];
const loadDocuments = async () => {
  try {
    const data = await fs.readFile(DOCUMENTS_FILE, 'utf-8');
    documents = JSON.parse(data);
    setDocumentsStore(documents);
    console.log(`Loaded ${documents.length} documents from storage`);
  } catch (error) {
    console.log('No existing documents file, starting fresh');
    documents = [];
  }
};

// Save documents to file
const saveDocuments = async () => {
  try {
    await fs.writeFile(DOCUMENTS_FILE, JSON.stringify(documents, null, 2));
  } catch (error) {
    console.error('Failed to save documents:', error);
  }
};

// Initialize documents on startup
loadDocuments();


// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = './uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
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
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, TXT, PPTX allowed.'));
    }
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
      path: req.file.path,
      uploaded: new Date().toISOString(),
      status: 'processing',
      type: path.extname(req.file.originalname).toLowerCase()
    };

    // Process file and extract text (SAME - for AI)
    const extractedText = await extractTextFromFile(req.file.path, fileInfo.type);
    fileInfo.pages = Math.ceil(extractedText.length / 3000);
    fileInfo.textContent = extractedText; // KEEPS AI WORKING 100%

    // Upload to R2 (NEW)
    const r2Result = await uploadToR2(req.file.path, req.file.originalname);
    
    if (r2Result.success) {
      fileInfo.r2Url = r2Result.publicUrl;
      fileInfo.r2FileName = r2Result.fileName;
      fileInfo.storageType = 'r2';
      console.log('✅ Document stored in R2:', r2Result.publicUrl);
    } else {
      fileInfo.storageType = 'local';
      console.log('⚠️ R2 failed, using local storage');
    }

    fileInfo.status = 'processed';
    documents.push(fileInfo);
    
    // Save to file and update chat store
    await saveDocuments();
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
    const docToDelete = documents.find(doc => doc.id.toString() === id);
    
    // Delete from R2 if stored there
    if (docToDelete && docToDelete.r2FileName) {
      await deleteFromR2(docToDelete.r2FileName);
    }
    
    documents = documents.filter(doc => doc.id.toString() !== id);
    
    // Save to file and update chat store
    await saveDocuments();
    setDocumentsStore(documents);
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

async function extractTextFromFile(filePath, fileType) {
  try {
    if (fileType === '.pdf') {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } else if (fileType === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } else if (fileType === '.txt') {
      return await fs.readFile(filePath, 'utf-8');
    } else if (fileType === '.pptx') {
      const directory = await unzipper.Open.file(filePath);
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