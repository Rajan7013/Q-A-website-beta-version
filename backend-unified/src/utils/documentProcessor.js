// import pdfParse from 'pdf-parse'; // Not needed - using LangChain processor
import mammoth from 'mammoth';
import unzipper from 'unzipper';
import xml2js from 'xml2js';
import { logger } from './logger.js';

export async function extractTextFromPDF(buffer) {
  // Legacy PDF processor - DISABLED
  // Use LangChain processor instead (documentProcessorLangChain.js)
  // Set USE_LANGCHAIN=true in .env
  throw new Error('Legacy PDF processor disabled. Use LangChain processor (USE_LANGCHAIN=true in .env)');
}

export async function extractTextFromDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return {
      text: result.value,
      messages: result.messages
    };
  } catch (error) {
    logger.error('DOCX extraction failed', { error: error.message });
    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
  }
}

export async function extractTextFromPPTX(buffer) {
  try {
    const directory = await unzipper.Open.buffer(buffer);
    let text = '';

    for (const file of directory.files) {
      if (file.path.startsWith('ppt/slides/') && file.path.endsWith('.xml')) {
        const content = await file.buffer();
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(content.toString());

        if (result['p:sld'] && result['p:sld']['p:cSld']) {
          const cSld = result['p:sld']['p:cSld'][0];
          if (cSld['p:spTree'] && cSld['p:spTree'][0]['p:sp']) {
            for (const sp of cSld['p:spTree'][0]['p:sp']) {
              if (sp['p:txBody']) {
                for (const txBody of sp['p:txBody']) {
                  if (txBody['a:p']) {
                    for (const p of txBody['a:p']) {
                      if (p['a:r']) {
                        for (const r of p['a:r']) {
                          if (r['a:t']) {
                            text += r['a:t'][0] + '\n';
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

    return { text };
  } catch (error) {
    logger.error('PPTX extraction failed', { error: error.message });
    throw new Error(`Failed to extract text from PPTX: ${error.message}`);
  }
}

export function chunkText(text, chunkSize = 1000, overlap = 100) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.substring(start, end);

    chunks.push({
      content: chunk.trim(),
      startOffset: start,
      endOffset: end,
      chunkIndex: chunks.length
    });

    start += chunkSize - overlap;
  }

  return chunks;
}

export async function processDocument(buffer, fileType) {
  try {
    let extractedData;

    switch (fileType.toLowerCase()) {
      case '.pdf':
        extractedData = await extractTextFromPDF(buffer);
        break;
      case '.docx':
        extractedData = await extractTextFromDOCX(buffer);
        break;
      case '.pptx':
        extractedData = await extractTextFromPPTX(buffer);
        break;
      case '.txt':
        extractedData = { text: buffer.toString('utf-8') };
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    const normalizedText = normalizeText(extractedData.text);
    let pages = [];

    // FOR PDFs: Use actual page-by-page text if available
    if (fileType.toLowerCase() === '.pdf' && extractedData.pageTexts && extractedData.pageTexts.length > 0) {
      logger.info('📄 Using actual PDF pages', { pageCount: extractedData.pageTexts.length });

      pages = extractedData.pageTexts.map((pageText, index) => {
        const normalized = normalizeText(pageText);
        return {
          pageNumber: index + 1,  // Real PDF page number!
          content: normalized,
          chunkIndex: 0,
          metadata: {
            source: 'pdf-page',
            actualPage: index + 1,
            wordCount: normalized.split(/\s+/).length
          }
        };
      }).filter(page => page.content.length > 50);  // Skip mostly empty pages

    } else {
      // FALLBACK: Chunk text for other formats or if PDF page extraction failed
      logger.info('📝 Using text chunking', { fileType });

      const chunks = chunkText(normalizedText, 1000, 100);
      pages = chunks.map((chunk, index) => ({
        pageNumber: index + 1,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        metadata: {
          source: 'chunk',
          startOffset: chunk.startOffset,
          endOffset: chunk.endOffset,
          wordCount: chunk.content.split(/\s+/).length
        }
      }));
    }

    logger.info('✅ Document processed', {
      fileType,
      totalPages: pages.length,
      wordCount: normalizedText.split(/\s+/).length,
      method: pages[0]?.metadata?.source || 'unknown'
    });

    return {
      text: normalizedText,
      pages,
      totalPages: pages.length,
      wordCount: normalizedText.split(/\s+/).length
    };
  } catch (error) {
    logger.error('Document processing failed', { error: error.message, fileType });
    throw error;
  }
}

export function normalizeText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ ]{2,}/g, ' ')
    .trim();
}
