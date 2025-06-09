import express from 'express';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createMissionMCPServer } from '../services/mcp/mcpServer';
import verifyApiKey from '../middleware/apiKey';
import { logger } from '../utils/logger';

const router: express.Router = express.Router();

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Add a health check endpoint for the MCP server
router.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok',
    type: 'mcp-server',
    protocol: 'modelcontextprotocol',
    version: '2024-11-05'
  });
});

// Apply API key authentication to all MCP routes
router.use(verifyApiKey);

// Handle POST requests for client-to-server communication
router.post('/', async (req, res) => {
  logger.info('Received MCP POST request', {
    headers: req.headers,
    body: req.body
  });
  
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  try {
    if (sessionId && transports[sessionId]) {
      // Reuse existing transport
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          transports[sessionId] = transport;
          logger.info(`MCP session initialized: ${sessionId}`);
        }
      });

      // Clean up transport when closed
      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId];
          logger.info(`MCP session closed: ${transport.sessionId}`);
        }
      };

      const server = createMissionMCPServer();
      await server.connect(transport);
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    logger.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

// Handle GET requests for server-to-client notifications via SSE
router.get('/', async (req, res) => {
  logger.info('Received MCP GET request');
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
});

// Handle DELETE requests for session termination
router.delete('/', async (req, res) => {
  logger.info('Received MCP DELETE request');
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
});

export default router;