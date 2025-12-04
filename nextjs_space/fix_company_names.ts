import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function fixCompanyNames() {
  // Find the company that has "Rise as One AAU" branding
  const riseAsOneBranding = await prisma.workspaceBranding.findFirst({
    where: {
      name: "Rise as One AAU",
      isDefault: true
    },
    include: {
      company: true
    }
  })

  if (riseAsOneBranding && riseAsOneBranding.company) {
    console.log(`\nFound "Rise as One AAU" branding linked to company: "${riseAsOneBranding.company.name}"`)
    
    // Rename the company to match the branding
    if (riseAsOneBranding.company.name !== "Rise As One") {
      await prisma.company.update({
        where: { id: riseAsOneBranding.companyId! },
        data: { name: "Rise As One" }
      })
      console.log(`✅ Renamed company to "Rise As One"`)
    }
  }

  // Find the company that has "The Basketball Factory Inc" branding
  const basketballFactoryBranding = await prisma.workspaceBranding.findFirst({
    where: {
      name: "The Basketball Factory Inc"
    },
    include: {
      company: true
    }
  })

  if (basketballFactoryBranding && basketballFactoryBranding.company) {
    console.log(`\nFound "The Basketball Factory Inc" branding linked to company: "${basketballFactoryBranding.company.name}"`)
    
    // Rename the company to match the branding
    if (basketballFactoryBranding.company.name !== "The Basketball Factory") {
      await prisma.company.update({
        where: { id: basketballFactoryBranding.companyId! },
        data: { name: "The Basketball Factory" }
      })
      console.log(`✅ Renamed company to "The Basketball Factory"`)
    }
  }

  console.log('\n=== UPDATED COMPANIES ===')
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      workspaceBrandings: {
        select: {
          name: true,
          isDefault: true
        }
      }
    }
  })
  console.log(JSON.stringify(companies, null, 2))

  await prisma.$disconnect()
}

fixCompanyNames()
