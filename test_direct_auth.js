import fetch from 'node-fetch';

// Test multiple credential combinations to find the working one
const testCredentials = [
  { key: "a8f5ee67abf84a3cf604ff16d2bdd1a", secret: "28d3f44b1604498ea6d29c44e01f858b", source: "image" },
  { key: process.env.SHIPSTATION_API_KEY, secret: process.env.SHIPSTATION_API_SECRET, source: "env" }
];

async function testAuth(apiKey, apiSecret, source) {
  if (!apiKey || !apiSecret) {
    console.log(`${source}: Missing credentials`);
    return false;
  }
  
  console.log(`\n=== Testing ${source} credentials ===`);
  console.log(`Key: ${apiKey}`);
  console.log(`Secret: ${apiSecret}`);
  
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  
  try {
    const response = await fetch('https://ssapi.shipstation.com/stores', {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'User-Agent': 'CityLifePharmacy/1.0'
      }
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`SUCCESS: Found ${data.length} stores`);
      console.log('Stores:', data.map(s => `${s.storeName} (${s.storeId})`));
      return true;
    } else {
      const error = await response.text();
      console.log(`Error: ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`Network error: ${error.message}`);
    return false;
  }
}

console.log('Testing ShipStation authentication...');

for (const creds of testCredentials) {
  const success = await testAuth(creds.key, creds.secret, creds.source);
  if (success) {
    console.log(`\n✅ Working credentials found: ${creds.source}`);
    process.exit(0);
  }
  await new Promise(resolve => setTimeout(resolve, 1000));
}

console.log('\n❌ No working credentials found');