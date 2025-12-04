import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
  const companies = await prisma.company.findMany({
    include: {
      profiles: {
        select: {
          id: true,
          name: true,
          lateProfileId: true,
          platformSettings: {
            select: {
              platform: true,
              isConnected: true,
              isActive: true
            }
          }
        }
      }
    }
  });
  
  console.log('All companies and profiles:');
  for (const company of companies) {
    console.log(`\n=== Company: ${company.name} (ID: ${company.id}) ===`);
    for (const profile of company.profiles) {
      console.log(`  Profile: ${profile.name}`);
      console.log(`    ID: ${profile.id}`);
      console.log(`    Late Profile ID: ${profile.lateProfileId || 'NOT SET'}`);
      console.log(`    Platform Settings: ${profile.platformSettings.length}`);
      if (profile.platformSettings.length > 0) {
        for (const ps of profile.platformSettings) {
          console.log(`      - ${ps.platform}: Connected=${ps.isConnected}, Active=${ps.isActive}`);
        }
      }
    }
  }
}

checkData().finally(() => prisma.$disconnect());
