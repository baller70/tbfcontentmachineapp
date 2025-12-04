
import { NextRequest, NextResponse } from 'next/server';
import { getFileUrl } from '@/lib/s3';

export const dynamic = 'force-dynamic';

/**
 * GET /api/upload/image?path=uploads/1234-image.jpg
 * Proxies uploaded images from S3 with CORS headers to bypass browser restrictions
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    console.log('🖼️ Fetching uploaded image from S3:', filePath);
    console.log('📌 File path type:', filePath.includes('amazonaws.com') ? 'S3 URL' : 'Cloud storage path');

    // If it's a full S3 URL (legacy support), extract the file path
    if (filePath.includes('amazonaws.com')) {
      try {
        const url = new URL(filePath);
        // Extract path after bucket name (everything after the domain)
        // Format: https://d2908q01vomqb2.cloudfront.net/e1822db470e60d090affd0956d743cb0e7cdf113/2024/03/20/1_architecture.png
        // We want: 6788/uploads/filename.jpg (the full cloud_storage_path)
        filePath = url.pathname.substring(1); // Remove leading "/"
        console.log('🔄 Extracted file path from S3 URL:', filePath);
      } catch (urlError) {
        console.error('❌ Failed to parse S3 URL:', urlError);
        return NextResponse.json(
          { error: 'Invalid S3 URL format' },
          { status: 400 }
        );
      }
    }

    // Generate fresh signed URL for S3 file
    console.log('🔑 Generating signed URL for path:', filePath);
    const signedUrl = await getFileUrl(filePath);
    
    if (!signedUrl) {
      console.error('❌ Failed to generate signed URL for:', filePath);
      return NextResponse.json(
        { error: 'Failed to generate file URL' },
        { status: 500 }
      );
    }

    // Fetch the image from S3
    console.log('📡 Fetching from signed URL:', signedUrl.substring(0, 120) + '...');
    const imageResponse = await fetch(signedUrl);
    
    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error('❌ Failed to fetch image from S3:', {
        status: imageResponse.status,
        statusText: imageResponse.statusText,
        errorBody: errorText.substring(0, 500),
        filePath,
        signedUrlPreview: signedUrl.substring(0, 120)
      });
      return NextResponse.json(
        { 
          error: 'Failed to fetch image from S3',
          status: imageResponse.status,
          details: errorText.substring(0, 200)
        },
        { status: 500 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    console.log('✅ Successfully fetched image, size:', imageBuffer.byteLength, 'bytes');

    // Return image with CORS headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('❌ Error fetching uploaded image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
