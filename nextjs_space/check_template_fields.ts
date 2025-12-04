import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTemplateFields() {
  try {
    const templates = await prisma.template.findMany({
      select: {
        id: true,
        name: true,
        fields: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log('Templates with fields:');
    templates.forEach(t => {
      console.log(`\n===== ${t.name} =====`);
      console.log('Fields:', JSON.stringify(t.fields, null, 2));
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTemplateFields();
