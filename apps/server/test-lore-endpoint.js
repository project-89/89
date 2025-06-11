const fetch = require('node-fetch');

async function testLoreEndpoint() {
  const API_URL = 'http://localhost:3001/api';
  
  // Test data
  const testNftIds = ['1', '2', '3', '4', '5'];
  
  try {
    // First, we need to get an auth token (simulate login)
    console.log('Testing batch available lore endpoint...');
    
    // For testing purposes, we'll simulate the request structure
    const requestBody = {
      nftIds: testNftIds
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    // Note: In a real test, you'd need to include authentication headers
    // For now, this shows the expected request/response structure
    console.log('\nExpected response structure:');
    console.log(JSON.stringify({
      "1": { hasUnclaimedLore: true, unclaimedCount: 2 },
      "2": { hasUnclaimedLore: false, unclaimedCount: 0 },
      "3": { hasUnclaimedLore: true, unclaimedCount: 1 },
      "4": { hasUnclaimedLore: false, unclaimedCount: 0 },
      "5": { hasUnclaimedLore: true, unclaimedCount: 3 }
    }, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLoreEndpoint();