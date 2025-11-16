import express from 'express';
import multer from 'multer';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import unzipper from 'unzipper';
import xml2js from 'xml2js';
import { uploadToR2, deleteFromR2 } from '../utils/r2Storage.js';
import { validateFileExtension, sanitizeFilename } from '../utils/pathSecurity.js';
import supabase from '../utils/supabaseClient.js'; // IMPORT SUPABASE

const router = express.Router();

// The database is now the single source of truth.
// All 'let documents = []' and file-based logic is GONE.

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt', '.pptx'];
    try {
      const sanitizedName = sanitizeFilename(file.originalname);
      const ext = validateFileExtension(sanitizedName, allowedTypes);
      if (ext) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type.'));
      }
    } catch (error) {
      cb(error);
    }
  }
});

// Upload document
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const userId = req.body.userId || 'anonymous';
    console.log('📁 Document upload for user:', userId.substring(0, 20) + '...');

    const newDocumentId = Date.now(); 

    const fileInfo = {
      id: newDocumentId,
      userId: userId,
      name: req.file.originalname,
      size: formatFileSize(req.file.size),
      uploaded: new Date().toISOString(),
      status: 'processing',
      type: path.extname(req.file.originalname).toLowerCase()
    };

    // Process file and extract text
    const extractedText = await extractTextFromFile(req.file.buffer, fileInfo.type);
    fileInfo.pages = Math.ceil(extractedText.length / 3000);
    fileInfo.textContent = extractedText;

    // Upload to R2
    const r2Result = await uploadToR2(req.file.buffer, req.file.originalname);
    
    if (r2Result.success) {
      fileInfo.r2Url = r2Result.publicUrl;
      fileInfo.r2FileName = r2Result.fileName;
      fileInfo.storageType = 'r2';
      console.log('✅ Document stored in R2:', r2Result.publicUrl);
    } else {
      throw new Error('R2 upload failed, and local storage is not supported.');
    }

    fileInfo.status = 'processed';

    // NEW: Insert into Supabase
    const { error: insertError } = await supabase
      .from('documents')
      .insert(fileInfo);

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      throw new Error(insertError.message);
    }
    
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
    
    // NEW: Select from Supabase
    const { data: userDocuments, error: selectError } = await supabase
      .from('documents')
      // Select only the metadata, NOT the huge textContent
      .select('id, name, size, pages, uploaded, status, type, r2Url, storageType')
      .eq('userId', userId)
      .order('uploaded', { ascending: false }); // Show newest first

    if (selectError) {
      throw new Error(selectError.message);
    }
    
    console.log(`📁 Returning ${userDocuments.length} documents for user`);
    res.json({
      documents: userDocuments // Send the data directly from database
    });

  } catch (error) {
    console.error('List documents error:', error.message);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Delete document
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string' || id.length > 50) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }
    
    // NEW: Get the doc from Supabase to find its r2FileName
    const { data: docToDelete, error: findError } = await supabase
      .from('documents')
      .select('id, r2FileName')
      .eq('id', id)
      .single(); // Get just one record

    if (findError || !docToDelete) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Delete from R2 if stored there
    if (docToDelete.r2FileName) {
      await deleteFromR2(docToDelete.r2FileName);
      console.log('✅ Deleted from R2');
    }
    
    // NEW: Delete from Supabase
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error.message);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// This function is UNCHANGED, it works with buffers
async function extractTextFromFile(fileBuffer, fileType) {
  try {
    if (fileType === '.pdf') {
      const data = await pdfParse(fileBuffer);
      return data.text;
    } else if (fileType === '.docx') {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;
    } else if (fileType === '.txt') {
      return fileBuffer.toString('utf-8');
    } else if (fileType === '.pptx') {
      const directory = await unzipper.Open.buffer(fileBuffer);
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

// This function is UNCHANGED
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default router;