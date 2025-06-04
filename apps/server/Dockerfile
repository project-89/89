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