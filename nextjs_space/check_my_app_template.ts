import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkTemplate() {
  const template = await prisma.template.findUnique({
    where: { id: 'cmh224cbf0001thsy6tbg13n6' },
    include: {
      fields: true
    }
  });
  
  if (!template) {
    console.log('Template not found');
    return;
  }
  
  console.log('\nTemplate Details:');
  console.log('  Name:', template.name);
  console.log('  ImageURL:', template.imageUrl);
  console.log('  Width:', template.width);
  console.log('  Height:', template.height);
  console.log('  Category:', template.category);
  console.log('\nFields:');
  template.fields.forEach(f => {
    console.log(`\n  Field: ${f.fieldName}`);
    console.log(`    Type: ${f.fieldType}`);
    console.log(`    X: ${f.x}, Y: ${f.y}`);
  });
}

checkTemplate().finally(() => prisma.$disconnect());
