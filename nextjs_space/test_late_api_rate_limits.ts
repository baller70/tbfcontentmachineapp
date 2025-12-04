import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function testLateAPIRateLimits() {
  console.log('🔍 Testing Late API Rate Limit Endpoints\n');

  const LATE_API_KEY = process.env.LATE_API_KEY;
  
  if (!LATE_API_KEY) {
    console.error('❌ LATE_API_KEY not found');
    return;
  }

  try {
    // Try to get accounts first
    console.log('📋 Step 1: Fetching Late API accounts...');
    const accountsResponse = await axios.get('https://getlate.dev/api/v1/accounts', {
      headers: {
        'Authorization': `Bearer ${LATE_API_KEY}`
      }
    });

    console.log(`✅ Found ${accountsResponse.data.length} accounts\n`);
    
    for (const account of accountsResponse.data) {
      console.log(`\n📱 Profile: ${account.profile || account.name || 'Unnamed'}`);
      console.log(`   ID: ${account._id || account.id}`);
      console.log(`   Platform: ${account.platform}`);
      console.log(`   Username: ${account.username || account.handle || 'N/A'}`);
      
      // Check if rate limit info is in the account object
      if (account.rateLimit || account.dailyLimit || account.postsToday) {
        console.log(`   📊 Rate Limit Info:`);
        console.log(`      Posts Today: ${account.postsToday || 0}`);
        console.log(`      Daily Limit: ${account.dailyLimit || account.rateLimit || 8}`);
        console.log(`      Remaining: ${(account.dailyLimit || 8) - (account.postsToday || 0)}`);
      }
    }

    // Try to get posts to see if rate limit info is there
    console.log('\n\n📋 Step 2: Checking recent posts for rate limit data...');
    const postsResponse = await axios.get('https://getlate.dev/api/v1/posts?limit=5', {
      headers: {
        'Authorization': `Bearer ${LATE_API_KEY}`
      }
    });

    console.log(`✅ Fetched ${postsResponse.data.length} recent posts`);
    
    // Check response headers for rate limit info
    console.log('\n📋 Step 3: Checking API response headers...');
    console.log('Response Headers:', JSON.stringify(accountsResponse.headers, null, 2));

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
      console.error('   Headers:', JSON.stringify(error.response.headers, null, 2));
    }
  }
}

testLateAPIRateLimits().catch(console.error);
