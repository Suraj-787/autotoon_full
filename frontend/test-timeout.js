// Test script to verify axios timeout configuration
const axios = require('axios');

const api = axios.create({
  baseURL: "http://localhost:3001",
  timeout: 600000, // 10 minutes timeout
  headers: {
    "Content-Type": "application/json",
  },
});

console.log('Axios timeout configured to:', api.defaults.timeout, 'ms');
console.log('That is', Math.round(api.defaults.timeout / 1000 / 60), 'minutes');

// Test with a simple request
api.post("/api/images", {
  prompts: ["Test prompt"],
  sessionId: "test"
}, {
  timeout: 600000 // explicit timeout
}).then(response => {
  console.log('Request successful:', response.status);
}).catch(error => {
  if (error.code === 'ECONNABORTED') {
    console.log('Request timed out after:', error.config.timeout, 'ms');
  } else {
    console.log('Request failed:', error.message);
  }
});
