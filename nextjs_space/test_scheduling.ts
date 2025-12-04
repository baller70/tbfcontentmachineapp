import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function testScheduling() {
  try {
    console.log('🧪 Testing Late API Scheduling...\n');

    // Get Basketball Factory profile
    const profile = await prisma.profile.findFirst({
      where: { name: 'Basketball Factory' },
      include: { platformSettings: true }
    });

    if (!profile) {
      throw new Error('Basketball Factory profile not found');
    }

    console.log(`✅ Found profile: ${profile.name}`);
    console.log(`   Late Profile ID: ${profile.lateProfileId}`);

    // Get Instagram platform setting
    const instagramSetting = profile.platformSettings.find(
      ps => ps.platform === 'instagram' && ps.isConnected
    );

    if (!instagramSetting || !instagramSetting.platformId) {
      throw new Error('Instagram not connected or no platformId');
    }

    console.log(`✅ Instagram connected: ${instagramSetting.platformId}\n`);

    // Create a scheduled time for 5 minutes from now
    const scheduledTime = new Date(Date.now() + 5 * 60 * 1000);
    const scheduledFor = scheduledTime.toISOString();
    const timezone = 'America/New_York';

    console.log(`📅 Scheduling test post for: ${scheduledTime.toLocaleString('en-US', { timeZone: timezone })}`);
    console.log(`   ISO Format: ${scheduledFor}`);
    console.log(`   Timezone: ${timezone}\n`);

    // Prepare Late API payload
    const payload = {
      content: `🧪 TEST SCHEDULED POST\n\nThis is a test of the Late API scheduling system.\n\nScheduled for: ${scheduledTime.toLocaleString('en-US', { timeZone: timezone })}\n\n#TestPost #Automated`,
      scheduledFor: scheduledFor,
      timezone: timezone,
      platforms: [
        {
          platform: 'instagram',
          accountId: instagramSetting.platformId
        }
      ]
    };

    console.log('📤 Sending to Late API...');
    console.log('Payload:', JSON.stringify(payload, null, 2), '\n');

    // Send to Late API
    const response = await axios.post(
      'https://getlate.dev/api/v1/posts',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LATE_API_KEY}`
        }
      }
    );

    console.log('✅ Late API Response:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Post ID: ${response.data.id || response.data._id}`);
    console.log(`   Data:`, JSON.stringify(response.data, null, 2), '\n');

    // Wait 3 seconds and then fetch the post details
    console.log('⏳ Waiting 3 seconds to fetch post details...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const postId = response.data.id || response.data._id;
    if (postId) {
      const postDetails = await axios.get(
        `https://getlate.dev/api/v1/posts/${postId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.LATE_API_KEY}`
          }
        }
      );

      console.log('📋 Post Details from Late API:');
      console.log(`   Status: ${postDetails.data.status}`);
      console.log(`   Scheduled For: ${postDetails.data.scheduledFor || 'NOT SET'}`);
      console.log(`   Timezone: ${postDetails.data.timezone || 'NOT SET'}`);
      console.log(`   Created At: ${postDetails.data.createdAt}`);
      console.log(`   Platform Statuses:`, postDetails.data.platformPosts || postDetails.data.platforms);
    }

    console.log('\n✅ TEST COMPLETE');
    console.log('\nNext Steps:');
    console.log('1. Check Late API dashboard: https://getlate.dev/posts');
    console.log('2. Verify the post shows as "SCHEDULED"');
    console.log(`3. Wait until ${scheduledTime.toLocaleString('en-US', { timeZone: timezone })} to see if it posts`);

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:');
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Response:', JSON.stringify(error.response?.data, null, 2));
    } else {
      console.error(error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testScheduling();
