import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'
import axios from 'axios'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') })

const prisma = new PrismaClient()
const LATE_API_KEY = process.env.LATE_API_KEY!
const ABACUSAI_API_KEY = process.env.ABACUSAI_API_KEY!

interface LatePost {
  _id: string
  status: string
  content: string
  scheduledFor?: string
  platforms: Array<{ platform: string; accountId: string }>
}

async function testAutoScheduling() {
  console.log('\n' + '='.repeat(80))
  console.log('🧪 TESTING AUTO-SCHEDULING (NO MANUAL TRIGGER)')
  console.log('='.repeat(80) + '\n')

  try {
    // Step 1: Find the active series
    console.log('📋 Step 1: Finding active series...')
    const series = await prisma.postSeries.findFirst({
      where: {
        name: { contains: 'MOTIVATIONAL', mode: 'insensitive' },
        status: 'ACTIVE',
        dropboxFolderPath: { not: null }
      },
      include: { profile: { include: { platformSettings: true } } }
    })

    if (!series || !series.profile) {
      throw new Error('No active series found')
    }

    console.log(`✅ Found series: ${series.name}`)
    console.log(`   Profile: ${series.profile.name}`)
    console.log(`   Current file index: ${series.currentFileIndex}`)
    console.log(`   Dropbox path: ${series.dropboxFolderPath}`)

    // Step 2: Schedule the current file to Late API
    console.log('\n📤 Step 2: Scheduling current file to Late API...')
    console.log('   Using existing scheduleFirstSeriesPost function...')
    
    // Use the existing function from cloud-storage-series-processor
    const { scheduleFirstSeriesPost } = await import('./lib/cloud-storage-series-processor')
    const result = await scheduleFirstSeriesPost(series.id)
    
    if (!result.success) {
      throw new Error(`Failed to schedule: ${result.message}`)
    }
    
    const postId = result.latePostId
    console.log(`   ✅ Post created in Late API: ${postId || 'ID not captured'}`)
    console.log(`   Message: ${result.message}`)

    // Check what posts are currently in Late API
    console.log('\n📊 Current state of Late API...')
    const initialPosts = await axios.get(
      'https://getlate.dev/api/v1/posts?status=scheduled',
      {
        headers: { 'Authorization': `Bearer ${LATE_API_KEY}` }
      }
    )
    const postsArray = Array.isArray(initialPosts.data) ? initialPosts.data : (initialPosts.data.posts || [])
    const initialPostIds = postsArray.map((p: LatePost) => p._id)
    console.log(`   Found ${postsArray.length} scheduled posts in Late API`)
    console.log(`   Initial IDs: ${initialPostIds.slice(0, 3).join(', ')}${initialPostIds.length > 3 ? '...' : ''}`)
    
    // If we have a valid post ID, move it to draft
    if (postId && postId !== 'undefined') {
      console.log('\n📝 Step 3: Moving post to DRAFT status...')
      try {
        await axios.patch(
          `https://getlate.dev/api/v1/posts/${postId}`,
          { status: 'draft' },
          {
            headers: {
              'Authorization': `Bearer ${LATE_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        )
        console.log('   ✅ Post moved to DRAFT')
      } catch (error: any) {
        console.log(`   ⚠️  Could not move to draft: ${error.message}`)
        console.log('   Will monitor for new posts anyway...')
      }
    } else {
      console.log('\n⚠️  Post ID was not captured, but post was created')
      console.log('   Will monitor for next post to appear...')
    }

    // Step 4: Monitor for next post
    console.log('\n👀 Step 4: Monitoring for next post to appear (NO MANUAL TRIGGER)...')
    console.log('   Checking every 30 seconds for up to 10 minutes...')
    console.log('   The daemon/webhook should detect the draft status and schedule the next post.\n')

    const startTime = Date.now()
    const maxWaitTime = 10 * 60 * 1000 // 10 minutes
    let nextPostFound = false
    let checkCount = 0

    while (Date.now() - startTime < maxWaitTime && !nextPostFound) {
      checkCount++
      const elapsedMinutes = Math.floor((Date.now() - startTime) / 1000 / 60)
      console.log(`\n⏱️  Check #${checkCount} (${elapsedMinutes} min elapsed)...`)

      // Check Late API for scheduled posts
      const scheduledPosts = await axios.get(
        'https://getlate.dev/api/v1/posts?status=scheduled',
        {
          headers: { 'Authorization': `Bearer ${LATE_API_KEY}` }
        }
      )

      const allScheduledIds = scheduledPosts.data.map((p: LatePost) => p._id)
      console.log(`   Found ${allScheduledIds.length} scheduled posts in Late API`)

      // Check if there's a NEW scheduled post (not our draft one)
      const newScheduledPosts = allScheduledIds.filter((id: string) => id !== postId)

      if (newScheduledPosts.length > 0) {
        console.log('\n' + '='.repeat(80))
        console.log('🎉 SUCCESS! NEXT POST AUTOMATICALLY APPEARED!')
        console.log('='.repeat(80))
        console.log(`\n✅ Found ${newScheduledPosts.length} new scheduled post(s):`)
        newScheduledPosts.forEach((id: string) => {
          console.log(`   - ${id}`)
        })

        // Get details of the first new post
        const newPost = scheduledPosts.data.find((p: LatePost) => p._id === newScheduledPosts[0])
        if (newPost) {
          console.log(`\n📋 New Post Details:`)
          console.log(`   Content: ${newPost.content.substring(0, 100)}...`)
          console.log(`   Scheduled for: ${newPost.scheduledFor}`)
          console.log(`   Platforms: ${newPost.platforms.map((p: any) => p.platform).join(', ')}`)
        }

        // Check series in database
        const updatedSeries = await prisma.postSeries.findUnique({
          where: { id: series.id }
        })
        console.log(`\n📊 Series State:`)
        console.log(`   Current file index: ${updatedSeries?.currentFileIndex}`)
        console.log(`   Current Late post ID: ${updatedSeries?.currentLatePostId}`)
        console.log(`   Next scheduled at: ${updatedSeries?.nextScheduledAt}`)

        nextPostFound = true
        break
      } else {
        console.log('   ⏳ No new scheduled posts yet. Waiting 30 seconds...')
        await new Promise(resolve => setTimeout(resolve, 30000))
      }
    }

    if (!nextPostFound) {
      console.log('\n' + '='.repeat(80))
      console.log('⚠️  TIMEOUT: Next post did NOT appear within 10 minutes')
      console.log('='.repeat(80))
      console.log('\nThis means:')
      console.log('1. The daemon might be running hourly (not every 5 minutes)')
      console.log('2. Or there\'s an issue with the auto-scheduling logic')
      console.log('\nCheck the daemon schedule at: https://apps.abacus.ai/chatllm/admin/tasks')
    }

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message)
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2))
    }
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testAutoScheduling().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})