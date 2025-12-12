import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import unzipper from 'unzipper';
import xml2js from 'xml2js';
import { setDocumentsStore } from './chat.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
let documents = [];

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

    const fileInfo = {
      id: Date.now(),
      name: req.file.originalname,
      size: formatFileSize(req.file.size),
      path: req.file.path,
      uploaded: new Date().toISOString(),
      status: 'processing',
      type: path.extname(req.file.originalname).toLowerCase()
    };

    // Process file and extract text
    const extractedText = await extractTextFromFile(req.file.path, fileInfo.type);
    fileInfo.pages = Math.ceil(extractedText.length / 3000);
    fileInfo.status = 'processed';
    fileInfo.textContent = extractedText;

    documents.push(fileInfo);
    
    // Update the documents store in chat route
    setDocumentsStore(documents);

    logger.info('Document uploaded', { 
      name: fileInfo.name, 
      size: fileInfo.size,
      pages: fileInfo.pages 
    });

    res.json({
      message: 'File uploaded successfully',
      document: fileInfo
    });

  } catch (error) {
    logger.error('Upload error', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to upload file',
      message: error.message 
    });
  }
});

// Get all documents
router.get('/list', async (req, res) => {
  try {
    const docsWithMetadata = documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      size: doc.size,
      pages: doc.pages,
      uploaded: doc.uploaded,
      status: doc.status,
      type: doc.type
    }));
    
    res.json({
      documents: docsWithMetadata
    });
  } catch (error) {
    logger.error('List documents error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docIndex = documents.findIndex(doc => doc.id.toString() === id);
    
    if (docIndex >= 0) {
      const doc = documents[docIndex];
      // Delete physical file
      try {
        await fs.unlink(doc.path);
      } catch (err) {
        logger.warn('Failed to delete physical file', { path: doc.path });
      }
      
      documents.splice(docIndex, 1);
      setDocumentsStore(documents);
      
      logger.info('Document deleted', { id, name: doc.name });
    }
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    logger.error('Delete document error', { error: error.message });
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
    logger.error('Text extraction error', { error: error.message, fileType });
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
