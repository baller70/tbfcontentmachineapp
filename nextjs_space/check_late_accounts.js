require('dotenv').config();
const axios = require('axios');

async function checkLateAccounts() {
  try {
    console.log('\n🔍 CHECKING LATE API ACCOUNTS\n');
    console.log('='.repeat(80));
    
    const response = await axios.get('https://getlate.dev/api/v1/accounts', {
      headers: {
        'Authorization': `Bearer ${process.env.LATE_API_KEY}`
      }
    });
    
    console.log('\n✅ Connected Accounts:');
    
    for (const account of response.data.accounts) {
      console.log(`\n📱 ${account.platform.toUpperCase()}`);
      console.log(`   Account ID: ${account.id}`);
      console.log(`   Username: ${account.username || account.name || 'N/A'}`);
      console.log(`   Connected: ${account.isConnected}`);
      
      // Try to identify which profile this belongs to
      if (account.name && account.name.toLowerCase().includes('basketball')) {
        console.log(`   ➡️  Likely belongs to: Basketball Factory`);
      } else if (account.name && account.name.toLowerCase().includes('rise')) {
        console.log(`   ➡️  Likely belongs to: Rise as One`);
      }
    }
    
    // Now check posts from last 24 hours
    console.log('\n\n📊 CHECKING RECENT POSTS (Last 24 hours)\n');
    console.log('='.repeat(80));
    
    const postsResponse = await axios.get('https://getlate.dev/api/v1/posts', {
      headers: {
        'Authorization': `Bearer ${process.env.LATE_API_KEY}`
      },
      params: {
        limit: 100
      }
    });
    
    const now = Date.now();
    const yesterday = now - (24 * 60 * 60 * 1000);
    
    const recentPosts = postsResponse.data.posts.filter(post => {
      const createdAt = new Date(post.createdAt).getTime();
      return createdAt > yesterday;
    });
    
    console.log(`\nTotal posts in last 24h: ${recentPosts.length}`);
    
    // Group by platform
    const platformCounts = {};
    
    for (const post of recentPosts) {
      for (const platform of post.platforms) {
        const key = `${platform.platform}-${platform.accountId}`;
        if (!platformCounts[key]) {
          platformCounts[key] = {
            platform: platform.platform,
            accountId: platform.accountId,
            count: 0
          };
        }
        platformCounts[key].count++;
      }
    }
    
    console.log('\n📈 Posts per Platform/Account (Last 24h):');
    for (const [key, data] of Object.entries(platformCounts)) {
      console.log(`   ${data.platform} (${data.accountId}): ${data.count} posts`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkLateAccounts();
