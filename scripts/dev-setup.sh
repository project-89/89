#!/bin/bash

echo "🚀 Setting up Project89 Local Development Environment"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p apps/server/uploads
mkdir -p apps/server/temp
mkdir -p apps/server/logs
mkdir -p scripts/mongo-init

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker is running and docker-compose is available"

# Create environment file template if it doesn't exist
ENV_FILE="apps/server/.env.development"
if [ ! -f "$ENV_FILE" ]; then
    echo "📝 Creating environment file template..."
    cat > "$ENV_FILE" << 'EOF'
# Local Development Environment Variables
NODE_ENV=development
PORT=4000

# Database Configuration (Docker services use different external ports)
DATABASE_URL=mongodb://admin:dev-password@localhost:27019/project89_dev?authSource=admin

# Redis Configuration  
REDIS_URL=redis://:dev-redis-password@localhost:6381

# Authentication & Security
JWT_SECRET=dev-jwt-secret-change-in-production-32-characters-long
API_KEY_ENCRYPTION_KEY=dev-encryption-key-32-chars-long-aes256
API_KEY_ENCRYPTION_IV=dev-encryption-iv-16chars

# Logging
LOG_LEVEL=debug
LOG_EXECUTION_ID=true

# Rate Limiting (Disabled for Development)
RATE_LIMIT_DISABLED=true
IP_RATE_LIMIT_DISABLED=true
FINGERPRINT_RATE_LIMIT_DISABLED=true

# Development Bypasses
BYPASS_ROLE_CHECK=true

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5000,http://localhost:3001

# API Keys (Replace with your actual keys)
OPENAI_API_KEY=your-openai-api-key-here
GOOGLE_AI_API_KEY=your-google-ai-key-here  
HELIUS_API_KEY=your-helius-key-here

# Optional: External Services
DISCORD_WEBHOOK_URL=your-discord-webhook-url-here
SENTRY_DSN=your-sentry-dsn-here

# File Storage (Local Development)
UPLOAD_DIR=./uploads
TEMP_DIR=./temp
LOG_DIR=./logs
EOF
    echo "✅ Created $ENV_FILE"
else
    echo "✅ Environment file already exists: $ENV_FILE"
fi

# Create MongoDB initialization script
MONGO_INIT_FILE="scripts/mongo-init/init-mongo.js"
if [ ! -f "$MONGO_INIT_FILE" ]; then
    echo "📝 Creating MongoDB initialization script..."
    cat > "$MONGO_INIT_FILE" << 'EOF'
// MongoDB initialization script for local development
db = db.getSiblingDB('project89_dev');

// Create a basic user for the application
db.createUser({
  user: 'project89_user',
  pwd: 'dev-app-password',
  roles: [
    {
      role: 'readWrite',
      db: 'project89_dev'
    }
  ]
});

// Create some basic indexes for performance
db.accounts.createIndex({ walletAddress: 1 }, { unique: true });
db.profiles.createIndex({ username: 1 }, { unique: true });
db.fingerprints.createIndex({ fingerprint: 1 }, { unique: true });

print('MongoDB initialized successfully for Project89 development');
EOF
    echo "✅ Created MongoDB initialization script"
else
    echo "✅ MongoDB initialization script already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit apps/server/.env.development with your API keys"
echo "2. Run: docker-compose up -d"
echo "3. Wait for services to start (about 30 seconds)"
echo "4. Run: cd apps/server && pnpm run dev"
echo ""
echo "🔗 Service URLs (Updated to avoid conflicts):"
echo "- Server: http://localhost:4000"
echo "- MongoDB Admin: http://localhost:8083 (admin/dev-admin)"
echo "- Redis Admin: http://localhost:8084 (admin/dev-admin)"
echo "- MongoDB Direct: mongodb://admin:dev-password@localhost:27019"
echo "- Redis Direct: redis://:dev-redis-password@localhost:6381" 