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

/**
 * COMPLETE SCRIPT TO SCHEDULE ALL POSTS
 * Files: All image files in the Dropbox folder (4.png to 29.png = 26 files)
 * Dates: Starting from series start date, one post per day
 * Prevents duplicates by checking existing Late API posts
 */

async function scheduleAll28Posts() {
  try {
    console.log('🚀 SCHEDULING ALL POSTS FOR MOTIVATIONAL QUOTES RHYME (TBF) V3');
    console.log('=' .repeat(80));
    console.log('');
    
    // Load series
    console.log('📂 Loading series from database...');
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
    
    console.log(`✅ Series: ${series.name}`);
    console.log(`✅ Folder: ${series.dropboxFolderPath}`);
    console.log(`✅ Profile: ${series.profile?.name || 'Unknown'}`);
    console.log('');
    
    // Get ALL existing posts from Late API (not just scheduled)
    console.log('📊 Fetching ALL existing posts from Late API...');
    const existingPostsResponse = await axios.get('https://getlate.dev/api/v1/posts', {
      headers: { 'Authorization': `Bearer ${process.env.LATE_API_KEY}` }
    });
    
    const existingPosts = existingPostsResponse.data.posts || existingPostsResponse.data || [];
    
    // Group by date to detect duplicates
    const dateCount: { [date: string]: number } = {};
    const existingDates = new Set<string>();
    
    existingPosts.forEach((post: any) => {
      if (post.status === 'scheduled' || post.status === 'published') {
        const date = dayjs(post.scheduledFor || post.createdAt).tz('America/New_York').format('YYYY-MM-DD');
        existingDates.add(date);
        dateCount[date] = (dateCount[date] || 0) + 1;
      }
    });
    
    console.log(`   Total posts found: ${existingPosts.length}`);
    console.log(`   Scheduled/Published: ${existingDates.size}`);
    console.log(`   Dates: ${Array.from(existingDates).sort().join(', ')}`);
    
    // Check for duplicates
    const duplicates = Object.entries(dateCount).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log('');
      console.log('⚠️  WARNING: Found duplicate posts on these dates:');
      duplicates.forEach(([date, count]) => {
        console.log(`   ${date}: ${count} posts`);
      });
      console.log('   User should manually delete duplicates from Late API dashboard');
    }
    console.log('');
    
    // List all files from Dropbox
    console.log('📂 Listing files from Dropbox...');
    const allFiles = await listFilesInFolder(series.dropboxFolderPath);
    const imageFiles = allFiles.filter(f => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name)
    );
    
    // Sort files numerically (4.png, 5.png, ..., 31.png)
    const sortedFiles = imageFiles.sort((a, b) => {
      const aNum = parseInt(a.name.match(/(\d+)/)?.[0] || '0');
      const bNum = parseInt(b.name.match(/(\d+)/)?.[0] || '0');
      return aNum - bNum;
    });
    
    console.log(`   Total image files: ${sortedFiles.length}`);
    console.log(`   File range: ${sortedFiles[0]?.name} to ${sortedFiles[sortedFiles.length - 1]?.name}`);
    console.log('');
    
    if (sortedFiles.length === 0) {
      throw new Error('No image files found in Dropbox folder!');
    }
    
    const totalFiles = sortedFiles.length;
    console.log(`📊 Will schedule ${totalFiles} posts total (one per file)`);
    console.log('');
    
    // Generate target dates for ALL files (starting from November 26, 2025 - tomorrow)
    const startDate = dayjs.tz('2025-11-26', 'America/New_York').hour(7).minute(0).second(0);
    const allTargetDates: { date: string; dateObj: dayjs.Dayjs; fileIndex: number; file: any }[] = [];
    
    console.log(`📅 Generating ${totalFiles} daily schedule slots starting ${startDate.format('YYYY-MM-DD')}...`);
    
    for (let i = 0; i < totalFiles; i++) {
      const targetDate = startDate.add(i, 'day');
      const dateStr = targetDate.format('YYYY-MM-DD');
      const file = sortedFiles[i]; // Files 4-31 map to indices 0-27
      
      if (file) {
        allTargetDates.push({ 
          date: dateStr, 
          dateObj: targetDate,
          fileIndex: i, 
          file 
        });
      }
    }
    
    console.log(`   Generated ${allTargetDates.length} target dates`);
    console.log(`   Date range: ${allTargetDates[0].date} to ${allTargetDates[allTargetDates.length - 1].date}`);
    console.log('');
    
    // Filter to only missing dates (avoid duplicates)
    const missingDates = allTargetDates.filter(td => !existingDates.has(td.date));
    
    console.log('📊 SCHEDULE SUMMARY:');
    console.log(`   Total posts needed: ${totalFiles}`);
    console.log(`   Already scheduled: ${existingDates.size}`);
    console.log(`   Missing (to schedule): ${missingDates.length}`);
    
    if (missingDates.length > 0) {
      console.log(`   Dates to schedule: ${missingDates.map(d => d.date).join(', ')}`);
    }
    console.log('');
    
    if (missingDates.length === 0) {
      console.log(`✅ All ${totalFiles} posts are already scheduled! Nothing to do.`);
      console.log('');
      return;
    }
    
    // Get platforms for Late API (exclude twitter, tiktok, youtube for image posts)
    const lateApiPlatforms = series.profile?.platformSettings
      .filter(ps => 
        ps.platform !== 'twitter' && 
        ps.platform !== 'tiktok' && 
        ps.platform !== 'youtube' && 
        ps.platformId
      )
      .map(ps => ({ platform: ps.platform, accountId: ps.platformId })) || [];
    
    console.log(`📱 Target platforms: ${lateApiPlatforms.map(p => p.platform).join(', ')}`);
    console.log('');
    
    if (lateApiPlatforms.length === 0) {
      throw new Error('No platforms configured for Late API!');
    }
    
    let successful = 0;
    let failed = 0;
    
    // Process each missing post
    for (let i = 0; i < missingDates.length; i++) {
      const { date, dateObj, fileIndex, file } = missingDates[i];
      const fileNumber = parseInt(file.name.match(/(\d+)/)?.[0] || '0');
      
      console.log('='.repeat(80));
      console.log(`📷 POST ${i + 1}/${missingDates.length}: ${file.name}`);
      console.log(`   File #${fileNumber} (index ${fileIndex})`);
      console.log(`   Date: ${date}`);
      console.log(`   Time: ${dateObj.format('h:mm A z')}`);
      console.log('='.repeat(80));
      console.log('');
      
      try {
        // 1. Download from Dropbox
        console.log('   ⬇️  Downloading from Dropbox...');
        const fileData = await downloadFile(file.path);
        const fileBuffer = fileData.buffer;
        console.log(`      Size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);
        
        // 2. Compress image
        console.log('   🗜️  Compressing image...');
        const compressedBuffer = await compressImage(fileBuffer, {
          maxSizeMB: 8,
          maxWidth: 1920,
          maxHeight: 1920
        });
        console.log(`      Compressed: ${(compressedBuffer.length / 1024).toFixed(2)} KB`);
        
        // 3. Convert to base64 for AI vision
        console.log('   🔄 Converting to base64 for AI...');
        const base64Image = compressedBuffer.toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;
        
        // 4. AI Vision Analysis
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
        
        // 5. Generate content with AI
        console.log('   ✍️  Generating post content...');
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
        
        if (!generatedContent || generatedContent.trim() === '') {
          throw new Error('AI generated empty content');
        }
        
        console.log(`      Content (${generatedContent.trim().length} chars): ${generatedContent.substring(0, 80)}...`);
        
        // 6. Upload media to Late API
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
        console.log(`      Media URL: ${mediaUrl.substring(0, 60)}...`);
        
        // 7. Schedule post in Late API
        console.log('   📅 Scheduling post in Late API...');
        
        const latePayload = {
          content: generatedContent.trim(),  // IMPORTANT: Use 'content', not 'text'
          mediaItems: [{ type: 'image', url: mediaUrl }],
          platforms: lateApiPlatforms,
          scheduledFor: dateObj.toISOString(),
          timezone: 'America/New_York'
        };
        
        const postResponse = await axios.post('https://getlate.dev/api/v1/posts', latePayload, {
          headers: {
            'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        const postId = postResponse.data.post?._id || postResponse.data._id;
        
        if (!postId) {
          throw new Error('Late API did not return a post ID');
        }
        
        console.log(`      ✅ Post scheduled successfully!`);
        console.log(`      Post ID: ${postId}`);
        console.log(`      Scheduled for: ${dateObj.format('YYYY-MM-DD h:mm A z')}`);
        console.log(`      Platforms: ${lateApiPlatforms.map(p => p.platform).join(', ')}`);
        console.log('');
        
        successful++;
        
        // Wait 5 seconds before next post (rate limiting)
        if (i < missingDates.length - 1) {
          console.log('   ⏳ Waiting 5 seconds before next post...');
          console.log('');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
      } catch (error: any) {
        failed++;
        console.error(`      ❌ ERROR: ${error.message}`);
        if (error.response) {
          console.error(`      Status: ${error.response.status}`);
          console.error(`      Response: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        console.log('');
        
        // Continue to next post even if this one fails
        continue;
      }
    }
    
    // Final summary
    console.log('='.repeat(80));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Successfully scheduled: ${successful}/${missingDates.length}`);
    console.log(`❌ Failed: ${failed}/${missingDates.length}`);
    console.log(`📅 Total posts now in Late API: ${existingDates.size + successful} / ${totalFiles}`);
    console.log('');
    
    if (existingDates.size + successful === totalFiles) {
      console.log(`🎉 ALL ${totalFiles} POSTS ARE NOW SCHEDULED!`);
    } else {
      console.log(`⚠️  Still missing ${totalFiles - (existingDates.size + successful)} posts`);
      console.log('   Run this script again to complete scheduling');
    }
    console.log('='.repeat(80));
    console.log('');
    
  } catch (error: any) {
    console.error('❌ FATAL ERROR:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
scheduleAll28Posts();
