
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Gets the currently selected company for the authenticated user
 * @returns Company ID and user ID, or null if not authenticated
 */
export async function getCurrentCompany() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        selectedCompanyId: true 
      }
    })

    if (!user) {
      return null
    }

    // If no company selected, get the first company they're a member of
    let companyId = user.selectedCompanyId

    if (!companyId) {
      const membership = await prisma.companyMember.findFirst({
        where: { userId: user.id },
        select: { companyId: true }
      })
      
      if (membership) {
        companyId = membership.companyId
        // Update user's selected company
        await prisma.user.update({
          where: { id: user.id },
          data: { selectedCompanyId: companyId }
        })
      }
    }

    await prisma.$disconnect()

    return {
      userId: user.id,
      companyId: companyId || null
    }
  } catch (error) {
    console.error('Error getting current company:', error)
    await prisma.$disconnect()
    return null
  }
}

/**
 * Verifies user has access to a specific company
 */
export async function verifyCompanyAccess(userId: string, companyId: string): Promise<boolean> {
  try {
    const membership = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId
        }
      }
    })
    await prisma.$disconnect()
    return !!membership
  } catch (error) {
    console.error('Error verifying company access:', error)
    await prisma.$disconnect()
    return false
  }
}
