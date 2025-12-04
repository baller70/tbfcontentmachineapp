import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.profile.findMany({
    include: {
      platformSettings: true
    }
  });
  
  console.log('Current Profiles and Platform Settings:');
  for (const profile of profiles) {
    console.log(`\nProfile: ${profile.name} (ID: ${profile.id})`);
    console.log(`  Description: ${profile.description || 'N/A'}`);
    console.log(`  Late Profile ID: ${profile.lateProfileId || 'Not set'}`);
    console.log(`  Connected Platforms: ${profile.platformSettings.length}`);
    
    if (profile.platformSettings.length > 0) {
      for (const platform of profile.platformSettings) {
        console.log(`    - ${platform.platform}: ${platform.isConnected ? 'Connected' : 'Not Connected'}`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
