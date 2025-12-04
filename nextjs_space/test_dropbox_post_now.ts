
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function testDropboxPost() {
  try {
    console.log('🧪 Testing Dropbox Series Posting...\n');
    
    // Find the series
    const series = await prisma.postSeries.findFirst({
      where: {
        dropboxFolderId: { not: null },
        status: 'ACTIVE'
      }
    });
    
    if (!series) {
      throw new Error('No active Dropbox series found');
    }
    
    console.log(`✅ Found series: "${series.name}"`);
    console.log(`   Folder: ${series.dropboxFolderPath}`);
    console.log(`   Current Index: ${series.currentFileIndex}`);
    
    // Set nextScheduledAt to past to trigger processing
    console.log('\n🔄 Setting schedule to past...');
    await prisma.postSeries.update({
      where: { id: series.id },
      data: { nextScheduledAt: new Date(Date.now() - 60000) }
    });
    
    console.log('\n📤 Triggering series processing...');
    const response = await axios.post(
      'http://localhost:3000/api/series/process',
      {},
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000
      }
    );
    
    console.log('\n📊 Response:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Processed: ${response.data.processed} series`);
    
    if (response.data.results && response.data.results.length > 0) {
      response.data.results.forEach((result: any) => {
        console.log(`\n   ${result.success ? '✅' : '❌'} ${result.message}`);
        if (!result.success && result.error) {
          console.log(`      Error: ${result.error}`);
        }
      });
    }
    
    // Check if post was created
    console.log('\n🔍 Checking Late API for post...');
    const lateResponse = await axios.get('https://getlate.dev/api/v1/posts', {
      params: { limit: 5, sort: '-createdAt' },
      headers: { 'Authorization': `Bearer ${process.env.LATE_API_KEY}` }
    });
    
    const recentPosts = lateResponse.data.posts || [];
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentPost = recentPosts.find((post: any) => 
      new Date(post.createdAt) > fiveMinutesAgo
    );
    
    if (recentPost) {
      console.log('\n✅ Found recent post:');
      console.log(`   Post ID: ${recentPost._id}`);
      console.log(`   Status: ${recentPost.status}`);
      console.log(`   Platforms: ${recentPost.platforms?.join(', ')}`);
      console.log(`   Content: "${recentPost.content?.substring(0, 60)}..."`);
      
      if (recentPost.platformPosts) {
        console.log('\n   Platform Statuses:');
        Object.entries(recentPost.platformPosts).forEach(([platform, status]: [string, any]) => {
          console.log(`      ${platform}: ${status.status || 'unknown'}`);
          if (status.errorMessage) {
            console.log(`         Error: ${status.errorMessage}`);
          }
        });
      }
    } else {
      console.log('\n⚠️  No recent post found');
    }
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

testDropboxPost();
