
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getVideoComments } from '@/lib/youtube-api';

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId } = params;
    const { searchParams } = new URL(request.url);
    const maxResults = parseInt(searchParams.get('maxResults') || '20');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 });
    }

    const result = await getVideoComments(videoId, maxResults);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      comments: result.comments,
      nextPageToken: result.nextPageToken,
    });
  } catch (error: any) {
    console.error('YouTube comments API error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
