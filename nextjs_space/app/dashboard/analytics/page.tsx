
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  Share,
  MessageCircle,
  Users,
  Calendar,
  Filter,
  Download,
  Instagram,
  Linkedin,
  Twitter,
  MessageSquare
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AnalyticsData {
  summary: {
    totalPosts: number
    totalViews: number
    totalLikes: number
    totalShares: number
    totalComments: number
    averageEngagement: number
    postsByStatus: Record<string, number>
  }
  platformPerformance: Array<{
    platform: string
    views: number
    likes: number
    shares: number
    comments: number
    averageEngagement: number
  }>
  recentPosts: Array<{
    id: string
    content: string
    platforms: string[]
    postedAt: string | null
    status: string
    analytics: Array<{
      platform: string
      views: number
      likes: number
      engagement: number
    }>
  }>
}

interface PostsData {
  posts: Array<{
    id: string
    content: string
    caption?: string
    hashtags?: string
    platforms: string[]
    status: string
    scheduledAt?: string
    postedAt?: string
    latePostId?: string
    errorMessage?: string
    createdAt: string
    analytics: Array<{
      platform: string
      views: number
      likes: number
      shares: number
      comments: number
      engagement: number
    }>
  }>
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

const platformIcons: Record<string, any> = {
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  tiktok: MessageSquare,
  youtube: MessageSquare
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [postsData, setPostsData] = useState<PostsData | null>(null)
  const [dateRange, setDateRange] = useState('7d')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchAnalytics()
    fetchPosts()
  }, [dateRange, statusFilter])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?range=${dateRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive'
      })
    }
  }

  const fetchPosts = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ limit: '50', offset: '0' })
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      const response = await fetch(`/api/posts?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setPostsData(data)
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      toast({
        title: 'Error',
        description: 'Failed to load posts data',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num?.toString?.() ?? '0'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'POSTED': return 'bg-green-100 text-green-800'
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800'
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlatformIcon = (platform: string) => {
    const IconComponent = platformIcons[platform] || MessageSquare
    return <IconComponent className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & History</h1>
          <p className="text-gray-600">Track your social media performance and post history</p>
        </div>
        <div className="flex space-x-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posts">Post History</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData?.summary?.totalPosts ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {dateRange === '7d' ? 'Last 7 days' : dateRange === '30d' ? 'Last 30 days' : 'Last 90 days'}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analyticsData?.summary?.totalViews ?? 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Across all platforms
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(analyticsData?.summary?.totalLikes ?? 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Likes, shares, comments
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(analyticsData?.summary?.averageEngagement ?? 0).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Engagement rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Posts */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest posts and their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData?.recentPosts?.length ? (
                <div className="space-y-4">
                  {analyticsData.recentPosts.slice(0, 10).map((post) => (
                    <div key={post.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 line-clamp-2 mb-2">
                          {post.content}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              {post.platforms.map((platform) => (
                                <div key={platform} className="flex items-center space-x-1 text-xs text-gray-500">
                                  {getPlatformIcon(platform)}
                                  <span>{platform}</span>
                                </div>
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">
                              {post.postedAt ? new Date(post.postedAt).toLocaleDateString() : 'Not posted'}
                            </span>
                          </div>
                          {post.analytics?.length > 0 && (
                            <div className="flex items-center space-x-3 text-xs text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>{formatNumber(post.analytics.reduce((sum, a) => sum + (a.views || 0), 0))}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Heart className="w-3 h-3" />
                                <span>{formatNumber(post.analytics.reduce((sum, a) => sum + (a.likes || 0), 0))}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start posting to see analytics here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Post History Tab */}
        <TabsContent value="posts" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>All Posts</CardTitle>
                  <CardDescription>
                    Complete history of your posts across all platforms
                  </CardDescription>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="POSTED">Posted</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : postsData?.posts?.length ? (
                <div className="space-y-4">
                  {postsData.posts.map((post) => (
                    <div key={post.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={`text-xs ${getStatusColor(post.status)}`}>
                              {post.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {post.postedAt 
                                ? `Posted ${new Date(post.postedAt).toLocaleDateString()}`
                                : post.scheduledAt 
                                  ? `Scheduled for ${new Date(post.scheduledAt).toLocaleDateString()}`
                                  : `Created ${new Date(post.createdAt).toLocaleDateString()}`
                              }
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 line-clamp-3 mb-2">
                            {post.content}
                          </p>
                          {post.caption && (
                            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                              Caption: {post.caption}
                            </p>
                          )}
                          {post.hashtags && (
                            <p className="text-xs text-blue-600 mb-2">
                              {post.hashtags}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {post.platforms.map((platform) => (
                            <div key={platform} className="flex items-center space-x-1 text-xs text-gray-500">
                              {getPlatformIcon(platform)}
                              <span>{platform}</span>
                            </div>
                          ))}
                        </div>

                        {post.analytics?.length > 0 && (
                          <div className="flex items-center space-x-4 text-xs text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Eye className="w-3 h-3" />
                              <span>{formatNumber(post.analytics.reduce((sum, a) => sum + (a.views || 0), 0))}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Heart className="w-3 h-3" />
                              <span>{formatNumber(post.analytics.reduce((sum, a) => sum + (a.likes || 0), 0))}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Share className="w-3 h-3" />
                              <span>{formatNumber(post.analytics.reduce((sum, a) => sum + (a.shares || 0), 0))}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-3 h-3" />
                              <span>{formatNumber(post.analytics.reduce((sum, a) => sum + (a.comments || 0), 0))}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {post.status === 'FAILED' && post.errorMessage && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                          Error: {post.errorMessage}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No posts found</p>
                  <p className="text-sm">Create your first post to see it here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Performance Tab */}
        <TabsContent value="platforms" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
              <CardDescription>
                Compare engagement across different social media platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData?.platformPerformance?.length ? (
                <div className="space-y-6">
                  {analyticsData.platformPerformance.map((platform) => (
                    <div key={platform.platform} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          {getPlatformIcon(platform.platform)}
                          <h3 className="font-medium capitalize">{platform.platform}</h3>
                        </div>
                        <div className="text-sm text-gray-600">
                          {platform.averageEngagement?.toFixed(1) ?? 0}% engagement rate
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">{formatNumber(platform.views)}</div>
                          <div className="text-xs text-gray-500">Views</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">{formatNumber(platform.likes)}</div>
                          <div className="text-xs text-gray-500">Likes</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{formatNumber(platform.shares)}</div>
                          <div className="text-xs text-gray-500">Shares</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">{formatNumber(platform.comments)}</div>
                          <div className="text-xs text-gray-500">Comments</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No platform data yet</p>
                  <p className="text-sm">Start posting to different platforms to see performance metrics</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
