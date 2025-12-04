import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const riseAsOne = await prisma.profile.findFirst({
      where: {
        name: 'Rise As One'
      },
      select: {
        id: true,
        name: true,
        lateProfileId: true,
        description: true
      }
    });
    
    if (riseAsOne) {
      console.log('\n=== Rise As One Profile ===');
      console.log('  ID:', riseAsOne.id);
      console.log('  Name:', riseAsOne.name);
      console.log('  Late Profile ID:', riseAsOne.lateProfileId || '(not set)');
      console.log('  Description:', riseAsOne.description || '(none)');
    } else {
      console.log('Rise As One profile not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
