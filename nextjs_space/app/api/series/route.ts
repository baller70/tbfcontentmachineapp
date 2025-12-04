
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getCurrentCompany } from '@/lib/company-utils';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function GET(req: NextRequest) {
  try {
    const companyData = await getCurrentCompany();
    if (!companyData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, companyId } = companyData;

    if (!companyId) {
      return NextResponse.json({ series: [] });
    }

    const series = await prisma.postSeries.findMany({
      where: { userId, companyId },
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ series });
  } catch (error) {
    console.error('Error fetching series:', error);
    return NextResponse.json(
      { error: 'Failed to fetch series' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const companyData = await getCurrentCompany();
    if (!companyData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, companyId } = companyData;

    if (!companyId) {
      return NextResponse.json({ error: 'No company selected' }, { status: 400 });
    }

    const body = await req.json();
    const {
      name,
      description,
      frequency,
      daysOfWeek,
      timeOfDay,
      timezone,
      platforms,
      startDate,
      endDate,
      profileId,
      autoPost,
      deleteAfterPosting,
      googleDriveFolderId,
      dropboxFolderId,
      dropboxFolderPath,
      prompt,
      loopEnabled,
    } = body;

    // Validate required fields
    if (!name || !frequency || !daysOfWeek || !platforms || !startDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await prisma.postSeries.findUnique({
      where: {
        companyId_name: {
          companyId,
          name,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Series with this name already exists' },
        { status: 400 }
      );
    }

    // Calculate next scheduled date
    const nextScheduledAt = calculateNextScheduledDate(
      new Date(startDate),
      daysOfWeek,
      timeOfDay,
      timezone || 'America/New_York'
    );

    const series = await prisma.postSeries.create({
      data: {
        userId,
        companyId,
        name,
        description,
        frequency,
        daysOfWeek,
        timeOfDay,
        timezone: timezone || 'America/New_York',
        platforms,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        nextScheduledAt,
        profileId: profileId || null,
        autoPost: autoPost !== undefined ? autoPost : true,
        deleteAfterPosting: deleteAfterPosting || false,
        googleDriveFolderId: googleDriveFolderId || null,
        dropboxFolderId: dropboxFolderId || null,
        dropboxFolderPath: dropboxFolderPath || null,
        prompt: prompt || null,
        loopEnabled: loopEnabled || false,
        currentFileIndex: 1,
      },
    });

    // IMMEDIATELY schedule the first post in Late API (if auto-post is enabled and Dropbox is configured)
    if (autoPost && (dropboxFolderId || dropboxFolderPath)) {
      console.log(`\n🚀 Series created! Now scheduling first post in Late API...`);
      
      // Import the scheduling function
      const { scheduleFirstSeriesPost } = await import('@/lib/cloud-storage-series-processor');
      
      // Schedule the first post (this will download the file, generate content, and create a scheduled post in Late)
      const result = await scheduleFirstSeriesPost(series.id);
      
      if (result.success) {
        console.log(`✅ First post scheduled successfully: ${result.message}`);
        console.log(`   Late Post ID: ${result.latePostId}`);
      } else {
        console.log(`⚠️ Warning: Failed to schedule first post: ${result.message}`);
        console.log(`   Error: ${result.error}`);
        // Don't fail the series creation if scheduling fails - user can manually trigger it
      }
    } else {
      console.log(`ℹ️  Auto-post disabled or no Dropbox folder configured - first post will NOT be scheduled automatically`);
    }

    return NextResponse.json({ series }, { status: 201 });
  } catch (error) {
    console.error('Error creating series:', error);
    return NextResponse.json(
      { error: 'Failed to create series' },
      { status: 500 }
    );
  }
}

function calculateNextScheduledDate(
  startDate: Date,
  daysOfWeek: string[],
  timeOfDay?: string,
  tz: string = 'America/New_York'
): Date {
  const [hours, minutes] = timeOfDay ? timeOfDay.split(':').map(Number) : [9, 0];
  
  // Map day names to numbers (0 = Sunday, 6 = Saturday)
  const dayMap: { [key: string]: number } = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
  };

  // Convert days to uppercase to handle both "Monday" and "MONDAY" formats
  const targetDays = daysOfWeek
    .map(day => dayMap[day.toUpperCase()])
    .filter(day => day !== undefined)
    .sort((a, b) => a - b);
  
  // Get current time in the target timezone
  const nowInTz = dayjs().tz(tz);
  
  // CRITICAL FIX: Parse the startDate in the target timezone to prevent timezone shift
  // When frontend sends "2025-11-24", new Date() interprets it as UTC midnight,
  // which becomes "2025-11-23 19:00" in EST (previous day!)
  // Solution: Extract the date parts and construct in target timezone
  const startDateStr = startDate.toISOString().split('T')[0]; // Get YYYY-MM-DD
  let currentDate = dayjs.tz(startDateStr, tz).hour(hours).minute(minutes).second(0).millisecond(0);
  
  // Start from the later of startDate or now
  if (currentDate.isBefore(nowInTz)) {
    currentDate = nowInTz.hour(hours).minute(minutes).second(0).millisecond(0);
    
    // If current time has passed today's scheduled time, start from tomorrow
    if (currentDate.isBefore(nowInTz) || currentDate.isSame(nowInTz)) {
      currentDate = currentDate.add(1, 'day');
    }
  }

  // Find the next matching day (check up to 7 days)
  for (let i = 0; i < 7; i++) {
    const dayOfWeek = currentDate.day();
    if (targetDays.includes(dayOfWeek)) {
      // Return as UTC Date object for database storage
      return currentDate.toDate();
    }
    currentDate = currentDate.add(1, 'day');
  }

  // Fallback: return the current date (shouldn't reach here)
  return currentDate.toDate();
}
