# Daemon Frequency Update

## Change Required

The Dropbox Series Auto-Poster daemon needs to be updated from **hourly** to **every 5 minutes**.

## Current Configuration
- **Schedule**: Hourly (0 */1 * * *)
- **Script**: `/home/ubuntu/late_content_poster/nextjs_space/scripts/process_scheduled_series.ts`

## New Configuration Needed
- **Schedule**: Every 5 minutes (*/5 * * * *)
- **Script**: Same

## How to Update

### Via UI (Recommended):
1. Go to: https://apps.abacus.ai/chatllm/admin/tasks
2. Find task: "Dropbox Series Auto-Poster"
3. Click "Edit"
4. Change schedule from `0 */1 * * *` to `*/5 * * * *`
5. Click "Save"

### Why This Change?

**BEFORE (Hourly)**:
- Post publishes at 7:00 AM
- Daemon checks at 8:00 AM (1 hour later)
- Next post scheduled at 8:00 AM
- **1 HOUR DELAY** ❌

**AFTER (Every 5 Minutes)**:
- Post publishes at 7:00 AM  
- Daemon checks at 7:05 AM (5 minutes later)
- Next post scheduled at 7:05 AM
- **5 MINUTE DELAY** ✅

## Updated Logic

The code has been updated to detect:
1. ✅ **Published** posts (mission accomplished)
2. ✅ **Draft** posts (manually moved by user)
3. ✅ **Deleted** posts (removed from Late API)
4. ✅ **Failed** posts (posting error)

**Any non-"scheduled" status will trigger the next post to be scheduled immediately.**

## Status
- ✅ Code updated in `lib/cloud-storage-series-processor.ts`
- ⏳ **USER ACTION REQUIRED**: Update daemon schedule to `*/5 * * * *`

