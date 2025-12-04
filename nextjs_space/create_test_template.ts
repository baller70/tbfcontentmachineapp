import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function createTestTemplate() {
  try {
    // Find John Doe user
    const user = await prisma.user.findUnique({
      where: { email: 'john@doe.com' }
    });

    if (!user) {
      console.error('User not found!');
      return;
    }

    console.log('Found user:', user.name, user.email);

    // Create a simple test template
    const template = await prisma.template.create({
      data: {
        userId: user.id,
        name: 'Test Graphic Template',
        description: 'A simple template for testing graphic generation',
        category: 'social',
        imageUrl: 'https://via.placeholder.com/1080x1080',
        width: 1080,
        height: 1080,
        fields: {
          create: [
            {
              fieldName: 'title',
              fieldLabel: 'Title',
              fieldType: 'text',
              x: 100,
              y: 100,
              width: 880,
              height: 100,
              fontSize: 48,
              fontFamily: 'Arial',
              fontWeight: 'bold',
              fontColor: '#000000',
              textAlign: 'center',
              isRequired: true,
              order: 1
            },
            {
              fieldName: 'subtitle',
              fieldLabel: 'Subtitle',
              fieldType: 'text',
              x: 100,
              y: 250,
              width: 880,
              height: 60,
              fontSize: 24,
              fontFamily: 'Arial',
              fontWeight: 'normal',
              fontColor: '#666666',
              textAlign: 'center',
              isRequired: false,
              order: 2
            }
          ]
        }
      },
      include: {
        fields: true
      }
    });

    console.log('Template created successfully:', template);
  } catch (error) {
    console.error('Error creating template:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestTemplate();
