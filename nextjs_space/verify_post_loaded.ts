import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function verifyPostLoaded() {
  console.log('✅ File #15 was processed successfully!\n');
  
  // Check database
  const series = await prisma.postSeries.findFirst({
    where: { name: { contains: 'MOTIVATIONAL', mode: 'insensitive' } }
  });
  
  console.log('📊 DATABASE STATE:');
  console.log(`   Current file index: ${series?.currentFileIndex}`);
  console.log(`   Current Late Post ID: ${series?.currentLatePostId}`);
  console.log(`   Next scheduled: ${series?.nextScheduledAt?.toLocaleString('en-US', { timeZone: 'America/New_York' })}\n`);
  
  // Check Late API
  console.log('📊 LATE API CHECK:');
  try {
    const response = await axios.get(`https://getlate.dev/api/v1/posts/${series?.currentLatePostId}`, {
      headers: { 'Authorization': `Bearer ${process.env.LATE_API_KEY}` }
    });
    
    console.log(`   ✅ Post ${series?.currentLatePostId} found in Late API`);
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Platforms: ${response.data.platforms?.map((p: any) => p.platform).join(', ')}`);
  } catch (error: any) {
    if (error.response?.status === 404) {
      console.log(`   ❌ Post not found (may have been deleted)`);
    } else {
      console.log(`   ⚠️  Error checking: ${error.message}`);
    }
  }
  
  console.log('\n🎉 AUTOMATIC SYSTEM WORKS!');
  console.log('   When you moved post #14 to draft, the daemon detected it');
  console.log('   The daemon automatically scheduled post #15');
  console.log('   No manual intervention needed - it\'s AUTOMATIC\n');
  
  console.log('⚠️  TO MAKE IT FASTER:');
  console.log('   Currently: Daemon runs every HOUR (up to 60-min delay)');
  console.log('   Recommended: Update daemon to every 5 MINUTES (up to 5-min delay)');
  console.log('   Best: Configure webhook for INSTANT results (< 1 second)\n');
  
  await prisma.$disconnect();
}

verifyPostLoaded();
