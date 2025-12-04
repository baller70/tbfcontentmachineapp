import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTemplates() {
  try {
    const templates = await prisma.template.findMany({
      select: {
        id: true,
        name: true,
        imageUrl: true,
        isPublic: true,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    console.log('Templates in database:');
    templates.forEach(t => {
      console.log(`\nID: ${t.id}`);
      console.log(`Name: ${t.name}`);
      console.log(`Public: ${t.isPublic}`);
      console.log(`Image URL: ${t.imageUrl.substring(0, 100)}...`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTemplates();
