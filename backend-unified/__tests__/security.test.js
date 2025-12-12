import { validateFileUpload, calculateChecksum, scanFile, sanitizeResponse } from '../src/middleware/security.js';

describe('Security Utilities', () => {
  describe('validateFileUpload', () => {
    test('should accept valid PDF file', () => {
      const file = {
        originalname: 'document.pdf',
        size: 1024 * 1024,
        mimetype: 'application/pdf'
      };

      expect(() => validateFileUpload(file)).not.toThrow();
    });

    test('should reject file exceeding size limit', () => {
      const file = {
        originalname: 'large.pdf',
        size: 100 * 1024 * 1024,
        mimetype: 'application/pdf'
      };

      expect(() => validateFileUpload(file)).toThrow(/size exceeds/);
    });

    test('should reject unsupported file type', () => {
      const file = {
        originalname: 'malicious.exe',
        size: 1024,
        mimetype: 'application/x-msdownload'
      };

      expect(() => validateFileUpload(file)).toThrow(/not allowed/);
    });

    test('should reject suspicious filename patterns', () => {
      const file = {
        originalname: 'script.bat',
        size: 1024,
        mimetype: 'application/octet-stream'
      };

      expect(() => validateFileUpload(file)).toThrow(/Suspicious file name/);
    });
  });

  describe('calculateChecksum', () => {
    test('should generate SHA256 checksum', () => {
      const buffer = Buffer.from('test content');
      const checksum = calculateChecksum(buffer);

      expect(checksum).toHaveLength(64);
      expect(/^[a-f0-9]{64}$/.test(checksum)).toBe(true);
    });

    test('should generate same checksum for same content', () => {
      const buffer = Buffer.from('test');
      const checksum1 = calculateChecksum(buffer);
      const checksum2 = calculateChecksum(buffer);

      expect(checksum1).toBe(checksum2);
    });
  });

  describe('scanFile', () => {
    test('should reject empty files', async () => {
      const buffer = Buffer.alloc(0);
      await expect(scanFile(buffer)).rejects.toThrow(/Empty file/);
    });

    test('should accept safe file', async () => {
      const buffer = Buffer.from('This is safe content');
      const result = await scanFile(buffer);

      expect(result.safe).toBe(true);
      expect(result.checksum).toBeDefined();
    });

    test('should reject executable files (MZ signature)', async () => {
      const buffer = Buffer.from([0x4D, 0x5A, 0x90, 0x00]);
      await expect(scanFile(buffer)).rejects.toThrow(/Executable file detected/);
    });
  });

  describe('sanitizeResponse', () => {
    test('should redact sensitive fields', () => {
      const data = {
        username: 'testuser',
        password: 'secret123',
        apiKey: 'sk_test_123',
        token: 'bearer_token'
      };

      const sanitized = sanitizeResponse(data);

      expect(sanitized.username).toBe('testuser');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
    });

    test('should handle nested objects', () => {
      const data = {
        user: {
          name: 'Test',
          secret: 'hidden'
        }
      };

      const sanitized = sanitizeResponse(data);

      expect(sanitized.user.name).toBe('Test');
      expect(sanitized.user.secret).toBe('[REDACTED]');
    });
  });
});
