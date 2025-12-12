import PDFDocument from 'pdfkit';
import { logger } from './logger.js';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = A4_WIDTH - (MARGIN * 2);

export async function generateAnswerPDF(answerData) {
  try {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: MARGIN,
          bottom: MARGIN + 30,
          left: MARGIN,
          right: MARGIN
        },
        info: {
          Title: 'AI Answer',
          Author: 'AI Document Analyzer',
          CreationDate: new Date()
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      let pageNumber = 1;

      const addHeader = () => {
        doc.fontSize(10)
           .fillColor('#666666')
           .text('AI Document Analyzer', MARGIN, MARGIN - 30, { align: 'left' })
           .text(new Date().toLocaleDateString(), MARGIN, MARGIN - 30, { align: 'right' });
      };

      const addFooter = () => {
        doc.fontSize(10)
           .fillColor('#666666')
           .text(`Page ${pageNumber}`, MARGIN, A4_HEIGHT - MARGIN + 10, { align: 'center' });
        pageNumber++;
      };

      addHeader();

      doc.fontSize(18)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Question & Answer', MARGIN, MARGIN);

      doc.moveDown(1);

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#333333')
         .text('Question:', MARGIN);

      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#000000')
         .text(answerData.question || 'N/A', MARGIN, doc.y + 5, {
           width: CONTENT_WIDTH,
           align: 'left'
         });

      doc.moveDown(1.5);

      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#333333')
         .text('Answer:', MARGIN);

      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#000000')
         .text(answerData.answer || 'N/A', MARGIN, doc.y + 5, {
           width: CONTENT_WIDTH,
           align: 'justify'
         });

      if (answerData.sources && answerData.sources.length > 0) {
        doc.moveDown(2);

        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#333333')
           .text('Sources:', MARGIN);

        doc.moveDown(0.5);

        answerData.sources.forEach((source, index) => {
          doc.fontSize(10)
             .font('Helvetica')
             .fillColor('#555555')
             .text(
               `${index + 1}. Document ID: ${source.documentId || 'N/A'}, Page: ${source.page || 'N/A'}`,
               MARGIN + 10,
               doc.y + 3,
               { width: CONTENT_WIDTH - 10 }
             );
        });
      }

      if (answerData.confidence) {
        doc.moveDown(1.5);
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#666666')
           .text(`Confidence: ${(answerData.confidence * 100).toFixed(1)}%`, MARGIN);
      }

      addFooter();
      doc.end();

      logger.info('Answer PDF generated successfully');
    });
  } catch (error) {
    logger.error('PDF generation failed', { error: error.message });
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

export async function generateChatSummaryPDF(chats) {
  try {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: MARGIN,
          bottom: MARGIN + 30,
          left: MARGIN,
          right: MARGIN
        },
        info: {
          Title: 'Chat Summary',
          Author: 'AI Document Analyzer',
          CreationDate: new Date()
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      let pageNumber = 1;

      const addHeader = () => {
        doc.fontSize(10)
           .fillColor('#666666')
           .text('AI Document Analyzer - Chat Summary', MARGIN, MARGIN - 30, { align: 'left' })
           .text(new Date().toLocaleDateString(), MARGIN, MARGIN - 30, { align: 'right' });
      };

      const addFooter = () => {
        doc.fontSize(10)
           .fillColor('#666666')
           .text(`Page ${pageNumber}`, MARGIN, A4_HEIGHT - MARGIN + 10, { align: 'center' });
        pageNumber++;
      };

      addHeader();

      doc.fontSize(20)
         .fillColor('#000000')
         .font('Helvetica-Bold')
         .text('Chat History Summary', MARGIN, MARGIN, { align: 'center' });

      doc.moveDown(2);

      chats.forEach((chat, index) => {
        if (doc.y > A4_HEIGHT - MARGIN - 150) {
          addFooter();
          doc.addPage();
          addHeader();
          doc.moveDown(2);
        }

        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('#333333')
           .text(`Chat ${index + 1}`, MARGIN);

        doc.moveDown(0.5);

        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#666666')
           .text(`Date: ${chat.date || new Date(chat.created_at).toLocaleDateString()}`, MARGIN + 10);

        doc.moveDown(0.5);

        doc.fontSize(11)
           .font('Helvetica')
           .fillColor('#000000')
           .text(chat.question || chat.query || 'N/A', MARGIN + 10, doc.y, {
             width: CONTENT_WIDTH - 10,
             align: 'left'
           });

        doc.moveDown(1);
      });

      addFooter();
      doc.end();

      logger.info('Chat summary PDF generated successfully', { chatCount: chats.length });
    });
  } catch (error) {
    logger.error('Chat summary PDF generation failed', { error: error.message });
    throw new Error(`Failed to generate chat summary PDF: ${error.message}`);
  }
}
