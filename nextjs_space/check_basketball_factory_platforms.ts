import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkPlatforms() {
  const profile = await prisma.profile.findUnique({
    where: { id: 'profile_1761070894175_9nnrhn' },
    include: {
      platformSettings: {
        orderBy: { platform: 'asc' }
      }
    }
  });

  if (!profile) {
    console.log('Profile not found');
    return;
  }

  console.log(`\n📋 Profile: ${profile.name}`);
  console.log(`🔑 Late Profile ID: ${profile.lateProfileId}`);
  console.log(`\n🌐 Platform Connections:\n`);

  const platforms = [
    'Instagram', 'Facebook', 'LinkedIn', 'Twitter',
    'TikTok', 'YouTube', 'Threads', 'Bluesky'
  ];

  for (const ps of profile.platformSettings) {
    const status = ps.isConnected ? '✅ Connected' : '❌ Not Connected';
    const active = ps.isActive ? '(Active)' : '(Inactive)';
    console.log(`   ${ps.platform.padEnd(10)} ${status} ${ps.isConnected ? active : ''}`);
  }
}

checkPlatforms().finally(() => prisma.$disconnect());
