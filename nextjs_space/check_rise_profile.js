require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const profile = await prisma.profile.findFirst({
    where: { name: 'Rise As One' },
    include: {
      platformSettings: true
    }
  });
  
  console.log('Rise As One Profile:');
  console.log(JSON.stringify(profile, null, 2));
  
  console.log('\n\nLate Profile ID:', profile?.lateProfileId);
  console.log('\nPlatform Settings:');
  profile?.platformSettings.forEach(ps => {
    console.log(`- ${ps.platform}: platformId = ${ps.platformId}, enabled = ${ps.enabled}`);
  });
}

check().finally(() => prisma.$disconnect());
