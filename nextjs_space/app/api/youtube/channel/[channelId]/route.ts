
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getChannelDetails } from '@/lib/youtube-api';

export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { channelId } = params;

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID required' }, { status: 400 });
    }

    const result = await getChannelDetails(channelId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      channel: result.channel,
    });
  } catch (error: any) {
    console.error('YouTube channel details API error:', error);
    return NextResponse.json({ error: 'Failed to fetch channel details' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
