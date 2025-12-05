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
 * BATCHED BULK SCHEDULING SCRIPT
 * 
 * This script processes posts in small batches to prevent errors and duplicates.
 * Maximum 10 posts per batch.
 * 
 * For 26 posts: Batch 1 (10) → Batch 2 (10) → Batch 3 (6)
 */

const BATCH_SIZE = 10; // Maximum posts per batch
const DELAY_BETWEEN_POSTS = 5000; // 5 seconds
const DELAY_BETWEEN_BATCHES = 10000; // 10 seconds between batches

async function scheduleBatch(startIndex: number, batchNumber: number) {
  try {
    console.log('\n' + '='.repeat(80));
    console.log(`🎯 BATCH ${batchNumber} - Starting from file index ${startIndex}`);
    console.log('='.repeat(80));
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
    console.log(`✅ Profile: ${series.profile?.name || 'Unknown'}`);
    console.log('');

    // Get existing posts from Late API
    console.log('📊 Checking existing posts in Late API...');
    const existingPostsResponse = await axios.get('https://getlate.dev/api/v1/posts', {
      headers: { 'Authorization': `Bearer ${process.env.LATE_API_KEY}` }
    });

    const existingPosts = existingPostsResponse.data.posts || existingPostsResponse.data || [];
    const existingDates = new Set<string>();

    existingPosts.forEach((post: any) => {
      if (post.status === 'scheduled' || post.status === 'published') {
        const date = dayjs(post.scheduledFor || post.createdAt).tz('America/New_York').format('YYYY-MM-DD');
        existingDates.add(date);
      }
    });

    console.log(`   Found ${existingDates.size} existing posts`);
    console.log('');

    // List files from Dropbox
    console.log('📂 Listing files from Dropbox...');
    const allFiles = await listFilesInFolder(series.dropboxFolderPath);
    const imageFiles = allFiles.filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name));

    const sortedFiles = imageFiles.sort((a, b) => {
      const aNum = parseInt(a.name.match(/(\d+)/)?.[0] || '0');
      const bNum = parseInt(b.name.match(/(\d+)/)?.[0] || '0');
      return aNum - bNum;
    });

    console.log(`   Total files: ${sortedFiles.length}`);
    console.log(`   Files: ${sortedFiles[0]?.name} to ${sortedFiles[sortedFiles.length - 1]?.name}`);
    console.log('');

    // Generate target dates starting from November 26
    const startDate = dayjs.tz('2025-11-26', 'America/New_York').hour(7).minute(0).second(0);
    const allTargetDates: { date: string; dateObj: dayjs.Dayjs; file: any; fileIndex: number }[] = [];

    for (let i = 0; i < sortedFiles.length; i++) {
      const targetDate = startDate.add(i, 'day');
      const dateStr = targetDate.format('YYYY-MM-DD');
      allTargetDates.push({
        date: dateStr,
        dateObj: targetDate,
        file: sortedFiles[i],
        fileIndex: i
      });
    }

    // Filter to only missing dates
    const missingDates = allTargetDates.filter(td => !existingDates.has(td.date));

    console.log('📊 BATCH STATUS:');
    console.log(`   Total files: ${sortedFiles.length}`);
    console.log(`   Already scheduled: ${existingDates.size}`);
    console.log(`   Remaining to schedule: ${missingDates.length}`);
    console.log('');

    // Calculate this batch's slice
    const batchStart = startIndex;
    const batchEnd = Math.min(startIndex + BATCH_SIZE, missingDates.length);
    const batchDates = missingDates.slice(batchStart, batchEnd);
    const actualBatchSize = batchDates.length;

    if (actualBatchSize === 0) {
      console.log('✅ No posts to schedule in this batch!');
      console.log('');
      return { processed: 0, hasMore: false };
    }

    console.log(`🎯 This batch will process ${actualBatchSize} posts`);
    console.log(`   Processing files ${batchStart + 1} to ${batchEnd}`);
    console.log(`   Dates: ${batchDates[0].date} to ${batchDates[batchDates.length - 1].date}`);
    console.log('');

    // Get platforms
    const lateApiPlatforms = series.profile?.platformSettings
      .filter((ps: any) =>
        ps.platform !== 'twitter' &&
        ps.platform !== 'tiktok' &&
        ps.platform !== 'youtube' &&
        ps.platformId
      )
      .map((ps: any) => ({ platform: ps.platform, accountId: ps.platformId })) || [];

    console.log(`📱 Platforms: ${lateApiPlatforms.map((p: any) => p.platform).join(', ')}`);
    console.log('');

    let successful = 0;
    let failed = 0;

    // Process each post in this batch
    for (let i = 0; i < batchDates.length; i++) {
      const { date, dateObj, file, fileIndex } = batchDates[i];
      const fileNumber = parseInt(file.name.match(/(\d+)/)?.[0] || '0');
      const postNumber = batchStart + i + 1;

      console.log('-'.repeat(80));
      console.log(`📷 POST ${postNumber}/${missingDates.length} (Batch ${batchNumber}, Item ${i + 1}/${actualBatchSize}): ${file.name}`);
      console.log(`   File #${fileNumber}`);
      console.log(`   Date: ${date} at 7:00 AM EST`);
      console.log('-'.repeat(80));
      console.log('');

      try {
        // Download from Dropbox
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

        const mediaResponse = await axios.post('https://getlate.dev/api/v1/media', mediaForm, {
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
        console.log('   📅 Scheduling...');
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

        // Delay between posts (not after last post in batch)
        if (i < batchDates.length - 1) {
          console.log('   ⏳ Waiting 5 seconds...');
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_POSTS));
        }

      } catch (error: any) {
        failed++;
        console.error(`   ❌ FAILED: ${error.message}`);
        if (error.response) {
          console.error(`      Status: ${error.response.status}`);
          console.error(`      Data: ${JSON.stringify(error.response.data)}`);
        }
        console.log('');

        // Continue to next post even if this one fails
        continue;
      }
    }

    // Batch summary
    console.log('');
    console.log('='.repeat(80));
    console.log(`📊 BATCH ${batchNumber} COMPLETE`);
    console.log('='.repeat(80));
    console.log(`✅ Successful: ${successful}/${actualBatchSize}`);
    console.log(`❌ Failed: ${failed}/${actualBatchSize}`);
    console.log(`📅 Next batch will start from post ${batchEnd + 1}`);
    console.log('='.repeat(80));
    console.log('');

    const hasMore = batchEnd < missingDates.length;

    return {
      processed: successful,
      hasMore: hasMore,
      nextStartIndex: batchEnd
    };

  } catch (error: any) {
    console.error('');
    console.error('❌ BATCH ERROR:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('');
    throw error;
  }
}

async function runBatchedScheduling() {
  const overallStartTime = Date.now();
  let totalProcessed = 0;
  let batchNumber = 1;
  let currentIndex = 0;
  let hasMore = true;

  try {
    console.log('');
    console.log('╔' + '═'.repeat(78) + '╗');
    console.log('║' + ' '.repeat(20) + 'BATCHED BULK SCHEDULING' + ' '.repeat(35) + '║');
    console.log('║' + ' '.repeat(20) + 'Maximum 10 posts per batch' + ' '.repeat(32) + '║');
    console.log('╚' + '═'.repeat(78) + '╝');
    console.log('');

    while (hasMore) {
      console.log('');
      console.log('🔵 Starting Batch ' + batchNumber);
      console.log('');

      const result = await scheduleBatch(currentIndex, batchNumber);

      totalProcessed += result.processed;
      hasMore = result.hasMore;
      currentIndex = result.nextStartIndex || 0;
      batchNumber++;

      if (hasMore) {
        console.log('');
        console.log('⏸️  BATCH RESET - Waiting 10 seconds before next batch...');
        console.log('');
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    // Final overall summary
    const elapsedMinutes = ((Date.now() - overallStartTime) / 1000 / 60).toFixed(1);

    console.log('');
    console.log('╔' + '═'.repeat(78) + '╗');
    console.log('║' + ' '.repeat(25) + 'ALL BATCHES COMPLETE' + ' '.repeat(33) + '║');
    console.log('╚' + '═'.repeat(78) + '╝');
    console.log('');
    console.log('📊 OVERALL SUMMARY:');
    console.log(`   Total batches: ${batchNumber - 1}`);
    console.log(`   Total posts scheduled: ${totalProcessed}`);
    console.log(`   Total time: ${elapsedMinutes} minutes`);
    console.log('');
    console.log('🎉 ALL DONE!');
    console.log('');

  } catch (error: any) {
    console.error('');
    console.error('❌ FATAL ERROR');
    console.error(`   Completed ${batchNumber - 1} batches`);
    console.error(`   Processed ${totalProcessed} total posts`);
    console.error(`   Error: ${error.message}`);
    console.error('');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the batched scheduling
runBatchedScheduling();
