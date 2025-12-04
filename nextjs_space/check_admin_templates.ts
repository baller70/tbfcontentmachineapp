import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAdminTemplates() {
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@example.com' }
  });
  
  if (!adminUser) {
    console.log('admin@example.com not found');
    return;
  }
  
  const templates = await prisma.template.findMany({
    where: {
      userId: adminUser.id
    },
    include: {
      fields: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  console.log(`\nTemplates for admin@example.com: ${templates.length}`);
  templates.forEach(t => {
    console.log(`\n  Template: ${t.name}`);
    console.log(`    ID: ${t.id}`);
    console.log(`    Category: ${t.category}`);
    console.log(`    Fields: ${t.fields.length}`);
  });
}

checkAdminTemplates().finally(() => prisma.$disconnect());
