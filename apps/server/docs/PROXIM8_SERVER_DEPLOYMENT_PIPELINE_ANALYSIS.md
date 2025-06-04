# Proxim8 Deployment Pipeline & Infrastructure Analysis

## Overview
This document provides a comprehensive analysis of the current Proxim8 deployment pipeline, infrastructure setup, and all configurations needed to successfully migrate this functionality into a new monorepo.

## 🏗️ Infrastructure Architecture

### Current Technology Stack
- **Cloud Provider**: Google Cloud Platform (GCP)
- **Project ID**: `argos-434718`
- **Primary Region**: `us-central1`
- **Container Orchestration**: Cloud Run (serverless) + Compute Engine (workers)
- **Infrastructure as Code**: Terraform 1.6.0
- **CI/CD**: GitHub Actions
- **Package Manager**: pnpm 8.10.0
- **Build System**: Turbo (monorepo)
- **Container Registry**: Google Artifact Registry

### Core Components

| Component | Technology | Purpose | Scaling Strategy |
|-----------|------------|---------|------------------|
| **API Server** | Express.js on Cloud Run | HTTP API, stateless | Auto-scaling (0-100 instances) |
| **Database** | MongoDB (external) | Primary data store | Managed externally |
| **Cache/Queue** | Redis (Memorystore) | Caching & job queues | Manual scaling |
| **File Storage** | Google Cloud Storage | Video/asset storage | Auto-scaling |
| **Container Registry** | Artifact Registry | Docker images | N/A |
| **Secrets** | Secret Manager | Secure credentials | N/A |
| **Monitoring** | Cloud Monitoring/Logging | Observability | Built-in |

## 🐳 Docker Configuration

### Production Dockerfile (`server/Dockerfile`)
```dockerfile
FROM node:20-slim
RUN npm install -g pnpm@8.10.0 turbo
RUN apt-get update && apt-get install -y build-essential libvips-dev python3
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json .npmrc ./
COPY server/package.json ./server/
RUN pnpm install --frozen-lockfile
COPY server ./server
RUN pnpm turbo run build --filter=proxim8-server...
RUN mkdir -p server/uploads server/temp server/logs
WORKDIR /app/server
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
```

### Development Dockerfile (`server/Dockerfile.dev`)
```dockerfile
FROM node:20-slim
RUN apt-get update && apt-get install -y build-essential libvips-dev python3
RUN npm install -g pnpm@8.10.0 turbo
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY server/package.json ./server/
COPY packages/shared-types/package.json ./packages/shared-types/
RUN pnpm install
COPY packages/shared-types ./packages/shared-types
COPY server ./server
EXPOSE 4000
WORKDIR /app/server
CMD ["pnpm", "run", "dev"]
```

### Docker Compose (Local Development)
```yaml
version: '3'
services:
  server:
    build:
      context: .
      dockerfile: server/Dockerfile.dev
    ports:
      - "4000:4000"
    volumes:
      - ./server/src:/app/server/src
      - ./packages/shared-types/src:/app/packages/shared-types/src
    environment:
      - NODE_ENV=development
      - PORT=4000
    depends_on:
      - mongo
      - redis
  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
volumes:
  mongo-data:
```

## 🚀 CI/CD Pipeline (GitHub Actions)

### Workflow Structure (`/.github/workflows/deploy.yml`)

#### Triggers
- **Push to `main`**: Deploy to production
- **Push to `develop`**: Deploy to development
- **Pull Requests**: Plan only (no deployment)
- **Manual Dispatch**: Deploy to any environment with options

#### Jobs Overview

1. **detect-changes**
   - Detects file changes using `dorny/paths-filter@v3`
   - Determines environment and deployment strategy
   - Outputs: `server_changed`, `terraform_changed`, `environment`, `should_deploy`

2. **build** (conditional)
   - Runs only if server files changed or forced
   - Builds Docker images using Docker Buildx
   - Pushes to Artifact Registry with environment-specific tags
   - Uses GitHub Actions cache for optimization

3. **terraform** (conditional)
   - Plans/applies infrastructure changes
   - Uses remote state in GCS bucket
   - Updates image tags in terraform.tfvars
   - Supports destroy operations

4. **health-check** (post-deployment)
   - Waits 30 seconds for services to stabilize
   - Performs HTTP health checks on deployed services

#### Environment Variables
```yaml
env:
  PROJECT_ID: argos-434718
  REGION: us-central1
  TERRAFORM_VERSION: 1.6.0
```

#### Required GitHub Secrets
- `GCP_SA_KEY`: Service account JSON key with required permissions

## 🏗️ Terraform Infrastructure

### Directory Structure
```
terraform/
├── main.tf                    # Core infrastructure
├── variables.tf               # Input variables
├── outputs.tf                 # Output values
├── backend.tf                 # Remote state config
├── .terraform.lock.hcl        # Provider version locks
├── README.md                  # Terraform documentation
└── environments/
    ├── dev/terraform.tfvars   # Development config
    ├── staging/terraform.tfvars # Staging config
    └── prod/terraform.tfvars  # Production config
```

### Core Resources (`main.tf`)

#### Required APIs
```hcl
google_project_service.required_apis = [
  "run.googleapis.com",              # Cloud Run
  "redis.googleapis.com",            # Memorystore Redis
  "artifactregistry.googleapis.com", # Artifact Registry
  "secretmanager.googleapis.com",    # Secret Manager
  "monitoring.googleapis.com",       # Cloud Monitoring
  "logging.googleapis.com",          # Cloud Logging
  "storage.googleapis.com",          # Cloud Storage
  "vpcaccess.googleapis.com"         # VPC Access for Redis
]
```

#### Key Infrastructure Components
1. **Artifact Registry Repository**
   - Format: Docker
   - Per-environment repositories
   - Location: us-central1

2. **Service Account & IAM**
   - Cloud Run service account
   - Minimal required permissions
   - Roles: secretmanager.secretAccessor, monitoring.metricWriter, logging.logWriter, storage.admin

3. **Redis Instance (Memorystore)**
   - Version: Redis 7.0
   - Auth enabled
   - Environment-specific sizing (Basic/Standard HA)

4. **Cloud Storage Bucket**
   - Video processing storage
   - Lifecycle policies (30-day deletion)
   - Uniform bucket-level access

5. **Cloud Run Service**
   - Auto-scaling (0-100 instances)
   - VPC connector for Redis access
   - Environment-specific resource limits
   - Secret Manager integration

6. **VPC Access Connector**
   - Enables Cloud Run to Redis connectivity
   - Serverless VPC access

### Environment Configurations

#### Development (`terraform/environments/dev/terraform.tfvars`)
```hcl
project_id  = "argos-434718"
region      = "us-central1"
zone        = "us-central1-a"
environment = "dev"
image_tag   = "dev-latest"
redis_tier  = "BASIC"
redis_memory_gb = 1
enable_monitoring = true
log_retention_days = 30
```

#### Production (`terraform/environments/prod/terraform.tfvars`)
```hcl
project_id  = "argos-434718"
region      = "us-central1"
zone        = "us-central1-a"
environment = "prod"
image_tag   = "latest"
redis_tier  = "STANDARD_HA"
redis_memory_gb = 2
enable_monitoring = true
log_retention_days = 90
```

### Remote State Configuration
- **Backend**: Google Cloud Storage
- **Bucket**: `{PROJECT_ID}-terraform-state`
- **Prefix**: `terraform/state/{environment}`
- **Versioning**: Enabled

## 📦 Package Management & Build System

### Monorepo Structure (pnpm + Turbo)

#### Workspace Configuration (`pnpm-workspace.yaml`)
```yaml
packages:
  - 'client'
  - 'server'
  - 'packages/*'
```

#### Turbo Configuration (`turbo.json`)
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**", ".turbo/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "cache": true
    }
  }
}
```

#### Root Package Scripts
```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "gcp-build": "pnpm install --no-frozen-lockfile && pnpm turbo run build --filter=proxim8-server...",
    "deploy:terraform:dev": "cd terraform && terraform apply -var-file=\"environments/dev/terraform.tfvars\" -auto-approve",
    "deploy:terraform:prod": "cd terraform && terraform apply -var-file=\"environments/prod/terraform.tfvars\" -auto-approve"
  }
}
```

### Server Dependencies
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.1",
    "@google/generative-ai": "^0.24.1",
    "@google-cloud/storage": "^6.11.0",
    "express": "^4.18.2",
    "mongoose": "^7.4.3",
    "redis": "^4.6.7",
    "winston": "^3.10.0"
  },
  "devDependencies": {
    "@types/supertest": "^6.0.3",
    "mongodb-memory-server": "^9.5.0",
    "supertest": "^6.3.4",
    "ts-jest": "^29.3.4"
  }
}
```

### Client Dependencies (Next.js)
```json
{
  "dependencies": {
    "next": "14.1.4",
    "react": "18.2.0",
    "@tanstack/react-query": "^5.75.7",
    "@solana/wallet-adapter-react": "^0.15.35",
    "tailwindcss": "^3.4.17"
  }
}
```

## 🔐 Security & Secrets Management

### Google Secret Manager Integration
All sensitive configuration is stored in Secret Manager with environment-specific naming:

#### Required Secrets
```bash
# Database
proxim8-mongodb-uri

# API Keys
proxim8-api-key-{env}
proxim8-jwt-secret-{env}
proxim8-openai-key-{env}
proxim8-google-ai-key-{env}
proxim8-helius-key-{env}

# Configuration
proxim8-allowed-origins-{env}
proxim8-redis-auth
```

### Service Account Permissions
```hcl
google_project_iam_member.cloud_run_permissions = [
  "roles/secretmanager.secretAccessor",
  "roles/monitoring.metricWriter",
  "roles/logging.logWriter",
  "roles/storage.admin",
  "roles/artifactregistry.reader",
  "roles/iam.serviceAccountUser"
]
```

### GitHub Actions Service Account Setup
```bash
#!/bin/bash
# scripts/setup/setup-github-secrets.sh
PROJECT_ID="argos-434718"
SA_EMAIL="terraform@argos-434718.iam.gserviceaccount.com"

gcloud iam service-accounts keys create gcp-sa-key.json \
  --iam-account=$SA_EMAIL \
  --project=$PROJECT_ID
```

## 🌍 Environment Management

### Environment Strategy
- **Development**: Feature development, testing, minimal resources
- **Staging**: Pre-production testing, production-like setup
- **Production**: Live user traffic, high availability, auto-scaling

### Environment-Specific Configurations

#### Resource Allocation
| Environment | Cloud Run CPU/Memory | Redis Tier | Redis Memory | Storage Lifecycle |
|-------------|---------------------|------------|--------------|-------------------|
| **Dev** | 1 CPU / 2Gi | BASIC | 1GB | 30 days |
| **Staging** | 2 CPU / 4Gi | STANDARD_HA | 2GB | 30 days |
| **Prod** | 4 CPU / 8Gi | STANDARD_HA | 4GB | 90 days |

#### Scaling Configuration
```hcl
# Cloud Run Auto-scaling
annotations = {
  "autoscaling.knative.dev/minScale" = "0"    # Scale to zero
  "autoscaling.knative.dev/maxScale" = "100"  # Max instances
  "run.googleapis.com/cpu-throttling" = "false"
}
```

## 📊 Monitoring & Observability

### Built-in Monitoring
- **Cloud Run Metrics**: Request rate, latency, error rate, instance count
- **Redis Metrics**: Memory usage, connection count, operations/sec
- **Storage Metrics**: Bandwidth usage, operation count, storage size
- **Custom Application Metrics**: Via prom-client integration

### Health Checks
```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});
```

### Logging Strategy
- **Structured Logging**: Winston with JSON format
- **Log Levels**: Error, Warn, Info, Debug
- **Retention**: 30 days (dev), 90 days (prod)
- **Integration**: Google Cloud Logging

## 🚀 Deployment Strategies

### 1. Automated CI/CD (Recommended)
```bash
# Trigger deployments via git push
git push origin develop  # → Deploy to dev
git push origin main     # → Deploy to prod
```

### 2. Manual Terraform Deployment
```bash
cd terraform
terraform init
terraform plan -var-file="environments/dev/terraform.tfvars"
terraform apply -var-file="environments/dev/terraform.tfvars"
```

### 3. Local Development
```bash
# Start local development environment
docker-compose up -d
pnpm dev
```

## 💰 Cost Analysis

### Monthly Cost Estimates

#### Development Environment (~$100/month)
- Cloud Run: $0-20 (usage-based)
- Redis (Basic 1GB): $25
- Storage: $5-20
- Artifact Registry: $5
- Other services: $10-20

#### Production Environment (~$400-1000/month)
- Cloud Run: $100-500 (traffic-dependent)
- Redis (Standard HA 4GB): $200
- Storage: $20-100
- Artifact Registry: $10
- Monitoring/Logging: $20-50
- Data transfer: $50-150

### Cost Optimization Features
- **Auto-scaling to zero**: Cloud Run scales down when not in use
- **Storage lifecycle policies**: Automatic cleanup of old files
- **Efficient caching**: Redis for reduced database load
- **Optimized Docker images**: Multi-stage builds, minimal base images

## 🔧 Local Development Setup

### Prerequisites
```bash
# Required tools
node >= 20
pnpm >= 8.10.0
docker
docker-compose
```

### Setup Commands
```bash
# 1. Install dependencies
pnpm install

# 2. Start infrastructure
docker-compose up -d

# 3. Start development servers
pnpm dev

# 4. Run tests
pnpm test
```

### Environment Variables (Local)
```bash
# .env.local
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/proxim8_dev
REDIS_HOST=localhost
REDIS_PORT=6379
```

## 📋 Migration Checklist for New Monorepo

### Infrastructure Setup
- [ ] Copy `terraform/` directory with all configurations
- [ ] Update `terraform/environments/*/terraform.tfvars` with new project details
- [ ] Copy `.github/workflows/deploy.yml` GitHub Actions workflow
- [ ] Set up Google Cloud project and enable required APIs
- [ ] Create service account and configure GitHub secrets

### Docker Configuration
- [ ] Copy `server/Dockerfile` and `server/Dockerfile.dev`
- [ ] Copy `docker-compose.yml` for local development
- [ ] Copy `.dockerignore` configuration
- [ ] Update image names and registry paths in Terraform

### Package Management
- [ ] Copy `pnpm-workspace.yaml` workspace configuration
- [ ] Copy `turbo.json` build system configuration
- [ ] Copy root `package.json` with deployment scripts
- [ ] Update package names and dependencies as needed

### Environment & Secrets
- [ ] Set up Google Secret Manager secrets for each environment
- [ ] Configure environment-specific variables in Terraform
- [ ] Set up GitHub repository secrets (GCP_SA_KEY)
- [ ] Update CORS origins and API endpoints

### Monitoring & Observability
- [ ] Verify Cloud Monitoring integration
- [ ] Set up log retention policies
- [ ] Configure health check endpoints
- [ ] Set up alerting policies (optional)

### Testing & Validation
- [ ] Run local development setup
- [ ] Test Docker builds locally
- [ ] Validate Terraform plans
- [ ] Deploy to development environment
- [ ] Run health checks and integration tests
- [ ] Deploy to production environment

## 🎯 Key Success Factors

1. **Infrastructure as Code**: All infrastructure defined in Terraform
2. **Environment Isolation**: Separate configurations for dev/staging/prod
3. **Automated Deployments**: GitHub Actions for CI/CD
4. **Security Best Practices**: Secret Manager, minimal IAM permissions
5. **Cost Optimization**: Auto-scaling, lifecycle policies
6. **Monitoring**: Built-in observability and health checks
7. **Developer Experience**: Local development with Docker Compose

This comprehensive setup provides a production-ready, scalable, and maintainable deployment pipeline that can be easily migrated to your new monorepo structure. 