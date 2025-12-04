import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all profiles...\n');
  
  const profiles = await prisma.profile.findMany({
    include: {
      platformSettings: true,
      user: {
        select: {
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
  
  console.log(`Found ${profiles.length} profiles\n`);
  
  for (const profile of profiles) {
    console.log(`ID: ${profile.id}`);
    console.log(`Name: ${profile.name}`);
    console.log(`User: ${profile.user.email}`);
    console.log(`Late Profile ID: ${profile.lateProfileId || 'Not set'}`);
    console.log(`Is Default: ${profile.isDefault}`);
    console.log(`Created: ${profile.createdAt}`);
    console.log(`Platform count: ${profile.platformSettings.length}`);
    console.log('---');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
