import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentCompany } from '@/lib/company-utils';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const companyData = await getCurrentCompany();
    
    if (!companyData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, companyId } = companyData;

    if (!companyId) {
      return NextResponse.json({ error: 'No company selected' }, { status: 400 });
    }

    const { newIndex } = await request.json();

    // Verify series belongs to user's company
    const series = await prisma.postSeries.findFirst({
      where: {
        id: params.id,
        companyId,
        userId
      }
    });

    if (!series) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    // Reset the counter
    const resetIndex = newIndex !== undefined ? newIndex : 1;

    const updatedSeries = await prisma.postSeries.update({
      where: { id: params.id },
      data: {
        currentFileIndex: resetIndex
      }
    });

    return NextResponse.json({
      success: true,
      message: `Counter reset to ${resetIndex}`,
      series: updatedSeries
    });

  } catch (error) {
    console.error('Error resetting counter:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
