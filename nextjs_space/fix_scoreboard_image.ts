import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function fixScoreboardImage() {
  try {
    // Find John Doe's user ID
    const johnDoe = await prisma.user.findUnique({
      where: {
        email: 'john@doe.com'
      }
    });

    if (!johnDoe) {
      console.log('John Doe user not found');
      return;
    }

    console.log('John Doe user ID:', johnDoe.id);

    // Find the Scoreboard 1 template
    const template = await prisma.template.findFirst({
      where: {
        name: 'Scoreboard 1'
      }
    });

    if (!template) {
      console.log('Template not found');
      return;
    }

    console.log('\nCurrent template:', {
      id: template.id,
      name: template.name,
      userId: template.userId,
      imageUrl: template.imageUrl?.substring(0, 100) + '...',
      width: template.width,
      height: template.height
    });

    // Update the template with a working image URL and assign to John Doe
    const updated = await prisma.template.update({
      where: {
        id: template.id
      },
      data: {
        imageUrl: 'https://placehold.co/2160x2700/1e293b/ffffff/png?text=Scoreboard+Template',
        userId: johnDoe.id
      }
    });

    console.log('\n✅ Updated template:', {
      id: updated.id,
      name: updated.name,
      userId: updated.userId,
      imageUrl: updated.imageUrl
    });

    console.log('\n✅ Template image fixed and assigned to John Doe!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixScoreboardImage();
