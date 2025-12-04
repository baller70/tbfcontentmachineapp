import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function checkBulkSeries() {
  try {
    console.log('🔍 Checking series configuration...\n');
    
    // Get the most recently created series
    const series = await prisma.postSeries.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        profile: true
      }
    });
    
    if (!series) {
      console.log('❌ No series found');
      return;
    }
    
    console.log('📋 Most Recent Series:');
    console.log(`   Name: ${series.name}`);
    console.log(`   Created: ${series.createdAt}`);
    console.log(`   Profile: ${series.profile?.name || 'Unknown'}`);
    console.log(`   Dropbox Path: ${series.dropboxFolderPath || 'Not set'}`);
    console.log(`   Current File Index: ${series.currentFileIndex || 1}`);
    console.log(`   Status: ${series.status}`);
    console.log(`   Auto Post: ${series.autoPost}`);
    console.log(`   Next Scheduled: ${series.nextScheduledAt}`);
    
    console.log('\n📊 Series Configuration:');
    console.log(`   Days: ${series.daysOfWeek.join(', ')}`);
    console.log(`   Time: ${series.timeOfDay}`);
    console.log(`   Timezone: ${series.timezone}`);
    console.log(`   Start Date: ${series.startDate}`);
    
    if (series.dropboxFolderPath) {
      console.log('\n🔄 Checking if bulk scheduling was triggered...');
      console.log('   (Checking for currentFileIndex > 1 would indicate bulk scheduling completed)');
      
      if (series.currentFileIndex && series.currentFileIndex > 1) {
        console.log(`   ✅ Bulk scheduling appears to have completed (currentFileIndex: ${series.currentFileIndex})`);
      } else {
        console.log(`   ⚠️  Bulk scheduling may not have completed (currentFileIndex: ${series.currentFileIndex || 1})`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBulkSeries();
