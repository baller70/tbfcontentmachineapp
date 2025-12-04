import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function triggerBulkScheduling() {
  try {
    console.log('🚀 Triggering bulk scheduling...\n');
    
    // Get the most recent series
    const series = await prisma.postSeries.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (!series) {
      console.log('❌ No series found');
      return;
    }
    
    console.log(`📋 Series: ${series.name}`);
    console.log(`📁 Dropbox Path: ${series.dropboxFolderPath}\n`);
    
    console.log('⏳ Calling bulk-schedule API...');
    console.log('   (This will process all files in the folder)\n');
    
    const response = await axios.post(
      `http://localhost:3000/api/series/${series.id}/bulk-schedule`,
      {},
      {
        timeout: 600000, // 10 minute timeout
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      }
    );
    
    // Handle streaming response
    response.data.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      const lines = text.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.progress) {
              console.log(`📊 Progress: ${data.current}/${data.total} - ${data.fileName || 'Processing...'}`);
            } else if (data.complete) {
              console.log(`\n✅ COMPLETE!`);
              console.log(`   Successful: ${data.successful}/${data.total}`);
              console.log(`   Failed: ${data.failed}`);
            } else if (data.error) {
              console.log(`\n❌ ERROR: ${data.error}`);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    });
    
    await new Promise((resolve, reject) => {
      response.data.on('end', resolve);
      response.data.on('error', reject);
    });
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
}

triggerBulkScheduling();
