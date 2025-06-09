#!/usr/bin/env node

console.error("[MCP-WRAPPER] Starting mission MCP wrapper...");
console.error("[MCP-WRAPPER] Current directory:", __dirname);
console.error("[MCP-WRAPPER] Node version:", process.version);

// Load environment variables from server/.env
const envPath = require("path").join(__dirname, "server/.env");
console.error("[MCP-WRAPPER] Loading environment from:", envPath);

try {
  // Use dotenv from server's node_modules
  require("./server/node_modules/dotenv").config({ path: envPath });
  console.error("[MCP-WRAPPER] Environment loaded successfully");
  console.error("[MCP-WRAPPER] MongoDB URI exists:", !!process.env.MONGODB_URI);
} catch (error) {
  console.error("[MCP-WRAPPER] Error loading environment:", error.message);
  console.error("[MCP-WRAPPER] Error stack:", error.stack);
  process.exit(1);
}

// Run the MCP server
console.error("[MCP-WRAPPER] Starting MCP server...");
try {
  require("./mission-mcp-server-db.js");
} catch (error) {
  console.error("[MCP-WRAPPER] Error starting MCP server:", error);
  process.exit(1);
}
