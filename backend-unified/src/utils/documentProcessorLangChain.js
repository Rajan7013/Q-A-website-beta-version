/**
 * LangChain-based Document Processor
 * Provides accurate page-by-page extraction for all PDF types
 */

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import mammoth from 'mammoth';
import unzipper from 'unzipper';
import xml2js from 'xml2js';
import { logger } from './logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extract text from PDF using LangChain (page-aware)
 * Works for: text PDFs, scanned PDFs, image PDFs, Canva PDFs
 */
export async function extractTextFromPDF(buffer, filename) {
    try {
        // LangChain's PDFLoader requires a file path, so create temp file
        const tempDir = os.tmpdir();
        const tempPath = path.join(tempDir, `pdf_${Date.now()}_${filename}`);

        logger.info('Creating temp PDF file', { path: tempPath });
        fs.writeFileSync(tempPath, buffer);

        try {
            // Load PDF with LangChain - creates ONE DOCUMENT PER PAGE
            const loader = new PDFLoader(tempPath, {
                splitPages: true // Critical: ensures page-by-page loading
            });

            const docs = await loader.load();
            logger.info('PDF loaded with LangChain', {
                pages: docs.length,
                filename
            });

            // Each doc has metadata: { loc: { pageNumber: 1 }, source: "file.pdf" }
            // Split large pages into chunks while preserving page metadata
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 1000,
                chunkOverlap: 100,
                separators: ["\n\n", "\n", ". ", " ", ""]
            });

            const chunks = await splitter.splitDocuments(docs);

            logger.info('PDF chunked', {
                totalChunks: chunks.length,
                avgChunkSize: Math.round(chunks.reduce((sum, c) => sum + c.pageContent.length, 0) / chunks.length)
            });

            // Transform to our format
            const pages = chunks.map((chunk, index) => {
                // LangChain stores page number in metadata.loc.pageNumber
                const pageNumber = chunk.metadata?.loc?.pageNumber ||
                    chunk.metadata?.page ||
                    1;

                return {
                    pageNumber: pageNumber,
                    content: chunk.pageContent,
                    chunkIndex: index,
                    metadata: {
                        source: 'langchain-pdf',
                        originalPage: pageNumber,
                        wordCount: chunk.pageContent.split(/\s+/).length,
                        ...chunk.metadata
                    }
                };
            });

            // Clean up temp file
            fs.unlinkSync(tempPath);
            logger.info('Temp file cleaned up', { path: tempPath });

            return {
                text: docs.map(d => d.pageContent).join('\n\n'),
                pages: docs.length, // Actual PDF page count
                pageTexts: docs.map(d => d.pageContent),
                chunks: pages,
                info: {
                    processor: 'langchain',
                    totalPages: docs.length,
                    totalChunks: chunks.length
                }
            };

        } catch (error) {
            // Clean up temp file even on error
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
            throw error;
        }

    } catch (error) {
        logger.error('LangChain PDF extraction failed', {
            error: error.message,
            stack: error.stack
        });
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
}

/**
 * Extract text from DOCX (unchanged from original)
 */
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

/**
 * Extract text from PPTX (unchanged from original)
 */
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

/**
 * Normalize text (remove extra whitespace, etc.)
 */
function normalizeText(text) {
    if (!text) return '';

    return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .trim();
}

/**
 * Chunk text for non-PDF formats (fallback)
 */
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

/**
 * Main document processor - routes to appropriate extractor
 */
export async function processDocument(buffer, fileType, filename = 'document') {
    try {
        let extractedData;

        switch (fileType.toLowerCase()) {
            case '.pdf':
                extractedData = await extractTextFromPDF(buffer, filename);
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

        // For PDFs processed by LangChain, return chunks directly
        if (fileType.toLowerCase() === '.pdf' && extractedData.chunks) {
            logger.info('✅ Document processed with LangChain', {
                fileType,
                totalPages: extractedData.pages,
                totalChunks: extractedData.chunks.length
            });

            return {
                text: extractedData.text,
                pages: extractedData.chunks, // Already chunked with page metadata
                totalPages: extractedData.pages,
                wordCount: extractedData.text.split(/\s+/).length,
                processor: 'langchain'
            };
        }

        // For non-PDF formats, use fallback chunking
        const normalizedText = normalizeText(extractedData.text);
        const chunks = chunkText(normalizedText, 1000, 100);
        const pages = chunks.map((chunk, index) => ({
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

        logger.info('✅ Document processed (fallback chunking)', {
            fileType,
            totalChunks: pages.length,
            wordCount: normalizedText.split(/\s+/).length
        });

        return {
            text: normalizedText,
            pages: pages,
            totalPages: pages.length,
            wordCount: normalizedText.split(/\s+/).length,
            processor: 'fallback'
        };

    } catch (error) {
        logger.error('Document processing failed', {
            error: error.message,
            fileType,
            stack: error.stack
        });
        throw error;
    }
}
