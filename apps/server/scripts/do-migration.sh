#!/bin/bash

echo "🚀 Starting ZenStack Migration (Direct Replacement)"
echo ""

# Step 1: Generate ZenStack client
echo "1️⃣ Generating ZenStack client..."
pnpm run zenstack:generate

# Step 2: Backup current files (just in case)
echo ""
echo "2️⃣ Creating backups..."
mkdir -p .migration-backup/routes
mkdir -p .migration-backup/endpoints
cp -r src/routes/*.ts .migration-backup/routes/
cp -r src/endpoints/*.ts .migration-backup/endpoints/

# Step 3: Show what will be deleted
echo ""
echo "3️⃣ CRUD handlers to delete:"
echo "   - handleGetAgent, handleListAgents, handleUpdateAgent"
echo "   - handleCreateCapability, handleGetCapabilities, handleUpdateCapability, handleDeleteCapability"
echo "   - handleGetNotification, handleDeleteNotification"
echo "   - handleGetProfile, handleUpdateProfile"
echo "   - handleGetKnowledge, handleListKnowledge, handleDeleteKnowledge"
echo "   - handleGetStats"
echo "   - handleGetVideo, handleDeleteVideo"

echo ""
echo "4️⃣ Next steps:"
echo ""
echo "   a) Delete CRUD handlers from endpoint files"
echo "   b) Remove CRUD routes from route files"
echo "   c) Update business logic handlers to use getEnhancedPrisma(req)"
echo "   d) Test auto-CRUD endpoints:"
echo "      curl http://localhost:3000/api/model/agent"
echo "      curl http://localhost:3000/api/model/mission"
echo "      curl http://localhost:3000/api/model/knowledge"
echo ""
echo "   e) Update frontend API calls:"
echo "      /api/agents → /api/model/agent"
echo "      /api/missions → /api/model/mission"
echo "      /api/knowledge → /api/model/knowledge"
echo ""
echo "📁 Backups saved to .migration-backup/"
echo ""
echo "✅ Ready to migrate! Start by updating agent.routes.ts and agent.endpoint.ts"