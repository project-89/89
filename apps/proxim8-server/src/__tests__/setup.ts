import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Extend Jest timeout for database operations
jest.setTimeout(60000);

// Global test setup
beforeAll(async () => {
  // Set NODE_ENV to test
  process.env.NODE_ENV = 'test';
  
  // Set test JWT secret
  process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
  
  // Set test API key
  process.env.API_KEY = 'test-api-key';
  
  // Disable console logs during tests unless debugging
  if (!process.env.DEBUG_TESTS) {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  }
});

// Global test teardown
afterAll(async () => {
  // Close any remaining mongoose connections
  await mongoose.disconnect();
});

// Mock external services
jest.mock('../services/video/veo', () => ({
  generateVideo: jest.fn().mockResolvedValue({
    id: 'mock-video-id',
    status: 'completed',
    videoUrl: 'https://mock-video.com/video.mp4'
  })
}));

jest.mock('../services/ai/gemini', () => ({
  generateText: jest.fn().mockResolvedValue('Mock AI generated text'),
  generateLore: jest.fn().mockResolvedValue({
    title: 'Mock Lore Fragment',
    content: ['Mock lore content']
  })
}));

jest.mock('../services/storage', () => ({
  uploadFile: jest.fn().mockResolvedValue('https://mock-storage.com/file.jpg'),
  deleteFile: jest.fn().mockResolvedValue(true)
}));

// Mock Redis cache
jest.mock('../services/cache', () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(true),
  del: jest.fn().mockResolvedValue(true),
  exists: jest.fn().mockResolvedValue(false)
}));

// Helper function to create test database connection
export async function createTestDatabase(): Promise<MongoMemoryServer> {
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  return mongoServer;
}

// Helper function to cleanup test database
export async function cleanupTestDatabase(mongoServer: MongoMemoryServer): Promise<void> {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
}

// Helper to create mock request object
export function createMockRequest(overrides: any = {}) {
  return {
    headers: {},
    body: {},
    params: {},
    query: {},
    user: null,
    ...overrides
  };
}

// Helper to create mock response object
export function createMockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis()
  };
  return res;
}

// Helper to create mock next function
export function createMockNext() {
  return jest.fn();
}