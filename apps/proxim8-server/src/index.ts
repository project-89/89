import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load environment variables FIRST, before any other imports
// Try to load shared environment first (optional for production containers)
const sharedEnvPath = path.join(__dirname, "../../.env.shared");
if (fs.existsSync(sharedEnvPath)) {
  dotenv.config({ path: sharedEnvPath });
}
// Load server-specific overrides
dotenv.config(); // This loads the server's .env file as overrides

import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { connectToDatabase } from "./db";
import { nftRoutes } from "./routes/nft";
import videoRoutes from "./routes/video";
import loreRoutes from "./routes/lore";
// import pipelineRoutes from "./routes/pipeline";
// import userRoutes from "./routes/user";
import notificationRoutes from "./routes/notification";
import { authRoutes } from "./routes/auth";
import {
  createDefaultConfigurations,
  registerDefaultMiddleware,
} from "./services/pipeline";
import { initRedisClient } from "./services/cache";
import { initializeTokenRotation } from "./services/tokenRotation";
import { logger } from "./utils/logger";
import verifyApiKey from "./middleware/apiKey";
import publicVideoRoutes from "./routes/publicVideos";
import config from "./config";

const app = express();
const port = config.port;

// Trust proxy for Cloud Run (fixes rate limiting and X-Forwarded-For headers)
app.set("trust proxy", true);

// Connect to MongoDB and wait for it to be ready
const startServer = async () => {
  try {
    // Wait for MongoDB connection
    await connectToDatabase();
    logger.info("✅ MongoDB connection established, starting server...");
  } catch (err) {
    logger.error(`Failed to connect to MongoDB: ${err}`);
    logger.warn(
      "Continuing without MongoDB connection - some features may not work"
    );
    // Don't exit - let the server start anyway for health checks
  }

  // Initialize Redis client
  try {
    await initRedisClient();
    logger.info("✅ Redis client initialized");
  } catch (err) {
    logger.error(`Failed to initialize Redis client: ${err}`);
    // Continue even if Redis fails - we'll fallback to config JWT secret
  }

  // Initialize token rotation system
  try {
    await initializeTokenRotation();
    logger.info("✅ Token rotation system initialized");
  } catch (err) {
    logger.error(`Failed to initialize token rotation system: ${err}`);
    // Continue even if token rotation initialization fails
  }

  // Initialize pipeline middleware
  registerDefaultMiddleware();

  // Create default pipeline configurations
  try {
    await createDefaultConfigurations();
    logger.info("✅ Default pipeline configurations created");
  } catch (err) {
    logger.error(`Failed to create default pipeline configurations: ${err}`);
  }

  // Start the server
  app.listen(port, "0.0.0.0", () => {
    logger.info(`🚀 Server running on port ${port}`);
  });
};

// Get allowed origins from env or use default for development
const allowedOrigins =
  process.env.NODE_ENV !== "development" && process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:3000", "https://proxim8.com"];

// Configure CORS with specific origins
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    // In development, we might not have an origin (like from Postman)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.error(`Blocked request from disallowed origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow credentials
};

// Setup rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
  // Skip rate limiting in development mode
  skip: () => process.env.NODE_ENV === "development",
});

// Apply rate limiting to API routes
app.use("/api/", apiLimiter);

// Middleware
app.use(cors(corsOptions)); // Use configured CORS
app.use(express.json());

// Apply API key verification to all API routes
app.use("/api/", verifyApiKey);

// Log API key configuration on startup
logger.info(
  `Server API key configured: ${process.env.API_KEY ? "Yes" : "No (using default)"}`
);
if (process.env.API_KEY) {
  logger.info(
    `Using API key from environment: ${process.env.API_KEY.substring(0, 4)}...`
  );
} else {
  logger.info("Using default API key: proxim8-dev-key");
}

// Static file serving for uploaded files
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/nft", nftRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/lore", loreRoutes);
// app.use("/api/pipeline", pipelineRoutes);
// app.use("/api/user", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/public", publicVideoRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

startServer();
