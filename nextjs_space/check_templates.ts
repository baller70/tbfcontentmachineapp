import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

async function checkTemplates() {
  const templates = await prisma.template.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      userId: true,
      companyId: true
    }
  });
  
  console.log(`Found ${templates.length} templates:`);
  templates.forEach(t => {
    console.log(`  - ${t.name} (${t.category}) - User: ${t.userId}`);
  });
  
  await prisma.$disconnect();
}

checkTemplates();
