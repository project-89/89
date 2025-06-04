import cors from 'cors';
import { config } from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import http from 'http';
import path from 'path';
import { ERROR_MESSAGES } from './constants';
import { CORS_CONFIG } from './constants/config/cors';
import {
  HEALTH_RATE_LIMIT_CONFIG,
  initializeRateLimits,
} from './constants/config/limits';
// import { initializeMCPSystem } from './mcp.system';
import { ipRateLimit, withMetrics } from './middleware';
import { errorHandler } from './middleware/error.middleware';
import router from './routes';
import { setupScheduledTasks } from './scheduled';
import { ApiError, initDatabases, sendError } from './utils';

// Load environment variables based on NODE_ENV first
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
config({ path: path.resolve(__dirname, '../', envFile) });

console.log('Environment loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  RATE_LIMIT_DISABLED: process.env.RATE_LIMIT_DISABLED,
  IP_RATE_LIMIT_DISABLED: process.env.IP_RATE_LIMIT_DISABLED,
});

// Helper to check if request is from a browser
const isBrowserRequest = (req: express.Request): boolean => {
  const accept = req.headers.accept || '';
  return accept.includes('text/html') || accept.includes('*/*');
};

// Initialize MongoDB database
initDatabases().catch((err) => {
  console.error('Failed to initialize databases:', err);
  process.exit(1);
});

// Create Express app
const app = express();

// Security & Basic Middleware
app.use(helmet());
app.use(express.json());

// CORS Configuration (single, comprehensive setup)
const allowedOrigins = CORS_CONFIG.getAllowedOrigins();
console.log('[CORS] Allowed origins:', allowedOrigins);

app.options(
  '*',
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin || '*');
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    ...CORS_CONFIG.options,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, '*');
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, origin);
      } else {
        console.error(
          `[CORS] Blocked request from unauthorized origin: ${origin}`
        );
        callback(new Error('Not allowed by CORS'));
      }
    },
    ...CORS_CONFIG.options,
  })
);

// Initialize rate limits
initializeRateLimits();

// Health endpoint rate limiting
const healthMiddleware = withMetrics(
  ipRateLimit(HEALTH_RATE_LIMIT_CONFIG),
  'healthIpRateLimit'
);
app.use('/health', healthMiddleware);
app.use('/metrics', healthMiddleware);

// Landing page handler
app.get('/', (req, res) => {
  if (isBrowserRequest(req)) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.json({
      name: 'Argos API',
      version: process.env.npm_package_version || '1.0.0',
      status: 'operational',
      documentation:
        'Visit https://argos.project89.org in a browser for documentation',
    });
  }
});

// Mount all API routes
app.use('/api', router);

// 404 handler
app.use((req, res, next) => {
  if (isBrowserRequest(req)) {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
  } else {
    sendError(res, new ApiError(404, ERROR_MESSAGES.NOT_FOUND));
  }
});

// Error handlers
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (err.message === 'Not allowed by CORS') {
      console.error('[CORS Error]', err.message);
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Not allowed by CORS',
      });
    }
    next(err);
  }
);

app.use(errorHandler);

// Get port from environment or use default
const PORT = process.env.PORT || 3000;

// Create server
const server = http.createServer(app);

// Start the server
async function startServer() {
  try {
    // Database is already initialized at module level - no need to initialize again

    // Initialize the MCP system
    // await initializeMCPSystem();

    // Setup scheduled tasks
    setupScheduledTasks();

    // Start the server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// For direct execution (not as a module)
if (require.main === module) {
  // Server is already started above
  console.log('Server running in standalone mode');
}

// Export the Express app for testing or programmatic usage
export { app };
