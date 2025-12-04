import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function testRiseAsOneAllPlatforms() {
  console.log('🧪 COMPLETE TEST: Rise as One - ALL PLATFORMS\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Load Rise as One profile
    console.log('📋 Step 1: Loading Rise as One profile...');
    const profile = await prisma.profile.findFirst({
      where: { name: 'Rise as One' },
      include: {
        platformSettings: {
          where: {
            isConnected: true,
            platform: { not: 'twitter' }
          }
        }
      }
    });

    if (!profile) {
      throw new Error('Rise as One profile not found');
    }

    console.log(`✅ Profile loaded: ${profile.name}`);
    console.log(`   ID: ${profile.id}`);
    console.log(`   Connected Platforms: ${profile.platformSettings.length}`);
    
    for (const ps of profile.platformSettings) {
      console.log(`      - ${ps.platform}: ${ps.platformId || 'No Late ID'}`);
    }

    // 2. Download test image
    console.log('\n📷 Step 2: Downloading test basketball image...');
    const imageUrl = 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800';
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);
    
    // Save temporarily
    const tempImagePath = '/tmp/rise_test_image.jpg';
    fs.writeFileSync(tempImagePath, imageBuffer);
    console.log(`✅ Downloaded image: ${imageBuffer.length} bytes`);

    // 3. Generate AI content
    console.log('\n📝 Step 3: Generating AI content for Rise as One...');
    
    const contentPrompt = `Create an inspirational social media post for Rise as One AAU Basketball program. 
Focus on youth development, teamwork, character building, and basketball excellence. 
Make it motivational and engaging for parents and young athletes.`;

    const aiResponse = await axios.post(
      'https://apps.abacus.ai/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a social media content creator for a youth basketball program.

CRITICAL FORMATTING RULES:
- Output ONLY plain text
- NO markdown formatting (no **, no *, no #)
- NO labels like "Caption:" or "Hashtags:" or "Text:"
- NO section headers
- Start with the post caption text directly
- After caption, add a blank line
- Then add hashtags on new lines

The output should be clean text ready to copy-paste directly to social media.`
          },
          {
            role: 'user',
            content: contentPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const generatedContent = aiResponse.data.choices[0].message.content.trim();
    console.log('✅ AI Content Generated:');
    console.log(`   Preview: ${generatedContent.substring(0, 100)}...`);

    // 4. Upload media to Late API
    console.log('\n🚀 Step 4: Uploading media to Late API...');
    
    const FormData = require('form-data');
    const mediaForm = new FormData();
    mediaForm.append('files', fs.createReadStream(tempImagePath), {
      filename: 'basketball.jpg',
      contentType: 'image/jpeg'
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
    console.log(`✅ Media uploaded: ${mediaUrl}`);

    // 5. Post to Late API with ALL platforms EXCEPT YOUTUBE (requires video)
    console.log('\n🎯 Step 5: Posting to ALL Rise as One platforms (except YouTube)...');
    
    // Filter out YouTube since we're testing with images
    const platformsToPost = profile.platformSettings.filter(ps => 
      ps.platformId && ps.platform !== 'youtube'
    );

    console.log(`✅ Platforms to post: ${platformsToPost.length}`);
    for (const ps of platformsToPost) {
      console.log(`   - ${ps.platform}: ${ps.platformId}`);
    }

    const latePayload = {
      content: generatedContent,
      platforms: platformsToPost.map(ps => ({
        platform: ps.platform,
        accountId: ps.platformId
      })),
      mediaItems: [{ url: mediaUrl, type: 'image' }]
    };

    console.log('   Late API Payload:');
    console.log(`   - Content length: ${generatedContent.length} chars`);
    console.log(`   - Media items: 1 image`);
    console.log(`   - Platforms: ${latePayload.platforms.map(p => p.platform).join(', ')}`);

    const lateResponse = await axios.post(
      'https://getlate.dev/api/v1/posts',
      latePayload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Late API Response: ${lateResponse.status}`);
    const postId = lateResponse.data._id || lateResponse.data.id;
    console.log(`   Post ID: ${postId}`);

    // 6. Verify post on Late API
    if (postId) {
      console.log('\n🔍 Step 6: Verifying post on Late API...');
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const postDetails = await axios.get(
        `https://getlate.dev/api/v1/posts/${postId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.LATE_API_KEY}`
          }
        }
      );

      console.log('✅ Post Verified:');
      console.log(`   Status: ${postDetails.data.status}`);
      console.log(`   Platforms:`);
      
      for (const platform of postDetails.data.platforms || []) {
        const statusIcon = platform.status === 'published' ? '✅' : 
                          platform.status === 'failed' ? '❌' : '⏳';
        console.log(`      ${statusIcon} ${platform.platform}: ${platform.status}`);
        if (platform.externalUrl) {
          console.log(`         URL: ${platform.externalUrl}`);
        }
        if (platform.errorMessage) {
          console.log(`         Error: ${platform.errorMessage}`);
        }
      }
    }

    // 7. Clean up temp file
    fs.unlinkSync(tempImagePath);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ TEST COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📝 Summary:');
    console.log(`   ✅ Profile: Rise as One`);
    console.log(`   ✅ AI Content Generated`);
    console.log(`   ✅ Media Uploaded`);
    console.log(`   ✅ Posted to ${platformsToPost.length} platforms (Instagram, Facebook, Threads)`);
    console.log(`   ⚠️  YouTube excluded (requires video content)`);
    console.log(`   ✅ Post ID: ${postId}\n`);

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:');
    if (error.response) {
      console.error('   HTTP Status:', error.response.status);
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Error:', error.message);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testRiseAsOneAllPlatforms().catch(console.error);
