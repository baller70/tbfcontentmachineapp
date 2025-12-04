
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listFolders, listFilesInFolder } from '@/lib/dropbox';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the parent folder path from query params (empty string for root)
    const { searchParams } = new URL(request.url);
    const parentPath = searchParams.get('parentPath') || '';
    
    try {
      // List subfolders
      const folders = await listFolders(parentPath);
      
      // Get file counts for each folder and the current folder
      const foldersWithCounts = await Promise.all(
        folders.map(async (folder) => {
          try {
            const files = await listFilesInFolder(folder.path);
            return {
              ...folder,
              fileCount: files.length,
            };
          } catch (error) {
            console.error(`Error counting files in folder ${folder.name}:`, error);
            return {
              ...folder,
              fileCount: 0,
            };
          }
        })
      );
      
      // Count files in the current folder
      let currentFolderFileCount = 0;
      try {
        const currentFiles = await listFilesInFolder(parentPath);
        currentFolderFileCount = currentFiles.length;
      } catch (error) {
        console.error('Error counting files in current folder:', error);
      }
      
      return NextResponse.json({
        folders: foldersWithCounts.sort((a, b) => a.name.localeCompare(b.name)),
        currentFolderFileCount,
      });
      
    } catch (error: any) {
      console.error('❌ Dropbox API error:', error);
      console.error('Error message:', error.message);
      console.error('Error status:', error.status);
      
      // Handle token expiration
      if (error.status === 401 || error.message?.includes('expired') || error.message?.includes('DROPBOX_TOKEN_EXPIRED')) {
        return NextResponse.json(
          { 
            error: 'Dropbox Token Expired',
            message: 'Your Dropbox connection has expired. Please use the oauth_token_manager tool to reconnect Dropbox.'
          },
          { status: 401 }
        );
      }
      
      // Handle authentication issues
      if (error.message?.includes('authentication') || error.message?.includes('not connected')) {
        return NextResponse.json(
          { 
            error: 'Dropbox Not Connected',
            message: 'Dropbox is not connected. Please use the oauth_token_manager tool to connect Dropbox.'
          },
          { status: 401 }
        );
      }
      
      // General error
      return NextResponse.json(
        { 
          error: 'Failed to fetch folders',
          message: error.message || 'Unknown error occurred',
          details: error.toString()
        },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('Error in Dropbox folders endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
