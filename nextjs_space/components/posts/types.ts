// Posts section types

export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'POSTED' | 'PUBLISHED' | 'FAILED' | 'PENDING'

export interface Post {
  id: string
  content: string
  caption?: string
  hashtags?: string
  platforms: string[]
  status: PostStatus
  scheduledAt?: string | null
  postedAt?: string | null
  publishedAt?: string | null
  createdAt: string
  updatedAt?: string
  errorMessage?: string | null
  latePostId?: string | null
  profileId?: string | null
  profileName?: string
  mediaUrls?: string[]
  mediaItems?: { url: string; type: 'image' | 'video' }[]
  source?: 'local' | 'late'
  analytics?: PostAnalytics[]
  contentTemplate?: {
    id: string
    title: string
    topic?: string
  }
}

export interface PostAnalytics {
  platform: string
  views: number
  likes: number
  shares: number
  comments: number
  engagement: number
}

export interface PostFilters {
  status: PostStatus | 'all'
  platform: string
  profile: string
  dateRange: 'all' | '7d' | '30d' | '90d'
  search: string
}

export interface Profile {
  id: string
  name: string
  lateProfileId?: string | null
}

export interface PostSeries {
  id: string
  name: string
  description?: string | null
  frequency: string
  daysOfWeek: string[]
  timeOfDay?: string | null
  platforms: string[]
  startDate: string
  endDate?: string | null
  status: string
  nextScheduledAt?: string | null
  dropboxFolderId?: string | null
  dropboxFolderPath?: string | null
  prompt?: string | null
  currentFileIndex?: number
  loopEnabled?: boolean
  lastProcessedAt?: string | null
  _count?: {
    posts: number
  }
}

export interface Team {
  id: string
  name: string
  description?: string | null
  members: TeamMember[]
  order: number
}

export interface TeamMember {
  id: string
  name: string
  handle?: string | null
  platform?: string | null
  order: number
}

export interface RateLimitData {
  profiles: {
    profileId: string
    profileName: string
    platforms: {
      platform: string
      count: number
      limit: number
      remaining: number
      resetTime?: string | null
    }[]
  }[]
}

export const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', color: '#E4405F' },
  { id: 'facebook', label: 'Facebook', color: '#1877F2' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
  { id: 'twitter', label: 'X (Twitter)', color: '#1DA1F2' },
  { id: 'threads', label: 'Threads', color: '#000000' },
  { id: 'tiktok', label: 'TikTok', color: '#000000' },
  { id: 'bluesky', label: 'Bluesky', color: '#0085FF' },
  { id: 'youtube', label: 'YouTube', color: '#FF0000' }
] as const

export const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: 'FileText' },
  SCHEDULED: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800', icon: 'Clock' },
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: 'Loader' },
  POSTED: { label: 'Published', color: 'bg-green-100 text-green-800', icon: 'CheckCircle' },
  PUBLISHED: { label: 'Published', color: 'bg-green-100 text-green-800', icon: 'CheckCircle' },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-800', icon: 'XCircle' }
} as const

