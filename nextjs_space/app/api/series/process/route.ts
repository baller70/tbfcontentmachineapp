
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { processCloudStorageSeries } from '@/lib/cloud-storage-series-processor';

// Process series that are due to be posted
export async function POST(req: NextRequest) {
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
    
    return NextResponse.json({ 
      success: true,
      processed: results.length,
      results 
    });
    
  } catch (error: any) {
    console.error('❌ Series processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process series', details: error.message },
      { status: 500 }
    );
  }
}
