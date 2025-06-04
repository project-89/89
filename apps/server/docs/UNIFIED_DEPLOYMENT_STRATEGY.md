# Unified Deployment Strategy - Project89 Server

## Overview
This document outlines the unified deployment strategy for the merged Project89 server, combining Core Server, Proxim8 Server, and the new Training Mission system into a single, cohesive deployment pipeline.

## 🏗️ **Unified Architecture**

### **Technology Stack**
- **Platform**: Google Cloud Run (containerized, auto-scaling)
- **Database**: MongoDB with Prisma ORM
- **Cache**: Redis (Memorystore) 
- **Storage**: Google Cloud Storage
- **Build System**: Turbo monorepo + pnpm
- **Container Registry**: Google Artifact Registry
- **Infrastructure**: Terraform 1.6.0+
- **CI/CD**: GitHub Actions

### **Key Architecture Decisions**

1. **Cloud Run over Cloud Functions**: Better suited for complex applications with multiple services
2. **Prisma Integration**: Modern ORM with type safety and database migration support
3. **Redis Caching**: Essential for performance with complex training mission logic
4. **Monorepo Structure**: Unified deployment from single repository

## 🐳 **Docker Configuration**

### **Production Dockerfile**
```dockerfile
FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libvips-dev \
    python3 \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Install package managers
RUN npm install -g pnpm@8.10.0 turbo

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json .npmrc ./

# Copy package.json files for all workspaces
COPY apps/server/package.json ./apps/server/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/server ./apps/server
COPY packages ./packages

# Generate Prisma client
WORKDIR /app/apps/server
RUN pnpm prisma generate

# Build the application
WORKDIR /app
RUN pnpm turbo run build --filter=server...

# Create necessary directories
RUN mkdir -p apps/server/uploads apps/server/temp apps/server/logs

# Set final working directory
WORKDIR /app/apps/server

# Environment setup
ENV NODE_ENV=production
ENV DATABASE_URL=""
ENV REDIS_URL=""

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-4000}/api/health || exit 1

# Start the server
CMD ["node", "dist/index.js"]
```

### **Development Dockerfile**
```dockerfile
FROM node:20-slim

# Install system dependencies  
RUN apt-get update && apt-get install -y \
    build-essential \
    libvips-dev \
    python3 \
    openssl \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install package managers
RUN npm install -g pnpm@8.10.0 turbo

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy package.json files
COPY apps/server/package.json ./apps/server/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN pnpm install

# Copy source code
COPY packages ./packages
COPY apps/server ./apps/server

# Generate Prisma client
WORKDIR /app/apps/server
RUN pnpm prisma generate

# Expose port
EXPOSE 4000

# Set working directory for development
WORKDIR /app/apps/server

# Development command
CMD ["pnpm", "run", "dev"]
```

### **Docker Compose for Local Development**
```yaml
version: '3.8'

services:
  server:
    build:
      context: .
      dockerfile: apps/server/Dockerfile.dev
    ports:
      - "4000:4000"
    volumes:
      - ./apps/server/src:/app/apps/server/src
      - ./apps/server/prisma:/app/apps/server/prisma
      - ./packages:/app/packages
    environment:
      - NODE_ENV=development
      - PORT=4000
      - DATABASE_URL=mongodb://mongo:27017/project89_dev
      - REDIS_URL=redis://redis:6379
      - LOG_LEVEL=debug
    depends_on:
      - mongo
      - redis
    networks:
      - project89-network

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=project89_dev
    networks:
      - project89-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - project89-network

volumes:
  mongo-data:
  redis-data:

networks:
  project89-network:
    driver: bridge
```

## 🚀 **CI/CD Pipeline (GitHub Actions)**

### **Workflow Configuration (`.github/workflows/deploy.yml`)**
```yaml
name: Deploy Project89 Server

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'dev'
        type: choice
        options:
          - dev
          - staging
          - prod
      force_deploy:
        description: 'Force deployment even if no changes detected'
        required: false
        default: false
        type: boolean

env:
  PROJECT_ID: argos-434718
  REGION: us-central1
  SERVICE_NAME: project89-server
  TERRAFORM_VERSION: 1.6.0

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      server_changed: ${{ steps.changes.outputs.server }}
      terraform_changed: ${{ steps.changes.outputs.terraform }}
      environment: ${{ steps.env.outputs.environment }}
      should_deploy: ${{ steps.deploy.outputs.should_deploy }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - uses: dorny/paths-filter@v3
        id: changes
        with:
          filters: |
            server:
              - 'apps/server/**'
              - 'packages/**'
              - 'package.json'
              - 'pnpm-lock.yaml'
            terraform:
              - 'terraform/**'

      - name: Determine environment
        id: env
        run: |
          if [[ "${{ github.event_name }}" == "workflow_dispatch" ]]; then
            echo "environment=${{ github.event.inputs.environment }}" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "environment=prod" >> $GITHUB_OUTPUT
          elif [[ "${{ github.ref }}" == "refs/heads/develop" ]]; then
            echo "environment=dev" >> $GITHUB_OUTPUT
          else
            echo "environment=dev" >> $GITHUB_OUTPUT
          fi

      - name: Should deploy
        id: deploy
        run: |
          if [[ "${{ github.event.inputs.force_deploy }}" == "true" || 
                "${{ steps.changes.outputs.server }}" == "true" || 
                "${{ steps.changes.outputs.terraform }}" == "true" ]]; then
            echo "should_deploy=true" >> $GITHUB_OUTPUT
          else
            echo "should_deploy=false" >> $GITHUB_OUTPUT
          fi

  build:
    needs: detect-changes
    if: needs.detect-changes.outputs.should_deploy == 'true'
    runs-on: ubuntu-latest
    environment: ${{ needs.detect-changes.outputs.environment }}
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: '${{ secrets.GCP_SA_KEY }}'

      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          dockerfile: apps/server/Dockerfile
          push: true
          tags: |
            ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/project89-registry/${{ env.SERVICE_NAME }}:${{ needs.detect-changes.outputs.environment }}-${{ github.sha }}
            ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/project89-registry/${{ env.SERVICE_NAME }}:${{ needs.detect-changes.outputs.environment }}-latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64

  terraform:
    needs: [detect-changes, build]
    if: needs.detect-changes.outputs.should_deploy == 'true'
    runs-on: ubuntu-latest
    environment: ${{ needs.detect-changes.outputs.environment }}
    defaults:
      run:
        working-directory: terraform
    steps:
      - uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: ${{ env.TERRAFORM_VERSION }}

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: '${{ secrets.GCP_SA_KEY }}'

      - name: Terraform Init
        run: terraform init

      - name: Update image tag
        run: |
          sed -i 's/image_tag = .*/image_tag = "${{ needs.detect-changes.outputs.environment }}-${{ github.sha }}"/' \
            environments/${{ needs.detect-changes.outputs.environment }}/terraform.tfvars

      - name: Terraform Plan
        run: |
          terraform plan \
            -var-file="environments/${{ needs.detect-changes.outputs.environment }}/terraform.tfvars" \
            -out=tfplan

      - name: Terraform Apply
        if: github.event_name != 'pull_request'
        run: terraform apply tfplan

  database-migration:
    needs: [detect-changes, terraform]
    if: needs.detect-changes.outputs.should_deploy == 'true' && github.event_name != 'pull_request'
    runs-on: ubuntu-latest
    environment: ${{ needs.detect-changes.outputs.environment }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm@8.10.0

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: '${{ secrets.GCP_SA_KEY }}'

      - name: Get database connection string
        run: |
          DATABASE_URL=$(gcloud secrets versions access latest --secret="project89-database-url-${{ needs.detect-changes.outputs.environment }}")
          echo "DATABASE_URL=$DATABASE_URL" >> $GITHUB_ENV

      - name: Run Prisma migrations
        working-directory: apps/server
        run: |
          pnpm prisma generate
          pnpm prisma db push --accept-data-loss

  health-check:
    needs: [detect-changes, database-migration]
    if: needs.detect-changes.outputs.should_deploy == 'true' && github.event_name != 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - name: Wait for deployment
        run: sleep 60

      - name: Health check
        run: |
          SERVICE_URL=$(gcloud run services describe project89-server \
            --region=${{ env.REGION }} \
            --format='value(status.url)')
          
          curl -f $SERVICE_URL/api/health || exit 1
```

## 🏗️ **Terraform Infrastructure**

### **Main Configuration (`terraform/main.tf`)**
```hcl
terraform {
  required_version = ">= 1.6.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  
  backend "gcs" {
    bucket = "argos-434718-terraform-state"
    prefix = "terraform/state/project89"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",
    "redis.googleapis.com", 
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "storage.googleapis.com",
    "vpcaccess.googleapis.com",
    "compute.googleapis.com"
  ])
  
  service = each.value
  disable_dependent_services = false
}

# Artifact Registry
resource "google_artifact_registry_repository" "project89_registry" {
  repository_id = "project89-registry"
  location      = var.region
  format        = "DOCKER"
  description   = "Docker repository for Project89 server"
}

# Service Account for Cloud Run
resource "google_service_account" "cloud_run_sa" {
  account_id   = "project89-cloud-run"
  display_name = "Project89 Cloud Run Service Account"
  description  = "Service account for Project89 Cloud Run service"
}

# IAM bindings for service account
resource "google_project_iam_member" "cloud_run_permissions" {
  for_each = toset([
    "roles/secretmanager.secretAccessor",
    "roles/monitoring.metricWriter", 
    "roles/logging.logWriter",
    "roles/storage.admin"
  ])
  
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# VPC for Redis connectivity
resource "google_compute_network" "vpc_network" {
  name                    = "project89-vpc-${var.environment}"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "vpc_subnet" {
  name          = "project89-subnet-${var.environment}"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc_network.id
}

# VPC Access Connector for Cloud Run to Redis
resource "google_vpc_access_connector" "vpc_connector" {
  name          = "project89-connector-${var.environment}"
  region        = var.region
  network       = google_compute_network.vpc_network.name
  ip_cidr_range = "10.1.0.0/28"
  
  depends_on = [google_project_service.required_apis]
}

# Redis instance
resource "google_redis_instance" "redis_cache" {
  name           = "project89-redis-${var.environment}"
  tier           = var.redis_tier
  memory_size_gb = var.redis_memory_gb
  region         = var.region
  
  authorized_network = google_compute_network.vpc_network.id
  auth_enabled       = true
  
  display_name = "Project89 Redis Cache - ${title(var.environment)}"
  
  depends_on = [google_project_service.required_apis]
}

# Cloud Storage bucket for file uploads
resource "google_storage_bucket" "file_storage" {
  name     = "${var.project_id}-project89-files-${var.environment}"
  location = "US"
  
  versioning {
    enabled = false
  }
  
  lifecycle_rule {
    condition {
      age = var.storage_lifecycle_days
    }
    action {
      type = "Delete"
    }
  }
  
  cors {
    origin          = var.cors_origins
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# Cloud Run Service
resource "google_cloud_run_v2_service" "project89_server" {
  name     = "project89-server"
  location = var.region
  
  template {
    service_account = google_service_account.cloud_run_sa.email
    
    vpc_access {
      connector = google_vpc_access_connector.vpc_connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }
    
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/project89-registry/project89-server:${var.image_tag}"
      
      ports {
        container_port = 4000
      }
      
      resources {
        limits = {
          cpu    = var.cloud_run_cpu
          memory = var.cloud_run_memory
        }
      }
      
      env {
        name  = "NODE_ENV"
        value = var.environment == "prod" ? "production" : "development"
      }
      
      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.database_url.secret_id
            version = "latest"
          }
        }
      }
      
      env {
        name  = "REDIS_URL"
        value = "redis://:${google_redis_instance.redis_cache.auth_string}@${google_redis_instance.redis_cache.host}:${google_redis_instance.redis_cache.port}"
      }
      
      env {
        name = "JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.jwt_secret.secret_id
            version = "latest"
          }
        }
      }
      
      env {
        name = "OPENAI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.openai_key.secret_id
            version = "latest"
          }
        }
      }
    }
    
    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }
  }
  
  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }
  
  depends_on = [
    google_project_service.required_apis,
    google_vpc_access_connector.vpc_connector
  ]
}

# Make Cloud Run service publicly accessible
resource "google_cloud_run_v2_service_iam_member" "public_access" {
  name     = google_cloud_run_v2_service.project89_server.name
  location = google_cloud_run_v2_service.project89_server.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Secret Manager secrets
resource "google_secret_manager_secret" "database_url" {
  secret_id = "project89-database-url-${var.environment}"
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "project89-jwt-secret-${var.environment}"
  
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "openai_key" {
  secret_id = "project89-openai-key-${var.environment}"
  
  replication {
    auto {}
  }
}

# Output the service URL
output "service_url" {
  value = google_cloud_run_v2_service.project89_server.uri
}

output "redis_host" {
  value = google_redis_instance.redis_cache.host
}

output "storage_bucket" {
  value = google_storage_bucket.file_storage.name
}
```

### **Variables (`terraform/variables.tf`)**
```hcl
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

# Cloud Run Configuration
variable "cloud_run_cpu" {
  description = "CPU allocation for Cloud Run"
  type        = string
  default     = "2"
}

variable "cloud_run_memory" {
  description = "Memory allocation for Cloud Run"
  type        = string
  default     = "4Gi"
}

variable "min_instances" {
  description = "Minimum number of Cloud Run instances"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of Cloud Run instances"
  type        = number
  default     = 100
}

# Redis Configuration
variable "redis_tier" {
  description = "Redis tier (BASIC or STANDARD_HA)"
  type        = string
  default     = "BASIC"
}

variable "redis_memory_gb" {
  description = "Redis memory in GB"
  type        = number
  default     = 1
}

# Storage Configuration
variable "storage_lifecycle_days" {
  description = "Days after which to delete files from storage"
  type        = number
  default     = 30
}

variable "cors_origins" {
  description = "CORS allowed origins"
  type        = list(string)
  default     = ["*"]
}
```

### **Environment Configurations**

#### **Development (`terraform/environments/dev/terraform.tfvars`)**
```hcl
project_id  = "argos-434718"
region      = "us-central1"
environment = "dev"
image_tag   = "dev-latest"

# Cloud Run Configuration
cloud_run_cpu    = "1"
cloud_run_memory = "2Gi"
min_instances    = 0
max_instances    = 10

# Redis Configuration
redis_tier      = "BASIC"
redis_memory_gb = 1

# Storage Configuration  
storage_lifecycle_days = 30

# CORS Configuration
cors_origins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5000",
  "https://dev-project89.example.com"
]
```

#### **Production (`terraform/environments/prod/terraform.tfvars`)**
```hcl
project_id  = "argos-434718"
region      = "us-central1"
environment = "prod"
image_tag   = "latest"

# Cloud Run Configuration
cloud_run_cpu    = "4"
cloud_run_memory = "8Gi"
min_instances    = 1
max_instances    = 100

# Redis Configuration
redis_tier      = "STANDARD_HA"
redis_memory_gb = 4

# Storage Configuration
storage_lifecycle_days = 90

# CORS Configuration
cors_origins = [
  "https://project89.example.com",
  "https://app.project89.example.com"
]
```

## 🔐 **Security & Secrets Management**

### **Required Secrets**
```bash
# Database
project89-database-url-{env}           # MongoDB connection string with Prisma format
project89-jwt-secret-{env}             # JWT signing secret
project89-openai-key-{env}             # OpenAI API key
project89-google-ai-key-{env}          # Google AI API key
project89-helius-key-{env}             # Helius API key for Solana
project89-encryption-key-{env}         # Data encryption key (from Core server)
project89-encryption-iv-{env}          # Encryption IV (from Core server)

# Optional secrets for external services
project89-discord-webhook-{env}        # Discord webhook for notifications
project89-sentry-dsn-{env}            # Sentry error tracking
```

### **Prisma Database Configuration**

The unified server uses Prisma with MongoDB. The connection string format:
```
DATABASE_URL="mongodb://username:password@host:port/database?authSource=admin"
```

## 📊 **Migration Strategy**

### **Phase 1: Infrastructure Setup**
1. **Copy Terraform Configuration**: Adapt existing configurations
2. **Create New Artifacts Registry**: For unified container images  
3. **Set up Redis**: Essential for training mission caching
4. **Configure Secrets**: Migrate all secrets to Secret Manager

### **Phase 2: Database Migration**
1. **Export Existing Data**: From both MongoDB instances
2. **Create Unified Schema**: Using Prisma migrations
3. **Data Transformation**: Merge data from both systems
4. **Prisma Generation**: Generate client for new schema

### **Phase 3: Application Deployment**
1. **Docker Build**: Create unified container image
2. **Cloud Run Deployment**: Deploy containerized application
3. **Health Checks**: Verify all endpoints work
4. **Performance Testing**: Ensure acceptable response times

### **Phase 4: Cutover & Monitoring**  
1. **DNS Updates**: Point domains to new infrastructure
2. **Monitor Metrics**: Watch for errors and performance issues
3. **Gradual Traffic Migration**: If using multiple environments
4. **Decommission Old Infrastructure**: Clean up unused resources

## 🎯 **Key Benefits of Unified Architecture**

1. **Cost Efficiency**: Single Cloud Run service vs multiple Cloud Functions
2. **Better Performance**: Redis caching for complex operations
3. **Type Safety**: Prisma provides full TypeScript integration
4. **Simplified Deployment**: Single container, single pipeline
5. **Better Monitoring**: Unified logging and metrics
6. **Auto-scaling**: Cloud Run handles traffic spikes automatically
7. **Development Experience**: Local Docker setup matches production

This unified deployment strategy provides a robust, scalable, and maintainable foundation for the Project89 server, combining the best practices from both original deployments while adding modern tooling like Prisma and improved caching capabilities. 