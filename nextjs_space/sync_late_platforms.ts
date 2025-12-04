import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const prisma = new PrismaClient();

interface RateLimitData {
  posts: Array<{
    platform: string;
    profileId: string;
    profileName: string;
    timestamp: number;
  }>;
  lastCleanup: number;
}

async function syncWithLateAPI() {
  console.log('🔄 Syncing rate limits with Late API...\n');
  
  const LATE_API_KEY = process.env.LATE_API_KEY;
  
  if (!LATE_API_KEY) {
    console.error('❌ LATE_API_KEY not found');
    return;
  }
  
  try {
    // 1. Get all profiles with Late account IDs
    const profiles = await prisma.profile.findMany({
      include: {
        platformSettings: {
          where: {
            isConnected: true,
            platform: { not: 'twitter' },
            platformId: { not: null }
          }
        }
      }
    });
    
    console.log(`📋 Found ${profiles.length} profiles\n`);
    
    // 2. Fetch recent posts from Late API
    const postsResponse = await axios.get('https://getlate.dev/api/v1/posts', {
      headers: {
        'Authorization': `Bearer ${LATE_API_KEY}`
      },
      params: {
        limit: 100  // Get more posts to ensure we capture all in 24h
      }
    });
    
    const posts = postsResponse.data.posts || postsResponse.data;
    console.log(`✅ Fetched ${posts.length} posts from Late API\n`);
    
    // 3. Filter posts from last 24 hours
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    
    const recentPosts = posts.filter((post: any) => {
      const postDate = new Date(post.createdAt).getTime();
      return postDate >= last24Hours;
    });
    
    console.log(`📅 Posts in last 24 hours: ${recentPosts.length}\n`);
    
    // 4. Build tracking data structure
    const trackingData: RateLimitData = {
      posts: [],
      lastCleanup: now
    };
    
    // Map Late account IDs to our profile IDs
    const accountToProfile = new Map<string, { profileId: string; profileName: string; platform: string }>();
    
    for (const profile of profiles) {
      for (const setting of profile.platformSettings) {
        if (setting.platformId) {
          accountToProfile.set(setting.platformId, {
            profileId: profile.id,
            profileName: profile.name,
            platform: setting.platform
          });
        }
      }
    }
    
    // 5. Process each post
    for (const post of recentPosts) {
      if (post.platforms && Array.isArray(post.platforms)) {
        for (const platform of post.platforms) {
          if (platform.status === 'published' || platform.status === 'scheduled') {
            const accountId = platform.accountId?._id || platform.accountId;
            const profileInfo = accountToProfile.get(accountId);
            
            if (profileInfo && profileInfo.platform === platform.platform) {
              trackingData.posts.push({
                platform: platform.platform,
                profileId: profileInfo.profileId,
                profileName: profileInfo.profileName,
                timestamp: new Date(post.createdAt).getTime()
              });
            }
          }
        }
      }
    }
    
    console.log(`✅ Processed ${trackingData.posts.length} successful posts\n`);
    
    // 6. Group by profile and platform for display
    const summary: Record<string, Record<string, number>> = {};
    
    for (const post of trackingData.posts) {
      if (!summary[post.profileName]) {
        summary[post.profileName] = {};
      }
      if (!summary[post.profileName][post.platform]) {
        summary[post.profileName][post.platform] = 0;
      }
      summary[post.profileName][post.platform]++;
    }
    
    console.log('📊 Rate Limit Summary:\n');
    for (const [profileName, platforms] of Object.entries(summary)) {
      console.log(`🏢 ${profileName}:`);
      for (const [platform, count] of Object.entries(platforms)) {
        const remaining = 8 - count;
        const status = remaining <= 0 ? '🔴' : remaining <= 2 ? '🟡' : '🟢';
        console.log(`   ${status} ${platform}: ${count}/8 (${remaining} remaining)`);
      }
      console.log('');
    }
    
    // 7. Save to tracking file
    const trackingFile = path.join(os.tmpdir(), 'late-rate-limit.json');
    fs.writeFileSync(trackingFile, JSON.stringify(trackingData, null, 2));
    
    console.log(`✅ Saved tracking data to: ${trackingFile}\n`);
    console.log('🎉 Sync complete! Rate limit display should now show real numbers.\n');
    
  } catch (error: any) {
    console.error('❌ Error syncing with Late API:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('   Message:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

syncWithLateAPI().catch(console.error);
