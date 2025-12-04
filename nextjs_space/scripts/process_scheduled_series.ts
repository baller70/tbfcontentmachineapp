import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function processScheduledSeries() {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] 🔄 Checking for scheduled series to process...`);

  try {
    const response = await axios.post('http://localhost:3000/api/series/process', {}, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 120000, // 2 minute timeout
    });

    const results = response.data.results || [];
    
    if (results.length === 0) {
      console.log('✅ No series ready to process at this time');
      return;
    }

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

  } catch (error: any) {
    console.error('❌ Error processing scheduled series:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

processScheduledSeries();
