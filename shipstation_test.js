// Comprehensive ShipStation API test
import fetch from 'node-fetch';

async function testShipStationCredentials(apiKey, apiSecret) {
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  
  console.log(`Testing credentials:`);
  console.log(`API Key: ${apiKey}`);
  console.log(`API Secret: ${apiSecret}`);
  console.log(`Auth header: Basic ${auth.substring(0, 20)}...`);
  
  try {
    // Test 1: Get stores
    console.log('\n=== Testing stores endpoint ===');
    const storesResponse = await fetch('https://ssapi.shipstation.com/stores', {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Stores response: ${storesResponse.status}`);
    if (storesResponse.ok) {
      const stores = await storesResponse.json();
      console.log(`Found ${stores.length} stores:`, stores.map(s => `${s.storeName} (${s.storeId})`));
    } else {
      const errorText = await storesResponse.text();
      console.log(`Stores error: ${errorText}`);
    }
    
    // Test 2: Get account info
    console.log('\n=== Testing account endpoint ===');
    const accountResponse = await fetch('https://ssapi.shipstation.com/accounts/listmodules', {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Account response: ${accountResponse.status}`);
    if (accountResponse.ok) {
      const account = await accountResponse.json();
      console.log('Account modules:', account);
    } else {
      const errorText = await accountResponse.text();
      console.log(`Account error: ${errorText}`);
    }
    
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Test current credentials
const apiKey = process.env.SHIPSTATION_API_KEY;
const apiSecret = process.env.SHIPSTATION_API_SECRET;

if (apiKey && apiSecret) {
  testShipStationCredentials(apiKey, apiSecret);
} else {
  console.log('No credentials found in environment');
}