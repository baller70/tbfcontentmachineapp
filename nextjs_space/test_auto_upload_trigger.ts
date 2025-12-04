import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function testAutoUpload() {
  try {
    console.log('\n🧪 TESTING AUTO-UPLOAD TRIGGER\n');
    console.log('=' .repeat(80));
    
    // 1. Find the series
    const series = await prisma.postSeries.findFirst({
      where: {
        name: { contains: 'MOTIVATIONAL', mode: 'insensitive' },
        status: 'ACTIVE'
      },
      include: {
        profile: {
          include: { platformSettings: true }
        }
      }
    });

    if (!series) {
      console.log('❌ No active series found');
      return;
    }

    console.log(`✅ Found series: ${series.name}`);
    console.log(`   Current file index: ${series.currentFileIndex}`);
    console.log(`   Current Late Post ID: ${series.currentLatePostId || 'NONE'}`);
    
    // 2. Check current post status in Late API
    if (series.currentLatePostId) {
      console.log(`\n🔍 Checking status of current post: ${series.currentLatePostId}`);
      
      try {
        const response = await axios.get(
          `https://getlate.dev/api/v1/posts/${series.currentLatePostId}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.LATE_API_KEY}`
            }
          }
        );
        
        const status = response.data.status || 'unknown';
        console.log(`   📊 Current post status: ${status}`);
        
        if (status === 'scheduled') {
          console.log('   ⏳ Post is still scheduled - no action needed');
          console.log('   💡 Move this post to DRAFT in Late API to trigger next post');
        } else {
          console.log(`   ✅ Post is ${status} - should trigger next post`);
          console.log('\n🚀 Manually triggering series processor...');
          
          // Import and call the processor
          const { processCloudStorageSeries } = await import('./lib/cloud-storage-series-processor');
          const result = await processCloudStorageSeries(series.id);
          
          console.log('\n📊 RESULT:');
          console.log(`   Success: ${result.success}`);
          console.log(`   Message: ${result.message}`);
          if (result.error) {
            console.log(`   Error: ${result.error}`);
          }
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log('   ❌ Post not found (deleted) - will trigger next post');
          
          console.log('\n🚀 Manually triggering series processor...');
          const { processCloudStorageSeries } = await import('./lib/cloud-storage-series-processor');
          const result = await processCloudStorageSeries(series.id);
          
          console.log('\n📊 RESULT:');
          console.log(`   Success: ${result.success}`);
          console.log(`   Message: ${result.message}`);
          if (result.error) {
            console.log(`   Error: ${result.error}`);
          }
        } else {
          throw error;
        }
      }
    } else {
      console.log('\n⚠️  No current Late Post ID - series needs initial post');
      console.log('🚀 Creating first post...');
      
      const { scheduleFirstSeriesPost } = await import('./lib/cloud-storage-series-processor');
      const result = await scheduleFirstSeriesPost(series.id);
      
      console.log('\n📊 RESULT:');
      console.log(`   Success: ${result.success}`);
      console.log(`   Message: ${result.message}`);
      if (result.latePostId) {
        console.log(`   Late Post ID: ${result.latePostId}`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
    
    // 3. Check updated series state
    const updatedSeries = await prisma.postSeries.findUnique({
      where: { id: series.id }
    });
    
    console.log('\n📋 UPDATED SERIES STATE:');
    console.log(`   Current file index: ${updatedSeries?.currentFileIndex}`);
    console.log(`   Current Late Post ID: ${updatedSeries?.currentLatePostId || 'NONE'}`);
    console.log(`   Next scheduled: ${updatedSeries?.nextScheduledAt?.toLocaleString('en-US', { timeZone: 'America/New_York' })}`);
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testAutoUpload();
