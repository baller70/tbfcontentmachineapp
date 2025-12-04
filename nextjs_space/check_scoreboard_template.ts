import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  // Check for Scoreboard 1 template
  const templates = await prisma.template.findMany({
    where: {
      name: {
        contains: 'Scoreboard',
        mode: 'insensitive'
      }
    },
    include: {
      fields: true
    }
  });

  console.log('Found Scoreboard templates:', JSON.stringify(templates, null, 2));

  // Also check all templates for the current user
  const allTemplates = await prisma.template.findMany({
    where: {
      userId: 'clqz1xyz0000008l4abc12345' // John Doe's ID
    },
    include: {
      fields: true
    }
  });

  console.log('\nAll templates for John Doe:', JSON.stringify(allTemplates, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
