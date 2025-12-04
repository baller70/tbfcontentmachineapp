
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getVideoDetails } from '@/lib/youtube-api';

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

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 });
    }

    const result = await getVideoDetails(videoId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      video: result.video,
    });
  } catch (error: any) {
    console.error('YouTube video details API error:', error);
    return NextResponse.json({ error: 'Failed to fetch video details' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
