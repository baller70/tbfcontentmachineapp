import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function fixTemplateField() {
  try {
    // Get the template with its fields
    const test1 = await prisma.template.findUnique({
      where: {
        id: 'cmh21ak3o0001th4idotrq5o4'
      },
      include: {
        fields: true
      }
    });

    if (!test1) {
      console.log('Template not found');
      return;
    }

    console.log(`Found template: ${test1.name}`);
    console.log(`Fields: ${test1.fields.length}`);

    // Update each field to have proper fieldName and fieldType
    for (const field of test1.fields) {
      console.log(`\nUpdating field ${field.id}...`);
      const updated = await prisma.templateField.update({
        where: { id: field.id },
        data: {
          fieldName: 'Image 1',
          fieldLabel: 'Image 1',
          fieldType: 'image'
        }
      });
      console.log(`✅ Updated: ${updated.fieldName} (${updated.fieldType})`);
    }

    console.log('\n✅ All fields updated successfully!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTemplateField();
