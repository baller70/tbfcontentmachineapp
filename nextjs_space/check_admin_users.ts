import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAdminUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true
    }
  });
  
  console.log('All users in database:');
  users.forEach(u => {
    console.log(`\n  Email: ${u.email}`);
    console.log(`  Name: ${u.name}`);
    console.log(`  ID: ${u.id}`);
  });
}

checkAdminUsers().finally(() => prisma.$disconnect());
