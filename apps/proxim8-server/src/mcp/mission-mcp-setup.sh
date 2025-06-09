#!/bin/bash

# Mission MCP Server Setup Script
# This script helps set up and test the Mission MCP server

echo "Mission MCP Server Setup"
echo "========================"

# Check if we're in the right directory
if [ ! -f "mission-mcp-server-db.js" ]; then
    echo "Error: Please run this script from the proxim8-pipeline directory"
    exit 1
fi

# Check for required dependencies
echo "Checking dependencies..."
if [ ! -d "server/node_modules/mongoose" ]; then
    echo "Error: Server dependencies not installed. Run 'pnpm install' first"
    exit 1
fi

# Check for environment file
if [ ! -f "server/.env" ]; then
    echo "Error: server/.env file not found"
    exit 1
fi

# Test database connection
echo ""
echo "Testing database connection..."
node -e "
require('dotenv').config({ path: require('path').join(__dirname, 'server/.env') });
const mongoose = require('./server/node_modules/mongoose');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Database connection successful');
    const db = mongoose.connection.db;
    const count = await db.collection('trainingmissions').countDocuments();
    console.log(\`✓ Found \${count} missions in database\`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    process.exit(1);
  }
})();
"

# Check MCP configuration
echo ""
echo "Checking MCP configuration..."
if [ -f "../../.mcp.json" ]; then
    echo "✓ MCP configuration found"
    grep -q "project89-missions" ../../.mcp.json && echo "✓ project89-missions server configured" || echo "✗ project89-missions not found in .mcp.json"
else
    echo "✗ .mcp.json not found in project root"
fi

# Test the MCP server
echo ""
echo "Testing MCP server startup..."
timeout 5s node mission-mcp-wrapper.js > /dev/null 2>&1
if [ $? -eq 124 ]; then
    echo "✓ MCP server starts successfully (killed after 5s test)"
else
    echo "✗ MCP server failed to start"
fi

echo ""
echo "Setup complete! The Mission MCP server is ready to use."
echo ""
echo "To use in Claude Code:"
echo "1. Reload MCP connections if needed"
echo "2. Use tools prefixed with 'mcp__project89-missions__'"
echo ""
echo "Available tools:"
echo "- mcp__project89-missions__list_missions"
echo "- mcp__project89-missions__get_mission"
echo "- mcp__project89-missions__create_mission"
echo "- mcp__project89-missions__update_mission"
echo "- mcp__project89-missions__seed_training_missions"
echo "- mcp__project89-missions__get_mission_schema"