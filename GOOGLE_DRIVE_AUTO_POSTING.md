# 🗂️ Google Drive Auto-Posting Feature

## Overview

The Google Drive Auto-Posting feature allows you to automatically post numbered files from your Google Drive folders to social media platforms on a schedule. The system will:

1. **Grab files sequentially** (1-something.jpg, 2-something.mp4, etc.)
2. **Analyze content with AI** to understand what's in each image/video
3. **Generate posts** using your custom prompt
4. **Post automatically** via Late API at your scheduled times

---

## ⚙️ How It Works

### 1. **Setup Phase** (One-time configuration)

1. Go to **Dashboard → Post → Series** tab
2. Click **"Create New Series"**
3. Fill in the basic details:
   - **Name**: e.g., "Game Highlights"
   - **Days of Week**: Select when to post (e.g., Monday, Wednesday, Friday)
   - **Time**: Set posting time (e.g., 10:00 AM Eastern)
   - **Platforms**: Choose where to post (Instagram, Facebook, etc.)

4. **Configure Google Drive Integration**:
   - **Folder ID**: Paste your Google Drive folder ID
     - Find it in URL: `drive.google.com/drive/folders/YOUR_FOLDER_ID`
   - **AI Prompt**: Write instructions for content generation
     - Example: *"Create an exciting post about this basketball game highlight. Include player names, score, and energetic language."*
   - **Loop Enabled**: Toggle ON if you want to automatically restart from file 1 after reaching the end

### 2. **File Naming Convention** (CRITICAL!)

Files in your Google Drive folder **must** be named with numeric prefixes:

✅ **Correct:**
- `1-game-highlights.jpg`
- `2-practice-session.mp4`
- `3-team-photo.png`
- `10-championship-win.jpg`

❌ **Wrong:**
- `game-1.jpg` (number must be at start)
- `highlights.jpg` (no number)
- `photo_01.png` (underscore not dash)

### 3. **Automated Execution**

The daemon runs **every minute** and:
- Checks which series are due (within 2 minutes of scheduled time)
- Downloads the next numbered file from Google Drive
- Uses AI to analyze the image/video
- Generates post content based on your prompt
- Posts immediately via Late API
- Increments the file counter
- Schedules the next run

---

## 🎯 Example Use Case

**Scenario:** Basketball team wants to post game highlights 3 times a week

**Setup:**
```
Series Name: "Game Highlights"
Schedule: Monday, Wednesday, Friday at 10:00 AM EST
Platforms: Instagram, Facebook, Twitter
Google Drive Folder: 1Abc2Def3Ghi4Jkl5Mno
AI Prompt: "Create an exciting post about this basketball game highlight. 
          Mention the plays, players visible, and hype up the action. 
          Use energetic language and basketball emojis."
Loop: ON
```

**Files in Drive:**
```
1-game1-buzzer-beater.jpg
2-game2-slam-dunk.mp4
3-game3-three-pointer.jpg
4-game4-defense-block.jpg
... (up to 30 files)
```

**What Happens:**
- **Monday 10:00 AM**: Posts file #1 → counter goes to 2
- **Wednesday 10:00 AM**: Posts file #2 → counter goes to 3
- **Friday 10:00 AM**: Posts file #3 → counter goes to 4
- ... continues until file #30
- **After file #30**: Loops back to file #1 (because Loop is ON)

---

## 🛠️ Management Controls

For each Google Drive-enabled series, you have these controls:

### 👁️ **Preview**
- Click to see which file will be posted next
- Shows file name, number, and total files in folder
- Useful to verify the queue before posting

### 🧪 **Test**
- Manually trigger a post immediately (ignores schedule)
- Posts the next file in sequence
- Great for testing your setup
- **WARNING**: This WILL post to your actual social media accounts!

### 🔄 **Reset**
- Resets the file counter back to 1
- Useful if you:
  - Add new files to the beginning
  - Want to restart the series
  - Made a mistake and need to re-post

---

## 📊 Status Indicators

When viewing your series, Google Drive-enabled ones show:

```
🗂️ Google Drive Enabled
   File #5    🔄 Loop
   [👁️ Preview] [🧪 Test] [🔄 Reset]
```

- **File #X**: Current file number in queue
- **🔄 Loop**: Shows if looping is enabled
- **Blue box**: Visual indicator that Google Drive is active

---

## 🚀 Daemon Setup

The daemon runs automatically and checks for due posts every minute.

### Manual Daemon Execution (for testing):

```bash
cd /home/ubuntu/late_content_poster/nextjs_space
npx ts-node scripts/google-drive-series-daemon.ts
```

### Automated Daemon Setup (Production):

#### Option 1: Cron Job (Recommended)
```bash
# Edit crontab
crontab -e

# Add this line to run every minute:
* * * * * cd /home/ubuntu/late_content_poster/nextjs_space && npx ts-node scripts/google-drive-series-daemon.ts >> /home/ubuntu/google-drive-daemon.log 2>&1
```

#### Option 2: PM2 (Process Manager)
```bash
# Install PM2
npm install -g pm2

# Start daemon (runs every minute via internal scheduler)
pm2 start scripts/google-drive-series-daemon.ts --name "google-drive-poster" --cron "* * * * *"

# View logs
pm2 logs google-drive-poster

# Stop daemon
pm2 stop google-drive-poster
```

---

## 🔍 Troubleshooting

### "No files found in folder"
- ✅ Check files are named correctly (1-, 2-, 3-)
- ✅ Verify folder ID is correct
- ✅ Ensure Google Drive is connected (check permissions)

### "File X not found and looping is disabled"
- You've reached the end of your files
- **Solution 1**: Enable looping in series settings
- **Solution 2**: Add more files to your Drive folder
- **Solution 3**: Reset counter to 1

### "Preview Failed"
- Google Drive folder ID might be wrong
- Files might not have numeric prefixes
- Check network/API connection

### "Test Failed"
- Check Late API key is configured (`LATE_API_KEY` in .env)
- Verify platforms are correctly linked in Late
- Check error message in toast notification

---

## 🎨 AI Content Generation

The AI analyzes each image/video and combines it with your prompt to create posts.

### How It Works:
1. **Image Analysis**: AI describes what it sees
   - People, actions, emotions, setting, colors, text
2. **Prompt Application**: Your instructions are applied
   - Tone, style, platform-specific formatting
3. **Content Generation**: Creates final post
   - Caption, hashtags, mentions, emojis

### Best Practices for Prompts:

**✅ Good Prompts:**
```
"Create an exciting post about this basketball game. 
Mention the team name 'Rise As One AAU', highlight 
the action, and use basketball emojis. Keep it energetic 
and inspiring for young players."
```

**❌ Generic Prompts:**
```
"Make a post about this image"
```

**Pro Tips:**
- Be specific about tone (exciting, professional, casual)
- Mention team/brand names to include
- Specify emoji usage
- Set length expectations (short for Twitter, longer for Facebook)

---

## ⚡ Performance & Limits

- **Processing Time**: ~30-60 seconds per file
  - 5-10s: Download from Drive
  - 10-20s: AI analysis
  - 5-10s: Content generation
  - 5-10s: Upload & post via Late API

- **File Limits**: 
  - Max file size: 50MB (Late API limit)
  - Supported formats: JPG, PNG, MP4, MOV
  - Recommended: Under 10MB for faster processing

- **Scheduling**:
  - Daemon checks every 1 minute
  - Posts prepared 2 minutes early
  - Posts exactly at scheduled time

---

## 🔒 Security & Permissions

### Required Permissions:
- ✅ Google Drive: Read access to specified folders
- ✅ Late API: Post creation permissions
- ✅ Social Platforms: Linked via Late

### Data Privacy:
- Files downloaded temporarily (deleted after posting)
- AI analysis done via Abacus AI (secure, encrypted)
- No permanent storage of Drive files in your database

---

## 📝 API Endpoints

For developers/automation:

### Preview Next File
```http
GET /api/series/{seriesId}/preview-next
```

### Test Run (Post Now)
```http
POST /api/series/{seriesId}/test-run
```

### Reset Counter
```http
POST /api/series/{seriesId}/reset-counter
Body: { "newIndex": 1 }
```

---

## ✨ Tips & Tricks

1. **Test Before Going Live**
   - Use the 🧪 Test button with 1-2 files first
   - Verify content quality matches expectations
   - Check all platforms receive the post correctly

2. **Organize Your Drive**
   - Create separate folders for different series
   - Use consistent naming: `1-brief-description.ext`
   - Keep files under 10MB for best performance

3. **Monitor Progress**
   - Check the "File #X" indicator regularly
   - Use Preview to see what's coming next
   - Review posted content in Dashboard → Posts

4. **Seasonal Content**
   - Disable loop during off-season
   - Reset counter at start of new season
   - Update prompts for different contexts

5. **Multiple Series**
   - Create separate series for different content types
   - Game highlights, practice sessions, team photos, etc.
   - Each can have its own schedule and prompt

---

## 🆘 Support

If you encounter issues:

1. **Check daemon logs**: `/home/ubuntu/google-drive-daemon.log`
2. **Test manually**: Run daemon script directly
3. **Verify API keys**: LATE_API_KEY, ABACUSAI_API_KEY
4. **Check permissions**: Google Drive access

---

## 🎉 Success Checklist

Before launching your first auto-posting series:

- [ ] Google Drive folder created with numbered files (1-, 2-, 3-)
- [ ] Series created in Dashboard with correct schedule
- [ ] Folder ID pasted correctly
- [ ] AI prompt written and tested
- [ ] Platforms selected and linked in Late
- [ ] Test button clicked and verified post appears
- [ ] Daemon running (cron job or PM2)
- [ ] First scheduled post confirmed successful

**You're all set! Your content will now post automatically.** 🚀
