import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function checkDate() {
  const series = await prisma.postSeries.findFirst({
    where: { name: { contains: 'MOTIVATIONAL QUOTES RHYME (TBF) V3', mode: 'insensitive' } }
  });
  
  console.log('Series start date:', series?.startDate);
  console.log('Today is: November 25, 2025');
  console.log('Should start from: November 26, 2025');
  
  await prisma.$disconnect();
}

checkDate();
