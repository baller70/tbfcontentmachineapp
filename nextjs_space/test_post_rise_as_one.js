// Test posting to Facebook and YouTube for Rise As One profile
const fetch = require('node-fetch');

async function testPost() {
  try {
    const response = await fetch('http://localhost:3000/api/late/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'next-auth.session-token=test'  // You'll need a valid session token
      },
      body: JSON.stringify({
        profileId: 'cmh0y0rex0001quciaqymaebt', // Rise As One profile ID
        content: 'Test post for Facebook and YouTube - Rise As One AAU Basketball Team',
        platforms: ['facebook', 'youtube']
      })
    });

    const data = await response.json();
    console.log('\n=== API Response ===');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testPost();
