import axios from 'axios';
import FormData from 'form-data';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '.env') });

async function testMediaUpload() {
  try {
    console.log('Testing Late API media upload endpoint...');
    console.log('API Key present:', !!process.env.LATE_API_KEY);
    
    // Create a small test buffer
    const testBuffer = Buffer.from('test image data');
    
    const form = new FormData();
    form.append('files', testBuffer, {
      filename: 'test.jpg',
      contentType: 'image/jpeg',
      knownLength: testBuffer.length
    });
    
    console.log('Sending request to https://getlate.dev/api/v1/media');
    
    const response = await axios.post('https://getlate.dev/api/v1/media', form, {
      headers: {
        'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
        ...form.getHeaders()
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 30000
    });
    
    console.log('Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error: any) {
    console.error('Failed!');
    console.error('Error message:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Status text:', error.response?.statusText);
    console.error('Headers:', JSON.stringify(error.response?.headers, null, 2));
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
  }
}

testMediaUpload();
