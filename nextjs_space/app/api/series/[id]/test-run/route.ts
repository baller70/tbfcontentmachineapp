import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentCompany } from '@/lib/company-utils';
import { processCloudStorageSeries } from '@/lib/cloud-storage-series-processor';

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

    // Process the series immediately
    console.log(`🧪 Manual test run triggered for series: ${series.name}`);
    const result = await processCloudStorageSeries(params.id);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Post created successfully!',
        result
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Processing failed',
        result
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error running test:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
