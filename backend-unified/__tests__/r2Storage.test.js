import { generateFileKey } from '../src/utils/r2Storage.js';

describe('R2 Storage Utilities', () => {
  describe('generateFileKey', () => {
    test('should generate unique file keys', () => {
      const key1 = generateFileKey('user123', 'document.pdf');
      const key2 = generateFileKey('user123', 'document.pdf');

      expect(key1).not.toBe(key2);
    });

    test('should include userId in key path', () => {
      const key = generateFileKey('user123', 'test.pdf');

      expect(key).toMatch(/^user123\//);
    });

    test('should preserve file extension', () => {
      const key = generateFileKey('user123', 'document.pdf');

      expect(key).toMatch(/\.pdf$/);
    });

    test('should sanitize filename', () => {
      const key = generateFileKey('user123', 'my document (1).pdf');

      expect(key).not.toContain('(');
      expect(key).not.toContain(')');
      expect(key).not.toContain(' ');
    });

    test('should handle long filenames', () => {
      const longName = 'a'.repeat(100) + '.pdf';
      const key = generateFileKey('user123', longName);

      const baseName = key.split('/')[1].split('-').slice(2).join('-').replace('.pdf', '');
      expect(baseName.length).toBeLessThanOrEqual(50);
    });
  });
});
