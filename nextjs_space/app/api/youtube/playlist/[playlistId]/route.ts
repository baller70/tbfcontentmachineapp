
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPlaylistDetails, getPlaylistVideos } from '@/lib/youtube-api';

export async function GET(
  request: NextRequest,
  { params }: { params: { playlistId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { playlistId } = params;
    const { searchParams } = new URL(request.url);
    const includeVideos = searchParams.get('includeVideos') === 'true';
    const maxResults = parseInt(searchParams.get('maxResults') || '50');

    if (!playlistId) {
      return NextResponse.json({ error: 'Playlist ID required' }, { status: 400 });
    }

    const playlistResult = await getPlaylistDetails(playlistId);

    if (!playlistResult.success) {
      return NextResponse.json({ error: playlistResult.error }, { status: 404 });
    }

    let videos: any[] = [];
    let nextPageToken: string | undefined = undefined;

    if (includeVideos) {
      const videosResult = await getPlaylistVideos(playlistId, maxResults);
      if (videosResult.success) {
        videos = videosResult.videos;
        nextPageToken = videosResult.nextPageToken || undefined;
      }
    }

    return NextResponse.json({
      success: true,
      playlist: playlistResult.playlist,
      videos,
      nextPageToken,
    });
  } catch (error: any) {
    console.error('YouTube playlist API error:', error);
    return NextResponse.json({ error: 'Failed to fetch playlist details' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
