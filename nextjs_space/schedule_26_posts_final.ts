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
 * FINAL COMPLETE SCRIPT - ALL 26 POSTS
 * November 26 - December 21, 2025 (7:00 AM EST each day)
 * NO DUPLICATES, ONE RUN, VERIFICATION BEFORE POSTING
 */

async function scheduleAll26PostsFinal() {
  const startTime = Date.now();
  let successful = 0;
  let failed = 0;
  const errors: string[] = [];
  
  try {
    console.log('\n🚀 FINAL BULK SCHEDULE - ALL 26 POSTS');
    console.log('=' .repeat(80));
    console.log('Target: November 26 - December 21, 2025 (7:00 AM EST each day)');
    console.log('=' .repeat(80));
    console.log('');
    
    // 1. Load series
    console.log('📂 Step 1: Loading series from database...');
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
      throw new Error('❌ Series not found or no Dropbox folder configured');
    }
    
    console.log(`✅ Series: ${series.name}`);
    console.log(`✅ Folder: ${series.dropboxFolderPath}`);
    console.log(`✅ Profile: ${series.profile?.name || 'Unknown'}`);
    console.log('');
    
    // 2. VERIFY Late API is clean (should be empty after user deleted everything)
    console.log('🔍 Step 2: Verifying Late API is clean...');
    const checkResponse = await axios.get('https://getlate.dev/api/v1/posts?status=scheduled', {
      headers: { 'Authorization': `Bearer ${process.env.LATE_API_KEY}` }
    });
    
    const existingCount = checkResponse.data.posts?.length || 0;
    console.log(`   Existing scheduled posts in Late API: ${existingCount}`);
    
    if (existingCount > 0) {
      console.log('');
      console.log('⚠️  WARNING: Late API still has scheduled posts!');
      console.log('   User said they deleted everything. Checking dates...');
      
      const existingDates = checkResponse.data.posts.map((p: any) => 
        dayjs(p.scheduledFor).tz('America/New_York').format('YYYY-MM-DD')
      ).sort();
      
      console.log(`   Existing dates: ${existingDates.join(', ')}`);
      console.log('');
    }
    
    // 3. List files from Dropbox
    console.log('📂 Step 3: Listing files from Dropbox...');
    const allFiles = await listFilesInFolder(series.dropboxFolderPath);
    const imageFiles = allFiles.filter(f => 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name)
    );
    
    const sortedFiles = imageFiles.sort((a, b) => {
      const aNum = parseInt(a.name.match(/(\d+)/)?.[0] || '0');
      const bNum = parseInt(b.name.match(/(\d+)/)?.[0] || '0');
      return aNum - bNum;
    });
    
    console.log(`   Total image files found: ${sortedFiles.length}`);
    console.log(`   File range: ${sortedFiles[0]?.name} to ${sortedFiles[sortedFiles.length - 1]?.name}`);
    
    if (sortedFiles.length < 26) {
      throw new Error(`❌ Not enough files! Found ${sortedFiles.length}, need 26`);
    }
    
    console.log('✅ File count verified: 26 files available');
    console.log('');
    
    // 4. Generate target dates (Nov 26 - Dec 21)
    console.log('📅 Step 4: Generating target dates...');
    const startDate = dayjs.tz('2025-11-26', 'America/New_York').hour(7).minute(0).second(0);
    const targetDates: { date: string; dateObj: dayjs.Dayjs; file: any; fileIndex: number }[] = [];
    
    for (let i = 0; i < 26; i++) {
      const targetDate = startDate.add(i, 'day');
      const dateStr = targetDate.format('YYYY-MM-DD');
      targetDates.push({ 
        date: dateStr, 
        dateObj: targetDate, 
        file: sortedFiles[i],
        fileIndex: i + 1
      });
    }
    
    console.log(`   Start: ${targetDates[0].date} (${sortedFiles[0].name})`);
    console.log(`   End: ${targetDates[25].date} (${sortedFiles[25].name})`);
    console.log('✅ All 26 dates generated');
    console.log('');
    
    // 5. Verify NO DUPLICATES in target dates
    console.log('🔍 Step 5: Verifying NO duplicate dates...');
    const dateSet = new Set(targetDates.map(d => d.date));
    if (dateSet.size !== 26) {
      throw new Error(`❌ DUPLICATE DATES DETECTED! Found ${dateSet.size} unique dates, expected 26`);
    }
    console.log('✅ No duplicate dates - all 26 dates are unique');
    console.log('');
    
    // 6. Get platforms for Late API
    console.log('📱 Step 6: Configuring platforms...');
    const lateApiPlatforms = series.profile?.platformSettings
      .filter(ps => 
        ps.platform !== 'twitter' && 
        ps.platform !== 'tiktok' && 
        ps.platform !== 'youtube' && 
        ps.platformId
      )
      .map(ps => ({ platform: ps.platform, accountId: ps.platformId })) || [];
    
    if (lateApiPlatforms.length === 0) {
      throw new Error('❌ No platforms configured for Late API!');
    }
    
    console.log(`   Platforms: ${lateApiPlatforms.map(p => p.platform).join(', ')}`);
    console.log(`   Platform count: ${lateApiPlatforms.length}`);
    console.log('✅ Platforms configured');
    console.log('');
    
    // 7. Process ALL 26 posts
    console.log('🎯 Step 7: Processing ALL 26 posts...');
    console.log('=' .repeat(80));
    console.log('');
    
    for (let i = 0; i < targetDates.length; i++) {
      const { date, dateObj, file, fileIndex } = targetDates[i];
      const fileNumber = parseInt(file.name.match(/(\d+)/)?.[0] || '0');
      
      console.log(`\n[${ i + 1}/26] 📷 ${file.name}`);
      console.log(`   Date: ${date} at ${dateObj.format('h:mm A z')}`);
      console.log(`   File #${fileNumber}`);
      console.log('---');
      
      try {
        // Download
        console.log('   ⬇️  Downloading...');
        const fileData = await downloadFile(file.path);
        const fileBuffer = fileData.buffer;
        console.log(`      ${(fileBuffer.length / 1024).toFixed(2)} KB`);
        
        // Compress
        console.log('   🗜️  Compressing...');
        const compressedBuffer = await compressImage(fileBuffer, {
          maxSizeMB: 8,
          maxWidth: 1920,
          maxHeight: 1920
        });
        console.log(`      ${(compressedBuffer.length / 1024).toFixed(2)} KB`);
        
        // AI Vision
        console.log('   🤖 AI vision analysis...');
        const base64Image = compressedBuffer.toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;
        
        const visionResponse = await axios.post(
          'https://apps.abacus.ai/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an expert at analyzing images. Describe what you see.'
              },
              {
                role: 'user',
                content: [
                  { type: 'text', text: 'Analyze this motivational image.' },
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
        console.log(`      ✓ Analyzed`);
        
        // AI Content Generation
        console.log('   ✍️  Generating content...');
        const contentResponse = await axios.post(
          'https://apps.abacus.ai/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a motivational social media content creator for basketball. CRITICAL: Output ONLY plain text, no markdown, no labels like "Caption:" or "Hashtags:". Start with the post text, then blank line, then hashtags.'
              },
              {
                role: 'user',
                content: `${series.prompt}\n\nImage: ${imageAnalysis}`
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
        
        console.log(`      ✓ Generated (${generatedContent.trim().length} chars)`);
        
        // Upload to Late API
        console.log('   📤 Uploading to Late API...');
        const mediaForm = new FormData();
        mediaForm.append('files', compressedBuffer, {
          filename: 'image.jpg',
          contentType: 'image/jpeg',
          knownLength: compressedBuffer.length
        });
        
        const mediaResponse = await axios.post('https://miro.medium.com/0*zkhrh5G1vY2LQBTX.jpeg', mediaForm, {
          headers: {
            'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
            ...mediaForm.getHeaders()
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        });
        
        const mediaUrl = mediaResponse.data.files?.[0]?.url || mediaResponse.data.url;
        console.log(`      ✓ Uploaded`);
        
        // Schedule in Late API
        console.log('   📅 Scheduling in Late API...');
        const latePayload = {
          content: generatedContent.trim(),
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
          throw new Error('Late API did not return post ID');
        }
        
        console.log(`   ✅ SCHEDULED!`);
        console.log(`      Post ID: ${postId}`);
        console.log(`      Date: ${date} at 7:00 AM EST`);
        console.log('');
        
        successful++;
        
        // Rate limiting delay (5 seconds between posts)
        if (i < targetDates.length - 1) {
          console.log('   ⏳ Waiting 5 seconds before next post...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
      } catch (error: any) {
        failed++;
        const errorMsg = `${file.name}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`   ❌ FAILED: ${error.message}`);
        if (error.response) {
          console.error(`      Status: ${error.response.status}`);
          console.error(`      Data: ${JSON.stringify(error.response.data)}`);  
        }
        console.log('');
        
        // STOP on error - do not continue
        throw new Error(`Failed at post ${i + 1}/26. Stopping to prevent partial run.`);
      }
    }
    
    // Final verification
    console.log('');
    console.log('=' .repeat(80));
    console.log('🔍 FINAL VERIFICATION');
    console.log('=' .repeat(80));
    console.log('');
    
    console.log('Checking Late API for all 26 posts...');
    const finalCheck = await axios.get('https://getlate.dev/api/v1/posts?status=scheduled', {
      headers: { 'Authorization': `Bearer ${process.env.LATE_API_KEY}` }
    });
    
    const finalCount = finalCheck.data.posts?.length || 0;
    const finalDates = finalCheck.data.posts
      .map((p: any) => dayjs(p.scheduledFor).tz('America/New_York').format('YYYY-MM-DD'))
      .sort();
    
    console.log(`Total scheduled posts: ${finalCount}`);
    console.log(`Dates: ${finalDates.join(', ')}`);
    console.log('');
    
    // Check for duplicates
    const dateCounts: { [key: string]: number } = {};
    finalDates.forEach((date: string) => {
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
    
    const duplicates = Object.entries(dateCounts).filter(([_, count]) => count > 1);
    
    if (duplicates.length > 0) {
      console.error('❌ DUPLICATES FOUND:');
      duplicates.forEach(([date, count]) => {
        console.error(`   ${date}: ${count} posts`);
      });
      console.error('');
      throw new Error('Duplicate posts detected in Late API!');
    }
    
    if (finalCount !== 26) {
      throw new Error(`Expected 26 posts, found ${finalCount}`);
    }
    
    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    
    console.log('=' .repeat(80));
    console.log('🎉 SUCCESS - ALL 26 POSTS SCHEDULED!');
    console.log('=' .repeat(80));
    console.log(`✅ ${successful} posts scheduled successfully`);
    console.log(`❌ ${failed} posts failed`);
    console.log(`⏱️  Total time: ${elapsed} minutes`);
    console.log(`📅 Date range: November 26 - December 21, 2025`);
    console.log(`🕐 Time: 7:00 AM EST each day`);
    console.log(`✅ NO DUPLICATES`);
    console.log('=' .repeat(80));
    console.log('');
    
  } catch (error: any) {
    console.error('');
    console.error('=' .repeat(80));
    console.error('❌ FATAL ERROR');
    console.error('=' .repeat(80));
    console.error(error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('');
    console.error('📊 SUMMARY AT FAILURE:');
    console.error(`   Successful: ${successful}/26`);
    console.error(`   Failed: ${failed}`);
    if (errors.length > 0) {
      console.error(`   Errors: ${errors.join(', ')}`);
    }
    console.error('=' .repeat(80));
    console.error('');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
scheduleAll26PostsFinal();