import axios from 'axios';

async function triggerDaemon() {
  console.log('🔄 Triggering daemon to check for draft posts...\n');
  
  try {
    const response = await axios.post('http://localhost:3000/api/series/process', {}, {
      timeout: 120000
    });
    
    console.log('✅ Daemon executed successfully');
    console.log(`   Results: ${JSON.stringify(response.data, null, 2)}\n`);
    
    // Check Late API for newly scheduled post
    console.log('📊 Checking Late API for new scheduled post...');
    const lateResponse = await axios.get('https://getlate.dev/api/v1/posts', {
      headers: {
        'Authorization': `Bearer ${process.env.LATE_API_KEY}`
      }
    });
    
    const scheduledPosts = lateResponse.data.filter((p: any) => p.status === 'scheduled');
    console.log(`   Found ${scheduledPosts.length} scheduled posts in Late API`);
    
    if (scheduledPosts.length > 0) {
      console.log('\n✅ SUCCESS: Next post is now in Late API schedule');
      scheduledPosts.slice(0, 3).forEach((post: any) => {
        console.log(`   - Post: ${post._id || post.id}`);
        console.log(`     Status: ${post.status}`);
        console.log(`     Scheduled: ${post.scheduledAt || post.scheduledFor || 'N/A'}`);
      });
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

triggerDaemon();
