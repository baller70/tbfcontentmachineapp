import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkDuplicates() {
  try {
    const LATE_API_KEY = process.env.LATE_API_KEY;
    
    console.log('🔍 Fetching all scheduled posts from Late API...\n');
    
    const response = await axios.get('https://getlate.dev/api/v1/posts?status=scheduled', {
      headers: {
        'Authorization': `Bearer ${LATE_API_KEY}`
      }
    });
    
    const posts = response.data.posts || response.data || [];
    console.log(`📊 Total scheduled posts: ${posts.length}\n`);
    
    // Group posts by scheduled date
    const postsByDate: Record<string, any[]> = {};
    
    posts.forEach((post: any) => {
      const scheduledDate = post.scheduledFor || post.scheduled_at || 'Unknown';
      const dateOnly = scheduledDate.split('T')[0]; // Get just the date part
      
      if (!postsByDate[dateOnly]) {
        postsByDate[dateOnly] = [];
      }
      postsByDate[dateOnly].push(post);
    });
    
    // Check for duplicates
    console.log('📅 Posts by Date:\n');
    const sortedDates = Object.keys(postsByDate).sort();
    let duplicatesFound = false;
    
    sortedDates.forEach(date => {
      const postsOnDate = postsByDate[date];
      if (postsOnDate.length > 1) {
        console.log(`❌ DUPLICATE on ${date}: ${postsOnDate.length} posts`);
        postsOnDate.forEach((post: any, index: number) => {
          console.log(`   ${index + 1}. ID: ${post._id}, Time: ${post.scheduledFor || post.scheduled_at}`);
        });
        duplicatesFound = true;
      } else {
        console.log(`✅ ${date}: 1 post (ID: ${postsOnDate[0]._id})`);
      }
    });
    
    if (!duplicatesFound) {
      console.log('\n✅ No duplicate posts found!');
    } else {
      console.log('\n⚠️  Duplicates detected! Need to delete extras.');
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total scheduled posts: ${posts.length}`);
    console.log(`   Unique dates: ${sortedDates.length}`);
    console.log(`   Expected posts: 26 (Nov 26 - Dec 21)`);
    console.log(`   Missing posts: ${26 - sortedDates.length}`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

checkDuplicates();
