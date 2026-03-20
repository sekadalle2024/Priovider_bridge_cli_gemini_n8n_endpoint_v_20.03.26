const axios = require('axios');

async function runTest() {
  const url = 'http://localhost:25809/api/providers/n8n/processor';
  const payload = {
    message: "Hello"
  };

  try {
    console.log('📡 Sending request (Literal "Hello") to:', url);
    const response = await axios.post(url, payload);
    console.log('✅ Status:', response.status);
    console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.error('❌ Error Status:', error.response.status);
      console.error('❌ Error Data:', error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

runTest();
