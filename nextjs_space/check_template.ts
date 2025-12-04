import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkTemplate() {
  try {
    const test1 = await prisma.template.findUnique({
      where: {
        id: 'cmh21ak3o0001th4idotrq5o4'
      },
      include: {
        fields: true
      }
    });

    console.log('\n=== Test 1 Template Details ===');
    console.log(`Name: ${test1?.name}`);
    console.log(`Image URL: ${test1?.imageUrl?.substring(0, 80)}...`);
    console.log(`Dimensions: ${test1?.width} x ${test1?.height}`);
    console.log(`\nFields (${test1?.fields?.length || 0}):`);
    test1?.fields?.forEach((field, i) => {
      console.log(`\n  Field ${i + 1}:`);
      console.log(`    Name: ${field.fieldName}`);
      console.log(`    Type: ${field.fieldType}`);
      console.log(`    X: ${field.x}, Y: ${field.y}`);
      console.log(`    Width: ${field.width}, Height: ${field.height}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTemplate();
