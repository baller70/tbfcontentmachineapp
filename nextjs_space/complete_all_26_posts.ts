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

async function completeAllPosts() {
  try {
    console.log('🚀 COMPLETING ALL 26 POSTS (FILES 4-29)');
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
    console.log(`📂 Folder: ${series.dropboxFolderPath}\n`);
    
    // Get all existing posts from Late API
    console.log('📊 Checking existing posts in Late API...');
    const existingPostsResponse = await axios.get('https://getlate.dev/api/v1/posts', {
      headers: { 'Authorization': `Bearer ${process.env.LATE_API_KEY}` }
    });
    
    const existingPosts = existingPostsResponse.data.posts || existingPostsResponse.data || [];
    const existingDates = new Set(
      existingPosts
        .filter((p: any) => p.status === 'scheduled' || p.status === 'published')
        .map((p: any) => {
          const date = new Date(p.scheduledFor || p.createdAt);
          return dayjs(date).tz('America/New_York').format('YYYY-MM-DD');
        })
    );
    
    console.log(`   Found ${existingDates.size} existing posts`);
    console.log(`   Dates: ${Array.from(existingDates).sort().join(', ')}\n`);
    
    // List all files
    const allFiles = await listFilesInFolder(series.dropboxFolderPath);
    const imageFiles = allFiles.filter(f => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name)
    );
    
    // Sort files numerically (4.png, 5.png, etc.)
    const sortedFiles = imageFiles.sort((a, b) => {
      const aNum = parseInt(a.name.match(/(\d+)/)?.[0] || '0');
      const bNum = parseInt(b.name.match(/(\d+)/)?.[0] || '0');
      return aNum - bNum;
    });
    
    console.log(`📊 Total files in folder: ${sortedFiles.length}`);
    console.log(`📊 Files range: ${sortedFiles[0]?.name} to ${sortedFiles[sortedFiles.length - 1]?.name}\n`);
    
    // Generate all 26 target dates (Nov 26 - Dec 21)
    const startDate = dayjs.tz('2025-11-26', 'America/New_York').hour(7).minute(0).second(0);
    const allTargetDates: { date: string; fileIndex: number; file: any }[] = [];
    
    for (let i = 0; i < 26; i++) {
      const targetDate = startDate.add(i, 'day');
      const dateStr = targetDate.format('YYYY-MM-DD');
      const fileIndex = i; // Files are 0-indexed in sortedFiles (4.png is index 0)
      const file = sortedFiles[fileIndex];
      
      if (file) {
        allTargetDates.push({ date: dateStr, fileIndex, file });
      }
    }
    
    // Filter to only missing dates
    const missingDates = allTargetDates.filter(td => !existingDates.has(td.date));
    
    console.log(`📊 Missing posts: ${missingDates.length}`);
    console.log(`📊 Dates to schedule: ${missingDates.map(d => d.date).join(', ')}\n`);
    
    if (missingDates.length === 0) {
      console.log('✅ All 26 posts are already scheduled! No action needed.\n');
      return;
    }
    
    // Late API platforms (exclude twitter, tiktok, and youtube for image posts)
    const lateApiPlatforms = series.profile?.platformSettings
      .filter(ps => 
        ps.platform !== 'twitter' && 
        ps.platform !== 'tiktok' && 
        ps.platform !== 'youtube' && 
        ps.platformId
      )
      .map(ps => ({ platform: ps.platform, accountId: ps.platformId })) || [];
    
    let successful = 0;
    let failed = 0;
    
    for (let i = 0; i < missingDates.length; i++) {
      const { date, fileIndex, file } = missingDates[i];
      const fileNumber = parseInt(file.name.match(/(\d+)/)?.[0] || '0');
      const scheduledDate = dayjs.tz(date, 'America/New_York').hour(7).minute(0).second(0);
      
      console.log(`======================================================================`);
      console.log(`📷 POST ${i + 1}/${missingDates.length}: ${file.name}`);
      console.log(`   File #: ${fileNumber}`);
      console.log(`   Date: ${date}`);
      console.log(`   Scheduled for: ${scheduledDate.format('YYYY-MM-DD h:mm A z')}`);
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
        
        // Ensure content is not empty
        if (!generatedContent || generatedContent.trim() === '') {
          throw new Error('Generated content is empty');
        }
        
        const latePayload = {
          text: generatedContent.trim(),
          mediaItems: [{ type: 'image', url: mediaUrl }],
          platforms: lateApiPlatforms,
          scheduledFor: scheduledDate.toISOString(),
          timezone: 'America/New_York'
        };
        
        console.log(`      📝 Content length: ${generatedContent.trim().length} characters`);
        console.log(`      📱 Platforms: ${lateApiPlatforms.length} platforms`);
        console.log(`      🔍 Full payload:`, JSON.stringify(latePayload, null, 2));
        
        const postResponse = await axios.post('https://getlate.dev/api/v1/posts', latePayload, {
          headers: {
            'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        const postId = postResponse.data.post?._id || postResponse.data._id;
        console.log(`      ✅ Post scheduled! ID: ${postId}`);
        console.log(`      📱 Platforms: ${lateApiPlatforms.map(p => p.platform).join(', ')}`);
        console.log(`      📅 Scheduled: ${scheduledDate.format('YYYY-MM-DD h:mm A z')}\n`);
        
        successful++;
        
        // Wait 5 seconds before next post
        if (i < missingDates.length - 1) {
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
    console.log(`✅ Successful: ${successful}/${missingDates.length}`);
    console.log(`❌ Failed: ${failed}/${missingDates.length}`);
    console.log(`📅 Total posts now: ${existingDates.size + successful} / 26`);
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

completeAllPosts();
