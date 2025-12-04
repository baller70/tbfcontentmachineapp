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

    console.log(`\n📊 Series due for processing:\n`);
    
    series.forEach((s) => {
      console.log(`📌 ${s.name} (ID: ${s.id})`);
      console.log(`   Next scheduled: ${s.nextScheduledAt}`);
      console.log(`   Dropbox folder: ${s.dropboxFolderId}`);
      console.log(`   Company: ${s.company?.name || 'N/A'}`);
      console.log('');
    });

    console.log('\n⚠️  Note: Actual processing requires the Next.js API server to be running.');
    console.log('   This script only checks for series that are due.');
    console.log('   To process them, ensure the server is running and call the /api/series/process endpoint.');

  } catch (error: any) {
    console.error('❌ Error checking scheduled series:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

processScheduledSeries();
