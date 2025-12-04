
import { NextResponse } from 'next/server'
import { getCurrentCompany } from '@/lib/company-utils'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/branding/current - Get branding for current company
export async function GET() {
  try {
    const companyData = await getCurrentCompany()
    if (!companyData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { companyId } = companyData

    if (!companyId) {
      // Return default branding if no company selected
      return NextResponse.json({ 
        branding: {
          primaryColor: '#3b82f6',     // Blue
          secondaryColor: '#6b7280',   // Gray
          accentColor: '#10b981',      // Green
          logoUrl: null
        }
      })
    }

    // Get company branding (get the default one for this company)
    const branding = await prisma.workspaceBranding.findFirst({
      where: { 
        companyId,
        isDefault: true 
      }
    })

    if (!branding || !branding.brandColors || branding.brandColors.length < 3) {
      // Return default branding if not configured
      return NextResponse.json({ 
        branding: {
          primaryColor: '#3b82f6',
          secondaryColor: '#6b7280',
          accentColor: '#10b981',
          logoUrl: null
        }
      })
    }

    await prisma.$disconnect()

    // Parse brand colors array (assuming [primaryColor, secondaryColor, accentColor])
    return NextResponse.json({ 
      branding: {
        primaryColor: branding.brandColors[0] || '#3b82f6',
        secondaryColor: branding.brandColors[1] || '#6b7280',
        accentColor: branding.brandColors[2] || '#10b981',
        logoUrl: branding.logoUrl
      }
    })
  } catch (error) {
    console.error('Error fetching branding:', error)
    await prisma.$disconnect()
    return NextResponse.json({ error: 'Failed to fetch branding' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
