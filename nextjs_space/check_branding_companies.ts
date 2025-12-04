import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function checkBrandingAndCompanies() {
  console.log('\n=== COMPANIES ===')
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      ownerId: true,
      createdAt: true
    }
  })
  console.log(JSON.stringify(companies, null, 2))

  console.log('\n=== WORKSPACE BRANDING ===')
  const brandings = await prisma.workspaceBranding.findMany({
    select: {
      id: true,
      name: true,
      companyId: true,
      userId: true,
      brandColors: true,
      isDefault: true
    }
  })
  console.log(JSON.stringify(brandings, null, 2))

  console.log('\n=== USERS ===')
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      selectedCompanyId: true
    }
  })
  console.log(JSON.stringify(users, null, 2))

  await prisma.$disconnect()
}

checkBrandingAndCompanies()
