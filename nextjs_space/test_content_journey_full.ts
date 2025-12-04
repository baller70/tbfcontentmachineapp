
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function testCompleteContentJourney() {
  console.log('🚀 TESTING COMPLETE CONTENT JOURNEY - TEMPLATE TO SOCIAL MEDIA\n');
  console.log('═'.repeat(80));

  try {
    // Step 1: Get Basketball Factory profile
    console.log('\n📋 STEP 1: Loading Basketball Factory profile...');
    const profile = await prisma.profile.findFirst({
      where: { name: 'Basketball Factory' },
      include: {
        platformSettings: {
          where: {
            isConnected: true
          }
        }
      }
    });

    if (!profile) {
      throw new Error('Basketball Factory profile not found');
    }

    console.log(`✅ Profile loaded: ${profile.name} (ID: ${profile.id})`);
    console.log(`   Connected platforms: ${profile.platformSettings.length}`);
    profile.platformSettings.forEach(ps => {
      console.log(`   - ${ps.platform}: ${ps.isConnected ? '✅' : '❌'}`);
    });

    // Step 2: Get a template (any template for testing)
    console.log('\n📋 STEP 2: Loading a template...');
    const template = await prisma.template.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    if (template) {
      console.log(`✅ Template loaded: "${template.name}" (ID: ${template.id})`);
      console.log(`   Category: ${template.category}`);
      console.log(`   Image URL: ${template.imageUrl}`);
    } else {
      console.log(`⚠️  No templates found - proceeding without template`);
    }

    // Step 3: Generate content using AI directly
    console.log('\n📋 STEP 3: Generating content with AI...');
    
    const contentPrompt = `Create a motivational basketball post with:
- An inspiring caption about teamwork and dedication
- 5-7 relevant hashtags
- Encouraging tone for young athletes`;

    console.log(`   Using prompt: "${contentPrompt}"`);
    
    // Call Abacus AI directly
    const aiResponse = await axios.post('https://apps.abacus.ai/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert social media content creator specializing in motivational sports content. Output ONLY plain text - NO markdown formatting. DO NOT use bold (**), italics, or any markdown syntax. DO NOT include labels like "Caption:" or "Hashtags:". Start directly with the actual post text, then add a blank line, then hashtags.'
        },
        {
          role: 'user',
          content: contentPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const generatedContent = aiResponse.data.choices[0].message.content.trim();
    console.log(`✅ Content generated successfully`);
    console.log(`   Content preview: ${generatedContent.substring(0, 100)}...`);

    // Step 4: Prepare platforms for posting
    console.log('\n📋 STEP 4: Preparing platforms for posting...');
    
    // Exclude Instagram, YouTube, and TikTok since they require media
    const platformsToPost = profile.platformSettings
      .filter(ps => ps.isConnected && ps.platform !== 'twitter' && ps.platform !== 'instagram' && ps.platform !== 'youtube' && ps.platform !== 'tiktok')
      .map(ps => ps.platform);

    console.log(`   Platforms to post to: ${platformsToPost.join(', ')}`);
    console.log(`   Total platforms: ${platformsToPost.length}`);
    console.log(`   Note: Excluded Instagram, YouTube, and TikTok (require media)`);

    // Step 5: Post to social media via Late API
    console.log('\n📋 STEP 5: Posting to social media platforms via Late API...');
    console.log('⏳ This may take 30-60 seconds...\n');

    // Get the Late account ID for Basketball Factory
    const instagramSetting = profile.platformSettings.find(ps => ps.platform === 'instagram');
    if (!instagramSetting?.platformId) {
      throw new Error('Basketball Factory Late API account ID not configured');
    }

    const lateAccountId = instagramSetting.platformId;
    console.log(`   Using Late Account ID: ${lateAccountId}`);

    // Map each platform to its account ID from platform settings
    const platformAccounts = platformsToPost.map(platform => {
      const setting = profile.platformSettings.find(ps => ps.platform === platform);
      if (!setting?.platformId) {
        console.warn(`   Warning: ${platform} has no platformId configured`);
        return null;
      }
      return {
        platform: platform.toLowerCase(),
        accountId: setting.platformId
      };
    }).filter(Boolean);

    console.log(`   Platform accounts configured: ${platformAccounts.length}`);

    // Prepare payload for Late API
    const latePayload = {
      content: generatedContent,
      platforms: platformAccounts,
      mediaItems: []
    };

    const postResponse = await axios.post('https://getlate.dev/api/v1/posts', latePayload, {
      headers: {
        'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000 // 2 minute timeout
    });

    console.log('\n📊 POST RESULTS:');
    console.log('═'.repeat(80));

    // Log the full response for debugging
    console.log('Late API Response:', JSON.stringify(postResponse.data, null, 2));

    if (postResponse.status === 200 || postResponse.status === 201) {
      const latePost = postResponse.data;
      console.log('✅ POST SUCCESSFUL!\n');
      
      const postId = latePost.id || latePost._id || latePost.postId;
      console.log(`📝 Late API Post ID: ${postId || 'N/A'}`);
      console.log(`   Status: ${latePost.status || 'N/A'}`);
      console.log(`   Created: ${latePost.createdAt || 'N/A'}`);
      console.log(`   Content: ${latePost.content?.substring(0, 100) || 'N/A'}...`);

      // Step 6: Wait and verify platform statuses
      if (postId) {
        console.log('\n📋 STEP 6: Waiting for platform posting (5 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const verifyResponse = await axios.get(
          `https://getlate.dev/api/v1/posts/${postId}`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.LATE_API_KEY}`
            }
          }
        );

        const verifiedPost = verifyResponse.data;
        console.log(`✅ Post verified in Late API`);
        
        if (verifiedPost.platformPosts) {
          console.log('\n🌐 PLATFORM-SPECIFIC RESULTS:');
          Object.entries(verifiedPost.platformPosts).forEach(([platform, data]: [string, any]) => {
            const status = data.status || 'unknown';
            const icon = status === 'published' ? '✅' : status === 'failed' ? '❌' : '⏳';
            console.log(`   ${icon} ${platform}: ${status}${data.errorMessage ? ` (${data.errorMessage})` : ''}`);
          });
        }
      } else {
        console.log('\n⚠️  No post ID returned - skipping verification');
      }

      // Summary
      console.log('\n' + '═'.repeat(80));
      console.log('✅ CONTENT JOURNEY TEST COMPLETE!');
      console.log('═'.repeat(80));
      console.log('\nSUCCESS SUMMARY:');
      if (template) {
        console.log(`✅ Template referenced: "${template.name}"`);
      } else {
        console.log(`✅ Generated content without template`);
      }
      console.log(`✅ Content generated using AI`);
      console.log(`✅ Posted to ${platformsToPost.length} platforms`);
      console.log(`✅ Late API post created: ${latePost.id || latePost._id}`);
      
      console.log('\n📱 VERIFY ON SOCIAL MEDIA:');
      console.log('Please check the following platforms manually:');
      platformsToPost.forEach(platform => {
        console.log(`   - ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
      });
      
      console.log('\n💡 TIP: Log into each platform to confirm the post appears in your feed.');
      
    } else {
      console.log('❌ POST FAILED');
      console.log(`   HTTP Status: ${postResponse.status}`);
      console.log(`   Response: ${JSON.stringify(postResponse.data, null, 2)}`);
    }

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:');
    console.error('═'.repeat(80));
    
    if (axios.isAxiosError(error)) {
      console.error(`HTTP Error: ${error.response?.status} ${error.response?.statusText}`);
      console.error('Response:', JSON.stringify(error.response?.data, null, 2));
    } else {
      console.error(error.message);
      console.error(error.stack);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCompleteContentJourney();
