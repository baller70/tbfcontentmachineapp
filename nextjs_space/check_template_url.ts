import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const template = await prisma.template.findFirst({
    where: {
      name: 'Test Graphic Template'
    },
    include: {
      fields: true
    }
  })
  
  console.log('Template:', JSON.stringify(template, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
