
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTwitterRateLimitStatus } from '@/lib/twitter-api';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get rate limit status
    const status = getTwitterRateLimitStatus();
    
    if (!status) {
      return NextResponse.json({
        hasData: false,
        message: 'No recent Twitter activity or rate limit has reset'
      });
    }

    // Calculate time until reset
    const now = Date.now();
    const resetTime = status.resetTime * 1000;
    const minutesUntilReset = Math.max(0, Math.ceil((resetTime - now) / 60000));
    
    // Determine status level
    let statusLevel: 'good' | 'warning' | 'critical' = 'good';
    if (status.remaining === 0) {
      statusLevel = 'critical';
    } else if (status.remaining <= 5) {
      statusLevel = 'warning';
    }

    return NextResponse.json({
      hasData: true,
      remaining: status.remaining,
      limit: status.limit,
      resetTime: new Date(resetTime).toISOString(),
      minutesUntilReset,
      statusLevel,
      percentageUsed: Math.round(((status.limit - status.remaining) / status.limit) * 100)
    });
  } catch (error: any) {
    console.error('Error fetching Twitter rate limit status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rate limit status' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
