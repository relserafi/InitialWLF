// Debug script to check current credentials
const apiKey = process.env.SHIPSTATION_API_KEY;
const apiSecret = process.env.SHIPSTATION_API_SECRET;

console.log("Current API Key:", apiKey);
console.log("Current API Secret:", apiSecret);
console.log("API Key length:", apiKey?.length);
console.log("API Secret length:", apiSecret?.length);