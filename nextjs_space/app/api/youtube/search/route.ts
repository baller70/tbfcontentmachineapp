
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { searchVideos } from '@/lib/youtube-api';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const maxResults = parseInt(searchParams.get('maxResults') || '10');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    const result = await searchVideos(query, maxResults);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      videos: result.videos,
      nextPageToken: result.nextPageToken,
    });
  } catch (error: any) {
    console.error('YouTube search API error:', error);
    return NextResponse.json({ error: 'Failed to search videos' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
