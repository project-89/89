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
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY .npmrc ./

# Copy package.json files for all workspaces
COPY apps/server/package.json ./apps/server/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

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

# Remove dev dependencies and clean cache
RUN pnpm prune --prod && pnpm store prune

# Set final working directory
WORKDIR /app/apps/server

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Environment setup
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Expose port (Cloud Run uses PORT env var, defaults to 8080)
EXPOSE ${PORT}

# Start the server
CMD ["node", "dist/index.js"] 