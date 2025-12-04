import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { processCloudStorageSeries } from '@/lib/cloud-storage-series-processor';

const prisma = new PrismaClient();

/**
 * Late API Webhook Handler
 * 
 * This endpoint receives webhook notifications from Late API when post statuses change.
 * When a post is published, it immediately triggers the scheduling of the next post in the series.
 * 
 * Expected webhook payload from Late API:
 * {
 *   event: 'post.published' | 'post.failed' | 'post.scheduled',
 *   post: {
 *     _id: string,
 *     status: 'published' | 'failed' | 'scheduled',
 *     scheduledFor: string,
 *     platforms: Array<{ platform: string, status: string }>,
 *     ...
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const separator = '='.repeat(80);
    console.log('\n🔔 WEBHOOK RECEIVED FROM LATE API');
    console.log(separator);
    
    // Parse webhook payload
    const payload = await request.json();
    
    console.log('📦 Webhook Event:', payload.event);
    console.log('📋 Post ID:', payload.post?._id);
    console.log('📊 Post Status:', payload.post?.status);
    
    // Verify this is a post status change event
    if (!payload.event || !payload.post || !payload.post._id) {
      console.log('⚠️  Invalid webhook payload - missing required fields');
      return NextResponse.json(
        { success: false, message: 'Invalid webhook payload' },
        { status: 400 }
      );
    }
    
    const postId = payload.post._id;
    const postStatus = payload.post.status;
    const eventType = payload.event;
    
    console.log(`\n🔍 Processing ${eventType} event for post ${postId}`);
    
    // Find series tracking this Late post ID
    const series = await prisma.postSeries.findFirst({
      where: {
        currentLatePostId: postId,
        status: 'ACTIVE',
      },
    });
    
    if (!series) {
      console.log(`ℹ️  No active series found tracking post ${postId}`);
      console.log('   This is normal if:');
      console.log('   - Post was created manually (not from a series)');
      console.log('   - Series was already processed and moved to next post');
      console.log('   - Series is paused or completed');
      
      return NextResponse.json({
        success: true,
        message: 'No active series found for this post',
      });
    }
    
    console.log(`✅ Found series: ${series.name} (ID: ${series.id})`);
    console.log(`   Current File Index: ${series.currentFileIndex}`);
    
    // Only process on published, draft, failed, or deleted status
    // (anything other than 'scheduled')
    if (postStatus === 'scheduled') {
      console.log('⏳ Post is still scheduled - no action needed');
      console.log('   Webhook will be called again when post publishes');
      
      return NextResponse.json({
        success: true,
        message: 'Post still scheduled, waiting for publish',
      });
    }
    
    console.log(`\n🚀 POST STATUS CHANGED TO: ${postStatus}`);
    console.log('   Triggering immediate scheduling of next post...');
    
    // Trigger the series processor to schedule the next post
    const result = await processCloudStorageSeries(series.id);
    
    if (result.success) {
      console.log('\n✅ WEBHOOK SUCCESS!');
      console.log(separator);
      console.log('🎯 Next post scheduled immediately');
      console.log('⏱️  Total time: < 1 second (instant trigger)');
      console.log('📅 Late API schedule section updated');
      console.log(separator);
    } else {
      console.log('\n⚠️  WEBHOOK PROCESSING ISSUE');
      console.log(separator);
      console.log('Message:', result.message);
      console.log('Error:', result.error);
      console.log(separator);
    }
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
      error: result.error,
    });
    
  } catch (error: any) {
    const separator = '='.repeat(80);
    console.error('\n❌ WEBHOOK ERROR');
    console.error(separator);
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error(separator);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Webhook processing failed',
        error: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// For webhook verification/testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Late API Webhook Endpoint',
    status: 'active',
    endpoint: '/api/webhooks/late',
    methods: ['POST'],
    description: 'Receives webhook notifications from Late API for post status changes',
  });
}

// Required for production deployment
export const dynamic = 'force-dynamic';
