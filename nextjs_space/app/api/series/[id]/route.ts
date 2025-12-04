
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
      status,
      profileId,
      autoPost,
      deleteAfterPosting,
      googleDriveFolderId,
      dropboxFolderId,
      dropboxFolderPath,
      prompt,
      loopEnabled,
      currentFileIndex,
    } = body;

    // Verify ownership
    const existing = await prisma.postSeries.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    // Calculate next scheduled date if schedule changed
    let nextScheduledAt = existing.nextScheduledAt;
    if (daysOfWeek || timeOfDay || startDate || timezone) {
      nextScheduledAt = calculateNextScheduledDate(
        startDate ? new Date(startDate) : existing.startDate,
        daysOfWeek || existing.daysOfWeek,
        timeOfDay || existing.timeOfDay || undefined,
        timezone || existing.timezone
      );
    }

    const series = await prisma.postSeries.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(frequency && { frequency }),
        ...(daysOfWeek && { daysOfWeek }),
        ...(timeOfDay !== undefined && { timeOfDay }),
        ...(timezone !== undefined && { timezone }),
        ...(platforms && { platforms }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(status && { status }),
        ...(profileId !== undefined && { profileId: profileId || null }),
        ...(autoPost !== undefined && { autoPost }),
        ...(deleteAfterPosting !== undefined && { deleteAfterPosting }),
        ...(googleDriveFolderId !== undefined && { googleDriveFolderId }),
        ...(dropboxFolderId !== undefined && { dropboxFolderId }),
        ...(dropboxFolderPath !== undefined && { dropboxFolderPath }),
        ...(prompt !== undefined && { prompt }),
        ...(loopEnabled !== undefined && { loopEnabled }),
        ...(currentFileIndex !== undefined && { currentFileIndex }),
        nextScheduledAt,
      },
    });

    return NextResponse.json({ series });
  } catch (error) {
    console.error('Error updating series:', error);
    return NextResponse.json(
      { error: 'Failed to update series' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify ownership
    const existing = await prisma.postSeries.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Series not found' }, { status: 404 });
    }

    // Delete the series (posts will have seriesId set to null due to the relation)
    await prisma.postSeries.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting series:', error);
    return NextResponse.json(
      { error: 'Failed to delete series' },
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
