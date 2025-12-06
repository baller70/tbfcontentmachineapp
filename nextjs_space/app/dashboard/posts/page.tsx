'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Inbox,
  Calendar,
  CheckCircle2,
  XCircle,
  FileText,
  Repeat,
  Gauge,
  RefreshCw,
  Plus,
  ExternalLink
} from 'lucide-react'
import {
  Post,
  PostFilters as PostFiltersType,
  Profile,
  PostSeries,
  RateLimitData,
  CreatePostDialog
} from '@/components/posts'

// Import tab components
import { AllPostsTab } from './tabs/AllPostsTab'
import { ScheduledTab } from './tabs/ScheduledTab'
import { PublishedTab } from './tabs/PublishedTab'
import { FailedTab } from './tabs/FailedTab'
import { DraftsTab } from './tabs/DraftsTab'
import { SeriesTab } from './tabs/SeriesTab'
import { RateLimitsTab } from './tabs/RateLimitsTab'

// Stats interface
interface PostStats {
  all: number
  scheduled: number
  published: number
  failed: number
  drafts: number
}

export default function PostsPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Data states
  const [posts, setPosts] = useState<Post[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [stats, setStats] = useState<PostStats>({
    all: 0, scheduled: 0, published: 0, failed: 0, drafts: 0
  })

  // Fetch all posts
  const fetchPosts = useCallback(async () => {
    try {
      const response = await fetch('/api/posts?limit=200')
      if (response.ok) {
        const data = await response.json()
        const fetchedPosts: Post[] = data.posts || []
        setPosts(fetchedPosts)
        
        // Calculate stats
        setStats({
          all: fetchedPosts.length,
          scheduled: fetchedPosts.filter(p => p.status === 'SCHEDULED').length,
          published: fetchedPosts.filter(p => ['POSTED', 'PUBLISHED'].includes(p.status)).length,
          failed: fetchedPosts.filter(p => p.status === 'FAILED').length,
          drafts: fetchedPosts.filter(p => p.status === 'DRAFT').length
        })
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      toast({ title: 'Error', description: 'Failed to load posts', variant: 'destructive' })
    }
  }, [toast])

  // Fetch Late API scheduled posts
  const fetchLatePosts = useCallback(async () => {
    try {
      const response = await fetch('/api/late/scheduled-posts')
      if (response.ok) {
        const data = await response.json()
        setProfiles(data.profiles || [])
        // Merge Late posts with local posts
        const latePosts: Post[] = (data.posts || []).map((p: any) => ({
          ...p,
          source: 'late',
          status: p.status?.toUpperCase() || 'SCHEDULED'
        }))
        
        setPosts(prev => {
          // Merge and deduplicate by latePostId
          const localPosts = prev.filter(p => p.source !== 'late')
          const merged = [...localPosts]
          latePosts.forEach((lp: Post) => {
            if (!merged.find(p => p.latePostId === lp.latePostId)) {
              merged.push(lp)
            }
          })
          return merged
        })
      }
    } catch (error) {
      console.error('Failed to fetch Late posts:', error)
    }
  }, [])

  // Refresh all data
  const refreshData = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([fetchPosts(), fetchLatePosts()])
    setRefreshing(false)
    toast({ title: 'Refreshed', description: 'Posts data updated' })
  }, [fetchPosts, fetchLatePosts, toast])

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchPosts(), fetchLatePosts()])
      setLoading(false)
    }
    loadData()
  }, [fetchPosts, fetchLatePosts])

  const tabConfig = [
    { id: 'all', label: 'All Posts', icon: Inbox, count: stats.all },
    { id: 'scheduled', label: 'Scheduled', icon: Calendar, count: stats.scheduled },
    { id: 'published', label: 'Published', icon: CheckCircle2, count: stats.published },
    { id: 'failed', label: 'Failed', icon: XCircle, count: stats.failed, highlight: stats.failed > 0 },
    { id: 'drafts', label: 'Drafts', icon: FileText, count: stats.drafts },
    { id: 'series', label: 'Series', icon: Repeat },
    { id: 'rate-limits', label: 'Rate Limits', icon: Gauge }
  ]

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
          <p className="text-gray-600">Manage all your social media posts in one place</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshData} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
          {tabConfig.map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-gray-200 px-4 py-2 rounded-lg"
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
              {tab.count !== undefined && (
                <Badge 
                  variant="secondary" 
                  className={`ml-2 ${tab.highlight ? 'bg-red-100 text-red-700' : ''}`}
                >
                  {tab.count}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <AllPostsTab posts={posts} profiles={profiles} loading={loading} onRefresh={refreshData} />
        </TabsContent>
        <TabsContent value="scheduled">
          <ScheduledTab posts={posts.filter(p => p.status === 'SCHEDULED')} profiles={profiles} loading={loading} onRefresh={refreshData} />
        </TabsContent>
        <TabsContent value="published">
          <PublishedTab posts={posts.filter(p => ['POSTED', 'PUBLISHED'].includes(p.status))} profiles={profiles} loading={loading} onRefresh={refreshData} />
        </TabsContent>
        <TabsContent value="failed">
          <FailedTab posts={posts.filter(p => p.status === 'FAILED')} profiles={profiles} loading={loading} onRefresh={refreshData} />
        </TabsContent>
        <TabsContent value="drafts">
          <DraftsTab posts={posts.filter(p => p.status === 'DRAFT')} profiles={profiles} loading={loading} onRefresh={refreshData} />
        </TabsContent>
        <TabsContent value="series">
          <SeriesTab profiles={profiles} />
        </TabsContent>
        <TabsContent value="rate-limits">
          <RateLimitsTab profiles={profiles} />
        </TabsContent>
      </Tabs>

      {/* Create Post Dialog */}
      <CreatePostDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onPostCreated={refreshData}
      />
    </div>
  )
}

