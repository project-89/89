import mongoose from "mongoose";
import { logger } from "./utils/logger";

// MongoDB connection URI with authentication - PRODUCTION READY (no unsafe fallbacks)
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  logger.error("MONGODB_URI environment variable is required but not set");
  throw new Error("MONGODB_URI environment variable is required");
}

// Log MongoDB configuration details (without exposing credentials)
const mongoUrl = new URL(MONGODB_URI);
logger.info("MongoDB Configuration:");
logger.info(`  Host: ${mongoUrl.hostname}`);
logger.info(`  Port: ${mongoUrl.port}`);
logger.info(`  Database: ${mongoUrl.pathname.slice(1)}`);
logger.info(
  `  Auth Source: ${mongoUrl.searchParams.get("authSource") || "default"}`
);
logger.info(
  `  TLS Enabled: ${mongoUrl.searchParams.get("tls") || mongoUrl.searchParams.get("ssl") || "false"}`
);
logger.info(
  `  Username: ${mongoUrl.username ? "[PROVIDED]" : "[NOT PROVIDED]"}`
);
logger.info(
  `  Password: ${mongoUrl.password ? "[PROVIDED]" : "[NOT PROVIDED]"}`
);

// MongoDB connection options - optimized for production Cloud Run environment
const connectionOptions: mongoose.ConnectOptions = {
  // Connection timeouts - increased for Cloud Run cold starts
  serverSelectionTimeoutMS: 10000, // How long to try selecting a server
  connectTimeoutMS: 10000, // How long to wait for initial connection
  socketTimeoutMS: 45000, // How long to wait for socket operations

  // Connection pooling for efficiency
  maxPoolSize: 10, // Maximum number of connections
  minPoolSize: 1, // Minimum number of connections to maintain
  maxIdleTimeMS: 30000, // Close connections after 30s of inactivity

  // Reliability and monitoring
  heartbeatFrequencyMS: 10000, // Send ping every 10 seconds
  retryWrites: true, // Retry failed writes
  retryReads: true, // Retry failed reads

  // Buffering - allow operations to queue until connected
  bufferCommands: true,
};

// Enable TLS options if requested in the connection string
if (
  process.env.MONGODB_URI?.includes("tls=true") ||
  process.env.MONGODB_URI?.includes("ssl=true")
) {
  Object.assign(connectionOptions, {
    tls: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false,
  });
  logger.info("TLS/SSL options enabled for MongoDB connection");
}

logger.info("MongoDB Connection Options:", {
  serverSelectionTimeoutMS: connectionOptions.serverSelectionTimeoutMS,
  connectTimeoutMS: connectionOptions.connectTimeoutMS,
  socketTimeoutMS: connectionOptions.socketTimeoutMS,
  maxPoolSize: connectionOptions.maxPoolSize,
  minPoolSize: connectionOptions.minPoolSize,
  bufferCommands: connectionOptions.bufferCommands,
  retryWrites: connectionOptions.retryWrites,
});

/**
 * Connect to MongoDB database
 * PRODUCTION READY: Does not exit process on failure, allows server to continue
 */
export const connectToDatabase = async (): Promise<void> => {
  const startTime = Date.now();
  logger.info("🔄 Attempting to connect to MongoDB...");

  try {
    await mongoose.connect(MONGODB_URI, connectionOptions);
    const connectionTime = Date.now() - startTime;
    logger.info(`✅ Connected to MongoDB successfully in ${connectionTime}ms`);

    // Log connection state details
    logger.info("MongoDB Connection State:", {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    });
  } catch (error) {
    const connectionTime = Date.now() - startTime;
    logger.error(`❌ Failed to connect to MongoDB after ${connectionTime}ms`);
    logger.error(
      `Error type: ${error instanceof Error ? error.constructor.name : typeof error}`
    );
    logger.error(
      `Error message: ${error instanceof Error ? error.message : String(error)}`
    );

    // Log additional error details if available
    if (error instanceof Error && "code" in error) {
      logger.error(`Error code: ${(error as any).code}`);
    }
    if (error instanceof Error && "codeName" in error) {
      logger.error(`Error codeName: ${(error as any).codeName}`);
    }

    // PRODUCTION FIX: Don't exit process - let server continue for health checks
    // The calling code will handle this gracefully
    throw error; // Re-throw so calling code can handle appropriately
  }
};

/**
 * Disconnect from MongoDB database
 */
export const disconnectFromDatabase = async (): Promise<void> => {
  try {
    logger.info("🔄 Disconnecting from MongoDB...");
    await mongoose.disconnect();
    logger.info("✅ Disconnected from MongoDB successfully");
  } catch (error) {
    logger.error(
      `❌ Error disconnecting from MongoDB: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

// Monitor MongoDB connection events with detailed logging
mongoose.connection.on("connecting", () => {
  logger.info("🔄 MongoDB connection state: CONNECTING");
});

mongoose.connection.on("connected", () => {
  logger.info("✅ MongoDB connection state: CONNECTED");
  logger.info("MongoDB Server Info:", {
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
  });
});

mongoose.connection.on("open", () => {
  logger.info("🔓 MongoDB connection state: OPEN (ready for operations)");
});

mongoose.connection.on("disconnecting", () => {
  logger.warn("⚠️ MongoDB connection state: DISCONNECTING");
});

mongoose.connection.on("disconnected", () => {
  logger.warn("⚠️ MongoDB connection state: DISCONNECTED");
  logger.info("Connection will attempt to reconnect automatically...");
  // PRODUCTION FIX: Don't exit on disconnect - MongoDB will auto-reconnect
  // This is normal behavior in cloud environments
});

mongoose.connection.on("reconnected", () => {
  logger.info("🔄 MongoDB connection state: RECONNECTED");
});

mongoose.connection.on("error", (err) => {
  logger.error(`❌ MongoDB connection error: ${err.message}`);
  logger.error("Error details:", {
    name: err.name,
    message: err.message,
    code: (err as any).code,
    codeName: (err as any).codeName,
  });
  // PRODUCTION FIX: Don't exit on error - let mongoose handle reconnection
});

mongoose.connection.on("close", () => {
  logger.info("🔒 MongoDB connection state: CLOSED");
});

// Handle application termination gracefully
process.on("SIGINT", async () => {
  logger.info("📡 Received SIGINT, gracefully shutting down...");
  await disconnectFromDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("📡 Received SIGTERM, gracefully shutting down...");
  await disconnectFromDatabase();
  process.exit(0);
});

export default mongoose;
