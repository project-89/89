#!/bin/bash

echo "🚀 Starting Project89 Local Development Environment"

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start the infrastructure services
echo "📦 Starting infrastructure services (MongoDB + Redis)..."
docker-compose up -d mongo redis

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
until docker-compose exec -T mongo mongosh --eval "print('MongoDB is ready')" > /dev/null 2>&1; do
    printf "."
    sleep 2
done
echo ""
echo "✅ MongoDB is ready"

# Wait for Redis to be ready  
echo "⏳ Waiting for Redis to be ready..."
until docker-compose exec -T redis redis-cli --no-auth-warning -a dev-redis-password ping > /dev/null 2>&1; do
    printf "."
    sleep 2
done
echo ""
echo "✅ Redis is ready"

# Start optional admin interfaces
echo "🖥️  Starting admin interfaces..."
docker-compose up -d mongo-express redis-commander

echo ""
echo "🎉 Infrastructure is ready!"
echo ""
echo "🔗 Service URLs:"
echo "- MongoDB Admin: http://localhost:8081 (admin/dev-admin)"
echo "- Redis Admin: http://localhost:8082 (admin/dev-admin)"
echo ""
echo "🔄 Next steps:"
echo "1. In another terminal: cd apps/server && pnpm install"
echo "2. Generate Prisma client: cd apps/server && pnpm prisma generate"
echo "3. Push database schema: cd apps/server && pnpm prisma db push"
echo "4. Start the server: cd apps/server && pnpm run dev"
echo ""
echo "Or run the server in Docker:"
echo "docker-compose up server" 