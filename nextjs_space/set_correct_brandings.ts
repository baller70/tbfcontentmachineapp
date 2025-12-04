import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function setCorrectBrandings() {
  // Find "The Basketball Factory" company
  const basketballCompany = await prisma.company.findFirst({
    where: { name: "The Basketball Factory" }
  })

  if (basketballCompany) {
    console.log(`\n✅ Found "The Basketball Factory" company`)
    
    // Set "The Basketball Factory Inc" branding as default
    await prisma.workspaceBranding.updateMany({
      where: {
        companyId: basketballCompany.id,
        name: "The Basketball Factory Inc"
      },
      data: { isDefault: true }
    })
    
    // Set "Rise as One AAU" branding as NOT default for this company
    await prisma.workspaceBranding.updateMany({
      where: {
        companyId: basketballCompany.id,
        name: "Rise as One AAU"
      },
      data: { isDefault: false }
    })
    
    console.log(`✅ Set "The Basketball Factory Inc" as default branding for this company`)
  }

  // Find "John Doe's Workspace" company (should stay with Rise as One)
  const johnDoeCompany = await prisma.company.findFirst({
    where: { name: "John Doe's Workspace" }
  })

  if (johnDoeCompany) {
    // Rename it to "Rise As One"
    await prisma.company.update({
      where: { id: johnDoeCompany.id },
      data: { name: "Rise As One" }
    })
    console.log(`\n✅ Renamed "John Doe's Workspace" to "Rise As One"`)
  }

  console.log('\n=== FINAL SETUP ===')
  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      workspaceBrandings: {
        select: {
          name: true,
          brandColors: true,
          isDefault: true
        }
      }
    },
    where: {
      workspaceBrandings: {
        some: {}
      }
    }
  })
  
  for (const company of companies) {
    console.log(`\n📦 Company: ${company.name}`)
    for (const branding of company.workspaceBrandings) {
      console.log(`  ${branding.isDefault ? '✅' : '  '} ${branding.name}`)
      console.log(`     Colors: ${branding.brandColors.join(', ')}`)
    }
  }

  await prisma.$disconnect()
}

setCorrectBrandings()
