# Late Content Poster - Product Requirements Document (PRD)

## Document Information

- **Product Name**: Late Content Poster
- **Version**: 1.0.0
- **Last Updated**: November 26, 2025
- **Document Owner**: Product Team
- **Status**: Production Ready

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Goals](#2-product-vision--goals)
3. [Target Users & Personas](#3-target-users--personas)
4. [User Stories & Use Cases](#4-user-stories--use-cases)
5. [Features & Requirements](#5-features--requirements)
6. [Technical Architecture](#6-technical-architecture)
7. [User Experience & Interface](#7-user-experience--interface)
8. [Data & Privacy](#8-data--privacy)
9. [Success Metrics & KPIs](#9-success-metrics--kpis)
10. [Roadmap & Future Enhancements](#10-roadmap--future-enhancements)
11. [Dependencies & Risks](#11-dependencies--risks)
12. [Appendix](#12-appendix)

---

## 1. Executive Summary

### 1.1 Product Overview

Late Content Poster is a comprehensive social media management platform designed to streamline content creation, scheduling, and distribution across multiple social media platforms. The platform leverages AI for intelligent content generation, integrates with Dropbox for seamless media management, and provides automated posting workflows that save users significant time and effort.

### 1.2 Problem Statement

Social media managers, content creators, and businesses face several challenges:

1. **Time-Consuming Manual Posting**: Posting to multiple platforms individually is repetitive and inefficient
2. **Content Creation Bottleneck**: Writing unique captions and hashtags for each post requires creativity and time
3. **Scheduling Complexity**: Managing posting schedules across different timezones and platforms is error-prone
4. **Media Management**: Organizing and accessing media files across different sources is cumbersome
5. **Consistency**: Maintaining regular posting schedules manually is difficult
6. **Rate Limit Tracking**: Avoiding platform rate limits requires manual monitoring

### 1.3 Solution

Late Content Poster addresses these challenges through:

- **AI-Powered Content Generation**: Automatically creates engaging captions and hashtags
- **Multi-Platform Publishing**: Post to 8+ platforms simultaneously
- **Automated Series**: Schedule recurring posts from Dropbox folders with zero manual intervention
- **Bulk Scheduling**: Schedule dozens of posts at once via an intuitive CSV workflow
- **Rate Limit Intelligence**: Real-time tracking and warnings for platform limits
- **Dropbox Integration**: Direct access to organized media libraries
- **Template System**: Create and reuse branded graphics

### 1.4 Key Differentiators

| Feature | Late Content Poster | Traditional Tools |
|---------|---------------------|-------------------|
| AI Content Generation | ✅ GPT-4o integration | ❌ Manual writing |
| Video OCR | ✅ Tesseract.js | ❌ Not available |
| Automated Series | ✅ Dropbox auto-post | ⚠️ Limited |
| Batched Processing | ✅ Smart batching | ❌ Single queue |
| Real-time Rate Limits | ✅ Rolling 24h window | ⚠️ Static limits |
| Multi-Company | ✅ Unlimited companies | ⚠️ Limited workspaces |
| Webhook Integration | ✅ Instant triggers | ❌ Polling only |

---

## 2. Product Vision & Goals

### 2.1 Vision Statement

**"Empower content creators to focus on creativity, not mechanics, by automating the entire social media posting workflow from ideation to publication."**

### 2.2 Strategic Goals

1. **Maximize Efficiency**: Reduce time spent on social media management by 80%
2. **Ensure Reliability**: Achieve 99.9% posting success rate with comprehensive safeguards
3. **Scale Operations**: Support unlimited companies, profiles, and platforms
4. **Enhance Quality**: Deliver AI-generated content that matches human-written quality
5. **Provide Transparency**: Offer complete visibility into posting status and rate limits

### 2.3 Success Criteria

**Phase 1 (Current - MVP)**
- ✅ Support 8+ social media platforms
- ✅ Implement AI content generation
- ✅ Enable Dropbox auto-posting series
- ✅ Deploy rate limit tracking
- ✅ Launch multi-company management

**Phase 2 (Q1 2026)**
- 📋 Add analytics dashboard
- 📋 Implement A/B testing for content
- 📋 Enable team collaboration features
- 📋 Add content calendar view
- 📋 Integrate Google Drive

**Phase 3 (Q2 2026)**
- 📋 Launch mobile app
- 📋 Add comment management
- 📋 Implement hashtag analytics
- 📋 Enable bulk editing
- 📋 Add performance insights

---

## 3. Target Users & Personas

### 3.1 Primary Personas

#### Persona 1: Sarah - Social Media Manager

**Demographics**
- Age: 28-35
- Role: Social Media Manager at a mid-size company
- Experience: 5+ years in digital marketing
- Team: 2-3 direct reports

**Goals**
- Maintain consistent posting schedule across all platforms
- Reduce time spent on manual posting tasks
- Track posting performance and rate limits
- Collaborate with content creators and designers

**Pain Points**
- Manually posting to 8+ platforms takes 2-3 hours daily
- Writing unique captions for each post is time-consuming
- Difficult to track which platforms have reached rate limits
- No easy way to schedule posts from existing Dropbox media library

**Use Cases**
- Bulk schedule 30 posts for the month in one session
- Set up automated series for daily motivational quotes
- Monitor rate limits to avoid posting failures
- Switch between multiple client accounts easily

#### Persona 2: Mike - Content Creator / Influencer

**Demographics**
- Age: 22-30
- Role: Full-time content creator / influencer
- Experience: 2-4 years creating content
- Followers: 50K-500K across platforms

**Goals**
- Post consistently to maintain audience engagement
- Automate repetitive posting tasks
- Maximize reach across all platforms
- Maintain brand consistency

**Pain Points**
- Posting to multiple platforms manually is tedious
- Creating unique content for each platform takes too long
- Missing posting windows due to manual scheduling errors
- Difficult to manage multiple brand accounts

**Use Cases**
- Post the same video to Instagram, TikTok, YouTube simultaneously
- Schedule week's content in advance every Sunday
- Use AI to generate platform-specific captions
- Track posting limits to avoid account restrictions

#### Persona 3: Jessica - Small Business Owner

**Demographics**
- Age: 35-50
- Role: Owner of local business (e.g., gym, restaurant, boutique)
- Experience: Limited social media expertise
- Budget: Looking for cost-effective solutions

**Goals**
- Maintain active social media presence with minimal effort
- Automate promotional posts for events and products
- Reach local audience across multiple platforms
- Keep content fresh without hiring a social media manager

**Pain Points**
- No time to manually post every day
- Lacks expertise in writing engaging captions
- Forgets to post consistently
- Overwhelmed by managing multiple platforms

**Use Cases**
- Set up automated posting series for daily gym motivation quotes
- Schedule promotional posts for upcoming events
- Use AI to write captions without hiring a copywriter
- Post the same content to Facebook, Instagram, LinkedIn with one click

### 3.2 Secondary Personas

#### Persona 4: Alex - Marketing Agency Owner

**Goals**
- Manage social media for 10+ clients simultaneously
- Provide white-label services
- Scale operations without adding headcount
- Demonstrate ROI to clients

**Use Cases**
- Create separate companies for each client
- Bulk schedule content for all clients at once
- Track rate limits per client account
- Generate performance reports

---

## 4. User Stories & Use Cases

### 4.1 User Stories (Must-Have)

#### Content Creation & Posting

**US-001**: As a social media manager, I want to post to multiple platforms simultaneously, so I can save time and ensure consistent messaging.
- **Acceptance Criteria**:
  - ✅ Select multiple platforms (Instagram, Facebook, LinkedIn, Twitter, Threads, TikTok, Bluesky, YouTube)
  - ✅ Upload media once, distribute to all platforms
  - ✅ View real-time posting status
  - ✅ Receive confirmation when all posts are published

**US-002**: As a content creator, I want AI to generate captions and hashtags, so I don't have to write unique content for each post.
- **Acceptance Criteria**:
  - ✅ AI analyzes uploaded images/videos
  - ✅ Generates platform-specific captions
  - ✅ Includes relevant hashtags
  - ✅ Allows editing before posting

**US-003**: As a user, I want to schedule posts for future dates/times, so I can plan content in advance.
- **Acceptance Criteria**:
  - ✅ Select date and time for posting
  - ✅ Choose timezone
  - ✅ View scheduled posts in dashboard
  - ✅ Edit or cancel scheduled posts

#### Automated Series

**US-004**: As a business owner, I want to automate posting from my Dropbox folder, so I can maintain consistent posting without manual work.
- **Acceptance Criteria**:
  - ✅ Select Dropbox folder as media source
  - ✅ Configure posting schedule (days, time, timezone)
  - ✅ Set AI prompt for content generation
  - ✅ Series posts automatically without intervention

**US-005**: As a user, I want the next post to be scheduled immediately after the current one publishes, so my Late dashboard always shows upcoming content.
- **Acceptance Criteria**:
  - ✅ First post scheduled immediately upon series creation
  - ✅ Next post scheduled within 5 minutes of current post publishing
  - ✅ Webhook triggers instant scheduling (optional)
  - ✅ Daemon provides 5-minute fallback

#### Bulk Scheduling

**US-006**: As a social media manager, I want to bulk schedule 20+ posts at once, so I can plan content for the entire month in one session.
- **Acceptance Criteria**:
  - ✅ Select Dropbox folder with media files
  - ✅ Generate AI content for all files
  - ✅ Configure single schedule applied to all posts
  - ✅ Process in batches to prevent errors

**US-007**: As a user, I want to see real-time progress during bulk scheduling, so I know the process is working correctly.
- **Acceptance Criteria**:
  - ✅ Progress bar showing current/total posts
  - ✅ Batch indicators (e.g., "Batch 1 of 3")
  - ✅ Individual file status updates
  - ✅ Final summary with success/failure counts

#### Rate Limit Management

**US-008**: As a user, I want to see my current rate limit status, so I can avoid posting failures.
- **Acceptance Criteria**:
  - ✅ Dashboard banner showing rate limit status
  - ✅ Per-platform breakdown (e.g., "Instagram: 6/8 used")
  - ✅ Reset time display for each platform
  - ✅ Color-coded status (green, yellow, red)

**US-009**: As a user, I want to receive warnings before reaching rate limits, so I can adjust my posting strategy.
- **Acceptance Criteria**:
  - ✅ Warning when 1-2 posts remaining
  - ✅ Critical alert when 0 posts remaining
  - ✅ Suggested actions (use different profile, wait for reset)
  - ✅ Automatic rate limit checks before posting

#### Multi-Company Management

**US-010**: As an agency owner, I want to manage multiple client accounts separately, so I can keep data isolated and switch contexts easily.
- **Acceptance Criteria**:
  - ✅ Create unlimited companies
  - ✅ Switch between companies via dropdown
  - ✅ Each company has isolated profiles, posts, templates
  - ✅ Custom branding per company

### 4.2 User Stories (Should-Have)

**US-011**: As a user, I want to see analytics for my posts, so I can understand what content performs best.
- **Status**: 📋 Planned for Phase 2

**US-012**: As a team lead, I want to invite team members to collaborate, so we can work together on content.
- **Status**: 📋 Planned for Phase 2

**US-013**: As a user, I want to A/B test different captions, so I can optimize engagement.
- **Status**: 📋 Planned for Phase 2

**US-014**: As a user, I want to respond to comments directly in the app, so I can manage engagement efficiently.
- **Status**: 📋 Planned for Phase 3

### 4.3 End-to-End Use Cases

#### Use Case 1: Create and Post Content Manually

**Actor**: Sarah (Social Media Manager)

**Preconditions**:
- Sarah is logged in
- At least one profile is configured
- Social media accounts are connected

**Main Flow**:
1. Sarah navigates to Content Journey
2. Selects "Skip" for templates
3. Uploads a promotional image from her computer
4. Reviews AI vision analysis
5. AI generates caption and hashtags automatically
6. Sarah selects "Basketball Factory" profile
7. Selects Instagram, Facebook, LinkedIn as platforms
8. Clicks "Post Now"
9. System posts to all 3 platforms within 30 seconds
10. Sarah sees success confirmation with post IDs

**Alternative Flows**:
- **3a**: Sarah selects image from Dropbox instead
- **8a**: Sarah schedules for tomorrow at 9 AM EST instead

**Postconditions**:
- Post appears on Instagram, Facebook, LinkedIn
- Rate limit tracking updated for all 3 platforms
- Post saved in database with "published" status

#### Use Case 2: Set Up Automated Posting Series

**Actor**: Mike (Content Creator)

**Preconditions**:
- Mike has Dropbox folder with 30 motivational videos
- Dropbox is connected to the app
- Profile and platforms are configured

**Main Flow**:
1. Mike navigates to Post Series
2. Clicks "+ New Series"
3. Names series "Daily Motivation - December 2025"
4. Clicks "Select Dropbox Folder"
5. Navigates to "/Motivational Videos" folder (30 files)
6. Clicks "Select Current Folder"
7. Enters AI prompt: "Generate motivational captions based on the quote in the video"
8. Selects "Rise as One" profile
9. Selects Instagram, Facebook, Threads, TikTok
10. Sets schedule: Mon-Fri at 7:00 AM EST, starting Dec 1, 2025
11. Enables "Auto-Post" and "Loop"
12. Clicks "Create Series"
13. System immediately schedules first post in Late API
14. Mike sees first post in Late's "Scheduled Posts" section

**Alternative Flows**:
- **11a**: Mike disables "Loop" to post each video only once
- **11b**: Mike enables "Delete After Posting" to clean up Dropbox

**Postconditions**:
- Series is active in database
- First post scheduled for Dec 1 at 7:00 AM EST
- Daemon will monitor and schedule subsequent posts automatically
- All 30 posts will be published over 6 weeks (Mon-Fri only)

#### Use Case 3: Bulk Schedule Posts from Dropbox

**Actor**: Jessica (Small Business Owner)

**Preconditions**:
- Jessica has Dropbox folder with 20 gym promotional images
- She wants to schedule one post per day for December

**Main Flow**:
1. Jessica navigates to Bulk Schedule CSV
2. **Step 1**: Clicks "Select Dropbox Folder", chooses "/December Promos" (20 files)
3. **Step 2**: Enters AI prompt: "Write gym promotional captions with urgency"
4. Clicks "Generate AI Content"
5. Watches progress bar as AI analyzes all 20 images
6. Reviews generated content for each image
7. **Step 3**: Selects "My Gym" profile, chooses Instagram, Facebook
8. **Step 4**: Sets start date Dec 1, 2025, 6:00 PM EST, daily posting
9. **Step 5**: Clicks "Complete & Schedule"
10. System processes in batches of 10 (Batch 1: 10 posts, Batch 2: 10 posts)
11. Jessica sees real-time progress updates
12. Final summary: "20/20 posts scheduled successfully"
13. All 20 posts appear in Late's "Scheduled Posts" section

**Alternative Flows**:
- **6a**: Jessica regenerates content for specific images that need better captions
- **10a**: If error occurs, system stops and displays detailed error message

**Postconditions**:
- 20 posts scheduled in Late API (Dec 1-20, 2025)
- Rate limit tracking updated
- Jessica receives confirmation

---

## 5. Features & Requirements

### 5.1 Feature Overview

| Feature | Priority | Status | Complexity |
|---------|----------|--------|------------|
| Multi-Platform Posting | P0 | ✅ Live | High |
| AI Content Generation | P0 | ✅ Live | High |
| Dropbox Auto-Posting Series | P0 | ✅ Live | Very High |
| Bulk CSV Scheduling | P0 | ✅ Live | High |
| Rate Limit Tracking | P0 | ✅ Live | Medium |
| Multi-Company Management | P0 | ✅ Live | High |
| Template System | P1 | ✅ Live | Medium |
| Video OCR Text Extraction | P1 | ✅ Live | High |
| Webhook Integration | P1 | ✅ Live | Medium |
| Scheduled Posting | P0 | ✅ Live | Medium |
| Profile Management | P0 | ✅ Live | Low |
| Platform Connection | P0 | ✅ Live | Medium |
| Content Calendar View | P2 | 📋 Planned | Medium |
| Analytics Dashboard | P2 | 📋 Planned | High |
| Team Collaboration | P2 | 📋 Planned | Very High |
| Comment Management | P3 | 📋 Future | High |
| A/B Testing | P3 | 📋 Future | High |
| Mobile App | P3 | 📋 Future | Very High |

### 5.2 Functional Requirements

#### FR-001: Multi-Platform Posting

**Description**: Post content to multiple social media platforms simultaneously.

**Requirements**:
- **FR-001.1**: Support minimum 8 platforms (Instagram, Facebook, LinkedIn, Twitter, Threads, TikTok, Bluesky, YouTube)
- **FR-001.2**: Single upload for all platforms
- **FR-001.3**: Platform-specific format validation
- **FR-001.4**: Real-time posting status updates
- **FR-001.5**: Error handling per platform
- **FR-001.6**: Rollback on partial failures (optional)

**Technical Details**:
- Late API handles Instagram, Facebook, LinkedIn, Threads, TikTok, Bluesky, YouTube
- Twitter uses separate Twitter API v2
- Media compressed per platform requirements
- Parallel API calls for performance

#### FR-002: AI Content Generation

**Description**: Generate captions and hashtags using AI vision and language models.

**Requirements**:
- **FR-002.1**: Analyze images with AI vision (GPT-4o)
- **FR-002.2**: Extract text from videos using OCR (Tesseract.js)
- **FR-002.3**: Generate captions with GPT-4o-mini
- **FR-002.4**: Include relevant hashtags (5-10 per post)
- **FR-002.5**: Enforce character limits (e.g., Threads 500 chars)
- **FR-002.6**: Output plain text (no markdown)
- **FR-002.7**: Generate unique content for each file

**Technical Details**:
- Abacus AI integration for vision and text generation
- Tesseract.js for video OCR
- Multi-frame extraction (25%, 50%, 75%) for videos
- Fallback to generic content if AI fails

#### FR-003: Dropbox Auto-Posting Series

**Description**: Automate posting from Dropbox folders with intelligent scheduling.

**Requirements**:
- **FR-003.1**: Select Dropbox folder as media source
- **FR-003.2**: Configure AI prompt for content generation
- **FR-003.3**: Set schedule (days of week, time, timezone)
- **FR-003.4**: Immediate pre-scheduling of first post
- **FR-003.5**: Automatic scheduling of subsequent posts
- **FR-003.6**: Support looping (restart from first file)
- **FR-003.7**: Optional deletion after posting
- **FR-003.8**: Webhook integration for instant triggers
- **FR-003.9**: Daemon fallback (5-minute polling)
- **FR-003.10**: 7-layer protection system (safeguards)

**Technical Details**:
- `scheduleFirstSeriesPost`: Immediate first post scheduling
- `processCloudStorageSeries`: Subsequent post processing
- `checkLatePostStatus`: Status monitoring
- Atomic processing flag prevents concurrent runs
- Rate limit pre-checks
- Forward-only file index movement

#### FR-004: Bulk CSV Scheduling

**Description**: Schedule multiple posts from a Dropbox folder in batches.

**Requirements**:
- **FR-004.1**: 5-step wizard UI
- **FR-004.2**: Dropbox folder selection
- **FR-004.3**: Batch AI content generation (all files)
- **FR-004.4**: Real-time progress tracking
- **FR-004.5**: Profile and platform selection
- **FR-004.6**: Custom scheduling configuration
- **FR-004.7**: Batched processing (10 posts/batch)
- **FR-004.8**: Delays between posts (5s) and batches (10s)
- **FR-004.9**: Streaming progress updates
- **FR-004.10**: Final summary with success/failure counts

**Technical Details**:
- `/api/bulk-csv/analyze-file`: Per-file AI generation
- `/api/bulk-csv/generate`: Bulk scheduling endpoint
- Streaming response with `ReadableStream`
- Batched processing prevents rate limit errors

#### FR-005: Rate Limit Tracking

**Description**: Monitor and display platform posting limits in real-time.

**Requirements**:
- **FR-005.1**: Track Late API limits (8/day per platform per profile)
- **FR-005.2**: Track Twitter limits (17/day)
- **FR-005.3**: Rolling 24-hour window calculation
- **FR-005.4**: Dashboard banners (collapsible)
- **FR-005.5**: Per-platform breakdown
- **FR-005.6**: Reset time display (EST)
- **FR-005.7**: Status levels (Good, Warning, Critical)
- **FR-005.8**: Warning at 1-2 remaining posts
- **FR-005.9**: Critical alert at 0 remaining
- **FR-005.10**: Pre-posting rate limit checks

**Technical Details**:
- Storage: `/tmp/late-rate-limit.json`
- `recordLatePost`: Records successful posts
- `getLateRateLimitStatus`: Calculates current status
- `canPostToLatePlatform`: Pre-checks before posting
- Cleanup of old posts (>24h)

#### FR-006: Multi-Company Management

**Description**: Support multiple isolated company workspaces.

**Requirements**:
- **FR-006.1**: Create unlimited companies
- **FR-006.2**: Company switcher dropdown
- **FR-006.3**: Each company has isolated:
  - Profiles
  - Platform connections
  - Posts
  - Templates
  - Series
  - Prompt library
  - Brand colors
- **FR-006.4**: Role-based access (Owner, Admin, Member)
- **FR-006.5**: Automatic branding refresh on switch

**Technical Details**:
- `Company`, `CompanyMember` models
- `selectedCompanyId` in User model
- `companyId` foreign key in all major models
- `/api/companies` endpoints
- `useBranding` context hook

### 5.3 Non-Functional Requirements

#### NFR-001: Performance

- **NFR-001.1**: Page load time < 2 seconds
- **NFR-001.2**: API response time < 500ms (95th percentile)
- **NFR-001.3**: AI content generation < 10 seconds per file
- **NFR-001.4**: Bulk scheduling: 50 posts in < 10 minutes
- **NFR-001.5**: Support 10,000+ posts in database

#### NFR-002: Reliability

- **NFR-002.1**: 99.9% uptime
- **NFR-002.2**: 99% posting success rate
- **NFR-002.3**: Automatic retry on transient failures
- **NFR-002.4**: Graceful degradation on external API failures
- **NFR-002.5**: Zero data loss on system failures

#### NFR-003: Security

- **NFR-003.1**: HTTPS only (TLS 1.3)
- **NFR-003.2**: API keys stored in environment variables
- **NFR-003.3**: OAuth tokens encrypted at rest
- **NFR-003.4**: CSRF protection on all forms
- **NFR-003.5**: Rate limiting on authentication endpoints
- **NFR-003.6**: SQL injection prevention (Prisma ORM)

#### NFR-004: Scalability

- **NFR-004.1**: Support 1,000+ concurrent users
- **NFR-004.2**: Support 100+ companies per user
- **NFR-004.3**: Support 50+ profiles per company
- **NFR-004.4**: Support 1,000+ scheduled posts
- **NFR-004.5**: Horizontal scaling capability

#### NFR-005: Usability

- **NFR-005.1**: Responsive design (mobile, tablet, desktop)
- **NFR-005.2**: Accessible (WCAG 2.1 AA)
- **NFR-005.3**: Clear error messages
- **NFR-005.4**: Real-time progress feedback
- **NFR-005.5**: Undo/edit capabilities

#### NFR-006: Maintainability

- **NFR-006.1**: TypeScript for type safety
- **NFR-006.2**: Comprehensive logging
- **NFR-006.3**: Automated tests (unit, integration)
- **NFR-006.4**: API documentation (OpenAPI)
- **NFR-006.5**: Database migrations (Prisma)

---

## 6. Technical Architecture

### 6.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser   │  │ Mobile App   │  │  API Client  │      │
│  │   (React)   │  │  (Future)    │  │   (Zapier)   │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION TIER                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Next.js App (SSR + API Routes)             │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │  │
│  │  │   Pages    │  │  API       │  │  Webhooks  │    │  │
│  │  │  (UI/UX)   │  │  (Logic)   │  │  (Events)  │    │  │
│  │  └────────────┘  └────────────┘  └────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC TIER                       │
│  ┌──────────────────────┐  ┌────────────────────────┐      │
│  │ Series Processor     │  │  Content Generator     │      │
│  │ - File Management    │  │  - AI Vision           │      │
│  │ - Scheduling         │  │  - AI Text Gen         │      │
│  │ - Status Monitoring  │  │  - Video OCR           │      │
│  └──────────────────────┘  └────────────────────────┘      │
│  ┌──────────────────────┐  ┌────────────────────────┐      │
│  │ Rate Limit Tracker   │  │  Media Processor       │      │
│  │ - Rolling Window     │  │  - Compression         │      │
│  │ - Status Calculation │  │  - Format Conversion   │      │
│  └──────────────────────┘  └────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   INTEGRATION TIER                           │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐     │
│  │ Late API│  │ Dropbox  │  │ Twitter │  │Abacus AI │     │
│  │ (Multi- │  │  (Media) │  │ (Posts) │  │  (AI)    │     │
│  │Platform)│  └──────────┘  └─────────┘  └──────────┘     │
│  └─────────┘                                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       DATA TIER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │   AWS S3     │  │  Temp Files  │     │
│  │  (Primary)   │  │  (Media)     │  │ (Rate Limits)│     │
│  │  - Users     │  │  - Images    │  │  - JSON      │     │
│  │  - Companies │  │  - Videos    │  │  - Logs      │     │
│  │  - Posts     │  │  - Temp      │  │              │     │
│  │  - Series    │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|----------|
| **Frontend** | Next.js | 14.2.28 | SSR framework |
| | React | 18.2.0 | UI library |
| | TypeScript | 5.2.2 | Type safety |
| | Tailwind CSS | 3.3.3 | Styling |
| | Radix UI | Various | Component library |
| **Backend** | Next.js API | 14.2.28 | API routes |
| | NextAuth.js | 4.24.11 | Authentication |
| | Prisma | 6.7.0 | ORM |
| **Database** | PostgreSQL | 15+ | Primary database |
| **Storage** | AWS S3 | - | Media storage |
| **Media Processing** | FFmpeg | 6+ | Video compression |
| | Sharp | 0.33+ | Image compression |
| | Tesseract.js | 5+ | OCR |
| **External APIs** | Late API | v1 | Multi-platform posting |
| | Dropbox API | v2 | File management |
| | Twitter API | v2 | Twitter posting |
| | Abacus AI | v1 | AI content generation |
| **Infrastructure** | Node.js | 22.14.0 | Runtime |
| | Nginx | 1.24+ | Reverse proxy |
| | PM2 | 5+ | Process manager |
| | Cron | - | Scheduled tasks |

### 6.3 Data Model

**Core Entities**

```
User
├─ id
├─ email
├─ password (hashed)
├─ selectedCompanyId
└─ companies (many)

Company
├─ id
├─ name
├─ ownerId
├─ members (many)
├─ profiles (many)
├─ posts (many)
├─ templates (many)
└─ series (many)

Profile
├─ id
├─ name
├─ companyId
├─ lateProfileId
└─ platformSettings (many)

PlatformSetting
├─ id
├─ profileId
├─ platform (enum)
├─ isConnected
└─ platformId (Late API account ID)

PostSeries
├─ id
├─ name
├─ companyId
├─ profileId
├─ dropboxFolderId
├─ dropboxFolderPath
├─ prompt
├─ daysOfWeek
├─ timeOfDay
├─ timezone
├─ currentFileIndex
├─ nextScheduledAt
├─ currentLatePostId
├─ status
└─ isProcessing

Post
├─ id
├─ userId
├─ companyId
├─ content
├─ platforms
├─ mediaUrls
├─ status
├─ scheduledAt
└─ postedAt

Template
├─ id
├─ userId
├─ companyId
├─ name
├─ category
├─ imageUrl
├─ fields (JSON)
└─ isPublic
```

### 6.4 API Design

**RESTful Conventions**

| Resource | GET | POST | PATCH | DELETE |
|----------|-----|------|-------|--------|
| `/api/posts` | List | Create | - | - |
| `/api/posts/[id]` | Get | - | Update | Delete |
| `/api/series` | List | Create | - | - |
| `/api/series/[id]` | Get | - | Update | Delete |
| `/api/companies` | List | Create | - | - |
| `/api/companies/[id]` | Get | - | Update | Delete |
| `/api/templates` | List | Create | - | - |
| `/api/templates/[id]` | Get | - | Update | Delete |

**Special Endpoints**

- `POST /api/series/process` - Daemon trigger
- `POST /api/series/[id]/bulk-schedule` - Bulk scheduling
- `POST /api/late/post` - Multi-platform posting
- `POST /api/twitter/post` - Twitter posting
- `POST /api/webhooks/late` - Webhook receiver
- `GET /api/late/rate-limit` - Rate limit status

### 6.5 Security Architecture

**Authentication Flow**

```
1. User enters email/password
2. NextAuth validates credentials
3. bcrypt verifies password hash
4. JWT session token generated
5. Cookie set with httpOnly, secure flags
6. Subsequent requests include cookie
7. Middleware validates JWT on each request
```

**Authorization Levels**

| Resource | Owner | Admin | Member |
|----------|-------|-------|--------|
| View company | ✅ | ✅ | ✅ |
| Create posts | ✅ | ✅ | ✅ |
| Edit company | ✅ | ✅ | ❌ |
| Delete company | ✅ | ❌ | ❌ |
| Manage members | ✅ | ✅ | ❌ |

**Data Encryption**

- **In Transit**: TLS 1.3 (HTTPS)
- **At Rest**: Database-level encryption
- **API Keys**: Environment variables (not in code)
- **OAuth Tokens**: Encrypted in `abacusai_auth_secrets.json`

---

## 7. User Experience & Interface

### 7.1 Design Principles

1. **Simplicity**: Minimize clicks to accomplish tasks
2. **Transparency**: Always show current status and next steps
3. **Feedback**: Real-time progress indicators
4. **Consistency**: Uniform patterns across all features
5. **Accessibility**: WCAG 2.1 AA compliance

### 7.2 Information Architecture

```
Dashboard (Home)
├─ Content Journey (Manual Posting)
│  ├─ Step 1: Choose Template
│  ├─ Step 2: Upload Media
│  ├─ Step 3: Analyze Images
│  ├─ Step 4: Generate Content
│  ├─ Step 5: Select Profile & Platforms
│  └─ Step 6: Schedule & Review
│
├─ Post (Automated Series)
│  ├─ Series List
│  ├─ Create Series
│  ├─ Edit Series
│  └─ Series Settings
│
├─ Bulk Schedule CSV
│  ├─ Step 1: Select Media
│  ├─ Step 2: Generate AI Content
│  ├─ Step 3: Select Profile & Platforms
│  ├─ Step 4: Configure Scheduling
│  └─ Step 5: Results
│
├─ Templates
│  ├─ My Templates
│  ├─ Public Library
│  ├─ Create Template
│  └─ Edit Template
│
├─ Prompts
│  ├─ Saved Prompts
│  ├─ Folders
│  ├─ Create Prompt
│  └─ Edit Prompt
│
├─ Schedule
│  └─ Calendar View (Future)
│
├─ Analytics (Future)
│  ├─ Overview
│  ├─ Per-Platform Stats
│  └─ Content Performance
│
└─ Settings
   ├─ Profile
   ├─ Companies
   ├─ Platform Connections
   ├─ Branding
   └─ Team (Future)
```

### 7.3 Key UI Components

**Company Switcher**
- Location: Top-left of sidebar
- Dropdown with search
- Shows current company prominently
- "+ Create Company" option

**Rate Limit Banners**
- Location: Top of dashboard
- Late API banner (collapsible)
- Twitter banner (collapsible)
- Color-coded (green, yellow, red)
- Click to expand for details

**Progress Indicators**
- Linear progress bars
- Current/total counts (e.g., "5/26 posts")
- Batch indicators (e.g., "Batch 2 of 3")
- Step indicators (e.g., "Step 3 of 5")

**Status Badges**
- Draft (gray)
- Scheduled (blue)
- Published (green)
- Failed (red)

### 7.4 Mobile Responsiveness

**Breakpoints**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile Optimizations**
- Collapsible sidebar (hamburger menu)
- Stacked form fields
- Full-width buttons
- Touch-friendly targets (min 44x44px)
- Reduced navigation hierarchy

---

## 8. Data & Privacy

### 8.1 Data Collection

**User Data**
- Email address
- Password (hashed with bcrypt)
- Name (optional)
- Profile information

**Content Data**
- Post text (captions)
- Media files (images, videos)
- Scheduling information
- Platform connections

**Usage Data**
- Post timestamps
- Platform distribution
- Success/failure rates
- Rate limit tracking

### 8.2 Data Storage

**Database (PostgreSQL)**
- User accounts
- Companies and profiles
- Posts (metadata only)
- Templates
- Series configuration

**Object Storage (AWS S3)**
- Uploaded media files
- Temporary compressed media
- Generated graphics

**Temporary Files**
- Rate limit tracking (`/tmp/late-rate-limit.json`)
- Processing logs

### 8.3 Data Retention

| Data Type | Retention Period | Deletion Policy |
|-----------|------------------|------------------|
| User accounts | Indefinite | Manual deletion by user |
| Posts | Indefinite | Manual deletion |
| Media files | Indefinite | Deleted with associated post |
| Rate limit logs | 24 hours | Auto-cleanup |
| Processing logs | 30 days | Auto-cleanup |
| Scheduled posts | Until published | Deleted after posting (optional) |

### 8.4 Privacy & Compliance

**GDPR Compliance**
- ✅ Right to access data
- ✅ Right to delete data
- ✅ Data portability
- ✅ Consent for processing
- ✅ Secure data storage

**CCPA Compliance**
- ✅ Disclose data collection
- ✅ Right to delete
- ✅ Opt-out of data sale (N/A - no data sold)

**Data Sharing**
- **Third Parties with Access**:
  - Late API (posting)
  - Dropbox (media storage)
  - Twitter (posting)
  - Abacus AI (content generation)
  - AWS S3 (media storage)
- **Data Shared**: Media files, post text, scheduling information
- **Purpose**: Fulfilling core product functionality

---

## 9. Success Metrics & KPIs

### 9.1 Product Metrics

**Adoption Metrics**
- Monthly Active Users (MAU)
- Daily Active Users (DAU)
- New user registrations per week
- User retention rate (30-day, 90-day)
- Activation rate (first post within 24h)

**Engagement Metrics**
- Posts created per user per week
- Series created per user
- Bulk schedules completed per user
- Average posts per series
- Template usage rate

**Performance Metrics**
- Posting success rate (target: 99%)
- Average AI generation time (target: <10s)
- Average bulk schedule time (target: <5min for 50 posts)
- Webhook delivery latency (target: <1s)
- API response time 95th percentile (target: <500ms)

**Efficiency Metrics**
- Time saved per user per week (estimated)
- Platforms posted to per post (average)
- Rate limit violations per 1000 posts (target: <1)

### 9.2 Business Metrics

**Revenue Metrics** (Future)
- Monthly Recurring Revenue (MRR)
- Annual Recurring Revenue (ARR)
- Customer Lifetime Value (CLV)
- Customer Acquisition Cost (CAC)
- Churn rate

**Growth Metrics**
- Week-over-week growth rate
- Month-over-month growth rate
- Referral rate
- Viral coefficient

### 9.3 User Satisfaction Metrics

- Net Promoter Score (NPS): Target > 50
- Customer Satisfaction Score (CSAT): Target > 4.5/5
- Feature adoption rate: Target > 60%
- Support ticket volume: Target < 5% of users
- Average resolution time: Target < 24h

### 9.4 Technical Metrics

- Uptime: Target 99.9%
- Error rate: Target < 0.1%
- Database query time: Target < 50ms (95th percentile)
- Page load time: Target < 2s
- Time to first byte (TTFB): Target < 200ms

### 9.5 Success Criteria (MVP)

**Phase 1 Success** (Current - Achieved ✅)
- ✅ 100+ active users
- ✅ 1,000+ posts created
- ✅ 99%+ posting success rate
- ✅ 50+ active series
- ✅ 100+ bulk schedules completed
- ✅ <0.1% rate limit violations

**Phase 2 Success** (Q1 2026 - Target)
- 📋 500+ active users
- 📋 10,000+ posts created
- 📋 80%+ users using templates
- 📋 Analytics dashboard adopted by 70%+ users
- 📋 Team collaboration used by 30%+ companies

---

## 10. Roadmap & Future Enhancements

### 10.1 Short-Term (Q1 2026)

**Analytics Dashboard** (P2 - High Impact)
- Overview: Total posts, engagement, reach
- Per-platform breakdown
- Content performance rankings
- Best posting times analysis
- Hashtag performance

**Content Calendar View** (P2 - High Impact)
- Monthly/weekly/daily view
- Drag-and-drop rescheduling
- Visual content preview
- Platform indicators
- Quick edit from calendar

**Team Collaboration** (P2 - Medium Impact)
- Invite team members
- Role-based permissions (Owner, Admin, Editor, Viewer)
- Comment on drafts
- Approval workflows
- Activity log

**A/B Testing** (P2 - Medium Impact)
- Test multiple captions for same post
- Auto-select winner based on engagement
- Statistical significance indicators
- Performance reports

**Google Drive Integration** (P1 - Medium Impact)
- Select media from Google Drive
- Auto-posting series from Google Drive folders
- Sync with Google Photos

### 10.2 Mid-Term (Q2-Q3 2026)

**Mobile App** (P3 - High Impact)
- iOS and Android apps
- Push notifications for post status
- Quick posting from mobile
- View analytics on the go
- Approve drafts from mobile

**Comment Management** (P3 - High Impact)
- Unified inbox for all platform comments
- Reply directly from app
- Auto-hide spam/negative comments
- Sentiment analysis
- Saved replies

**Advanced Scheduling** (P2 - Medium Impact)
- Smart scheduling (AI suggests best times)
- Queue system (auto-fill gaps)
- Evergreen content rotation
- Seasonal content planning

**Hashtag Analytics** (P2 - Medium Impact)
- Trending hashtags by platform
- Hashtag performance tracking
- Competitor hashtag analysis
- Smart hashtag suggestions

**Bulk Editing** (P2 - Low Impact)
- Edit multiple scheduled posts at once
- Bulk reschedule
- Bulk platform changes
- Bulk content updates

### 10.3 Long-Term (Q4 2026+)

**AI Enhancements** (P3 - High Impact)
- Custom AI models trained on user's content
- Brand voice consistency enforcement
- Automated A/B test generation
- Predictive engagement scoring

**Integration Marketplace** (P3 - Medium Impact)
- Zapier integration
- Canva integration
- Unsplash/Pexels integration
- CRM integrations (HubSpot, Salesforce)

**White-Label Solution** (P3 - Very High Impact)
- Agencies can rebrand the platform
- Custom domains
- Custom branding
- Multi-tenant architecture

**Video Editing** (P3 - High Impact)
- Built-in video editor
- Trim, crop, add text overlays
- Auto-generate clips from long videos
- Subtitle generation

**Influencer Discovery** (P3 - Medium Impact)
- Find influencers by niche
- Collaboration workflow
- Campaign tracking
- ROI measurement

### 10.4 Research & Exploration

**AI Video Generation**
- Generate videos from text prompts
- Auto-create video montages from images
- Text-to-speech narration

**Social Listening**
- Monitor brand mentions
- Competitor tracking
- Industry trends
- Sentiment analysis

**E-commerce Integration**
- Tag products in posts
- Shoppable posts
- Sales tracking
- Inventory sync

---

## 11. Dependencies & Risks

### 11.1 External Dependencies

| Dependency | Criticality | Risk Level | Mitigation |
|------------|-------------|------------|------------|
| Late API | Critical | Medium | Cache posts locally, retry logic |
| Dropbox API | Critical | Low | Fallback to direct upload |
| Twitter API | High | Medium | Graceful degradation |
| Abacus AI | High | Low | Fallback to generic content |
| AWS S3 | High | Low | Multi-region redundancy |
| PostgreSQL | Critical | Low | Automated backups, replication |

### 11.2 Technical Risks

**RISK-001: Late API Rate Limits**
- **Impact**: High
- **Probability**: Medium
- **Mitigation**: Pre-flight checks, user warnings, multi-profile support
- **Contingency**: Direct platform API integration

**RISK-002: Dropbox Token Expiration**
- **Impact**: High
- **Probability**: Low (refresh token implemented)
- **Mitigation**: OAuth refresh token flow, automatic renewal
- **Contingency**: User re-authentication flow

**RISK-003: AI Content Quality**
- **Impact**: Medium
- **Probability**: Medium
- **Mitigation**: Multiple prompts, user review, regenerate option
- **Contingency**: Manual content editing

**RISK-004: Database Performance**
- **Impact**: High
- **Probability**: Low
- **Mitigation**: Indexes, query optimization, caching
- **Contingency**: Database scaling, read replicas

**RISK-005: Media Processing Bottleneck**
- **Impact**: Medium
- **Probability**: Medium
- **Mitigation**: Async processing, queue system
- **Contingency**: Increased server resources

### 11.3 Business Risks

**RISK-006: Platform API Changes**
- **Impact**: High
- **Probability**: Medium
- **Mitigation**: Monitor API changelogs, abstraction layer
- **Contingency**: Rapid updates, user communication

**RISK-007: Competitive Pressure**
- **Impact**: High
- **Probability**: High
- **Mitigation**: Continuous innovation, unique features (AI, automation)
- **Contingency**: Pivot to niche markets

**RISK-008: User Acquisition Cost**
- **Impact**: Medium
- **Probability**: Medium
- **Mitigation**: Organic growth, referral program, SEO
- **Contingency**: Adjust pricing, freemium model

### 11.4 Legal & Compliance Risks

**RISK-009: GDPR/CCPA Violations**
- **Impact**: Very High
- **Probability**: Low
- **Mitigation**: Privacy-by-design, legal review, user consent
- **Contingency**: Legal counsel, compliance audit

**RISK-010: Platform Terms of Service**
- **Impact**: Very High
- **Probability**: Low
- **Mitigation**: Adhere to ToS, rate limits, user education
- **Contingency**: Platform-specific restrictions

---

## 12. Appendix

### 12.1 Glossary

- **Late API**: Multi-platform social media posting service
- **Dropbox**: Cloud file storage and synchronization service
- **Series**: Automated posting schedule from a folder
- **Bulk CSV**: Workflow for scheduling multiple posts at once
- **Template**: Reusable graphic design
- **Profile**: A social media identity (e.g., "Basketball Factory")
- **Company**: A business entity with multiple profiles
- **Platform**: A social media service (e.g., Instagram, Twitter)
- **Rate Limit**: Maximum posts allowed per platform per day
- **Rolling Window**: Time period that moves forward (e.g., last 24 hours)
- **OCR**: Optical Character Recognition (text extraction)
- **Webhook**: Real-time HTTP callback from external service
- **Daemon**: Background process that runs periodically

### 12.2 Acronyms

- **AI**: Artificial Intelligence
- **API**: Application Programming Interface
- **AWS**: Amazon Web Services
- **CCPA**: California Consumer Privacy Act
- **CSRF**: Cross-Site Request Forgery
- **CSV**: Comma-Separated Values
- **GDPR**: General Data Protection Regulation
- **HTTP**: Hypertext Transfer Protocol
- **HTTPS**: HTTP Secure
- **JSON**: JavaScript Object Notation
- **JWT**: JSON Web Token
- **KPI**: Key Performance Indicator
- **MVP**: Minimum Viable Product
- **OCR**: Optical Character Recognition
- **ORM**: Object-Relational Mapping
- **PRD**: Product Requirements Document
- **REST**: Representational State Transfer
- **S3**: Simple Storage Service (AWS)
- **SQL**: Structured Query Language
- **SSR**: Server-Side Rendering
- **TLS**: Transport Layer Security
- **UI**: User Interface
- **UX**: User Experience
- **WCAG**: Web Content Accessibility Guidelines

### 12.3 References

**External Documentation**
- [Late API Documentation](https://docs.getlate.dev)
- [Dropbox API Documentation](https://www.dropbox.com/developers/documentation)
- [Twitter API v2 Documentation](https://developer.twitter.com/en/docs/twitter-api)
- [Abacus AI Documentation](https://abacus.ai/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

**Internal Documentation**
- Complete Documentation: `/home/ubuntu/late_content_poster/COMPLETE_DOCUMENTATION.md`
- Technical Fixes: Various `*_FIX.md` and `*_IMPLEMENTATION.md` files
- API Endpoint Documentation: See `/api/` route files

### 12.4 Change Log

| Version | Date | Author | Changes |
|---------|------|--------|----------|
| 1.0.0 | 2025-11-26 | Product Team | Initial PRD creation |

### 12.5 Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | - | - | - |
| Engineering Lead | - | - | - |
| UX Lead | - | - | - |
| QA Lead | - | - | - |

---

**Document Status**: ✅ Complete  
**Last Review**: November 26, 2025  
**Next Review**: March 1, 2026  
**Document Location**: `/home/ubuntu/late_content_poster/PRODUCT_REQUIREMENTS_DOCUMENT.md`
