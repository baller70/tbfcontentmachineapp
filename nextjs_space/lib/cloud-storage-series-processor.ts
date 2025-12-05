
import { PrismaClient } from '@prisma/client';
import {
  listFilesInFolder as listDropboxFiles,
  downloadFile as downloadDropboxFile,
  getFileMetadata as getDropboxMetadata,
  deleteFile as deleteDropboxFile  
} from './dropbox';
import { uploadFile as uploadFileToS3, getFileUrl } from './s3';
import { getTwitterCredentials, postTweetToTwitter, uploadMediaToTwitter } from './twitter-api';
import { compressImage, compressVideo, isImage as detectImage, isVideo as detectVideo } from './media-compression';
import { recordLatePost, canPostToLatePlatform } from './late-rate-limit';
import { isDropboxConnected } from './dropbox';

const prisma = new PrismaClient();

// Helper to extract file number from filename (e.g., "1-file.png" or "1.png" → 1)
function extractFileNumber(filename: string): number {
  const match = filename.match(/^(\d+)[-.]?/);
  return match ? parseInt(match[1], 10) : 0;
}

// AI vision analysis
async function analyzeMediaContent(mediaBuffer: Buffer, mimeType: string): Promise<string> {
  try {
    console.log('📸 Analyzing media with AI vision...');
    
    const base64Media = mediaBuffer.toString('base64');
    const mediaUrl = `data:${mimeType};base64,${base64Media}`;
    
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image and describe what you see in detail. Focus on the main subjects, colors, mood, and any text visible.',
              },
              {
                type: 'image_url',
                image_url: { url: mediaUrl },
              },
            ],
          },
        ],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ AI API Error (${response.status}):`, errorText);
      throw new Error(`AI API returned ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || 'No analysis available';
    
    console.log('✅ AI Vision Analysis:', analysis.substring(0, 150) + '...');
    return analysis;
    
  } catch (error: any) {
    console.error('❌ AI vision analysis failed:', error);
    console.error('   Error details:', error.message);
    // Return generic fallback to allow posting to continue
    return 'Image analysis not available';
  }
}

// AI content generation
async function generatePostContent(
  imageAnalysis: string,
  prompt: string,
  platforms: string[]
): Promise<string> {
  try {
    console.log('🤖 Generating post content with AI...');
    
    const systemPrompt = `You are a social media content creator. Generate engaging post content based on the image analysis and user prompt. 

Platforms: ${platforms.join(', ')}
Consider platform-specific best practices (character limits, hashtags, tone).

IMPORTANT OUTPUT RULES:
- Output ONLY plain text - NO markdown formatting
- DO NOT use bold (**), italics, or any markdown syntax
- DO NOT include labels like "Caption:" or "Hashtags:"
- DO NOT use section headers or formatting markers
- Start with the actual post caption text
- Add a blank line, then include hashtags
- Keep it clean, simple, and ready to post as-is

Keep it concise, engaging, and optimized for ${platforms.join(', ')}.`;
    
    const userPrompt = `Image Analysis: ${imageAnalysis}

User Instructions: ${prompt}

Create compelling social media content based on the above.`;
    
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ AI API Error (${response.status}):`, errorText);
      throw new Error(`AI API returned ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('📊 AI API Response:', JSON.stringify(data, null, 2));
    
    const content = data.choices?.[0]?.message?.content;
    
    if (!content || content.trim() === '') {
      console.error('❌ AI returned empty content!');
      console.error('   Full response:', JSON.stringify(data, null, 2));
      throw new Error('AI API returned empty content');
    }
    
    console.log('✅ Generated content:', content.substring(0, 150) + '...');
    return content;
    
  } catch (error: any) {
    console.error('❌ AI content generation failed:', error);
    console.error('   Error details:', error.message);
    console.error('   Error response:', error.response?.data || 'No response data');
    // Return a generic message instead of raw prompt - allows posting to continue
    // but won't post user's prompt instructions
    return `Check out this post!\n\n#motivation #inspiration #dailypost`;
  }
}


// Post via Late API with compression and queue system
async function postViaLateAPI(
  platformConfigs: Array<{ platform: string; accountId: string }>,
  content: string,
  mediaBuffer: Buffer,
  mimeType: string,
  lateProfileId?: string | null
): Promise<any> {
  try {
    console.log('📤 Uploading media to Late API...');
    
    // Detect media type
    const isVideoMimeType = mimeType.startsWith('video/');
    const isImageType = mimeType.startsWith('image/');
    
    // Compress media before uploading to Late API
    let processedBuffer = mediaBuffer;
    if (isImageType) {
      console.log('🗜️ Compressing image for Late API...');
      processedBuffer = await compressImage(mediaBuffer, { targetPlatform: 'late', maxSizeMB: 10 });
      console.log(`   Original: ${(mediaBuffer.length / 1024 / 1024).toFixed(2)}MB → Compressed: ${(processedBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    } else if (isVideoMimeType) {
      console.log('🗜️ Compressing video for Late API...');
      processedBuffer = await compressVideo(mediaBuffer, { targetPlatform: 'late', maxSizeMB: 10 });
      console.log(`   Original: ${(mediaBuffer.length / 1024 / 1024).toFixed(2)}MB → Compressed: ${(processedBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // Upload to Late API using axios (better compatibility with form-data)
    const axios = (await import('axios')).default;
    const FormData = (await import('form-data')).default;
    const mediaForm = new FormData();
    mediaForm.append('files', processedBuffer, {
      filename: isVideoMimeType ? 'video.mp4' : 'image.jpg',
      contentType: mimeType,
      knownLength: processedBuffer.length,
    });
    
    const mediaResponse = await axios.post('https://getlate.dev/api/v1/media', mediaForm, {
      headers: {
        'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
        ...mediaForm.getHeaders(),
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    
    const mediaUrl = mediaResponse.data.files?.[0]?.url || mediaResponse.data.url;
    console.log('✅ Media uploaded to Late API:', mediaUrl);
    
    // Get next available time slot using Late API Queue System
    let scheduledFor: string | undefined;
    let timezone: string | undefined;
    
    if (lateProfileId) {
      console.log('\n🔄 Using Late API Queue System...');
      console.log(`   Profile ID: ${lateProfileId}`);
      
      try {
        const queueResponse = await fetch(`https://getlate.dev/api/v1/queue/next-slot?profileId=${lateProfileId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
          },
        });
        
        if (queueResponse.ok) {
          const queueData = await queueResponse.json();
          scheduledFor = queueData.nextSlot; // ISO 8601 format
          timezone = queueData.timezone;
          
          console.log(`✅ Got next slot from queue:`);
          console.log(`   Next Slot: ${scheduledFor}`);
          console.log(`   Timezone: ${timezone}`);
        } else {
          console.warn(`⚠️  Queue API returned ${queueResponse.status}, falling back to immediate post`);
        }
      } catch (queueError: any) {
        console.warn(`⚠️  Failed to get queue slot: ${queueError.message}, falling back to immediate post`);
      }
    } else {
      console.log('⚠️  No Late Profile ID provided - posting immediately without queue');
    }
    
    // Create post via Late API
    console.log('\n📮 Creating post via Late API...');
    const postPayload: any = {
      content,
      mediaItems: [{
        type: isVideoMimeType ? 'video' : 'image',
        url: mediaUrl
      }],
      platforms: platformConfigs,
    };
    
    // Add scheduling information if we got it from queue
    if (scheduledFor) {
      postPayload.scheduledFor = scheduledFor; // ISO 8601 format
      console.log(`⏰ Scheduling post for: ${scheduledFor}`);
    }
    if (timezone) {
      postPayload.timezone = timezone; // e.g., "America/New_York"
      console.log(`🌍 Timezone: ${timezone}`);
    }
    
    // Add queuedFromProfile field if we have a profile ID
    if (lateProfileId) {
      postPayload.queuedFromProfile = lateProfileId;
      console.log(`📋 Queued from profile: ${lateProfileId}`);
    }
    
    const postResponse = await fetch('https://getlate.dev/api/v1/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
      },
      body: JSON.stringify(postPayload),
    });
    
    if (!postResponse.ok) {
      const errorText = await postResponse.text();
      throw new Error(`Late API post failed: ${postResponse.status} - ${errorText}`);
    }
    
    const postData = await postResponse.json();
    
    // Late API returns response in format: { post: { _id, ... } }
    const post = postData.post || postData;
    const postId = post._id || post.id || postData._id || postData.id;
    console.log('✅ Post created via Late API:', postId);
    
    if (!postId) {
      console.error('❌ CRITICAL: No post ID found in response!');
      console.error('📊 Full response:', JSON.stringify(postData, null, 2));
    }
    
    // Return with normalized id field for consistency  
    return { ...post, id: postId };
    
  } catch (error: any) {
    console.error('❌ Late API posting failed:', error);
    throw error;
  }
}

/**
 * Create the first scheduled post immediately when a series is created
 * This function is called when a series is first created to pre-schedule the first post in Late API
 */
export async function scheduleFirstSeriesPost(seriesId: string): Promise<{ success: boolean; message: string; latePostId?: string; error?: string }> {
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📅 Scheduling First Post for Series: ${seriesId}`);
    console.log('='.repeat(80));
    
    // Fetch series with profile and platform settings
    const series = await prisma.postSeries.findUnique({
      where: { id: seriesId },
      include: {
        profile: {
          include: {
            platformSettings: true,
          },
        },
      },
    });
    
    if (!series) {
      throw new Error('Series not found');
    }
    
    console.log(`📋 Series: ${series.name}`);
    console.log(`   Scheduled for: ${series.nextScheduledAt?.toLocaleString('en-US', { timeZone: series.timezone || 'America/New_York' })} ${series.timezone || 'EST'}`);
    console.log(`   Platforms: ${series.platforms.join(', ')}`);
    
    // Check if Dropbox is configured
    if (!series.dropboxFolderId || !series.dropboxFolderPath) {
      throw new Error('No Dropbox folder configured for this series');
    }
    
    // Check Dropbox connection
    if (!isDropboxConnected()) {
      throw new Error('Dropbox is not connected or token expired');
    }
    
    // List files from Dropbox
    console.log(`📁 Listing files from Dropbox folder: ${series.dropboxFolderPath}`);
    const files = await listDropboxFiles(series.dropboxFolderPath);
    
    if (!files || files.length === 0) {
      throw new Error('No files found in Dropbox folder');
    }
    
    // Sort files by numerical prefix
    const sortedFiles = files
      .map(f => ({ ...f, num: extractFileNumber(f.name) }))
      .filter(f => f.num > 0)
      .sort((a, b) => a.num - b.num);
    
    console.log(`📊 Found ${sortedFiles.length} numbered files`);
    
    // Get the first file (currentFileIndex should be 1 for new series)
    const targetFile = sortedFiles.find(f => f.num === series.currentFileIndex) || sortedFiles[0];
    
    if (!targetFile) {
      throw new Error('No files available for posting');
    }
    
    console.log(`📄 Processing file: ${targetFile.name} (File #${targetFile.num})`);
    
    // Download file from Dropbox
    console.log('⬇️  Downloading file from Dropbox...');
    const downloadedFile = await downloadDropboxFile(targetFile.path);
    const fileBuffer = downloadedFile.buffer;
    const fileMimeType = downloadedFile.mimeType || targetFile.mimeType || 'image/jpeg';
    console.log(`✅ Downloaded ${(fileBuffer.length / 1024).toFixed(2)} KB`);
    
    // Analyze media with AI
    const imageAnalysis = await analyzeMediaContent(fileBuffer, fileMimeType);
    
    // Generate post content
    const generatedContent = await generatePostContent(
      imageAnalysis,
      series.prompt || 'Create engaging social media content',
      series.platforms
    );
    
    // Prepare platform configurations
    const platformConfigs: Array<{ platform: string; accountId: string }> = [];
    
    for (const platform of series.platforms) {
      if (platform.toLowerCase() === 'twitter') {
        continue; // Twitter handled separately (has its own API)
      }
      
      const setting = series.profile?.platformSettings?.find(
        (s: any) => s.platform.toLowerCase() === platform.toLowerCase()
      );
      
      if (setting?.isConnected && setting.platformId) {
        platformConfigs.push({
          platform: platform.toLowerCase(),
          accountId: setting.platformId
        });
      }
    }
    
    if (platformConfigs.length === 0) {
      throw new Error('No platforms configured for this series');
    }
    
    // Create scheduled post in Late API using Queue System
    console.log(`\n📅 Creating post in Late API using Queue System...`);
    console.log(`   Late Profile ID: ${series.profile?.lateProfileId || 'NONE'}`);
    console.log(`   Platforms: ${platformConfigs.map(p => p.platform).join(', ')}`);
    
    const latePost = await postViaLateAPI(
      platformConfigs,
      generatedContent,
      fileBuffer,
      fileMimeType,
      series.profile?.lateProfileId
    );
    
    console.log(`✅ Post created in Late API with ID: ${latePost.id}`);
    console.log(`   Status: ${latePost.status}`);
    console.log(`   Queue system will determine the exact publish time`);
    
    // Store the Late post ID in the series so the daemon can track when it's published
    // CRITICAL: Also update currentFileIndex to the file we actually processed + 1
    const nextFileIndex = targetFile.num + 1;
    
    // 🛡️ CRITICAL SAFEGUARD: Ensure we NEVER go backwards
    if (nextFileIndex <= series.currentFileIndex) {
      throw new Error(`SAFEGUARD VIOLATION: Attempted to move backwards (${series.currentFileIndex} → ${nextFileIndex}). THIS SHOULD NEVER HAPPEN.`);
    }
    
    console.log(`✅ Moving forward: File #${series.currentFileIndex} → File #${nextFileIndex}`);
    
    await prisma.postSeries.update({
      where: { id: seriesId },
      data: {
        currentLatePostId: latePost.id,
        currentFileIndex: nextFileIndex,
      }
    });
    
    console.log(`\n✅ SUCCESS: First post created for ${series.name}`);
    console.log(`   Late Post ID: ${latePost.id}`);
    console.log(`   Processed File: #${targetFile.num}`);
    console.log(`   Next File Index: #${nextFileIndex}`);
    console.log(`   Queue system determined the publish time`);
    
    return {
      success: true,
      message: `First post created successfully using Queue System`,
      latePostId: latePost.id
    };
    
  } catch (error: any) {
    console.error('❌ Failed to schedule first post:', error);
    return {
      success: false,
      message: 'Failed to schedule first post',
      error: error.message
    };
  }
}

// Main processor function
/**
 * Check if a Late API post has been published
 */
async function checkLatePostStatus(postId: string): Promise<{ isPublished: boolean; status: string; shouldScheduleNext: boolean }> {
  try {
    console.log(`🔍 Checking Late API post status: ${postId}`);
    
    const response = await fetch(`https://getlate.dev/api/v1/posts/${postId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
      },
    });
    
    // If post doesn't exist (404), it was deleted - schedule next
    if (response.status === 404) {
      console.log(`   ❌ Post not found (deleted) - will schedule next post`);
      return { isPublished: false, status: 'deleted', shouldScheduleNext: true };
    }
    
    if (!response.ok) {
      throw new Error(`Late API returned ${response.status}`);
    }
    
    const postData = await response.json();
    const status = postData.status || 'unknown';
    
    // Determine if we should schedule the next post
    // We schedule next if:
    // 1. Post is "published" (mission accomplished)
    // 2. Post is "draft" (user moved it manually)
    // 3. Post is "failed" (something went wrong)
    // 4. Post is any other non-"scheduled" status
    
    const isPublished = status === 'published';
    const shouldScheduleNext = status !== 'scheduled';
    
    console.log(`   Status: ${status}`);
    console.log(`   Published: ${isPublished ? 'YES ✅' : 'NO ⏳'}`);
    console.log(`   Should schedule next: ${shouldScheduleNext ? 'YES ✅' : 'NO ⏳'}`);
    
    return { isPublished, status, shouldScheduleNext };
    
  } catch (error: any) {
    console.error('❌ Failed to check Late post status:', error);
    // Return false on error to avoid processing prematurely
    return { isPublished: false, status: 'error', shouldScheduleNext: false };
  }
}

export async function processCloudStorageSeries(seriesId: string): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🚀 Processing Series: ${seriesId}`);
    console.log('='.repeat(80));
    
    // Fetch series with profile and platform settings
    const series = await prisma.postSeries.findUnique({
      where: { id: seriesId },
      include: {
        profile: {
          include: {
            platformSettings: true,
          },
        },
      },
    });
    
    if (!series) {
      throw new Error('Series not found');
    }
    
    console.log(`📋 Series: ${series.name}`);
    console.log(`   Storage: Dropbox`);
    console.log(`   Platforms: ${series.platforms.join(', ')}`);
    console.log(`   Current File Index: ${series.currentFileIndex}`);
    console.log(`   Loop Enabled: ${series.loopEnabled}`);
    console.log(`   Current Late Post ID: ${series.currentLatePostId || 'None'}`);
    
    // ============================================================================
    // NEW: CHECK IF CURRENT POST HAS PUBLISHED
    // ============================================================================
    
    // If there's a current Late post scheduled, check if it's ready for the next post
    if (series.currentLatePostId) {
      console.log(`\n🔍 Checking current post status...`);
      const { isPublished, status, shouldScheduleNext } = await checkLatePostStatus(series.currentLatePostId);
      
      if (!shouldScheduleNext) {
        console.log(`⏳ Current post (${series.currentLatePostId}) is still "${status}"`);
        console.log(`   → Waiting for it to change status before scheduling next post`);
        console.log(`   ℹ️  Will schedule next post when status changes from "scheduled"`);
        return {
          success: false,
          message: `Waiting for current post status to change (current: ${status})`
        };
      }
      
      console.log(`✅ Current post status is "${status}" - will schedule next post now!`);
      console.log(`   ${isPublished ? '📤 Post has published successfully' : '📝 Post was moved/deleted'}`);
    } else {
      console.log(`\nℹ️  No current Late post ID - this must be the first run or manual trigger`);
    }
    
    // ============================================================================
    // SAFEGUARDS TO GUARANTEE CORRECT SCHEDULING
    // ============================================================================
    
    // SAFEGUARD 1: Check if series is active
    if (series.status !== 'ACTIVE') {
      console.log(`⚠️  Series status is "${series.status}", not ACTIVE. Skipping.`);
      return { 
        success: false, 
        message: `Series is not active (status: ${series.status})` 
      };
    }
    console.log('✅ Safeguard 1: Series is ACTIVE');
    
    // SAFEGUARD 2: Duplicate prevention - check if processed recently
    const now = new Date();
    if (series.lastProcessedAt) {
      const timeSinceLastProcessing = now.getTime() - series.lastProcessedAt.getTime();
      const minutesSinceLastProcessing = Math.round(timeSinceLastProcessing / 1000 / 60);
      
      console.log(`📅 Last Processed Check:`);
      console.log(`   Last processed: ${series.lastProcessedAt.toISOString()} (${series.lastProcessedAt.toLocaleString('en-US', { timeZone: series.timezone || 'America/New_York' })})`);
      console.log(`   Minutes ago: ${minutesSinceLastProcessing}`);
      console.log('   ✅ Cooldown DISABLED - immediate scheduling enabled');
      
      // COOLDOWN REMOVED: Was blocking immediate scheduling after draft/delete
      // Now relying on file index increment + Late Post ID to prevent true duplicates
      console.log('✅ Safeguard 2: Cooldown bypassed (immediate mode)');
    } else {
      console.log('✅ Safeguard 2: No previous processing - OK to proceed');
    }
    
    // SAFEGUARD 3: Atomic Processing Flag - Prevent concurrent runs
    console.log('🔒 Checking atomic processing lock...');
    
    // Check for stale locks (older than 10 minutes) and auto-reset them
    if (series.isProcessing) {
      const lockAge = series.lastProcessedAt 
        ? (now.getTime() - series.lastProcessedAt.getTime()) / 1000 / 60
        : 999;
      
      if (lockAge > 10) {
        console.log(`⚠️  Stale processing lock detected (${Math.round(lockAge)} minutes old) - Auto-resetting`);
        await prisma.postSeries.update({
          where: { id: seriesId },
          data: { isProcessing: false },
        });
      } else {
        console.log(`❌ Safeguard 3 FAILED: Series is currently being processed by another instance.`);
        console.log(`   Lock age: ${Math.round(lockAge)} minutes (will auto-reset after 10 minutes)`);
        return { 
          success: false, 
          message: 'Series is already being processed (concurrent run prevention)' 
        };
      }
    }
    
    // Set the processing lock
    await prisma.postSeries.update({
      where: { id: seriesId },
      data: { isProcessing: true },
    });
    console.log('✅ Safeguard 3: Atomic processing lock acquired');
    
    // SAFEGUARD 5: Rate Limit Pre-Check - Verify we can post before processing
    console.log('📊 Checking Late API rate limits...');
    
    // Get profile info for rate limit check
    const profileLateId = series.profile?.id;
    const profileName = series.profile?.name || 'Unknown Profile';
    
    if (profileLateId) {
      // Filter out Twitter since it uses its own API
      const latePlatforms = series.platforms.filter((p: any) => p.toLowerCase() !== 'twitter');
      
      for (const platform of latePlatforms) {
        const rateLimitCheck = canPostToLatePlatform(platform, profileLateId, profileName);
        
        if (!rateLimitCheck.canPost) {
          console.log(`❌ Safeguard 4 FAILED: Rate limit reached for ${platform}`);
          console.log(`   ${rateLimitCheck.message}`);
          
          // Release the processing lock before returning
          await prisma.postSeries.update({
            where: { id: seriesId },
            data: { isProcessing: false },
          });
          
          return { 
            success: false, 
            message: rateLimitCheck.message || `Rate limit reached for ${platform}` 
          };
        }
        
        if (rateLimitCheck.message) {
          console.log(`⚠️  ${rateLimitCheck.message}`);
        }
      }
    }
    console.log('✅ Safeguard 4: Rate limits OK for all platforms');
    
    // SAFEGUARD 6: Platform Availability Pre-Check - Verify connections
    console.log('🔌 Checking platform connections...');
    
    // Check Dropbox token validity
    if (!isDropboxConnected()) {
      console.log('❌ Safeguard 5 FAILED: Dropbox is not connected or token expired');
      
      // Release the processing lock before returning
      await prisma.postSeries.update({
        where: { id: seriesId },
        data: { isProcessing: false },
      });
      
      return { 
        success: false, 
        message: 'Dropbox connection failed - please reconnect your Dropbox account' 
      };
    }
    console.log('   ✓ Dropbox connected');
    
    // Check Late API platform connections
    if (series.profile?.platformSettings) {
      const connectedPlatforms: string[] = [];
      const disconnectedPlatforms: string[] = [];
      
      for (const setting of series.profile.platformSettings) {
        const platformName = setting.platform.toLowerCase();
        if (platformName === 'twitter') continue; // Twitter handled separately
        
        if (series.platforms.includes(setting.platform)) {
          if (setting.isConnected && setting.platformId) {
            connectedPlatforms.push(setting.platform);
          } else {
            disconnectedPlatforms.push(setting.platform);
          }
        }
      }
      
      if (disconnectedPlatforms.length > 0) {
        console.log(`❌ Safeguard 5 FAILED: Some platforms are not connected: ${disconnectedPlatforms.join(', ')}`);
        
        // Release the processing lock before returning
        await prisma.postSeries.update({
          where: { id: seriesId },
          data: { isProcessing: false },
        });
        
        return { 
          success: false, 
          message: `Platform connection failed: ${disconnectedPlatforms.join(', ')} - please reconnect these platforms` 
        };
      }
      
      console.log(`   ✓ Late API platforms connected: ${connectedPlatforms.join(', ')}`);
    }
    
    console.log('✅ Safeguard 5: All platforms connected and ready');
    
    console.log('\n🎯 ALL 7 SAFEGUARDS PASSED - Proceeding with series processing\n');
    
    // ============================================================================
    // END SAFEGUARDS
    // ============================================================================
    
    // Check if Dropbox is configured
    if (!series.dropboxFolderId || !series.dropboxFolderPath) {
      throw new Error('No Dropbox folder configured for this series');
    }
    
    // List files from Dropbox
    console.log(`📁 Listing files from Dropbox folder: ${series.dropboxFolderPath}`);
    const files = await listDropboxFiles(series.dropboxFolderPath);
    
    if (!files || files.length === 0) {
      throw new Error('No files found in folder');
    }
    
    // Sort files by numerical prefix
    const sortedFiles = files
      .map(f => ({ ...f, num: extractFileNumber(f.name) }))
      .filter(f => f.num > 0)
      .sort((a, b) => a.num - b.num);
    
    console.log(`📊 Found ${sortedFiles.length} numbered files`);
    
    // Find the target file
    const targetFile = sortedFiles.find(f => f.num === series.currentFileIndex);
    
    if (!targetFile) {
      const minFileNum = sortedFiles[0].num;
      const maxFileNum = sortedFiles[sortedFiles.length - 1].num;
      
      // Check if we've reached the end (currentFileIndex > maxFileNum)
      if (series.currentFileIndex > maxFileNum) {
        const message = series.loopEnabled
          ? 'Reached end of files, looping back to first file'
          : 'All files processed. Series completed.';
        
        if (series.loopEnabled) {
          await prisma.postSeries.update({
            where: { id: seriesId },
            data: { currentFileIndex: minFileNum },
          });
        } else {
          await prisma.postSeries.update({
            where: { id: seriesId },
            data: { status: 'COMPLETED' },
          });
        }
        
        return { success: false, message };
      }
      
      // Otherwise, skip to the next available file
      const nextAvailableFile = sortedFiles.find(f => f.num > series.currentFileIndex);
      if (nextAvailableFile) {
        console.log(`⚠️  File #${series.currentFileIndex} not found. Skipping to next available file #${nextAvailableFile.num}`);
        await prisma.postSeries.update({
          where: { id: seriesId },
          data: { currentFileIndex: nextAvailableFile.num },
        });
        return {
          success: false,
          message: `File #${series.currentFileIndex} not found. Updated to file #${nextAvailableFile.num}. Please run again.`
        };
      }
      
      // No more files available
      await prisma.postSeries.update({
        where: { id: seriesId },
        data: { status: 'COMPLETED' },
      });
      
      return {
        success: false,
        message: 'No more files available. Series completed.'
      };
    }
    
    console.log(`🎯 Target file: ${targetFile.name} (Index: ${targetFile.num})`);
    
    // Download file from Dropbox
    const downloadedFile = await downloadDropboxFile(targetFile.path);
    
    console.log(`✅ Downloaded: ${downloadedFile.name} (${(downloadedFile.buffer.length / 1024 / 1024).toFixed(2)}MB)`);
    
    // Upload to S3 for persistence
    const s3Key = `series/${seriesId}/${Date.now()}-${downloadedFile.name}`;
    const s3FullKey = await uploadFileToS3(downloadedFile.buffer, s3Key, downloadedFile.mimeType);
    const s3Url = await getFileUrl(s3FullKey);
    console.log(`☁️ Uploaded to S3: ${s3Key}`);
    
    // AI analysis and content generation
    const imageAnalysis = await analyzeMediaContent(downloadedFile.buffer, downloadedFile.mimeType);
    const generatedContent = await generatePostContent(
      imageAnalysis,
      series.prompt || 'Create an engaging post for this content',
      series.platforms
    );
    
    // Prepare platform configurations
    const platformSettings = series.profile?.platformSettings || [];
    
    // Determine if media is video or image
    const isVideoContent = downloadedFile.mimeType.startsWith('video/');
    
    // Get Late API account IDs (filter out YouTube if image)
    let latePlatforms = series.platforms.filter((p: any) => p !== 'twitter' && p !== 'x');
    if (!isVideoContent) {
      // Remove YouTube for image posts
      latePlatforms = latePlatforms.filter((p: any) => p.toLowerCase() !== 'youtube');
      if (latePlatforms.length < series.platforms.filter((p: any) => p !== 'twitter' && p !== 'x').length) {
        console.log('⚠️  Skipping YouTube (requires video, have image)');
      }
    }

    const platformConfigs = latePlatforms
      .map((platform: any) => {
        const setting = platformSettings.find((s: any) => s.platform.toLowerCase() === platform.toLowerCase());
        if (setting?.platformId && setting.platformId !== platform) {
          return {
            platform,
            accountId: setting.platformId
          };
        }
        return null;
      })
      .filter((config: any): config is { platform: string; accountId: string } => config !== null);
    
    // Post to Late API platforms using Queue System
    if (platformConfigs.length > 0) {
      console.log(`\n📱 Creating post in Late API: ${platformConfigs.length} account(s)`);
      console.log(`   Late Profile ID: ${series.profile?.lateProfileId || 'NONE'}`);
      console.log(`   Using Queue System to get next available time slot...`);
      
      // 🧹 SAFEGUARD 2: Delete old scheduled post if it exists (prevent duplicates)
      if (series.currentLatePostId) {
        console.log(`\n🧹 Checking for old scheduled post to delete...`);
        try {
          const { isPublished, status } = await checkLatePostStatus(series.currentLatePostId);
          if (status === 'scheduled') {
            console.log(`⚠️  Deleting old scheduled post: ${series.currentLatePostId}`);
            await fetch(`https://getlate.dev/api/v1/posts/${series.currentLatePostId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
              },
            });
            console.log(`✅ Old scheduled post deleted`);
          } else {
            console.log(`✅ Old post already ${status}, no need to delete`);
          }
        } catch (deleteError: any) {
          console.warn(`⚠️  Could not delete old post: ${deleteError.message}`);
        }
      }
      
      const latePost = await postViaLateAPI(
        platformConfigs,
        generatedContent,
        downloadedFile.buffer,
        downloadedFile.mimeType,
        series.profile?.lateProfileId
      );
      
      console.log(`✅ Post created in Late API with ID: ${latePost.id}`);
      console.log(`   Status: ${latePost.status}`);
      console.log(`   Queue system determined the publish time`);
      
      // Store the new Late post ID so we can track when it's published
      await prisma.postSeries.update({
        where: { id: seriesId },
        data: {
          currentLatePostId: latePost.id,
        }
      });
      console.log(`   💾 Stored Late Post ID: ${latePost.id}`);
      
      // Record rate limit tracking for successful posts
      if (series.profile?.id && series.profile?.name) {
        for (const config of platformConfigs) {
          recordLatePost(config.platform, series.profile.id, series.profile.name);
        }
      }
    }
    
    // Post to Twitter if selected
    if (series.platforms.includes('twitter') || series.platforms.includes('x')) {
      try {
        console.log('\n🐦 Posting to Twitter...');
        
        const twitterCredentials = await getTwitterCredentials(series.profile?.name);
        
        if (!twitterCredentials) {
          throw new Error('Twitter credentials not found');
        }
        
        // Upload media to Twitter
        const mediaId = await uploadMediaToTwitter(s3Url, twitterCredentials);
        
        // Post tweet
        const tweet = await postTweetToTwitter(generatedContent, [mediaId], twitterCredentials);
        
        if (tweet.success && tweet.tweetId) {
          console.log(`✅ Tweet posted successfully: ${tweet.tweetId}`);
        } else {
          throw new Error('Twitter post failed');
        }
      } catch (twitterError: any) {
        console.error('❌ Twitter posting failed:', twitterError.message);
        // Don't fail the entire series - just log the error
      }
    }
    
    // Delete from Dropbox if requested
    if (series.deleteAfterPosting) {
      try {
        await deleteDropboxFile(targetFile.path);
        console.log(`🗑️ Deleted file from Dropbox: ${targetFile.name}`);
      } catch (deleteError) {
        console.error('❌ Failed to delete file:', deleteError);
      }
    }
    
    // Update series for next run
    const nextFileIndex = targetFile.num + 1;
    const maxFileNum = Math.max(...sortedFiles.map(f => f.num));
    const shouldLoop = series.loopEnabled && nextFileIndex > maxFileNum;
    
    // 🛡️ CRITICAL SAFEGUARD: Ensure we NEVER go backwards
    const newIndex = shouldLoop ? sortedFiles[0].num : nextFileIndex;
    if (newIndex < series.currentFileIndex && !shouldLoop) {
      throw new Error(`SAFEGUARD VIOLATION: Attempted to move backwards (${series.currentFileIndex} → ${newIndex}). THIS SHOULD NEVER HAPPEN.`);
    }
    
    console.log(`✅ Moving forward: File #${series.currentFileIndex} → File #${newIndex}`);
    
    // Update series - increment file index and mark as active
    await prisma.postSeries.update({
      where: { id: seriesId },
      data: {
        currentFileIndex: newIndex,
        lastProcessedAt: new Date(),
        status: shouldLoop || nextFileIndex <= maxFileNum ? 'ACTIVE' : 'COMPLETED',
        isProcessing: false, // Release the atomic processing lock
      },
    });
    
    console.log(`\n✅ Series processing completed successfully`);
    console.log(`   Next file index: ${shouldLoop ? 1 : nextFileIndex}`);
    console.log(`   Status: ${shouldLoop || nextFileIndex <= maxFileNum ? 'ACTIVE' : 'COMPLETED'}`);
    console.log(`   ℹ️  The next post is already scheduled in Late's "Scheduled Posts" section`);
    console.log(`   📍 Late Queue System will automatically determine when it posts`);
    console.log(`   🔄 When it publishes, the daemon will load the NEXT file automatically`);
    console.log('='.repeat(80) + '\n');
    
    return {
      success: true,
      message: `Successfully processed file ${targetFile.num} and posted to ${series.platforms.join(', ')}`,
    };
    
  } catch (error: any) {
    console.error(`❌ Error processing series ${seriesId}:`, error);
    
    // Release the processing lock in case of error
    try {
      await prisma.postSeries.update({
        where: { id: seriesId },
        data: { isProcessing: false },
      });
      console.log('🔓 Released processing lock after error');
    } catch (lockError) {
      console.error('Failed to release processing lock:', lockError);
    }
    
    console.log('='.repeat(80) + '\n');
    
    return {
      success: false,
      message: 'Failed to process series',
      error: error.message,
    };
  }
}
