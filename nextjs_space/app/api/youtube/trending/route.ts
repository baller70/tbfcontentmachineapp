
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTrendingVideos } from '@/lib/youtube-api';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const regionCode = searchParams.get('regionCode') || 'US';
    const maxResults = parseInt(searchParams.get('maxResults') || '10');

    const result = await getTrendingVideos(regionCode, maxResults);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      videos: result.videos,
    });
  } catch (error: any) {
    console.error('YouTube trending API error:', error);
    return NextResponse.json({ error: 'Failed to fetch trending videos' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
