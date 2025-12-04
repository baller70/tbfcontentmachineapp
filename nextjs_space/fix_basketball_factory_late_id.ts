import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixLateId() {
  // Find "The Basketball Factory Inc" profile that has platforms connected but no Late ID
  const profile = await prisma.profile.findFirst({
    where: {
      name: "The Basketball Factory Inc"
    },
    include: {
      platformSettings: {
        where: {
          isConnected: true
        }
      }
    }
  });

  if (!profile) {
    console.log('❌ Profile "The Basketball Factory Inc" not found');
    return;
  }

  console.log(`\n📋 Found profile: ${profile.name}`);
  console.log(`   ID: ${profile.id}`);
  console.log(`   Current Late Profile ID: ${profile.lateProfileId || 'NOT SET'}`);
  console.log(`   Connected platforms: ${profile.platformSettings.length}`);

  // From the Late screenshot, the profile ID for "The Basketball Factory Inc" is:
  const correctLateProfileId = '68f68556d5654b446d61d7dc';
  
  console.log(`\n🔧 Updating Late Profile ID to: ${correctLateProfileId}`);

  const updated = await prisma.profile.update({
    where: { id: profile.id },
    data: {
      lateProfileId: correctLateProfileId
    }
  });

  console.log(`\n✅ Successfully updated profile!`);
  console.log(`   Late Profile ID is now: ${updated.lateProfileId}`);
}

fixLateId()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
