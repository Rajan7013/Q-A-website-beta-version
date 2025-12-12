import { chunkText, normalizeText } from '../src/utils/documentProcessor.js';

describe('Document Processor', () => {
  describe('chunkText', () => {
    test('should chunk text into specified sizes', () => {
      const text = 'a'.repeat(2500);
      const chunks = chunkText(text, 1000, 100);

      expect(chunks.length).toBeGreaterThan(2);
      expect(chunks[0].content.length).toBeLessThanOrEqual(1000);
    });

    test('should include chunk metadata', () => {
      const text = 'Test content for chunking';
      const chunks = chunkText(text, 10, 2);

      expect(chunks[0]).toHaveProperty('content');
      expect(chunks[0]).toHaveProperty('startOffset');
      expect(chunks[0]).toHaveProperty('endOffset');
      expect(chunks[0]).toHaveProperty('chunkIndex');
    });

    test('should handle text smaller than chunk size', () => {
      const text = 'Short text';
      const chunks = chunkText(text, 1000, 100);

      expect(chunks.length).toBe(1);
      expect(chunks[0].content).toBe('Short text');
    });
  });

  describe('normalizeText', () => {
    test('should normalize line endings', () => {
      const text = 'Line 1\r\nLine 2\rLine 3\nLine 4';
      const normalized = normalizeText(text);

      expect(normalized).not.toContain('\r\n');
      expect(normalized).not.toContain('\r');
    });

    test('should remove excessive whitespace', () => {
      const text = 'Word1    Word2\t\tWord3';
      const normalized = normalizeText(text);

      expect(normalized).not.toContain('  ');
      expect(normalized).not.toContain('\t');
    });

    test('should trim leading and trailing whitespace', () => {
      const text = '   Trimmed text   ';
      const normalized = normalizeText(text);

      expect(normalized).toBe('Trimmed text');
    });
  });
});
