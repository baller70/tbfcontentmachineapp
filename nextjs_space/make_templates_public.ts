
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function makeTemplatesPublic() {
  try {
    const args = process.argv.slice(2)
    
    if (args.length === 0) {
      console.log('Usage:')
      console.log('  yarn tsx make_templates_public.ts --all              # Make all templates public')
      console.log('  yarn tsx make_templates_public.ts [template-id]      # Make specific template public')
      return
    }

    if (args[0] === '--all') {
      const result = await prisma.template.updateMany({
        where: {
          isPublic: false
        },
        data: {
          isPublic: true
        }
      })

      console.log(`✅ Made ${result.count} template(s) public`)
    } else {
      const templateId = args[0]
      
      const template = await prisma.template.findUnique({
        where: { id: templateId },
        select: {
          id: true,
          name: true,
          isPublic: true
        }
      })

      if (!template) {
        console.log(`❌ Template not found: ${templateId}`)
        return
      }

      if (template.isPublic) {
        console.log(`ℹ️  Template "${template.name}" is already public`)
        return
      }

      await prisma.template.update({
        where: { id: templateId },
        data: { isPublic: true }
      })

      console.log(`✅ Made template "${template.name}" public`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

makeTemplatesPublic()
