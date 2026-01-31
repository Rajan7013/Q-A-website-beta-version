/**
 * Citation Validator
 * Ensures AI responses only cite valid page numbers and document names
 */

import { logger } from './logger.js';

/**
 * Validate and correct citations in AI response
 * @param {string} answer - AI generated answer
 * @param {Array} sources - Array of {documentName, page, documentId}
 * @param {Object} documentMetadata - Map of documentId -> {filename, totalPages}
 * @returns {string} - Corrected answer with validated citations
 */
export function validateCitations(answer, sources, documentMetadata) {
    if (!answer || !sources || sources.length === 0) {
        return answer;
    }

    // Build valid citation map
    const validCitations = new Map();
    sources.forEach(source => {
        const key = `${source.documentName}|${source.page}`;
        validCitations.set(key, true);
    });

    // Build document page limits
    const docPageLimits = new Map();
    if (documentMetadata) {
        Object.entries(documentMetadata).forEach(([docId, meta]) => {
            docPageLimits.set(meta.filename, meta.totalPages);
        });
    }

    // Pattern to match citations: [Document: filename, Page: X]
    const citationPattern = /\[Document:\s*([^,]+),\s*Page:\s*(\d+)\]/g;

    let correctedAnswer = answer;
    let invalidCount = 0;
    let correctedCount = 0;

    // Find all citations
    const matches = [...answer.matchAll(citationPattern)];

    matches.forEach(match => {
        const fullCitation = match[0];
        const docName = match[1].trim();
        const pageNum = parseInt(match[2]);

        // Check if citation is valid
        const citationKey = `${docName}|${pageNum}`;
        const isValid = validCitations.has(citationKey);

        // Check if page number exceeds document length
        const maxPages = docPageLimits.get(docName);
        const exceedsPageLimit = maxPages && pageNum > maxPages;

        if (!isValid || exceedsPageLimit) {
            invalidCount++;

            // Try to find a valid page for this document
            const validPageForDoc = sources.find(s => s.documentName === docName);

            if (validPageForDoc && !exceedsPageLimit) {
                // Correct to a valid page
                const correctedCitation = `[Document: ${docName}, Page: ${validPageForDoc.page}]`;
                correctedAnswer = correctedAnswer.replace(fullCitation, correctedCitation);
                correctedCount++;
                logger.warn('Citation corrected', {
                    original: fullCitation,
                    corrected: correctedCitation
                });
            } else if (exceedsPageLimit) {
                // Page exceeds document length - cap to max page
                const correctedCitation = `[Document: ${docName}, Page: ${maxPages}]`;
                correctedAnswer = correctedAnswer.replace(fullCitation, correctedCitation);
                correctedCount++;
                logger.warn('Citation page capped', {
                    original: fullCitation,
                    corrected: correctedCitation,
                    reason: `Page ${pageNum} exceeds document length (${maxPages} pages)`
                });
            } else {
                // Remove invalid citation entirely
                correctedAnswer = correctedAnswer.replace(fullCitation, '');
                logger.warn('Citation removed', { citation: fullCitation });
            }
        }
    });

    if (invalidCount > 0) {
        logger.info('✅ Citation validation complete', {
            totalCitations: matches.length,
            invalidFound: invalidCount,
            corrected: correctedCount
        });
    }

    return correctedAnswer;
}

/**
 * Build document metadata summary for AI context
 * @param {Array} sources - Array of source documents
 * @returns {string} - Formatted metadata summary
 */
export function buildDocumentMetadataSummary(documentMetadata) {
    if (!documentMetadata || Object.keys(documentMetadata).length === 0) {
        return '';
    }

    const lines = ['📄 AVAILABLE DOCUMENTS:'];

    Object.values(documentMetadata).forEach(meta => {
        const pageText = meta.totalPages === 1 ? '1 page' : `${meta.totalPages} pages`;
        lines.push(`- ${meta.filename} (${pageText})`);
    });

    return lines.join('\n');
}

/**
 * Extract unique document metadata from sources
 * @param {Array} sources - Array of {documentId, documentName, page}
 * @returns {Object} - Map of documentId -> {filename, totalPages}
 */
export function extractDocumentMetadata(sources) {
    const metadata = {};

    sources.forEach(source => {
        if (!metadata[source.documentId]) {
            metadata[source.documentId] = {
                filename: source.documentName,
                totalPages: source.page,
                documentId: source.documentId
            };
        } else {
            // Update max page seen
            metadata[source.documentId].totalPages = Math.max(
                metadata[source.documentId].totalPages,
                source.page
            );
        }
    });

    return metadata;
}

/**
 * Deduplicate citations in answer text
 * Removes duplicate [Document: X, Page: Y] citations
 * @param {string} answer - AI generated answer with citations
 * @returns {string} - Answer with deduplicated citations
 */
export function deduplicateCitations(answer) {
    if (!answer) return answer;

    const citationPattern = /\[Document: ([^,]+), Page: (\d+)\]/g;
    const seen = new Set();
    let deduplicatedAnswer = answer;

    // Find all citations
    const citations = [...answer.matchAll(citationPattern)];
    let removedCount = 0;

    citations.forEach(match => {
        const fullCitation = match[0];
        const docName = match[1].trim();
        const pageNum = match[2];
        const key = `${docName}|${pageNum}`;

        if (seen.has(key)) {
            // Remove duplicate citation
            deduplicatedAnswer = deduplicatedAnswer.replace(fullCitation, '');
            removedCount++;
        } else {
            seen.add(key);
        }
    });

    if (removedCount > 0) {
        logger.info('🔄 Citations deduplicated', {
            total: citations.length,
            removed: removedCount,
            unique: seen.size
        });
    }

    return deduplicatedAnswer;
}
