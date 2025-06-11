import fetch from 'node-fetch';

// Test the exact credentials from the user's image
const API_KEY = "a8f5ee67abf84a3cf604ff16d2bdd1a";
const API_SECRET = "28d3f44b1604498ea6d29c44e01f858b";

async function comprehensiveTest() {
  console.log("=== CREDENTIAL VERIFICATION ===");
  console.log(`API Key: ${API_KEY}`);
  console.log(`API Secret: ${API_SECRET}`);
  console.log(`Key Length: ${API_KEY.length}`);
  console.log(`Secret Length: ${API_SECRET.length}`);
  
  const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');
  console.log(`Auth String: ${auth.substring(0, 30)}...`);
  
  // Test multiple endpoints to isolate the issue
  const endpoints = [
    { name: "Stores", url: "https://ssapi.shipstation.com/stores" },
    { name: "Account", url: "https://ssapi.shipstation.com/accounts" },
    { name: "Carriers", url: "https://ssapi.shipstation.com/carriers" }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n=== Testing ${endpoint.name} ===`);
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'User-Agent': 'City-Life-Pharmacy/1.0'
        }
      });
      
      console.log(`Status: ${response.status}`);
      console.log(`Headers: ${JSON.stringify([...response.headers])}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Success: ${JSON.stringify(data).substring(0, 200)}...`);
      } else {
        const errorText = await response.text();
        console.log(`Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`Network Error: ${error.message}`);
    }
    
    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

comprehensiveTest();