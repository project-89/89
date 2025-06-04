# Local Development Setup - Project89

This guide helps you set up the unified Project89 server for local development using Docker Compose.

## 🚀 Quick Start

1. **Run the setup script:**
   ```bash
   chmod +x scripts/dev-setup.sh
   ./scripts/dev-setup.sh
   ```

2. **Add your API keys** to `apps/server/.env.development`:
   ```bash
   # Edit this file and replace the placeholder values
   nano apps/server/.env.development
   ```

3. **Start the infrastructure:**
   ```bash
   chmod +x scripts/dev-start.sh
   ./scripts/dev-start.sh
   ```

4. **Start the server:**
   ```bash
   cd apps/server
   pnpm install
   pnpm prisma generate
   pnpm prisma db push
   pnpm run dev
   ```

## 🏗️ Architecture

The local development environment includes:

- **Project89 Server** (Port 4000) - Unified Express.js API
- **MongoDB** (Port 27017) - Primary database with Prisma ORM
- **Redis** (Port 6379) - Caching and session storage
- **Mongo Express** (Port 8081) - MongoDB admin interface
- **Redis Commander** (Port 8082) - Redis admin interface

## 🔗 Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Project89 API | http://localhost:4000 | - |
| MongoDB Admin | http://localhost:8081 | admin / dev-admin |
| Redis Admin | http://localhost:8082 | admin / dev-admin |
| MongoDB Direct | mongodb://localhost:27017 | admin / dev-password |
| Redis Direct | redis://localhost:6379 | Password: dev-redis-password |

## 📁 Directory Structure

```
89/
├── docker-compose.yml          # Local development services
├── apps/server/
│   ├── Dockerfile              # Production container
│   ├── Dockerfile.dev          # Development container  
│   ├── .env.development        # Local environment variables
│   ├── src/                    # Server source code
│   ├── prisma/                 # Database schema
│   ├── uploads/                # File uploads (created automatically)
│   ├── temp/                   # Temporary files
│   └── logs/                   # Application logs
└── scripts/
    ├── dev-setup.sh            # Initial setup script
    ├── dev-start.sh            # Start infrastructure
    └── mongo-init/             # MongoDB initialization
```

## 🔧 Development Commands

### Infrastructure Management
```bash
# Start all services
docker-compose up -d

# Start only infrastructure (no server)
./scripts/dev-start.sh

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Reset everything (delete volumes)
docker-compose down -v
```

### Server Development
```bash
# Install dependencies
cd apps/server && pnpm install

# Generate Prisma client
pnpm prisma generate

# Push database schema (development)
pnpm prisma db push

# Start development server (with hot reload)
pnpm run dev

# Run tests
pnpm test

# Build for production
pnpm run build
```

### Database Management
```bash
# View database in browser
open http://localhost:8081

# Connect with MongoDB CLI
docker-compose exec mongo mongosh -u admin -p dev-password project89_dev

# Reset database
docker-compose exec mongo mongosh -u admin -p dev-password --eval "use project89_dev; db.dropDatabase();"
```

## 🔐 Environment Variables

Key environment variables for local development:

```bash
# Database
DATABASE_URL=mongodb://admin:dev-password@localhost:27017/project89_dev?authSource=admin

# Redis
REDIS_URL=redis://:dev-redis-password@localhost:6379

# Security (Development Only)
JWT_SECRET=dev-jwt-secret-change-in-production-32-characters-long
API_KEY_ENCRYPTION_KEY=dev-encryption-key-32-chars-long-aes256

# API Keys (Add Your Real Keys)
OPENAI_API_KEY=your-openai-api-key-here
GOOGLE_AI_API_KEY=your-google-ai-key-here
HELIUS_API_KEY=your-helius-key-here

# Development Features
RATE_LIMIT_DISABLED=true
BYPASS_ROLE_CHECK=true
LOG_LEVEL=debug
```

## 🧪 Testing the Setup

1. **Health Check:**
   ```bash
   curl http://localhost:4000/api/health
   ```

2. **MongoDB Connection:**
   ```bash
   curl http://localhost:4000/api/debug/db-test
   ```

3. **Redis Connection:**
   ```bash
   curl http://localhost:4000/api/debug/redis-test
   ```

4. **Training Missions API:**
   ```bash
   curl http://localhost:4000/api/training/health
   ```

## 🔧 Troubleshooting

### Common Issues

**Docker not running:**
```bash
# Start Docker Desktop or Docker daemon
```

**Port conflicts:**
```bash
# Check what's using ports
lsof -i :4000
lsof -i :27017
lsof -i :6379

# Kill conflicting processes
kill -9 [PID]
```

**MongoDB connection issues:**
```bash
# Check MongoDB logs
docker-compose logs mongo

# Reset MongoDB container
docker-compose down
docker volume rm 89_mongo-data
docker-compose up -d mongo
```

**Prisma client issues:**
```bash
# Regenerate Prisma client
cd apps/server
rm -rf node_modules/.prisma
pnpm prisma generate
```

## 🚀 Next Steps

Once you have local development working:

1. **Deploy to Cloud**: Set up Terraform infrastructure
2. **CI/CD Pipeline**: Configure GitHub Actions
3. **Database Migration**: Import existing data
4. **Production Secrets**: Set up Google Secret Manager

## 📚 Useful Commands

```bash
# View all containers
docker-compose ps

# View container logs
docker-compose logs -f server

# Execute commands in containers
docker-compose exec mongo mongosh
docker-compose exec redis redis-cli

# Clean up everything
docker-compose down -v --remove-orphans
docker system prune -a
``` 