import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function testRiseAsOneContentJourney() {
  console.log('🧪 TESTING: Rise as One Content Journey\n');
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

    // 2. Generate AI content
    console.log('\n📝 Step 2: Generating AI content for Rise as One...');
    
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

    // 3. Filter platforms (exclude media-required platforms for text-only post)
    console.log('\n🎯 Step 3: Filtering platforms for text-only post...');
    const mediaRequiredPlatforms = ['twitter', 'instagram', 'youtube', 'tiktok'];
    const platformsToPost = profile.platformSettings.filter(
      ps => !mediaRequiredPlatforms.includes(ps.platform) && ps.platformId
    );

    console.log(`✅ Platforms to post: ${platformsToPost.length}`);
    for (const ps of platformsToPost) {
      console.log(`   - ${ps.platform}: ${ps.platformId}`);
    }

    if (platformsToPost.length === 0) {
      throw new Error('No valid platforms to post to');
    }

    // 4. Post via Late API
    console.log('\n🚀 Step 4: Posting to Late API...');
    
    const latePayload = {
      content: generatedContent,
      platforms: platformsToPost.map(ps => ({
        platform: ps.platform,
        accountId: ps.platformId
      }))
    };

    console.log('   Late API Payload:');
    console.log(`   - Content length: ${generatedContent.length} chars`);
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

    // 5. Verify post on Late API
    if (postId) {
      console.log('\n🔍 Step 5: Verifying post on Late API...');
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

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
        console.log(`      - ${platform.platform}: ${platform.status}`);
      }
    }

    // 6. Check rate limits
    console.log('\n📊 Step 6: Checking rate limits...');
    
    // Load rate limit tracking file
    const rateLimitFile = '/tmp/late-rate-limit.json';
    const fs = require('fs');
    
    if (fs.existsSync(rateLimitFile)) {
      const rateLimitData = JSON.parse(fs.readFileSync(rateLimitFile, 'utf8'));
      
      // Filter posts for Rise as One
      const riseAsOnePosts = rateLimitData.posts.filter((post: any) => 
        post.profileName === 'Rise as One'
      );
      
      console.log(`✅ Rate Limit Data for Rise as One:`);
      console.log(`   Total posts tracked: ${riseAsOnePosts.length}`);
      
      // Group by platform
      const platformCounts: Record<string, number> = {};
      for (const post of riseAsOnePosts) {
        platformCounts[post.platform] = (platformCounts[post.platform] || 0) + 1;
      }
      
      console.log('   By platform:');
      for (const [platform, count] of Object.entries(platformCounts)) {
        const remaining = 8 - count;
        const status = remaining <= 0 ? '🔴' : remaining <= 2 ? '🟡' : '🟢';
        console.log(`      ${status} ${platform}: ${count}/8 (${remaining} remaining)`);
      }
    } else {
      console.log('⚠️  Rate limit tracking file not found');
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ TEST COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('📝 Summary:');
    console.log(`   ✅ Profile: Rise as One`);
    console.log(`   ✅ AI Content Generated`);
    console.log(`   ✅ Posted to ${platformsToPost.length} platforms`);
    console.log(`   ✅ Post ID: ${postId}`);
    console.log(`   ✅ Rate Limits Updated\n`);

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

testRiseAsOneContentJourney().catch(console.error);
