# Rise as One Rate Limit Display Fix

## Date
November 23, 2025

## Issue Reported
**"Rise as One" profile was not showing in the Rate Limits table**, even though it should appear alongside "Basketball Factory".

## Root Cause
The `/api/late/rate-limit` API endpoint was only returning profiles that had **posting activity recorded** in the rate limit tracking file (`/tmp/late-rate-limit.json`). Since "Rise as One" hadn't posted recently (or posts weren't tracked), it wasn't included in the API response.

## Fix Applied

### File Modified
`/home/ubuntu/late_content_poster/nextjs_space/app/api/late/rate-limit/route.ts`

### Changes Made

1. **Always fetch ALL user profiles** from the database (not just those with posting history)
2. **Show all 7 platforms** (Instagram, Facebook, LinkedIn, Threads, TikTok, Bluesky, YouTube) for each profile
3. **Display 0/8** for platforms that haven't been used yet
4. **Merge existing rate limit data** with complete profile list to show accurate counts

### Before (Broken Logic)
```typescript
// Only returned profiles that had posts recorded
const rateLimitStatus = getLateRateLimitStatus(profileIds)

if (rateLimitStatus.length === 0) {
  return NextResponse.json({
    hasData: false,
    message: 'No recent posting activity'
  })
}

return NextResponse.json({
  profiles: rateLimitStatus  // Only profiles with activity
})
```

### After (Fixed Logic)
```typescript
// Get all user profiles with platform settings
const profiles = await prisma.profile.findMany({
  where: { userId: user.id },
  include: { platformSettings: { where: { isConnected: true } } }
})

// Get existing rate limit data
const rateLimitStatus = getLateRateLimitStatus(profileIds)
const rateLimitMap = new Map(rateLimitStatus.map(p => [p.profileId, p]))

// Build COMPLETE profile list (even if 0 posts)
const ALL_PLATFORMS = ['instagram', 'facebook', 'linkedin', 'threads', 'tiktok', 'bluesky', 'youtube']

const completeProfileList = profiles.map(profile => {
  const existingData = rateLimitMap.get(profile.id)
  
  if (existingData) {
    // Profile has activity - show all platforms with actual counts
    const allPlatformStatuses = ALL_PLATFORMS.map(platform => {
      const existing = existingData.platforms.find(p => p.platform === platform)
      return existing || { platform, count: 0, limit: 8, remaining: 8, ... }
    })
    return { ...existingData, platforms: allPlatformStatuses }
  } else {
    // Profile has NO activity - show all platforms as 0/8
    return {
      profileId: profile.id,
      profileName: profile.name,
      platforms: ALL_PLATFORMS.map(platform => ({
        platform, count: 0, limit: 8, remaining: 8, statusLevel: 'good', ...
      })),
      overallStatus: 'good'
    }
  }
})

return NextResponse.json({
  profiles: completeProfileList  // ALL profiles, always
})
```

## Expected Behavior After Fix

### Rate Limits Table Will Show:

```
Business / Platform    Instagram  Facebook  LinkedIn  Twitter  Threads  TikTok  Bluesky  YouTube
═══════════════════════════════════════════════════════════════════════════════════════════════════
Basketball Factory     0/8        0/8       0/8       0/8      0/8      0/8     0/8      0/8
Rise as One            0/8        0/8       0/8       0/8      0/8      0/8     0/8      0/8
```

**Both profiles will ALWAYS be visible**, showing their actual post counts or 0/8 if no posts.

## Deployment Status
✅ Code changes committed
✅ Build successful  
✅ Checkpoint saved: "Fixed Rise as One rate limit display"
✅ Deployed to: `late-content-poster-bvwoef.abacusai.app`

⚠️  **Note**: CDN caching may take 5-10 minutes to propagate. If "Rise as One" still doesn't appear:
1. Hard refresh the browser (Ctrl+Shift+R)
2. Clear browser cache
3. Wait 10 minutes for CDN to update

## Verification Steps

### 1. Check API Response Directly
```bash
curl 'https://late-content-poster-bvwoef.abacusai.app/api/late/rate-limit' \
  -H 'Cookie: <your-session-token>' | jq '.profiles[] | .profileName'
```

Expected output:
```
"Basketball Factory"
"Rise as One"
```

### 2. Check in UI
1. Navigate to: Dashboard → Post → Rate Limits tab
2. Look at the table
3. Both "Basketball Factory" and "Rise as One" should be listed

### 3. Test with Actual Posts
To populate the rate limit data and verify correct numbers:
```bash
cd /home/ubuntu/late_content_poster
npx tsx test_content_journey_both_profiles.ts
```

This will:
- Post from Basketball Factory
- Post from Rise as One
- Verify both show up with correct counts

## Database Verification

### Check Profiles Exist
```sql
SELECT id, name, "userId", "companyId" 
FROM "Profile" 
WHERE name IN ('Basketball Factory', 'Rise as One');
```

Expected: 2 rows

### Check Connected Platforms
```sql
SELECT p.name, ps.platform, ps."isConnected", ps."platformId"
FROM "Profile" p
JOIN "PlatformSetting" ps ON ps."profileId" = p.id
WHERE p.name IN ('Basketball Factory', 'Rise as One')
  AND ps."isConnected" = true
  AND ps.platform != 'twitter'
ORDER BY p.name, ps.platform;
```

Expected:
- Basketball Factory: 7 platforms
- Rise as One: 4 platforms (instagram, facebook, threads, youtube)

## Next Steps (User Action)

1. **Wait 5-10 minutes** for deployment to fully propagate
2. **Hard refresh** the Rate Limits page (Ctrl+Shift+R)
3. **Verify** both profiles appear in the table
4. If still not showing, **report back** with:
   - Screenshot of Rate Limits tab
   - Browser console errors (F12 → Console tab)
   - Result of API curl command above

## Summary
✅ **ROOT CAUSE IDENTIFIED**: API only returned profiles with existing post history  
✅ **FIX APPLIED**: API now always returns ALL profiles, showing 0/8 for unused platforms  
✅ **DEPLOYED**: Changes are live on production  
⏳ **WAITING**: CDN cache clearance (5-10 minutes)

---

**Status**: 🟡 DEPLOYED - Waiting for CDN propagation  
**Expected Time**: 5-10 minutes  
**Action Required**: User should hard refresh after 10 minutes
