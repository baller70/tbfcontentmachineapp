
/**
 * Check YouTube Post Status on Late API
 */

import * as dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkYouTubePosts() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 CHECKING YOUTUBE POST STATUS ON LATE API');
  console.log('='.repeat(80) + '\n');

  const lateApiKey = process.env.LATE_API_KEY;
  if (!lateApiKey) {
    console.error('❌ LATE_API_KEY not configured');
    return;
  }

  // Post IDs from the test
  const postIds = [
    '6920b18f4e5f1b000c098971', // Instant post
    '6920b1961802936bffa618db'  // Scheduled post
  ];

  console.log('📋 Checking status of test posts...\n');

  for (const postId of postIds) {
    try {
      console.log(`\n🔍 Checking Post ID: ${postId}`);
      console.log('-'.repeat(80));

      const response = await axios.get(`https://getlate.dev/api/v1/posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${lateApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`\n✅ Post Found!`);
      console.log(JSON.stringify(response.data, null, 2));

    } catch (error: any) {
      console.error(`\n❌ Error checking post ${postId}:`);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
      } else {
        console.error(`   Error: ${error.message}`);
      }
    }
  }

  // Also check all recent posts for this account
  console.log('\n\n' + '='.repeat(80));
  console.log('📋 CHECKING ALL RECENT POSTS');
  console.log('='.repeat(80) + '\n');

  try {
    const response = await axios.get('https://getlate.dev/api/v1/posts', {
      headers: {
        'Authorization': `Bearer ${lateApiKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 10,
        sort: '-createdAt'
      }
    });

    console.log(`Found ${response.data.posts?.length || 0} recent posts:\n`);
    
    if (response.data.posts && response.data.posts.length > 0) {
      for (const post of response.data.posts) {
        console.log(`\n📝 Post ID: ${post._id || post.id}`);
        console.log(`   Status: ${post.status}`);
        console.log(`   Platforms: ${JSON.stringify(post.platforms || [])}`);
        console.log(`   Created: ${post.createdAt}`);
        if (post.scheduledAt) {
          console.log(`   Scheduled: ${post.scheduledAt}`);
        }
        console.log(`   Content: ${post.content?.substring(0, 60)}...`);
        
        // Check if it has platformPosts (actual posting status per platform)
        if (post.platformPosts && post.platformPosts.length > 0) {
          console.log(`   Platform Posts:`);
          for (const pp of post.platformPosts) {
            console.log(`      - ${pp.platform}: ${pp.status} ${pp.error ? `(Error: ${pp.error})` : ''}`);
            if (pp.externalId) {
              console.log(`        External ID: ${pp.externalId}`);
            }
          }
        }
      }
    } else {
      console.log('No recent posts found.');
    }

  } catch (error: any) {
    console.error('\n❌ Error fetching recent posts:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

checkYouTubePosts().catch(console.error);
