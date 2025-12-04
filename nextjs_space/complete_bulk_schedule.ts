import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { listFilesInFolder, downloadFile } from './lib/dropbox';
import { compressImage } from './lib/media-compression';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function completeScheduling() {
  try {
    console.log('🚀 COMPLETING BULK SCHEDULE');
    console.log('======================================================================\n');
    
    // Load series
    const series = await prisma.postSeries.findFirst({
      where: { name: { contains: 'MOTIVATIONAL QUOTES RHYME (TBF) V3', mode: 'insensitive' } },
      include: {
        profile: {
          include: {
            platformSettings: { where: { isConnected: true } }
          }
        }
      }
    });
    
    if (!series || !series.dropboxFolderPath) {
      throw new Error('Series not found or no Dropbox folder configured');
    }
    
    console.log(`📁 Series: ${series.name}`);
    console.log(`📂 Folder: ${series.dropboxFolderPath}`);
    console.log(`📋 Prompt: ${series.prompt?.substring(0, 100)}...\n`);
    
    // List all files
    const allFiles = await listFilesInFolder(series.dropboxFolderPath);
    const imageFiles = allFiles.filter(f => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name)
    );
    
    // Sort files numerically
    const sortedFiles = imageFiles.sort((a, b) => {
      const aNum = parseInt(a.name.match(/(\d+)/)?.[0] || '0');
      const bNum = parseInt(b.name.match(/(\d+)/)?.[0] || '0');
      return aNum - bNum;
    });
    
    // We need files 14-29 (since we already have 1-13 scheduled)
    // File #14 corresponds to index 13, file #29 corresponds to index 28
    const filesToProcess = sortedFiles.slice(13, 29); // Get files 14-29
    
    console.log(`📊 Total files in folder: ${sortedFiles.length}`);
    console.log(`📊 Files to process: ${filesToProcess.length} (files #14-29)`);
    console.log(`📊 Will schedule from Dec 10 to Dec 25\n`);
    
    // Late API platforms
    const lateApiPlatforms = series.profile?.platformSettings
      .filter(ps => ps.platform !== 'twitter' && ps.platformId)
      .map(ps => ({ platform: ps.platform, accountId: ps.platformId })) || [];
    
    // Starting date: December 10, 2025
    let startDate = dayjs.tz('2025-12-10', 'America/New_York');
    let successful = 0;
    let failed = 0;
    
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      const fileNumber = parseInt(file.name.match(/(\d+)/)?.[0] || '0');
      const scheduledDate = startDate.add(i, 'day');
      
      console.log(`======================================================================`);
      console.log(`📷 FILE ${i + 1}/${filesToProcess.length}: ${file.name}`);
      console.log(`   File #: ${fileNumber}`);
      console.log(`   Scheduled for: ${scheduledDate.format('YYYY-MM-DD h:mm A')} z`);
      console.log(`======================================================================\n`);
      
      try {
        // Download file
        console.log('   ⬇️  Downloading from Dropbox...');
        const fileData = await downloadFile(file.path);
        const fileBuffer = fileData.buffer;
        console.log(`      Size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
        
        // Compress image
        console.log('   🗜️  Compressing image...');
        const compressedBuffer = await compressImage(fileBuffer, {
          maxSizeMB: 8,
          maxWidth: 1920,
          maxHeight: 1920
        });
        console.log(`      Compressed: ${(compressedBuffer.length / 1024).toFixed(2)} KB`);
        
        // Convert to base64 for AI vision
        console.log('   🔄 Converting image to base64...');
        const base64Image = compressedBuffer.toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;
        console.log(`      Base64 size: ${(base64Image.length / 1024).toFixed(2)} KB`);
        
        // AI Vision Analysis
        console.log('   🤖 Analyzing image with AI vision...');
        const visionResponse = await axios.post(
          'https://apps.abacus.ai/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an expert at analyzing images. Describe what you see in detail, focusing on text, design elements, and the overall message.'
              },
              {
                role: 'user',
                content: [
                  { type: 'text', text: 'Analyze this motivational image and describe what you see.' },
                  { type: 'image_url', image_url: { url: dataUrl } }
                ]
              }
            ]
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const imageAnalysis = visionResponse.data.choices?.[0]?.message?.content || '';
        console.log(`      Analysis: ${imageAnalysis.substring(0, 100)}...`);
        
        // Generate content with AI
        console.log('   ✍️  Generating post content with AI...');
        const contentResponse = await axios.post(
          'https://apps.abacus.ai/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are a motivational social media content creator for a basketball brand. CRITICAL FORMATTING RULES: - Output ONLY plain text - NO markdown formatting (no **, no *, no _) - NO labels like "Caption:", "Hashtags:", "Text:" - Start directly with the post text - After the main text, add a blank line, then add hashtags - Keep it clean, professional, and ready to copy-paste`
              },
              {
                role: 'user',
                content: `${series.prompt}\n\nImage Analysis: ${imageAnalysis}`
              }
            ]
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const generatedContent = contentResponse.data.choices?.[0]?.message?.content || '';
        console.log(`      Content: ${generatedContent.substring(0, 80)}...`);
        
        // Upload media to Late API
        console.log('   📤 Uploading media to Late API...');
        const mediaForm = new FormData();
        mediaForm.append('files', compressedBuffer, {
          filename: 'image.jpg',
          contentType: 'image/jpeg',
          knownLength: compressedBuffer.length
        });
        
        const mediaResponse = await axios.post('https://getlate.dev/api/v1/media', mediaForm, {
          headers: {
            'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
            ...mediaForm.getHeaders()
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        });
        
        const mediaUrl = mediaResponse.data.files?.[0]?.url || mediaResponse.data.url;
        console.log(`      Media URL: ${mediaUrl}`);
        
        // Schedule post in Late API
        console.log('   📅 Scheduling post in Late API...');
        const latePayload = {
          text: generatedContent,
          mediaItems: [{ type: 'image', url: mediaUrl }],
          platforms: lateApiPlatforms,
          scheduledFor: scheduledDate.toISOString(),
          timezone: 'America/New_York'
        };
        
        const postResponse = await axios.post('https://getlate.dev/api/v1/posts', latePayload, {
          headers: {
            'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        const postId = postResponse.data.post?._id || postResponse.data._id;
        console.log(`      ✅ Post scheduled! ID: ${postId}`);
        console.log(`      📱 Platforms: ${lateApiPlatforms.map(p => p.platform).join(', ')}`);
        console.log(`      📅 Scheduled: ${scheduledDate.format('YYYY-MM-DD h:mm A')} z\n`);
        
        successful++;
        
        // Wait 5 seconds before next post
        if (i < filesToProcess.length - 1) {
          console.log('   ⏳ Waiting 5 seconds before next post...\n');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
      } catch (error: any) {
        failed++;
        console.error(`      ❌ Error processing file: ${error.message}`);
        if (error.response) {
          console.error(`      Status: ${error.response.status}`);
          console.error(`      Data: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        console.log('');
      }
    }
    
    console.log('======================================================================');
    console.log('📊 BULK SCHEDULE COMPLETE');
    console.log('======================================================================');
    console.log(`✅ Successful: ${successful}/${filesToProcess.length}`);
    console.log(`❌ Failed: ${failed}/${filesToProcess.length}`);
    console.log(`📅 Start Date: December 10, 2025 at 7:00 AM EST`);
    console.log(`📅 End Date: ${startDate.add(filesToProcess.length - 1, 'day').format('MMMM DD, YYYY')} at 7:00 AM EST`);
    console.log(`📱 Platforms: ${lateApiPlatforms.map(p => p.platform).join(', ')}`);
    console.log('======================================================================\n');
    
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

completeScheduling();
