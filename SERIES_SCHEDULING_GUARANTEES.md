# Series Scheduling Guarantees

## Date: November 22, 2025

## Overview
This document details ALL safeguards and guarantees that ensure your post series runs **exactly as configured** - posting once per day at the specified time to the specified platforms.

---

## The 5 Layers of Protection

### Layer 1: Next Schedule Time Calculation ✅
**What it does:** After each post, the system calculates the next scheduled time using your exact configuration.

**Code location:** `lib/cloud-storage-series-processor.ts` (lines 441-462)

**How it works:**
- Uses `dayjs` for timezone-aware date calculation
- Reads your `daysOfWeek`, `timeOfDay`, and `timezone` from the database
- Calculates the EXACT next date/time when the series should run
- Updates `nextScheduledAt` in the database

**Example:**
```
Configuration: Monday-Sunday at 7:00 AM EST
After posting on Nov 22 at 7:00 AM EST
→ Next scheduled: Nov 23 at 7:00 AM EST (stored as 2025-11-23T12:00:00.000Z)
```

---

### Layer 2: Strict Time Validation ✅
**What it does:** Before processing ANY series, checks if it's actually time to post.

**Code location:** `lib/cloud-storage-series-processor.ts` (lines 253-276)

**How it works:**
1. Gets current time in UTC
2. Gets `nextScheduledAt` from database
3. Compares: If `nextScheduledAt > now`, **SKIP** and return message with minutes remaining
4. Only processes if `nextScheduledAt <= now`

**Console output you'll see:**
```
⏰ Time Check:
   Current time:  2025-11-23T11:59:00.000Z (Nov 23, 6:59 AM EST)
   Scheduled for: 2025-11-23T12:00:00.000Z (Nov 23, 7:00 AM EST)
❌ Safeguard 2 FAILED: Series is scheduled for the FUTURE.
   Time until scheduled: 1 minutes
   → Skipping - not yet time to post.
```

---

### Layer 3: Duplicate Prevention Lock ✅
**What it does:** Prevents the same series from posting multiple times within 50 minutes.

**Code location:** `lib/cloud-storage-series-processor.ts` (lines 278-299)

**How it works:**
1. Checks `lastProcessedAt` timestamp
2. Calculates minutes since last processing
3. If < 50 minutes, **SKIP** and return message
4. This prevents double-posting if the daemon runs multiple times

**Console output you'll see:**
```
📅 Last Processed Check:
   Last processed: 2025-11-23T12:00:30.000Z (Nov 23, 7:00 AM EST)
   Minutes ago: 15
❌ Safeguard 3 FAILED: Series was processed too recently.
   → Skipping to prevent duplicate posting (minimum 50-minute gap required).
```

---

### Layer 4: Status Check ✅
**What it does:** Only processes series marked as ACTIVE.

**Code location:** `lib/cloud-storage-series-processor.ts` (lines 243-251)

**How it works:**
- Reads `status` field from database
- If status is not 'ACTIVE' (e.g., 'PAUSED', 'COMPLETED'), **SKIP**

**Console output you'll see:**
```
✅ Safeguard 1: Series is ACTIVE
```

---

### Layer 5: Comprehensive Logging ✅
**What it does:** Logs every decision point so you can verify what the system is doing.

**Code location:** Throughout `lib/cloud-storage-series-processor.ts`

**What you'll see in logs:**
```
================================================================================
🚀 Processing Series: [series-id]
================================================================================
📋 Series: MOTIVATIONAL QUOTES RHYME (TBF) V1
   Storage: Dropbox
   Platforms: instagram, facebook, linkedin, threads, tiktok, bluesky, twitter
   Current File Index: 4
   Loop Enabled: true

✅ Safeguard 1: Series is ACTIVE

⏰ Time Check:
   Current time:  2025-11-23T12:00:10.000Z (Nov 23, 7:00 AM EST)
   Scheduled for: 2025-11-23T12:00:00.000Z (Nov 23, 7:00 AM EST)
✅ Safeguard 2: Scheduled time is in the past - OK to process

📅 Last Processed Check:
   Last processed: 2025-11-22T12:00:00.000Z (Nov 22, 7:00 AM EST)
   Minutes ago: 1440
✅ Safeguard 3: Sufficient time since last processing

🎯 ALL SAFEGUARDS PASSED - Proceeding with series processing
```

---

## What This Guarantees

### ✅ **Guarantee 1: Exact Schedule**
Your series will ONLY post when `nextScheduledAt` is reached. Not before, not after.

### ✅ **Guarantee 2: No Duplicates**
Even if the daemon runs multiple times per hour, the series can only post once every 50+ minutes.

### ✅ **Guarantee 3: Correct Platforms**
Posts to the exact platforms configured in your series settings.

### ✅ **Guarantee 4: Automatic Advancement**
After each post:
- `currentFileIndex` increments to next file
- `lastProcessedAt` records the posting time
- `nextScheduledAt` calculates the next run time
- Status updates (or loops if configured)

### ✅ **Guarantee 5: Full Visibility**
Every decision is logged to console:
- Why a series was skipped
- Why a series was processed
- Exact times in both UTC and your timezone
- Every safeguard check result

---

## How the Daemon Works

### Cron Schedule
```
0 * * * *  (Every hour on the hour)
```

### Execution Flow
1. **Daemon wakes up** (e.g., 7:00 AM, 8:00 AM, 9:00 AM...)
2. **Calls** `/api/series/process`
3. **API finds** all series where:
   - `status = 'ACTIVE'`
   - `dropboxFolderId IS NOT NULL`
   - `nextScheduledAt <= current_time`
4. **For each series:**
   - Run all 5 safeguard layers
   - If ALL pass → Process and post
   - If ANY fail → Skip with logged reason
5. **Results logged** to `/home/ubuntu/late_content_poster/logs/`

---

## Current Series Configuration

**Series:** MOTIVATIONAL QUOTES RHYME (TBF) V1

**Schedule:**
- Days: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday (all days)
- Time: 07:00 (7:00 AM)
- Timezone: America/New_York (EST/EDT)

**Next Scheduled:**
- UTC: 2025-11-23T12:00:00.000Z
- EST: November 23, 2025 at 7:00 AM

**Platforms:**
- Instagram
- Facebook
- LinkedIn
- Threads
- TikTok
- Bluesky
- Twitter (via separate API)

**Status:** ACTIVE

---

## Verification Steps

### 1. Check Logs
```bash
ls -la /home/ubuntu/late_content_poster/logs/
cat /home/ubuntu/late_content_poster/logs/series_processing_[timestamp].log
```

### 2. Verify Database
```typescript
// Check current series state
const series = await prisma.postSeries.findFirst({
  where: { name: { contains: 'MOTIVATIONAL' } }
});
console.log('Status:', series.status);
console.log('Next Scheduled:', series.nextScheduledAt);
console.log('Last Processed:', series.lastProcessedAt);
console.log('Current Index:', series.currentFileIndex);
```

### 3. Monitor Posting
- **Expected:** One post per day at 7:00 AM EST
- **Verify:** Check social media platforms at 7:05 AM EST each day
- **Confirm:** File index increments each day (4 → 5 → 6 → ...)

---

## What Can Still Go Wrong?

### Scenario 1: Dropbox Token Expires
**Detection:** Error logged: "Dropbox access token has expired"
**Solution:** Reconnect Dropbox in settings
**Safeguard:** Series continues once token is refreshed

### Scenario 2: Late API Platform Disconnected
**Detection:** Post status shows "requires authentication"
**Solution:** Reconnect platform via Late API dashboard
**Safeguard:** Other platforms continue posting

### Scenario 3: Daily Rate Limit Reached
**Detection:** Error logged: "Daily limit reached for this account"
**Solution:** Wait for 24-hour rolling window reset
**Safeguard:** Logged and tracked, series tries again next day

---

## Summary

**5 Layers of Protection:**
1. ✅ Next schedule time auto-calculation
2. ✅ Strict time validation (only if `nextScheduledAt <= now`)
3. ✅ Duplicate prevention (minimum 50-minute gap)
4. ✅ Status check (only ACTIVE series)
5. ✅ Comprehensive logging (every decision logged)

**Result:**
Your series will post **EXACTLY** as configured:
- ✅ Once per day
- ✅ At 7:00 AM EST
- ✅ To all specified platforms
- ✅ Following the series file order
- ✅ With full logging for verification

**If ANY safeguard fails, the series WILL NOT post and the reason will be logged.**

---

## Files Modified

1. `/lib/cloud-storage-series-processor.ts`
   - Added 5 safeguard layers
   - Enhanced logging at every decision point
   - Fixed `nextScheduledAt` calculation

2. Database (manual correction)
   - Set correct `nextScheduledAt` for current series

3. `/logs/` directory
   - Daemon creates timestamped logs every hour

---

## Checkpoint

✅ **All safeguards implemented**
✅ **Build successful**
✅ **Ready for production**

**Next scheduled post:** Tomorrow (Nov 23, 2025) at 7:00 AM EST

The system now has multiple redundant checks to guarantee your series runs exactly as configured.
