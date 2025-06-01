FROM node:20-slim

# Install pnpm
RUN npm install -g pnpm@8.10.0 turbo

# Install dependencies for Sharp (libvips)
RUN apt-get update && apt-get install -y \
    build-essential \
    libvips-dev \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json .npmrc ./
COPY server/package.json ./server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY server ./server

# Build
RUN pnpm turbo run build --filter=proxim8-server...

# Create needed directories
RUN mkdir -p server/uploads server/temp server/logs

# Start the server
WORKDIR /app/server
ENV NODE_ENV=production
CMD ["node", "dist/index.js"] 