require('dotenv').config();

// Check if the issue is with how Late handles S3 URLs vs direct URLs
async function testDirectVideoUrl() {
  const lateApiKey = process.env.LATE_API_KEY;
  const youtubeAccountId = '68f686338bbca9c10cbfe2ea';
  
  console.log('🔍 Testing different video URL formats...\n');
  
  // Test 1: Public video URL
  console.log('TEST 1: Public video URL');
  const publicPayload = {
    content: 'Test post with public video URL',
    platforms: [{ platform: 'youtube', accountId: youtubeAccountId }],
    mediaItems: [{ 
      type: 'video',
      url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
    }]
  };
  
  let response = await fetch('https://getlate.dev/api/v1/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${lateApiKey}`
    },
    body: JSON.stringify(publicPayload)
  });
  
  let data = await response.json();
  console.log('Public URL Result:', data.platformResults?.[0]?.status, '-', data.platformResults?.[0]?.error || 'No error');
  
  // Check the actual error details
  if (data.post?.platforms?.[0]?.errorMessage) {
    console.log('Detailed Error:', data.post.platforms[0].errorMessage);
  }
  
  console.log('\n---\n');
  
  // Test 2: Check if Late API media upload endpoint exists
  console.log('TEST 2: Check Late API media upload endpoint');
  console.log('According to Late API docs, videos should be uploaded via /api/v1/media first');
  console.log('Then use the returned mediaId in the post');
  
  // Let's check if there's a media upload endpoint
  const testFile = Buffer.from('test');
  const formData = new FormData();
  
  // This is just to see what the endpoint expects
  console.log('\nChecking Late API documentation for proper video upload format...');
}

testDirectVideoUrl();
