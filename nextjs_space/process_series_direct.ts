import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { processCloudStorageSeries } from './lib/cloud-storage-series-processor';

// Load environment variables
config({ path: '.env' });

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('[' + new Date().toISOString() + '] 🚀 Starting series processing...');
    
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
    console.log(JSON.stringify({ success: true, processed: results.length, results }, null, 2));
    
  } catch (error: any) {
    console.error('❌ Series processing error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
