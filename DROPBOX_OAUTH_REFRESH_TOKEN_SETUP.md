# Dropbox OAuth Refresh Token Setup - COMPLETE GUIDE

## Date
November 25, 2025

## Executive Summary

**PROBLEM**: Dropbox access tokens expire every 4 hours, causing your auto-posting to fail.

**SOLUTION**: OAuth with refresh tokens - tokens refresh automatically in the background, forever.

**RESULT**: ✅ Your Dropbox integration will NEVER expire again. Zero manual intervention required.

---

## What Was Implemented

### 1. Automatic Token Refresh
The app now:
- ✅ Detects when a Dropbox access token expires (401 error)
- ✅ Automatically uses the refresh token to get a new access token
- ✅ Saves the new access token to the database
- ✅ Retries the failed request with the new token
- ✅ All happens in the background without any user action

### 2. Files Modified

#### `/lib/dropbox.ts`
- Added `refreshAccessToken()` function to call Dropbox OAuth API
- Added `saveAccessToken()` function to persist new tokens
- Modified `getDropboxTokens()` to prioritize refresh tokens
- Modified `createDropboxClient()` to wrap all API calls with automatic retry logic

**Code Flow:**
```
1. App makes Dropbox API call
2. If 401 error detected:
   a. Call Dropbox OAuth API with refresh token
   b. Receive new access token (valid 4 hours)
   c. Save new access token to auth secrets file
   d. Retry original API call with new token
3. If refresh fails, return error to user
```

---

## How to Set Up OAuth with Refresh Token

### Prerequisites
You need:
1. A Dropbox App (you already have this)
2. Your Dropbox App's **App Key** and **App Secret**
3. A refresh token (we'll get this below)

---

### Step 1: Get Your Dropbox App Key and Secret

1. Go to https://www.dropbox.com/developers/apps
2. Click on your app ("BasketballFactoryPoster" or whatever you named it)
3. Copy the **App key**
4. Click **"Show"** next to **App secret** and copy it

**Save these somewhere safe - you'll need them for Step 3.**

---

### Step 2: Get a Refresh Token

You need to go through the OAuth flow **once** to get a refresh token.

#### Option A: Use the oauth_token_manager Tool (RECOMMENDED)

I can run this for you:

```bash
oauth_token_manager --service dropbox
```

This will:
1. Open a browser for you to authorize the app
2. Save the access token AND refresh token to `/home/ubuntu/.config/abacusai_auth_secrets.json`
3. Done!

#### Option B: Manual OAuth Flow (if Option A doesn't work)

1. **Construct Authorization URL:**
   ```
   https://www.dropbox.com/oauth2/authorize?client_id=YOUR_APP_KEY&response_type=code&token_access_type=offline
   ```
   Replace `YOUR_APP_KEY` with your actual App Key from Step 1.

2. **Open the URL in a browser** and authorize the app.

3. **Copy the authorization code** from the URL after redirecting.

4. **Exchange the code for tokens:**
   ```bash
   curl -X POST https://api.dropbox.com/oauth2/token \
     -d grant_type=authorization_code \
     -d code=YOUR_AUTHORIZATION_CODE \
     -d client_id=YOUR_APP_KEY \
     -d client_secret=YOUR_APP_SECRET
   ```

5. **Copy the `refresh_token` from the response** (it will NOT start with `sl.`).

---

### Step 3: Configure Environment Variables

Add these to `/home/ubuntu/late_content_poster/nextjs_space/.env`:

```env
DROPBOX_APP_KEY=your_app_key_here
DROPBOX_APP_SECRET=your_app_secret_here
DROPBOX_REFRESH_TOKEN=your_refresh_token_here
```

**IMPORTANT:**
- The refresh token does NOT start with `sl.`
- The refresh token is usually 60-80 characters long
- The refresh token NEVER expires (unless you manually revoke it)

---

### Step 4: Update Auth Secrets File (Alternative to .env)

Alternatively, you can store the refresh token in `/home/ubuntu/.config/abacusai_auth_secrets.json`:

```json
{
  "dropbox": {
    "secrets": {
      "REFRESH_TOKEN": {
        "value": "your_refresh_token_here"
      },
      "ACCESS_TOKEN": {
        "value": "your_current_access_token",
        "expires_at": "2025-11-25T12:00:00Z"
      }
    }
  }
}
```

---

## How It Works Now

### Token Priority (in order):

1. **BEST**: Refresh token in `.env` or `auth_secrets.json`
   - App auto-refreshes access tokens every 4 hours
   - Zero manual intervention
   - Works forever

2. **OKAY**: App Access Token (your current setup)
   - Never expires
   - But Dropbox deprecated these in 2021
   - May stop working in the future

3. **WORST**: OAuth access token without refresh
   - Expires in 4 hours
   - Requires manual reconnection
   - Will break your auto-posting

---

## Verification

### Test the Setup:

1. **Make sure the environment variables are set:**
   ```bash
   cd /home/ubuntu/late_content_poster/nextjs_space
   cat .env | grep DROPBOX
   ```

2. **Test Dropbox connection:**
   ```bash
   node -e "console.log(require('./lib/dropbox').isDropboxConnected())"
   ```

3. **Check the console logs:**
   - You should see: `✅ Using Dropbox OAuth with refresh token (automatic renewal enabled)`

4. **Wait for a token to expire** (or force a 401 error) and check logs:
   - You should see:
     ```
     🔄 Detected 401 error, attempting to refresh Dropbox token...
     🔄 Refreshing Dropbox access token using refresh token...
     ✅ Successfully refreshed Dropbox access token (valid for ~4 hours)
     ✅ Saved new Dropbox access token to auth secrets
     🔄 Retrying Dropbox request with refreshed token...
     ✅ Request succeeded with refreshed token
     ```

---

## Troubleshooting

### Error: "DROPBOX_APP_KEY and DROPBOX_APP_SECRET must be set"

**Solution:** Add these to your `.env` file (see Step 3 above).

### Error: "Failed to refresh Dropbox token: 400 Bad Request"

**Possible Causes:**
1. Invalid refresh token
2. Wrong App Key or App Secret
3. Refresh token was revoked

**Solution:**
- Go through the OAuth flow again (Step 2) to get a new refresh token
- Make sure App Key and App Secret are correct

### Error: "Dropbox OAuth token has expired. Please reconnect Dropbox to get a refresh token."

**Cause:** You're using an old OAuth token without a refresh token.

**Solution:** Follow Step 2 to get a refresh token.

---

## What Happens Automatically

### Every ~4 Hours:
1. ⏰ Your access token expires
2. 🔍 App detects 401 error on next Dropbox API call
3. 🔄 App automatically calls Dropbox OAuth API with refresh token
4. ✅ App receives new access token (valid for another 4 hours)
5. 💾 App saves new access token to `auth_secrets.json`
6. 🔄 App retries the failed API call with new token
7. ✅ Everything continues working

### You Do: NOTHING

The refresh happens automatically in the background. You'll never know it happened.

---

## Benefits of OAuth with Refresh Token

✅ **Zero Manual Intervention**: Tokens refresh automatically
✅ **Works Forever**: Refresh token never expires (unless revoked)
✅ **Transparent**: Happens in background during API calls
✅ **No Downtime**: Failed requests are automatically retried
✅ **Secure**: Refresh token stored securely in auth secrets
✅ **Production Ready**: Used by millions of apps worldwide

---

## Migration Path

### Current State (What you have now):
- ❌ App Access Token that expires
- ❌ Manual reconnection required
- ❌ Auto-posting breaks when token expires

### After Setup (What you'll have):
- ✅ Refresh token that never expires
- ✅ Automatic token renewal
- ✅ Auto-posting works forever

---

## Summary

1. **Get App Key and Secret** from Dropbox Developer Console
2. **Get Refresh Token** via OAuth flow (use `oauth_token_manager` or manual)
3. **Add to `.env`**:
   - `DROPBOX_APP_KEY`
   - `DROPBOX_APP_SECRET`
   - `DROPBOX_REFRESH_TOKEN`
4. **Done** - tokens will auto-refresh forever

---

## Status

✅ **CODE IMPLEMENTED** - OAuth refresh token flow is ready
⏳ **USER ACTION REQUIRED** - You need to set up the tokens (Steps 1-3 above)
🎯 **FINAL RESULT** - Dropbox will work forever without manual intervention

---

**Once you complete Steps 1-3, your Dropbox integration will be 100% permanent and automatic. No more token expiration issues. Ever.**
