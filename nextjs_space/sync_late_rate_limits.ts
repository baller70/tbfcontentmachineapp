import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();
const LATE_API_KEY = process.env.LATE_API_KEY;

interface LateAPIPost {
  _id: string;
  createdAt: string;
  platforms: Array<{
    platform: string;
    accountId: {
      _id: string;
      profileId: string | { _id: string };
    };
    status: string;
  }>;
}

async function syncRateLimitsFromLateAPI() {
  console.log('🔄 Syncing Rate Limits from Late API\n');
  console.log('════════════════════════════════════════════════════════\n');

  if (!LATE_API_KEY) {
    console.error('❌ LATE_API_KEY not found');
    return;
  }

  try {
    // 1. Get all profiles from database
    console.log('📋 Step 1: Fetching profiles from database...');
    const profiles = await prisma.profile.findMany({
      include: {
        platformSettings: {
          where: {
            isConnected: true,
            platform: { not: 'twitter' }
          }
        }
      }
    });

    console.log(`✅ Found ${profiles.length} profiles\n`);

    // 2. Get posts from today from Late API (in EST)
    const now = new Date();
    const estOffset = -5; // EST is UTC-5
    const estDate = new Date(now.getTime() + (estOffset * 60 * 60 * 1000));
    const todayEST = new Date(estDate);
    todayEST.setHours(0, 0, 0, 0);
    
    // Convert back to UTC for API query
    const todayUTC = new Date(todayEST.getTime() - (estOffset * 60 * 60 * 1000));
    const todayUTCString = todayUTC.toISOString();

    console.log('📋 Step 2: Fetching today\'s posts from Late API...');
    console.log(`   Today in EST: ${todayEST.toLocaleString('en-US', { timeZone: 'America/New_York' })}`);
    console.log(`   Query from: ${todayUTCString} (UTC)\n`);

    const postsResponse = await axios.get(
      `https://getlate.dev/api/v1/posts`,
      {
        headers: {
          'Authorization': `Bearer ${LATE_API_KEY}`
        }
      }
    );

    const allPosts: LateAPIPost[] = postsResponse.data.posts || [];
    
    // Filter to today's posts (since midnight EST)
    const todaysPosts = allPosts.filter(post => {
      const postDate = new Date(post.createdAt);
      return postDate >= todayUTC;
    });

    console.log(`✅ Found ${todaysPosts.length} posts created today\n`);

    // 3. Count posts by account
    console.log('📋 Step 3: Counting posts by account and platform...\n');

    const rateLimitData: Record<string, Record<string, number>> = {};

    for (const post of todaysPosts) {
      for (const platformData of post.platforms || []) {
        if (platformData.status === 'published' || platformData.status === 'scheduled') {
          const accountId = platformData.accountId?._id;
          const platform = platformData.platform;

          if (accountId && platform) {
            if (!rateLimitData[accountId]) {
              rateLimitData[accountId] = {};
            }
            rateLimitData[accountId][platform] = (rateLimitData[accountId][platform] || 0) + 1;
          }
        }
      }
    }

    // 4. Display results by profile
    console.log('📊 RATE LIMIT REPORT (From Late API)\n');
    console.log('════════════════════════════════════════════════════════\n');

    for (const profile of profiles) {
      console.log(`\n🏢 ${profile.name}:`);
      console.log(`   Profile ID: ${profile.id}`);

      const platforms = ['instagram', 'facebook', 'linkedin', 'threads', 'tiktok', 'bluesky', 'youtube'];

      for (const platform of platforms) {
        const setting = profile.platformSettings.find(ps => ps.platform === platform);
        
        if (setting && setting.platformId) {
          const count = rateLimitData[setting.platformId]?.[platform] || 0;
          const remaining = 8 - count;
          const status = remaining === 0 ? '🔴' : remaining <= 2 ? '🟡' : '🟢';
          
          console.log(`   ${status} ${platform.padEnd(12)}: ${count}/8 (${remaining} left)`);
        } else {
          console.log(`   ⚪ ${platform.padEnd(12)}: Not connected`);
        }
      }
    }

    console.log('\n\n════════════════════════════════════════════════════════');
    console.log('✅ Rate Limit Sync Complete!\n');

    // 5. Save to tracking file
    const trackingFile = '/tmp/late-rate-limit-sync.json';
    const syncData = {
      lastSync: new Date().toISOString(),
      profiles: profiles.map(profile => ({
        profileId: profile.id,
        profileName: profile.name,
        platforms: ['instagram', 'facebook', 'linkedin', 'threads', 'tiktok', 'bluesky', 'youtube'].map(platform => {
          const setting = profile.platformSettings.find(ps => ps.platform === platform);
          const accountId = setting?.platformId;
          const count = accountId ? (rateLimitData[accountId]?.[platform] || 0) : 0;
          
          return {
            platform,
            accountId: accountId || null,
            count,
            limit: 8,
            remaining: 8 - count
          };
        })
      }))
    };

    fs.writeFileSync(trackingFile, JSON.stringify(syncData, null, 2));
    console.log(`💾 Saved sync data to: ${trackingFile}\n`);

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Response:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

syncRateLimitsFromLateAPI().catch(console.error);
