import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Finding the most recent series...\n');
    
    const series = await prisma.postSeries.findFirst({
      where: {
        status: 'ACTIVE',
        dropboxFolderPath: { not: null }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!series) {
      console.log('❌ No active series with Dropbox folder found');
      return;
    }
    
    console.log(`✅ Found series: ${series.name}`);
    console.log(`   ID: ${series.id}`);
    console.log(`   Current File Index: ${series.currentFileIndex}`);
    console.log(`   Dropbox Path: ${series.dropboxFolderPath}`);
    console.log(`   Created: ${series.createdAt}`);
    console.log(`   Updated: ${series.updatedAt}`);
    
    // Check Late API for posts related to this series
    console.log(`\n🔍 Checking Late API for posts created around the series creation time...\n`);
    
    const seriesCreatedAt = new Date(series.createdAt);
    const tenMinutesBeforeCreation = new Date(seriesCreatedAt.getTime() - 10 * 60 * 1000);
    const tenMinutesAfterCreation = new Date(seriesCreatedAt.getTime() + 30 * 60 * 1000);
    
    const lateResponse = await axios.get('https://getlate.dev/api/v1/posts', {
      headers: {
        'Authorization': `Bearer ${process.env.LATE_API_KEY}`
      },
      params: {
        limit: 100,
        page: 1
      }
    });
    
    const allPosts = lateResponse.data.data || lateResponse.data.posts || [];
    
    const postsInWindow = allPosts.filter((post: any) => {
      const postCreatedAt = new Date(post.createdAt);
      return postCreatedAt >= tenMinutesBeforeCreation && postCreatedAt <= tenMinutesAfterCreation;
    });
    
    console.log(`Total posts in Late API: ${allPosts.length}`);
    console.log(`Posts created in the 10-minute window around series creation: ${postsInWindow.length}`);
    
    if (postsInWindow.length > 0) {
      console.log(`\n📊 Posts created around series creation time:\n`);
      postsInWindow.forEach((post: any, index: number) => {
        console.log(`[${index + 1}] Post ID: ${post.id}`);
        console.log(`   Status: ${post.status}`);
        console.log(`   Created: ${post.createdAt}`);
        console.log(`   Scheduled: ${post.scheduledFor || 'immediate'}`);
        console.log(`   Content: ${(post.content || '').substring(0, 60)}...`);
        console.log();
      });
    } else {
      console.log('\n⚠️  No posts found in the expected time window!');
      console.log(`\nThis suggests the bulk scheduling may have failed silently.`);
    }
    
    // Show the most recent 10 posts
    console.log(`\n📋 Most recent 10 posts in Late API:\n`);
    allPosts.slice(0, 10).forEach((post: any, index: number) => {
      console.log(`[${index + 1}] Post ID: ${post.id}`);
      console.log(`   Status: ${post.status}`);
      console.log(`   Created: ${post.createdAt}`);
      console.log(`   Scheduled: ${post.scheduledFor || 'immediate'}`);
      console.log(`   Content: ${(post.content || '').substring(0, 60)}...`);
      console.log();
    });
    
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
