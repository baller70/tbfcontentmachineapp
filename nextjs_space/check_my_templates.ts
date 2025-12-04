import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkTemplates() {
  const templates = await prisma.template.findMany({
    where: {
      user: { email: 'john@doe.com' }
    },
    include: {
      fields: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  console.log('Templates found:', templates.length);
  templates.forEach(t => {
    console.log(`\nTemplate: ${t.name}`);
    console.log(`  ID: ${t.id}`);
    console.log(`  Fields: ${t.fields.length}`);
    console.log(`  Created: ${t.createdAt}`);
  });
}

checkTemplates().finally(() => prisma.$disconnect());
