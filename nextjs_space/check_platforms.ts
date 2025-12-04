import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function checkPlatforms() {
  const series = await prisma.postSeries.findFirst({
    where: { name: { contains: 'MOTIVATIONAL QUOTES RHYME (TBF) V3', mode: 'insensitive' } },
    include: {
      profile: {
        include: {
          platformSettings: { where: { isConnected: true } }
        }
      }
    }
  });
  
  console.log('Connected platforms:');
  series?.profile?.platformSettings.forEach(ps => {
    console.log(`- ${ps.platform}: ${ps.platformId || 'NO ID'}`);
  });
  
  const lateApiPlatforms = series?.profile?.platformSettings
    .filter(ps => ps.platform !== 'twitter' && ps.platformId)
    .map(ps => ({ platform: ps.platform, accountId: ps.platformId })) || [];
  
  console.log('\nPlatforms for Late API:');
  lateApiPlatforms.forEach(p => {
    console.log(`- ${p.platform}: ${p.accountId}`);
  });
  
  await prisma.$disconnect();
}

checkPlatforms();
