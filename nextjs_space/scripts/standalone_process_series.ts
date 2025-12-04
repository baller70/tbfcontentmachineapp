import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../nextjs_space/.env') });

const prisma = new PrismaClient();

// Import the processor function
async function processCloudStorageSeries(seriesId: string) {
  // This is a placeholder - we'll need to import the actual function
  // For now, we'll just return a mock result
  const { processCloudStorageSeries: processor } = await import('../nextjs_space/lib/cloud-storage-series-processor');
  return await processor(seriesId);
}

async function processScheduledSeries() {
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
    
    // Log summary
    const successful = results.filter((r: any) => r.success).length;
    const failed = results.filter((r: any) => !r.success).length;
    console.log(`📈 Summary: ${successful} successful, ${failed} failed`);

    // Print detailed results
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

    await prisma.$disconnect();
    
  } catch (error: any) {
    console.error('❌ Error processing scheduled series:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

processScheduledSeries();
