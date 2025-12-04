
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkPublicTemplates() {
  try {
    console.log('📋 Checking all templates...\n')

    const allTemplates = await prisma.template.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        isPublic: true,
        usageCount: true,
        platforms: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })

    console.log(`Total templates: ${allTemplates.length}\n`)

    const publicTemplates = allTemplates.filter(t => t.isPublic)
    const privateTemplates = allTemplates.filter(t => !t.isPublic)

    console.log(`✅ Public templates: ${publicTemplates.length}`)
    console.log(`🔒 Private templates: ${privateTemplates.length}\n`)

    if (publicTemplates.length > 0) {
      console.log('PUBLIC TEMPLATES:')
      console.log('='.repeat(80))
      publicTemplates.forEach((template, index) => {
        console.log(`${index + 1}. ${template.name}`)
        console.log(`   ID: ${template.id}`)
        console.log(`   Category: ${template.category}`)
        console.log(`   Platforms: ${template.platforms.join(', ') || 'None'}`)
        console.log(`   Usage: ${template.usageCount} times`)
        console.log(`   Owner: ${template.user.name || template.user.email}`)
        console.log()
      })
    }

    if (privateTemplates.length > 0) {
      console.log('\nPRIVATE TEMPLATES (not visible on frontend):')
      console.log('='.repeat(80))
      privateTemplates.forEach((template, index) => {
        console.log(`${index + 1}. ${template.name}`)
        console.log(`   ID: ${template.id}`)
        console.log(`   Category: ${template.category}`)
        console.log(`   Platforms: ${template.platforms.join(', ') || 'None'}`)
        console.log(`   Owner: ${template.user.name || template.user.email}`)
        console.log()
      })

      console.log('\n💡 To make a template public, run:')
      console.log('   yarn tsx make_templates_public.ts [template-id]')
      console.log('   or')
      console.log('   yarn tsx make_templates_public.ts --all')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPublicTemplates()
