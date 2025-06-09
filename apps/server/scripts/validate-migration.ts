import axios from 'axios';
import { diff } from 'json-diff';

interface TestCase {
  name: string;
  oldEndpoint: string;
  newEndpoint: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: any;
}

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// Test cases for validation
const testCases: TestCase[] = [
  // Agent CRUD
  {
    name: 'List agents',
    oldEndpoint: '/api/agents',
    newEndpoint: '/api/model/agent',
    method: 'GET'
  },
  {
    name: 'Get single agent',
    oldEndpoint: '/api/agents/{agentId}',
    newEndpoint: '/api/model/agent/{agentId}',
    method: 'GET'
  },
  
  // Mission CRUD
  {
    name: 'List available missions',
    oldEndpoint: '/api/missions/available',
    newEndpoint: '/api/model/mission?where={"status":"available"}',
    method: 'GET'
  },
  
  // Knowledge CRUD
  {
    name: 'List knowledge',
    oldEndpoint: '/api/knowledge',
    newEndpoint: '/api/model/knowledge',
    method: 'GET'
  },
  
  // Profile CRUD
  {
    name: 'Get profile',
    oldEndpoint: '/api/profiles/{profileId}',
    newEndpoint: '/api/model/profile/{profileId}',
    method: 'GET'
  }
];

async function compareEndpoints(testCase: TestCase, authToken?: string) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`Old: ${testCase.method} ${testCase.oldEndpoint}`);
  console.log(`New: ${testCase.method} ${testCase.newEndpoint}`);
  
  const headers = {
    'Authorization': authToken ? `Bearer ${authToken}` : '',
    'Content-Type': 'application/json',
    ...testCase.headers
  };
  
  try {
    // Make requests to both endpoints
    const [oldResponse, newResponse] = await Promise.all([
      axios({
        method: testCase.method,
        url: `${API_BASE}${testCase.oldEndpoint}`,
        data: testCase.body,
        headers,
        validateStatus: () => true // Don't throw on non-2xx
      }),
      axios({
        method: testCase.method,
        url: `${API_BASE}${testCase.newEndpoint}`,
        data: testCase.body,
        headers,
        validateStatus: () => true
      })
    ]);
    
    // Compare status codes
    if (oldResponse.status !== newResponse.status) {
      console.error(`❌ Status code mismatch: ${oldResponse.status} vs ${newResponse.status}`);
      return false;
    }
    
    // Compare response bodies
    const differences = diff(oldResponse.data, newResponse.data);
    
    if (differences) {
      console.error('❌ Response body mismatch:');
      console.log(JSON.stringify(differences, null, 2));
      return false;
    }
    
    console.log('✅ Responses match!');
    return true;
    
  } catch (error) {
    console.error('❌ Error during comparison:', error.message);
    return false;
  }
}

async function validateMigration() {
  console.log('🚀 Starting endpoint migration validation...\n');
  
  // Get auth token if needed
  const authToken = process.env.AUTH_TOKEN;
  
  let passed = 0;
  let failed = 0;
  
  // Run all test cases
  for (const testCase of testCases) {
    // Replace placeholders with actual IDs
    const processedCase = {
      ...testCase,
      oldEndpoint: testCase.oldEndpoint.replace('{agentId}', process.env.TEST_AGENT_ID || ''),
      newEndpoint: testCase.newEndpoint.replace('{agentId}', process.env.TEST_AGENT_ID || '')
    };
    
    const result = await compareEndpoints(processedCase, authToken);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Validation Summary:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All endpoints validated successfully! Safe to migrate.');
  } else {
    console.log('\n⚠️  Some endpoints have differences. Review before migrating.');
  }
}

// Helper to generate migration report
async function generateMigrationReport() {
  const report = {
    timestamp: new Date().toISOString(),
    endpoints: {
      total: testCases.length,
      validated: 0,
      failed: 0
    },
    recommendations: [] as string[]
  };
  
  // Add recommendations based on validation
  if (report.endpoints.failed > 0) {
    report.recommendations.push('Fix endpoint differences before full migration');
    report.recommendations.push('Consider keeping old endpoints during transition');
  } else {
    report.recommendations.push('Safe to proceed with migration');
    report.recommendations.push('Monitor error rates after switching');
  }
  
  return report;
}

// Run validation
if (require.main === module) {
  validateMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

export { compareEndpoints, validateMigration };