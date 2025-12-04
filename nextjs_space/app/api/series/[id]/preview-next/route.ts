import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentCompany } from '@/lib/company-utils';
import { listFilesInFolder } from '@/lib/dropbox';

const prisma = new PrismaClient();

/**
 * Extracts the numeric prefix from a filename
 */
function extractFileNumber(fileName: string): number | null {
  const match = fileName.match(/^(\d+)-/);
  return match ? parseInt(match[1], 10) : null;
}

export async function GET(
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

    if (!series.dropboxFolderPath) {
      return NextResponse.json({
        error: 'No Dropbox folder configured for this series'
      }, { status: 400 });
    }

    // List files in the folder using the Dropbox API
    const files = await listFilesInFolder(series.dropboxFolderPath);

    if (!files || files.length === 0) {
      return NextResponse.json({
        error: 'No files found in the Dropbox folder'
      }, { status: 404 });
    }

    // Filter and sort numbered files
    const numberedFiles = files
      .map((file: any) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        index: extractFileNumber(file.name)
      }))
      .filter((file: any) => file.index !== null)
      .sort((a: any, b: any) => a.index - b.index);

    if (numberedFiles.length === 0) {
      return NextResponse.json({
        error: 'No numbered files found in the folder. Files must be named like: 1-something.jpg, 2-something.png, etc.'
      }, { status: 404 });
    }

    // Find the next file to be processed
    const nextFile = numberedFiles.find((f: any) => f.index === series.currentFileIndex);

    if (!nextFile) {
      if (series.loopEnabled) {
        // Loop back to first file
        const firstFile = numberedFiles[0];
        return NextResponse.json({
          nextFile: firstFile,
          totalFiles: numberedFiles.length,
          willLoop: true,
          message: `Reached end of files. Will loop back to file ${firstFile.index}`
        });
      } else {
        return NextResponse.json({
          error: `File ${series.currentFileIndex} not found in folder. Add more files or enable looping.`,
          totalFiles: numberedFiles.length,
          availableFiles: numberedFiles.map((f: any) => ({ index: f.index, name: f.name }))
        }, { status: 404 });
      }
    }

    // Return next file info
    return NextResponse.json({
      nextFile: {
        id: nextFile.id,
        name: nextFile.name,
        mimeType: nextFile.mimeType,
        index: nextFile.index
      },
      totalFiles: numberedFiles.length,
      allFiles: numberedFiles.map((f: any) => ({
        index: f.index,
        name: f.name,
        mimeType: f.mimeType
      })),
      loopEnabled: series.loopEnabled,
      message: `Next file to post: ${nextFile.name}`
    });

  } catch (error: any) {
    console.error('Error previewing next file:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
