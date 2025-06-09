import { promises as fs } from 'fs';
import path from 'path';

interface EndpointInfo {
  file: string;
  method: string;
  path: string;
  handler: string;
  complexity: 'CRUD' | 'BUSINESS' | 'AGGREGATION';
  canReplace: boolean;
  notes: string;
}

async function analyzeEndpoint(content: string, file: string): Promise<EndpointInfo[]> {
  const endpoints: EndpointInfo[] = [];
  
  // Match route definitions
  const routePattern = /router\.(get|post|patch|put|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  const handlerPattern = /handle(\w+)/g;
  
  let match;
  while ((match = routePattern.exec(content)) !== null) {
    const [, method, routePath] = match;
    
    // Try to find handler name
    const lineContent = content.substring(match.index, match.index + 200);
    const handlerMatch = handlerPattern.exec(lineContent);
    const handler = handlerMatch ? handlerMatch[0] : 'unknown';
    
    // Analyze complexity
    let complexity: EndpointInfo['complexity'] = 'CRUD';
    let canReplace = true;
    let notes = '';
    
    // Check for complex patterns
    if (content.includes('$transaction') || content.includes('aggregate')) {
      complexity = 'AGGREGATION';
      canReplace = false;
      notes = 'Contains transactions or aggregations';
    } else if (
      handler.includes('Join') ||
      handler.includes('Complete') ||
      handler.includes('Deploy') ||
      handler.includes('Transfer') ||
      handler.includes('Share') ||
      handler.includes('Activate')
    ) {
      complexity = 'BUSINESS';
      canReplace = false;
      notes = 'Complex business logic';
    } else if (
      handler.includes('Create') ||
      handler.includes('Update') ||
      handler.includes('Delete') ||
      handler.includes('Get') ||
      handler.includes('List') ||
      handler.includes('Find')
    ) {
      complexity = 'CRUD';
      canReplace = true;
      notes = 'Pure CRUD - can use auto-endpoints';
    }
    
    endpoints.push({
      file: path.basename(file),
      method: method.toUpperCase(),
      path: routePath,
      handler,
      complexity,
      canReplace,
      notes
    });
  }
  
  return endpoints;
}

async function auditEndpoints() {
  console.log('🔍 Auditing endpoints...\n');
  
  const routesDir = path.join(__dirname, '../src/routes');
  const endpointsDir = path.join(__dirname, '../src/endpoints');
  
  const allEndpoints: EndpointInfo[] = [];
  
  // Scan route files
  const routeFiles = await fs.readdir(routesDir);
  for (const file of routeFiles) {
    if (file.endsWith('.routes.ts')) {
      const content = await fs.readFile(path.join(routesDir, file), 'utf-8');
      const endpoints = await analyzeEndpoint(content, file);
      allEndpoints.push(...endpoints);
    }
  }
  
  // Group by complexity
  const crudEndpoints = allEndpoints.filter(e => e.complexity === 'CRUD');
  const businessEndpoints = allEndpoints.filter(e => e.complexity === 'BUSINESS');
  const aggregationEndpoints = allEndpoints.filter(e => e.complexity === 'AGGREGATION');
  
  // Print summary
  console.log('📊 Summary:');
  console.log(`Total endpoints: ${allEndpoints.length}`);
  console.log(`CRUD endpoints (replaceable): ${crudEndpoints.length}`);
  console.log(`Business logic endpoints: ${businessEndpoints.length}`);
  console.log(`Aggregation endpoints: ${aggregationEndpoints.length}`);
  console.log('\n');
  
  // Print CRUD endpoints that can be replaced
  if (crudEndpoints.length > 0) {
    console.log('✅ CRUD Endpoints (Can be replaced with auto-CRUD):');
    console.log('─'.repeat(80));
    crudEndpoints.forEach(e => {
      console.log(`${e.method.padEnd(6)} ${e.path.padEnd(30)} → /api/model/${getModelName(e.path)}`);
    });
    console.log('\n');
  }
  
  // Print business logic endpoints
  if (businessEndpoints.length > 0) {
    console.log('🔄 Business Logic Endpoints (Need refactoring):');
    console.log('─'.repeat(80));
    businessEndpoints.forEach(e => {
      console.log(`${e.method.padEnd(6)} ${e.path.padEnd(30)} ${e.notes}`);
    });
    console.log('\n');
  }
  
  // Print aggregation endpoints
  if (aggregationEndpoints.length > 0) {
    console.log('📊 Aggregation Endpoints (Keep & enhance):');
    console.log('─'.repeat(80));
    aggregationEndpoints.forEach(e => {
      console.log(`${e.method.padEnd(6)} ${e.path.padEnd(30)} ${e.notes}`);
    });
    console.log('\n');
  }
  
  // Calculate potential code reduction
  const codeReduction = Math.round((crudEndpoints.length / allEndpoints.length) * 100);
  console.log(`💡 Potential code reduction: ${codeReduction}% of endpoints can be auto-generated`);
  
  // Generate migration checklist
  console.log('\n📝 Migration Checklist:');
  console.log('1. [ ] Generate ZenStack client: pnpm run zenstack:generate');
  console.log('2. [ ] Test auto-CRUD endpoints for each model');
  console.log('3. [ ] Update frontend to use new endpoints');
  console.log('4. [ ] Refactor business logic endpoints to use enhanced Prisma');
  console.log('5. [ ] Remove deprecated CRUD endpoints');
  console.log('6. [ ] Update API documentation');
}

function getModelName(path: string): string {
  // Extract model name from path
  const parts = path.split('/').filter(p => p && p !== ':id');
  const modelMap: Record<string, string> = {
    'agents': 'agent',
    'missions': 'mission',
    'knowledge': 'knowledge',
    'profiles': 'profile',
    'stats': 'stats',
    'tags': 'tag',
    'videos': 'video',
    'notifications': 'notification'
  };
  
  const key = parts[1] || parts[0];
  return modelMap[key] || key;
}

// Run the audit
auditEndpoints().catch(console.error);