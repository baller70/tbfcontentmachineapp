import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function processScheduledSeries() {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] 🔄 Checking for scheduled series to process...`);

  try {
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
      await prisma.$disconnect();
      return;
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
        
        // Import and use the processor
        const { processCloudStorageSeries } = await import('../lib/cloud-storage-series-processor');
        const result = await processCloudStorageSeries(s.id);
        
        results.push({
          seriesId: s.id,
          seriesName: s.name,
          success: result.success,
          message: result.message,
          error: result.error,
        });
        
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${s.name}`);
        console.log(`   Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        if (result.message) {
          console.log(`   Message: ${result.message}`);
        }
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
        
      } catch (error: any) {
        console.error(`❌ Error processing series ${s.name}:`, error.message);
        
        results.push({
          seriesId: s.id,
          seriesName: s.name,
          success: false,
          error: error.message,
        });
      }
    }
    
    // Log summary
    const successful = results.filter((r: any) => r.success).length;
    const failed = results.filter((r: any) => !r.success).length;
    console.log(`\n📈 Summary: ${successful} successful, ${failed} failed`);
    
    await prisma.$disconnect();
    
  } catch (error: any) {
    console.error('❌ Error processing scheduled series:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

processScheduledSeries();
