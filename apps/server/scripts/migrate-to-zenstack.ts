#!/usr/bin/env tsx
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Direct migration script - no backwards compatibility needed
 * This script will:
 * 1. Identify CRUD endpoints
 * 2. Generate a list of endpoints to delete
 * 3. Update route files
 * 4. Show which business logic endpoints need refactoring
 */

interface EndpointAnalysis {
  file: string;
  endpoints: {
    crud: string[];
    business: string[];
    keep: string[];
  };
}

// Patterns that indicate pure CRUD operations
const CRUD_PATTERNS = [
  /handleGet\w+/,
  /handleList\w+/,
  /handleCreate\w+/,
  /handleUpdate\w+/,
  /handleDelete\w+/,
  /handleFind\w+/,
];

// Patterns that indicate business logic
const BUSINESS_PATTERNS = [
  /handleJoin/,
  /handleComplete/,
  /handleDeploy/,
  /handleTransfer/,
  /handleShare/,
  /handleActivate/,
  /handleVerify/,
  /handleCompress/,
  /handleDecompress/,
  /handle\w+Status/,
  /handle\w+Progress/,
];

async function analyzeRouteFile(filePath: string): Promise<EndpointAnalysis> {
  const content = await fs.readFile(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  
  const analysis: EndpointAnalysis = {
    file: fileName,
    endpoints: {
      crud: [],
      business: [],
      keep: []
    }
  };
  
  // Find all route definitions
  const routeRegex = /router\.(get|post|patch|put|delete)\s*\(\s*['"`]([^'"`]+)['"`][^,]*,\s*([^,\s]+)\s*[,)]/g;
  
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const [fullMatch, method, routePath, handler] = match;
    const endpoint = `${method.toUpperCase()} ${routePath} -> ${handler}`;
    
    // Classify endpoint
    if (CRUD_PATTERNS.some(pattern => pattern.test(handler))) {
      analysis.endpoints.crud.push(endpoint);
    } else if (BUSINESS_PATTERNS.some(pattern => pattern.test(handler))) {
      analysis.endpoints.business.push(endpoint);
    } else {
      analysis.endpoints.keep.push(endpoint);
    }
  }
  
  return analysis;
}

async function generateMigrationPlan() {
  console.log('🚀 ZenStack Migration Plan\n');
  console.log('Since we\'re not in production, we can do a clean migration!\n');
  
  const routesDir = path.join(__dirname, '../src/routes');
  const files = await fs.readdir(routesDir);
  const routeFiles = files.filter(f => f.endsWith('.routes.ts') && !f.includes('zenstack'));
  
  const analyses: EndpointAnalysis[] = [];
  
  for (const file of routeFiles) {
    const analysis = await analyzeRouteFile(path.join(routesDir, file));
    analyses.push(analysis);
  }
  
  // Print summary
  let totalCrud = 0;
  let totalBusiness = 0;
  let totalKeep = 0;
  
  console.log('📊 Endpoint Analysis:\n');
  
  for (const analysis of analyses) {
    const crudCount = analysis.endpoints.crud.length;
    const businessCount = analysis.endpoints.business.length;
    const keepCount = analysis.endpoints.keep.length;
    
    totalCrud += crudCount;
    totalBusiness += businessCount;
    totalKeep += keepCount;
    
    if (crudCount > 0 || businessCount > 0) {
      console.log(`📁 ${analysis.file}`);
      
      if (crudCount > 0) {
        console.log(`  🗑️  ${crudCount} CRUD endpoints to DELETE`);
        analysis.endpoints.crud.forEach(e => console.log(`     - ${e}`));
      }
      
      if (businessCount > 0) {
        console.log(`  🔄 ${businessCount} business endpoints to REFACTOR`);
        analysis.endpoints.business.forEach(e => console.log(`     - ${e}`));
      }
      
      console.log('');
    }
  }
  
  console.log('📈 Summary:');
  console.log(`   🗑️  ${totalCrud} CRUD endpoints to delete`);
  console.log(`   🔄 ${totalBusiness} business endpoints to refactor`);
  console.log(`   ✅ ${totalKeep} endpoints to keep as-is`);
  console.log(`   💾 ${Math.round((totalCrud / (totalCrud + totalBusiness + totalKeep)) * 100)}% code reduction\n`);
  
  // Generate action items
  console.log('📝 Action Items:\n');
  console.log('1. DELETE these endpoint handlers:');
  
  const endpointsDir = path.join(__dirname, '../src/endpoints');
  const endpointFiles = await fs.readdir(endpointsDir);
  
  for (const file of endpointFiles) {
    if (file.endsWith('.endpoint.ts')) {
      const content = await fs.readFile(path.join(endpointsDir, file), 'utf-8');
      const hasCrud = CRUD_PATTERNS.some(pattern => pattern.test(content));
      if (hasCrud) {
        console.log(`   - src/endpoints/${file} (or remove CRUD handlers)`);
      }
    }
  }
  
  console.log('\n2. UPDATE these route files to remove CRUD routes:');
  for (const analysis of analyses) {
    if (analysis.endpoints.crud.length > 0) {
      console.log(`   - src/routes/${analysis.file}`);
    }
  }
  
  console.log('\n3. REFACTOR these endpoints to use enhanced Prisma:');
  for (const analysis of analyses) {
    if (analysis.endpoints.business.length > 0) {
      console.log(`   - src/routes/${analysis.file} (${analysis.endpoints.business.length} endpoints)`);
    }
  }
  
  console.log('\n4. UPDATE frontend to use auto-CRUD:');
  console.log('   - Replace /api/agents → /api/model/agent');
  console.log('   - Replace /api/missions → /api/model/mission');
  console.log('   - Replace /api/knowledge → /api/model/knowledge');
  console.log('   - etc.\n');
  
  // Generate migration commands
  console.log('🛠️  Quick Commands:\n');
  console.log('# Generate ZenStack client');
  console.log('pnpm run zenstack:generate\n');
  
  console.log('# Test auto-CRUD endpoints');
  console.log('curl http://localhost:3000/api/model/agent');
  console.log('curl http://localhost:3000/api/model/mission');
  console.log('curl http://localhost:3000/api/model/knowledge\n');
}

// Run the migration plan
generateMigrationPlan().catch(console.error);