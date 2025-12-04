import { prisma } from '../lib/db';
import { processCloudStorageSeries } from '../lib/cloud-storage-series-processor';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] 🔄 Checking for scheduled series to process...`);

  try {
    console.log('🚀 Starting series processing...');
    
    // Get all active Dropbox series that are due
    const now = new Date();
    const series = await prisma.postSeries.findMany({
      where: {
        status: 'ACTIVE',
        dropboxFolderId: { not: null },
        nextScheduledAt: {
          lte: now,
        },
      },
      include: {
        user: true,
        company: true,
      },
    });

    console.log(`📋 Found ${series.length} Dropbox series to process`);

    if (series.length === 0) {
      console.log('✅ No series ready to process at this time');
      return [];
    }

    const results = [];

    for (const s of series) {
      try {
        console.log(`\n🔄 Processing series: ${s.name} (ID: ${s.id})`);
        
        if (!s.dropboxFolderId) {
          console.log(`⚠️  Series ${s.name} has no Dropbox folder, skipping`);
          continue;
        }

        if (!s.prompt) {
          console.log(`⚠️  Series ${s.name} has no prompt, skipping`);
          continue;
        }
        
        // Use the unified cloud storage processor
        const result = await processCloudStorageSeries(s.id);
        
        results.push({
          seriesId: s.id,
          seriesName: s.name,
          success: result.success,
          message: result.message,
          error: result.error,
        });
        
      } catch (error: any) {
        console.error(`❌ Error processing series ${s.name}:`, error);
        
        results.push({
          seriesId: s.id,
          seriesName: s.name,
          success: false,
          error: error.message,
        });
      }
    }
    
    console.log(`\n✅ Completed processing ${results.length} series`);

    // Print summary
    console.log(`\n📊 Processed ${results.length} series:\n`);
    
    results.forEach((result: any) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.seriesName || 'Unknown Series'}`);
      console.log(`   Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      if (result.message) {
        console.log(`   Message: ${result.message}`);
      }
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      console.log('');
    });

    // Log summary
    const successful = results.filter((r: any) => r.success).length;
    const failed = results.filter((r: any) => !r.success).length;
    console.log(`📈 Summary: ${successful} successful, ${failed} failed`);
    
    return results;
  } catch (error: any) {
    console.error('❌ Error processing scheduled series:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().then(() => {
  console.log('\n✅ Script completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Script failed:', error);
  process.exit(1);
});
