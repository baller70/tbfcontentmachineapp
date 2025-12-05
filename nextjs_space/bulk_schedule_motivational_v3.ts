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

dotenv.config({ path: path.join(__dirname, '.env') });

dayjs.extend(utc);
dayjs.extend(timezone);

const prisma = new PrismaClient();

interface FileItem {
  name: string;
  id: string;
  path: string;
  mimeType?: string;
}

async function bulkScheduleMotivationalV3() {
  console.log('🎯 BULK SCHEDULE: MOTIVATIONAL QUOTES RHYME (TBF) V3');
  console.log('=' .repeat(70));
  console.log('');

  try {
    // 1. Load series from database
    console.log('📊 Step 1: Loading series from database...');
    const series = await prisma.postSeries.findFirst({
      where: {
        name: { contains: 'MOTIVATIONAL QUOTES RHYME', mode: 'insensitive' },
        status: 'ACTIVE'
      },
      include: {
        profile: {
          include: {
            platformSettings: {
              where: { isConnected: true }
            }
          }
        }
      }
    });

    if (!series) {
      throw new Error('❌ Series not found');
    }

    console.log(`   ✅ Series found: ${series.name}`);
    console.log(`   📁 Dropbox folder: ${series.dropboxFolderPath}`);
    console.log(`   📝 Prompt: ${series.prompt?.substring(0, 100)}...`);
    console.log(`   🏢 Profile: ${series.profile?.name}`);
    console.log('');

    // 2. List files in Dropbox folder
    console.log('📂 Step 2: Listing files in Dropbox folder...');
    const allFiles = await listFilesInFolder(series.dropboxFolderPath!);
    
    // Filter to images only
    const imageFiles = allFiles.filter((file: FileItem) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
    });

    // Sort numerically
    const sortedFiles = imageFiles.sort((a: FileItem, b: FileItem) => {
      const aNum = parseInt(a.name.match(/^(\d+)/)?.[1] || '0');
      const bNum = parseInt(b.name.match(/^(\d+)/)?.[1] || '0');
      return aNum - bNum;
    });

    // Filter files starting from #4
    const filesToProcess = sortedFiles.filter((file: FileItem) => {
      const fileNum = parseInt(file.name.match(/^(\d+)/)?.[1] || '0');
      return fileNum >= 4;
    });

    console.log(`   ✅ Found ${sortedFiles.length} total image files`);
    console.log(`   🎯 Will process ${filesToProcess.length} files (starting from #4)`);
    console.log('');

    // 3. Get platform configurations
    const platformSettings = series.profile?.platformSettings || [];
    const lateApiPlatforms = platformSettings
      .filter((ps: any) => ps.platform !== 'twitter' && ps.platformId)
      .map((ps: any) => ({
        platform: ps.platform,
        accountId: ps.platformId!
      }));

    if (lateApiPlatforms.length === 0) {
      throw new Error('❌ No connected Late API platforms found');
    }

    console.log(`   📱 Platforms: ${lateApiPlatforms.map((p: any) => p.platform).join(', ')}`);
    console.log('');

    // 4. Process each file
    let successCount = 0;
    let failCount = 0;
    const startDate = dayjs.tz('2025-11-26', 'America/New_York');

    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      const fileNum = parseInt(file.name.match(/^(\d+)/)?.[1] || '0');
      const scheduledDate = startDate.add(i, 'day').hour(7).minute(0).second(0);

      console.log(`\n${'='.repeat(70)}`);
      console.log(`📷 FILE ${i + 1}/${filesToProcess.length}: ${file.name}`);
      console.log(`   File #: ${fileNum}`);
      console.log(`   Scheduled for: ${scheduledDate.format('YYYY-MM-DD h:mm A z')}`);
      console.log(`${'='.repeat(70)}\n`);

      try {
        // Download file
        console.log('   ⬇️  Downloading from Dropbox...');
        const fileData = await downloadFile(file.path);
        const fileBuffer = fileData.buffer;
        console.log(`      Size: ${(fileBuffer.length / 1024).toFixed(2)} KB`);

        // Compress image for Late API
        console.log('   🗜️  Compressing image...');
        const compressedBuffer = await compressImage(fileBuffer, {
          targetPlatform: 'late',
          maxSizeMB: 8,
          maxWidth: 1920,
          maxHeight: 1920
        });
        console.log(`      Compressed: ${(compressedBuffer.length / 1024).toFixed(2)} KB`);

        // Convert to base64 for AI vision analysis
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

        // AI Content Generation using series prompt
        console.log('   ✍️  Generating post content with AI...');
        const contentResponse = await axios.post(
          'https://apps.abacus.ai/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `CRITICAL FORMATTING RULES:\n1. Output ONLY plain text\n2. NO markdown formatting (no **, no *, no __)\n3. NO labels like "Caption:" or "Hashtags:" or "Text:"\n4. Start directly with the post text\n5. After the post text, add a blank line\n6. Then add hashtags on a new line\n7. Keep caption under 100 words\n8. Use 3-5 hashtags\n\nImage Analysis: ${imageAnalysis}`
              },
              {
                role: 'user',
                content: series.prompt || 'Create an engaging social media post based on the image.'
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
        console.log(`      Content: ${generatedContent.substring(0, 80)}...`);

        // Upload media to Late API
        console.log('   📤 Uploading media to Late API...');
        const mediaForm = new FormData();
        mediaForm.append('files', compressedBuffer, {
          filename: file.name,
          contentType: 'image/jpeg',
          knownLength: compressedBuffer.length
        });

        const mediaResponse = await axios.post(
          'https://getlate.dev/api/v1/media',
          mediaForm,
          {
            headers: {
              'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
              ...mediaForm.getHeaders()
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
          }
        );

        const mediaUrl = mediaResponse.data.files?.[0]?.url || mediaResponse.data.url;
        console.log(`      Media URL: ${mediaUrl}`);

        // Schedule post in Late API
        console.log('   📅 Scheduling post in Late API...');
        const latePayload = {
          content: generatedContent,
          platforms: lateApiPlatforms,
          mediaItems: [{ url: mediaUrl, type: 'image' }],
          scheduledFor: scheduledDate.toISOString(),
          timezone: 'America/New_York'
        };

        const postResponse = await axios.post(
          'https://getlate.dev/api/v1/posts',
          latePayload,
          {
            headers: {
              'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const postId = postResponse.data.post?._id || postResponse.data._id;
        console.log(`      ✅ Post scheduled! ID: ${postId}`);
        console.log(`      📱 Platforms: ${lateApiPlatforms.map((p: any) => p.platform).join(', ')}`);
        console.log(`      📅 Scheduled: ${scheduledDate.format('YYYY-MM-DD h:mm A z')}`);

        successCount++;

        // Wait 5 seconds between posts to avoid rate limits
        if (i < filesToProcess.length - 1) {
          console.log('\n   ⏳ Waiting 5 seconds before next post...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }

      } catch (error: any) {
        console.error(`\n   ❌ ERROR processing ${file.name}:`);
        console.error(`      ${error.message}`);
        if (error.response) {
          console.error(`      HTTP Status: ${error.response.status}`);
          console.error(`      Response: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        failCount++;
      }
    }

    // Final summary
    console.log('\n\n' + '='.repeat(70));
    console.log('📊 BULK SCHEDULE COMPLETE');
    console.log('='.repeat(70));
    console.log(`✅ Successful: ${successCount}/${filesToProcess.length}`);
    console.log(`❌ Failed: ${failCount}/${filesToProcess.length}`);
    console.log(`📅 Start Date: November 26, 2025 at 7:00 AM EST`);
    console.log(`📅 End Date: ${startDate.add(filesToProcess.length - 1, 'day').format('YYYY-MM-DD')} at 7:00 AM EST`);
    console.log(`📱 Platforms: ${lateApiPlatforms.map((p: any) => p.platform).join(', ')}`);
    console.log('');

    if (successCount === filesToProcess.length) {
      console.log('🎉 ALL POSTS SCHEDULED SUCCESSFULLY!');
      console.log('   Check Late API dashboard to verify: https://getlate.dev/dashboard');
    } else {
      console.log('⚠️  Some posts failed. Review errors above.');
    }

  } catch (error: any) {
    console.error('\n❌ FATAL ERROR:');
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
bulkScheduleMotivationalV3();
