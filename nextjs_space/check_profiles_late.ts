import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkProfiles() {
  const profiles = await prisma.profile.findMany({
    select: {
      id: true,
      name: true,
      lateProfileId: true,
      companyId: true
    }
  });
  
  console.log('All profiles:');
  console.log(JSON.stringify(profiles, null, 2));
}

checkProfiles().finally(() => prisma.$disconnect());
