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

async function finishAll26Posts() {
  try {
    console.log('🚀 FINISHING ALL 26 POSTS');
    console.log('======================================================================\n');
    
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
      throw new Error('Series not found');
    }
    
    console.log(`📁 Series: ${series.name}`);
    console.log(`📂 Folder: ${series.dropboxFolderPath}\n`);
    
    // Get existing posts from Late API
    console.log('📊 Checking existing posts...');
    const existingResponse = await axios.get('https://getlate.dev/api/v1/posts', {
      headers: { 'Authorization': `Bearer ${process.env.LATE_API_KEY}` }
    });
    
    const existingPosts = existingResponse.data.posts || existingResponse.data || [];
    const existingDates = new Set(
      existingPosts
        .filter((p: any) => p.status === 'scheduled' || p.status === 'published')
        .map((p: any) => dayjs(p.scheduledFor || p.createdAt).tz('America/New_York').format('YYYY-MM-DD'))
    );
    
    console.log(`   Found ${existingDates.size} existing posts`);
    console.log(`   Dates: ${Array.from(existingDates).sort().join(', ')}\n`);
    
    // List all files
    const allFiles = await listFilesInFolder(series.dropboxFolderPath);
    const imageFiles = allFiles.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name));
    const sortedFiles = imageFiles.sort((a, b) => {
      const aNum = parseInt(a.name.match(/(\d+)/)?.[0] || '0');
      const bNum = parseInt(b.name.match(/(\d+)/)?.[0] || '0');
      return aNum - bNum;
    });
    
    console.log(`📊 Total files: ${sortedFiles.length}\n`);
    
    // Generate all 26 dates (Nov 26 - Dec 21)
    const startDate = dayjs.tz('2025-11-26', 'America/New_York').hour(7).minute(0).second(0);
    const allTargetDates = [];
    
    for (let i = 0; i < 26; i++) {
      const targetDate = startDate.add(i, 'day');
      const dateStr = targetDate.format('YYYY-MM-DD');
      const file = sortedFiles[i];
      
      if (file && !existingDates.has(dateStr)) {
        allTargetDates.push({ date: dateStr, fileIndex: i, file });
      }
    }
    
    console.log(`📊 Missing posts: ${allTargetDates.length}`);
    console.log(`📊 Dates to schedule: ${allTargetDates.map(d => d.date).join(', ')}\n`);
    
    if (allTargetDates.length === 0) {
      console.log('✅ All 26 posts already scheduled!\n');
      return;
    }
    
    // Platforms - use same as before
    const lateApiPlatforms = series.profile?.platformSettings
      .filter(ps => ps.platform !== 'twitter' && ps.platformId)
      .map(ps => ({ platform: ps.platform, accountId: ps.platformId })) || [];
    
    console.log(`📱 Platforms: ${lateApiPlatforms.map(p => p.platform).join(', ')}\n`);
    
    let successful = 0;
    
    for (let i = 0; i < allTargetDates.length; i++) {
      const { date, file } = allTargetDates[i];
      const fileNumber = parseInt(file.name.match(/(\d+)/)?.[0] || '0');
      const scheduledDate = dayjs.tz(date, 'America/New_York').hour(7).minute(0).second(0);
      
      console.log(`======================================================================`);
      console.log(`📷 POST ${i + 1}/${allTargetDates.length}: ${file.name}`);
      console.log(`   File #: ${fileNumber}`);
      console.log(`   Date: ${date}`);
      console.log(`======================================================================\n`);
      
      try {
        // Download
        console.log('   ⬇️  Downloading...');
        const fileData = await downloadFile(file.path);
        const fileBuffer = fileData.buffer;
        
        // Compress
        console.log('   🗜️  Compressing...');
        const compressedBuffer = await compressImage(fileBuffer, {
          maxSizeMB: 8,
          maxWidth: 1920,
          maxHeight: 1920
        });
        
        // Base64 for AI
        console.log('   🔄 Converting to base64...');
        const base64Image = compressedBuffer.toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;
        
        // AI Vision
        console.log('   🤖 AI vision...');
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
        
        // Generate content
        console.log('   ✍️  Generating content...');
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
        console.log(`   📝 Content length: ${generatedContent.length} chars`);
        console.log(`   📝 Content preview: ${generatedContent.substring(0, 100)}...`);
        
        // Upload to Late
        console.log('   📤 Uploading media...');
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
        
        // Schedule post
        console.log('   📅 Scheduling...');
        const latePayload = {
          content: generatedContent.trim(),
          mediaItems: [{ type: 'image', url: mediaUrl }],
          platforms: lateApiPlatforms,
          scheduledFor: scheduledDate.toISOString(),
          timezone: 'America/New_York'
        };
        
        console.log(`   🔍 Payload content length: ${latePayload.content.length}`);
        console.log(`   🔍 Platforms count: ${lateApiPlatforms.length}`);
        console.log(`   🔍 ScheduledFor: ${latePayload.scheduledFor}`);
        
        const postResponse = await axios.post('https://getlate.dev/api/v1/posts', latePayload, {
          headers: {
            'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        const postId = postResponse.data.post?._id || postResponse.data._id;
        console.log(`      ✅ Scheduled! ID: ${postId}`);
        console.log(`      📅 ${scheduledDate.format('YYYY-MM-DD h:mm A z')}\n`);
        
        successful++;
        
        if (i < allTargetDates.length - 1) {
          console.log('   ⏳ Waiting 5 seconds...\n');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
      } catch (error: any) {
        console.error(`      ❌ Error: ${error.message}`);
        if (error.response) {
          console.error(`      Status: ${error.response.status}`);
          console.error(`      Data: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        console.log('');
      }
    }
    
    console.log('======================================================================');
    console.log('📊 COMPLETE');
    console.log('======================================================================');
    console.log(`✅ Successful: ${successful}/${allTargetDates.length}`);
    console.log(`📅 Total posts now: ${existingDates.size + successful} / 26`);
    console.log('======================================================================\n');
    
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

finishAll26Posts();
