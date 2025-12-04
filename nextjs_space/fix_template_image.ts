import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function fixTemplate() {
  try {
    // Get John Doe's ID
    const johnDoe = await prisma.user.findUnique({
      where: { email: 'john@doe.com' }
    });

    if (!johnDoe) {
      console.log('John Doe not found');
      return;
    }

    // Update Test 1 template
    const updated = await prisma.template.update({
      where: { id: 'cmh21ak3o0001th4idotrq5o4' },
      data: {
        userId: johnDoe.id,
        imageUrl: 'https://placehold.co/2160x2700/1e293b/ef4444/png?text=FINAL+SCORE'
      }
    });

    console.log('✅ Updated Test 1 template:');
    console.log(`   Name: ${updated.name}`);
    console.log(`   User: ${updated.userId}`);
    console.log(`   Image: ${updated.imageUrl}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTemplate();
