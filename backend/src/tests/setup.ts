import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.BCRYPT_ROUNDS = '10';

// Mock console methods to reduce noise during tests
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}

// Global test timeout
jest.setTimeout(10000);

// Clean up after tests
afterAll(() => {
  jest.clearAllMocks();
});