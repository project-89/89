import request from 'supertest';
import express from 'express';
import mcpRoutes from '../mcp';
import { createMissionMCPServer } from '../../services/mcp/mcpServer';

// Mock the MCP server and transport
jest.mock('../../services/mcp/mcpServer');
jest.mock('@modelcontextprotocol/sdk/server/streamableHttp.js');
jest.mock('@modelcontextprotocol/sdk/types.js');
jest.mock('../../middleware/apiKey', () => {
  return jest.fn((req: any, res: any, next: any) => {
    const apiKey = req.header('X-API-Key');
    if (apiKey === 'valid-key') {
      next();
    } else {
      res.status(401).json({ message: 'Unauthorized - Invalid API key' });
    }
  });
});
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  }
}));

const mockMcpServer = {
  connect: jest.fn(),
  close: jest.fn(),
};

const mockTransport = {
  sessionId: 'test-session-123',
  handleRequest: jest.fn(),
  onclose: null as any,
};

const MockedStreamableHTTPServerTransport = require('@modelcontextprotocol/sdk/server/streamableHttp.js').StreamableHTTPServerTransport;
const { isInitializeRequest } = require('@modelcontextprotocol/sdk/types.js');

describe('MCP HTTP Integration', () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();
    
    app = express();
    app.use(express.json());
    app.use('/api/mcp', mcpRoutes);

    (createMissionMCPServer as jest.Mock).mockReturnValue(mockMcpServer);
    MockedStreamableHTTPServerTransport.mockImplementation(() => mockTransport);
  });

  describe('Authentication', () => {
    it('should reject requests without API key', async () => {
      const response = await request(app)
        .post('/api/mcp')
        .send({ test: 'data' });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Unauthorized');
    });

    it('should reject requests with invalid API key', async () => {
      const response = await request(app)
        .post('/api/mcp')
        .set('X-API-Key', 'invalid-key')
        .send({ test: 'data' });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Unauthorized');
    });

    it('should accept requests with valid API key', async () => {
      isInitializeRequest.mockReturnValue(true);
      mockTransport.handleRequest.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/mcp')
        .set('X-API-Key', 'valid-key')
        .send({ 
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
          params: {}
        });

      expect(response.status).not.toBe(401);
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      mockTransport.handleRequest.mockResolvedValue(undefined);
    });

    it('should create new session for initialize request', async () => {
      isInitializeRequest.mockReturnValue(true);

      await request(app)
        .post('/api/mcp')
        .set('X-API-Key', 'valid-key')
        .send({ 
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
          params: {}
        });

      expect(MockedStreamableHTTPServerTransport).toHaveBeenCalledWith({
        sessionIdGenerator: expect.any(Function),
        onsessioninitialized: expect.any(Function)
      });
      expect(createMissionMCPServer).toHaveBeenCalled();
      expect(mockMcpServer.connect).toHaveBeenCalledWith(mockTransport);
    });

    it('should reuse existing session when session ID provided', async () => {
      isInitializeRequest.mockReturnValue(true);

      // First request creates session
      await request(app)
        .post('/api/mcp')
        .set('X-API-Key', 'valid-key')
        .send({ 
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
          params: {}
        });

      // Simulate session initialization callback
      const sessionInitCallback = MockedStreamableHTTPServerTransport.mock.calls[0][0].onsessioninitialized;
      sessionInitCallback('test-session-123');

      jest.clearAllMocks();
      isInitializeRequest.mockReturnValue(false);

      // Second request with session ID should reuse transport
      await request(app)
        .post('/api/mcp')
        .set('X-API-Key', 'valid-key')
        .set('mcp-session-id', 'test-session-123')
        .send({ 
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 2,
          params: {}
        });

      expect(MockedStreamableHTTPServerTransport).not.toHaveBeenCalled();
      expect(createMissionMCPServer).not.toHaveBeenCalled();
      expect(mockTransport.handleRequest).toHaveBeenCalled();
    });

    it('should reject non-initialize requests without session', async () => {
      isInitializeRequest.mockReturnValue(false);

      const response = await request(app)
        .post('/api/mcp')
        .set('X-API-Key', 'valid-key')
        .send({ 
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 1,
          params: {}
        });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('No valid session ID provided');
    });
  });

  describe('HTTP Methods', () => {
    beforeEach(() => {
      // Setup a session first
      isInitializeRequest.mockReturnValue(true);
      mockTransport.handleRequest.mockResolvedValue(undefined);
    });

    it('should handle GET requests for SSE', async () => {
      // Create session first
      await request(app)
        .post('/api/mcp')
        .set('X-API-Key', 'valid-key')
        .send({ 
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
          params: {}
        });

      const sessionInitCallback = MockedStreamableHTTPServerTransport.mock.calls[0][0].onsessioninitialized;
      sessionInitCallback('test-session-123');

      // Test GET request
      const response = await request(app)
        .get('/api/mcp')
        .set('X-API-Key', 'valid-key')
        .set('mcp-session-id', 'test-session-123');

      expect(mockTransport.handleRequest).toHaveBeenCalled();
    });

    it('should handle DELETE requests for session termination', async () => {
      // Create session first
      await request(app)
        .post('/api/mcp')
        .set('X-API-Key', 'valid-key')
        .send({ 
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
          params: {}
        });

      const sessionInitCallback = MockedStreamableHTTPServerTransport.mock.calls[0][0].onsessioninitialized;
      sessionInitCallback('test-session-123');

      // Test DELETE request
      const response = await request(app)
        .delete('/api/mcp')
        .set('X-API-Key', 'valid-key')
        .set('mcp-session-id', 'test-session-123');

      expect(mockTransport.handleRequest).toHaveBeenCalled();
    });

    it('should reject GET/DELETE requests without valid session', async () => {
      const getResponse = await request(app)
        .get('/api/mcp')
        .set('X-API-Key', 'valid-key')
        .set('mcp-session-id', 'invalid-session');

      expect(getResponse.status).toBe(400);
      expect(getResponse.text).toContain('Invalid or missing session ID');

      const deleteResponse = await request(app)
        .delete('/api/mcp')
        .set('X-API-Key', 'valid-key')
        .set('mcp-session-id', 'invalid-session');

      expect(deleteResponse.status).toBe(400);
      expect(deleteResponse.text).toContain('Invalid or missing session ID');
    });
  });

  describe('Error Handling', () => {
    it('should handle transport connection errors', async () => {
      isInitializeRequest.mockReturnValue(true);
      mockMcpServer.connect.mockRejectedValue(new Error('Connection failed'));

      const response = await request(app)
        .post('/api/mcp')
        .set('X-API-Key', 'valid-key')
        .send({ 
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
          params: {}
        });

      expect(response.status).toBe(500);
      expect(response.body.error.message).toBe('Internal server error');
    });

    it('should handle transport request errors', async () => {
      isInitializeRequest.mockReturnValue(true);
      mockTransport.handleRequest.mockRejectedValue(new Error('Request handling failed'));

      const response = await request(app)
        .post('/api/mcp')
        .set('X-API-Key', 'valid-key')
        .send({ 
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
          params: {}
        });

      expect(response.status).toBe(500);
      expect(response.body.error.message).toBe('Internal server error');
    });

    it('should not send response twice on errors', async () => {
      isInitializeRequest.mockReturnValue(true);
      mockTransport.handleRequest.mockImplementation((req: any, res: any) => {
        res.status(200).send('First response');
        throw new Error('After response error');
      });

      const response = await request(app)
        .post('/api/mcp')
        .set('X-API-Key', 'valid-key')
        .send({ 
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
          params: {}
        });

      expect(response.status).toBe(200);
      expect(response.text).toBe('First response');
    });
  });

  describe('Session Cleanup', () => {
    it('should clean up sessions when transport closes', async () => {
      isInitializeRequest.mockReturnValue(true);
      mockTransport.handleRequest.mockResolvedValue(undefined);

      await request(app)
        .post('/api/mcp')
        .set('X-API-Key', 'valid-key')
        .send({ 
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
          params: {}
        });

      const sessionInitCallback = MockedStreamableHTTPServerTransport.mock.calls[0][0].onsessioninitialized;
      sessionInitCallback('test-session-123');

      // Simulate transport close
      if (mockTransport.onclose) {
        mockTransport.onclose();
      }

      // Subsequent request should not find the session
      isInitializeRequest.mockReturnValue(false);
      const response = await request(app)
        .post('/api/mcp')
        .set('X-API-Key', 'valid-key')
        .set('mcp-session-id', 'test-session-123')
        .send({ 
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 2,
          params: {}
        });

      expect(response.status).toBe(400);
    });
  });
});