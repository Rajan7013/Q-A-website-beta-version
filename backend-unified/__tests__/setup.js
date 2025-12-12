process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.CLERK_SECRET_KEY = 'sk_test_mock';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.R2_ACCOUNT_ID = 'test-account';
process.env.R2_ACCESS_KEY_ID = 'test-access-key';
process.env.R2_SECRET_ACCESS_KEY = 'test-secret';
process.env.R2_BUCKET_NAME = 'test-bucket';
process.env.MAX_FILE_SIZE_MB = '50';
process.env.ALLOWED_FILE_TYPES = 'pdf,docx,pptx,txt';

jest.mock('../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

global.createMockFile = (overrides = {}) => ({
  originalname: 'test.pdf',
  size: 1024 * 1024,
  mimetype: 'application/pdf',
  buffer: Buffer.from('test content'),
  ...overrides
});

global.createMockUser = (overrides = {}) => ({
  id: 'user_123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  ...overrides
});
