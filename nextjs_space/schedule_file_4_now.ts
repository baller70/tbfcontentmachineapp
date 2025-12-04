import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '.env') });

import { scheduleFirstSeriesPost } from './lib/cloud-storage-series-processor.js';

async function scheduleFile4() {
  try {
    const seriesId = 'cmiecz2pj0001xy9meg7qyuki';
    
    console.log('\n📅 Scheduling file #4 to Late API...\n');
    
    const result = await scheduleFirstSeriesPost(seriesId);
    
    console.log('\n=== RESULT ===');
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    if (result.latePostId) {
      console.log('Late Post ID:', result.latePostId);
    }
    if (result.error) {
      console.log('Error:', result.error);
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

scheduleFile4();
