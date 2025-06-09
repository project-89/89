#!/usr/bin/env tsx
import { promises as fs } from 'fs';
import path from 'path';

/**
 * More accurate endpoint categorization based on actual code analysis
 */

// Pure CRUD handlers - can be replaced by auto-CRUD
const PURE_CRUD_HANDLERS = [
  // Agent
  'handleGetAgent',
  'handleListAgents',
  'handleUpdateAgent',
  
  // Capability
  'handleCreateCapability',
  'handleGetCapabilities',
  'handleUpdateCapability',
  'handleDeleteCapability',
  
  // Notification
  'handleGetNotification',
  'handleListNotifications',
  'handleDeleteNotification',
  
  // Profile
  'handleGetProfile',
  'handleListProfiles',
  'handleUpdateProfile',
  
  // Knowledge
  'handleGetKnowledge',
  'handleListKnowledge',
  'handleDeleteKnowledge',
  
  // Stats
  'handleGetStats',
  
  // Visit
  'handleGetSite',
  'handleListSites',
  
  // Price
  'handleGetPrices',
  
  // Video
  'handleGetVideo',
  'handleListVideos',
  'handleDeleteVideo',
];

// Business logic handlers - need refactoring to use enhanced Prisma
const BUSINESS_LOGIC_HANDLERS = [
  // Agent
  'handleRegisterAgent',
  'handleUpdateAgentState',
  'handleGetAgentsByCapability',
  'handleActivateAgent',
  
  // Mission
  'handleGetAvailableMissions',
  'handleGetActiveMissions',
  'handleUpdateMissionStatus',
  'handleAddFailureRecord',
  'handleJoinMission',
  
  // Knowledge
  'handleCompressKnowledge',
  'handleDecompressKnowledge',
  'handleShareKnowledge',
  'handleTransferKnowledge',
  
  // Training
  'handleDeployToMission',
  'handleCompleteDeployment',
  'handleGetDeploymentProgress',
  
  // Tag
  'handleTagUser',
  'handleGetLeaderboard',
  
  // Capability
  'handleFindSimilarSkills',
  
  // Stats
  'handleRecordHistory',
  'handleCalculateSuccessRate',
  
  // Social/Complex
  'handleVerifyMission',
  'handleCompleteOnboarding',
];

async function analyzeEndpoints() {
  console.log('🎯 Accurate Endpoint Analysis\n');
  
  const routesDir = path.join(__dirname, '../src/routes');
  const endpointsDir = path.join(__dirname, '../src/endpoints');
  
  let totalCrud = 0;
  let totalBusiness = 0;
  let totalUnknown = 0;
  
  // Analyze each route file
  const routeFiles = await fs.readdir(routesDir);
  
  for (const file of routeFiles) {
    if (!file.endsWith('.routes.ts') || file.includes('zenstack')) continue;
    
    const content = await fs.readFile(path.join(routesDir, file), 'utf-8');
    
    // Extract all handlers
    const handlerRegex = /handle\w+/g;
    const handlers = [...new Set(content.match(handlerRegex) || [])];
    
    if (handlers.length === 0) continue;
    
    const crud = handlers.filter(h => PURE_CRUD_HANDLERS.includes(h));
    const business = handlers.filter(h => BUSINESS_LOGIC_HANDLERS.includes(h));
    const unknown = handlers.filter(h => !PURE_CRUD_HANDLERS.includes(h) && !BUSINESS_LOGIC_HANDLERS.includes(h));
    
    totalCrud += crud.length;
    totalBusiness += business.length;
    totalUnknown += unknown.length;
    
    console.log(`📁 ${file}`);
    if (crud.length > 0) {
      console.log(`  🗑️  ${crud.length} CRUD handlers (delete these):`);
      crud.forEach(h => console.log(`     - ${h}`));
    }
    if (business.length > 0) {
      console.log(`  🔄 ${business.length} business handlers (refactor these):`);
      business.forEach(h => console.log(`     - ${h}`));
    }
    if (unknown.length > 0) {
      console.log(`  ❓ ${unknown.length} uncategorized handlers:`);
      unknown.forEach(h => console.log(`     - ${h}`));
    }
    console.log('');
  }
  
  console.log('📊 Summary:');
  console.log(`  🗑️  ${totalCrud} pure CRUD handlers → Delete`);
  console.log(`  🔄 ${totalBusiness} business logic handlers → Refactor`);
  console.log(`  ❓ ${totalUnknown} uncategorized handlers → Review`);
  
  const total = totalCrud + totalBusiness + totalUnknown;
  console.log(`  💾 ${Math.round((totalCrud / total) * 100)}% can be auto-generated\n`);
  
  // Generate specific actions
  console.log('🎬 Action Plan:\n');
  
  console.log('1️⃣ IMMEDIATE: Delete these CRUD handlers from endpoint files:');
  PURE_CRUD_HANDLERS.slice(0, 10).forEach(h => {
    console.log(`   - ${h}`);
  });
  if (PURE_CRUD_HANDLERS.length > 10) {
    console.log(`   ... and ${PURE_CRUD_HANDLERS.length - 10} more\n`);
  }
  
  console.log('\n2️⃣ REFACTOR: Update these to use enhanced Prisma:');
  console.log('   Example before:');
  console.log('   ```');
  console.log('   const agent = await agentService.getAgent(id);');
  console.log('   if (agent.accountId !== req.auth.accountId) throw new Error();');
  console.log('   ```');
  console.log('   Example after:');
  console.log('   ```');
  console.log('   const db = getEnhancedPrisma(req);');
  console.log('   const agent = await db.agent.findUnique({ where: { id } });');
  console.log('   // Access control handled automatically!');
  console.log('   ```\n');
  
  console.log('3️⃣ FRONTEND: Update API calls:');
  console.log('   - GET /api/agents/:id → GET /api/model/agent/:id');
  console.log('   - POST /api/agents → POST /api/model/agent');
  console.log('   - GET /api/missions → GET /api/model/mission');
  console.log('   - etc.\n');
  
  console.log('4️⃣ CLEANUP: Remove these middleware after refactoring:');
  console.log('   - verifyAccountOwnership');
  console.log('   - Manual permission checks in handlers\n');
}

// Run analysis
analyzeEndpoints().catch(console.error);