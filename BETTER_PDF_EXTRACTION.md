# 🔧 Better PDF Page Extraction

## Current Issue:
- `pdf-parse` extracts all text at once, can't easily get individual pages
- We split by `\f` (form feed) but many PDFs don't have this
- Fallback to chunking creates wrong page numbers

## Solution: Use pdf.js (Mozilla's PDF library)

### **Step 1: Install pdf.js**

```bash
cd backend-unified
npm install pdfjs-dist canvas
```

### **Step 2: Replace PDF extractor**

Create `backend-unified/src/utils/pdfExtractor.js`:

```javascript
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { logger } from './logger.js';

/**
 * Extract text from PDF page by page using pdf.js
 * Returns actual PDF pages with correct numbering
 */
export async function extractPDFPages(buffer) {
  try {
    // Load PDF
    const loadingTask = getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/'
    });
    
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    
    logger.info('📄 PDF loaded', { pages: numPages });
    
    const pages = [];
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items with spaces
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ');
      
      // Skip mostly empty pages (< 50 chars)
      if (pageText.trim().length > 50) {
        pages.push({
          pageNumber: pageNum,  // Real PDF page number!
          content: pageText.trim(),
          metadata: {
            source: 'pdf-page',
            actualPage: pageNum,
            height: page.view[3],
            width: page.view[2]
          }
        });
      }
      
      // Clean up
      page.cleanup();
    }
    
    logger.info('✅ PDF pages extracted', { 
      totalPages: numPages,
      usablePages: pages.length 
    });
    
    return {
      pages,
      numPages,
      fullText: pages.map(p => p.content).join('\n\n')
    };
    
  } catch (error) {
    logger.error('PDF extraction failed', { error: error.message });
    throw error;
  }
}
```

### **Step 3: Update documentProcessor.js**

Replace `extractTextFromPDF` with:

```javascript
import { extractPDFPages } from './pdfExtractor.js';

export async function extractTextFromPDF(buffer) {
  try {
    const result = await extractPDFPages(buffer);
    return {
      text: result.fullText,
      pages: result.numPages,
      pageTexts: result.pages.map(p => p.content),
      pageObjects: result.pages  // Complete page objects
    };
  } catch (error) {
    logger.error('PDF extraction failed', { error: error.message });
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}
```

### **Step 4: Update processDocument.js**

```javascript
if (fileType.toLowerCase() === '.pdf' && extractedData.pageObjects) {
  logger.info('📄 Using actual PDF pages', { pageCount: extractedData.pageObjects.length });
  
  // Use pre-extracted pages directly!
  pages = extractedData.pageObjects;
  
} else if (fileType.toLowerCase() === '.pdf' && extractedData.pageTexts) {
  // Fallback to page texts
  pages = extractedData.pageTexts.map((pageText, index) => ({
    pageNumber: index + 1,
    content: normalizeText(pageText),
    metadata: {
      source: 'pdf-page',
      actualPage: index + 1
    }
  }));
} else {
  // Fallback to chunking for other formats
  const chunks = chunkText(normalizedText, 1000, 100);
  pages = chunks.map((chunk, index) => ({
    pageNumber: index + 1,
    content: chunk.content,
    metadata: { source: 'chunk' }
  }));
}
```

## Benefits:
- ✅ Real PDF page numbers
- ✅ Preserves page boundaries
- ✅ Better text extraction
- ✅ Works with any PDF

## Result:
- 10-page PDF → 10 pages in database (not 50+ chunks!)
- Page numbers match PDF viewer
- Search shows "Page 3" → actually page 3 in PDF!
