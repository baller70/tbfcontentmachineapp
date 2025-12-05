'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
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
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  PieChart,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'

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
    postCount?: number
  }>
  profilePerformance?: Array<{
    profileId: string
    profileName: string
    totalPosts: number
    successRate: number
    failedPosts: number
  }>
  dailyStats?: Array<{
    date: string
    posts: number
    success: number
    failed: number
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

interface Profile {
  id: string
  name: string
  lateProfileId?: string
}

const platformIcons: Record<string, any> = {
  instagram: Instagram,
  linkedin: Linkedin,
  twitter: Twitter,
  tiktok: MessageSquare,
  youtube: MessageSquare,
  facebook: MessageSquare,
  threads: MessageSquare,
  bluesky: MessageSquare
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E4405F',
  facebook: '#1877F2',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  tiktok: '#000000',
  youtube: '#FF0000',
  threads: '#000000',
  bluesky: '#0085FF'
}

const STATUS_COLORS = {
  POSTED: '#22c55e',
  SCHEDULED: '#3b82f6',
  DRAFT: '#6b7280',
  FAILED: '#ef4444'
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [postsData, setPostsData] = useState<PostsData | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [dateRange, setDateRange] = useState('30d')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedProfile, setSelectedProfile] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchProfiles()
    fetchAnalytics()
    fetchPosts()
  }, [dateRange, statusFilter, selectedProfile])

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/profiles')
      if (response.ok) {
        const data = await response.json()
        setProfiles(data.profiles || [])
      }
    } catch (error) {
      console.error('Failed to fetch profiles:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams({ range: dateRange })
      if (selectedProfile !== 'all') {
        params.append('profileId', selectedProfile)
      }
      const response = await fetch(`/api/analytics?${params.toString()}`)
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
      const params = new URLSearchParams({ limit: '100', offset: '0' })
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

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchAnalytics(), fetchPosts()])
    setIsRefreshing(false)
    toast({
      title: 'Refreshed',
      description: 'Analytics data updated'
    })
  }

  // Calculate derived data for charts
  const statusChartData = useMemo(() => {
    if (!analyticsData?.summary?.postsByStatus) return []
    return Object.entries(analyticsData.summary.postsByStatus).map(([status, count]) => ({
      name: status,
      value: count,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6b7280'
    }))
  }, [analyticsData])

  const platformChartData = useMemo(() => {
    if (!postsData?.posts) return []
    const platformCounts: Record<string, { total: number; success: number; failed: number }> = {}
    postsData.posts.forEach(post => {
      post.platforms.forEach(platform => {
        if (!platformCounts[platform]) {
          platformCounts[platform] = { total: 0, success: 0, failed: 0 }
        }
        platformCounts[platform].total++
        if (post.status === 'POSTED') platformCounts[platform].success++
        if (post.status === 'FAILED') platformCounts[platform].failed++
      })
    })
    return Object.entries(platformCounts).map(([platform, data]) => ({
      platform: platform.charAt(0).toUpperCase() + platform.slice(1),
      total: data.total,
      success: data.success,
      failed: data.failed,
      successRate: data.total > 0 ? Math.round((data.success / data.total) * 100) : 0
    }))
  }, [postsData])

  const dailyPostData = useMemo(() => {
    if (!postsData?.posts) return []
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    const data: { date: string; posts: number; success: number; failed: number }[] = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      data.push({ date: dateStr, posts: 0, success: 0, failed: 0 })
    }

    postsData.posts.forEach(post => {
      const postDate = new Date(post.createdAt).toISOString().split('T')[0]
      const dayData = data.find(d => d.date === postDate)
      if (dayData) {
        dayData.posts++
        if (post.status === 'POSTED') dayData.success++
        if (post.status === 'FAILED') dayData.failed++
      }
    })

    return data.map(d => ({
      ...d,
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }))
  }, [postsData, dateRange])

  const profilePerformance = useMemo(() => {
    // This would ideally come from API, for now we'll show placeholder
    return profiles.map(profile => ({
      name: profile.name,
      posts: Math.floor(Math.random() * 50) + 10,
      successRate: Math.floor(Math.random() * 30) + 70
    }))
  }, [profiles])

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
    const IconComponent = platformIcons[platform.toLowerCase()] || MessageSquare
    return <IconComponent className="w-4 h-4" />
  }

  // Calculate totals
  const totalPosts = postsData?.posts?.length || 0
  const successfulPosts = postsData?.posts?.filter(p => p.status === 'POSTED').length || 0
  const failedPosts = postsData?.posts?.filter(p => p.status === 'FAILED').length || 0
  const scheduledPosts = postsData?.posts?.filter(p => p.status === 'SCHEDULED').length || 0
  const successRate = totalPosts > 0 ? Math.round((successfulPosts / totalPosts) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive performance metrics and insights</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={selectedProfile} onValueChange={setSelectedProfile}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Profiles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Profiles</SelectItem>
              {profiles.map(profile => (
                <SelectItem key={profile.id} value={profile.id}>{profile.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="posts">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalPosts}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  {dateRange === '7d' ? 'Last 7 days' : dateRange === '30d' ? 'Last 30 days' : 'Last 90 days'}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Successful</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{successfulPosts}</div>
                <div className="flex items-center mt-1">
                  <Progress value={successRate} className="h-2 flex-1" />
                  <span className="text-xs text-muted-foreground ml-2">{successRate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-red-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                <XCircle className="h-5 w-5 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{failedPosts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {failedPosts > 0 ? 'Needs attention' : 'All posts successful'}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                <Clock className="h-5 w-5 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">{scheduledPosts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pending publication
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Post Status Distribution */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Post Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statusChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Platform Performance */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Platform Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {platformChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={platformChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="platform" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="success" name="Success" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-500">
                    No platform data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Success Rate by Platform */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Success Rate by Platform</CardTitle>
              <CardDescription>Percentage of successful posts per platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {platformChartData.map(platform => (
                  <div key={platform.platform} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-28">
                      {getPlatformIcon(platform.platform)}
                      <span className="text-sm font-medium">{platform.platform}</span>
                    </div>
                    <div className="flex-1">
                      <Progress
                        value={platform.successRate}
                        className="h-3"
                      />
                    </div>
                    <div className="w-20 text-right">
                      <span className={`text-sm font-medium ${platform.successRate >= 80 ? 'text-green-600' : platform.successRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {platform.successRate}%
                      </span>
                      <span className="text-xs text-gray-500 ml-1">({platform.total})</span>
                    </div>
                  </div>
                ))}
                {platformChartData.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No platform data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platforms Tab */}
        <TabsContent value="platforms" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {platformChartData.map(platform => (
              <Card key={platform.platform} className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getPlatformIcon(platform.platform)}
                      {platform.platform}
                    </CardTitle>
                    <Badge
                      variant={platform.successRate >= 80 ? 'default' : platform.successRate >= 50 ? 'secondary' : 'destructive'}
                    >
                      {platform.successRate}% success
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{platform.total}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{platform.success}</div>
                      <div className="text-xs text-muted-foreground">Success</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{platform.failed}</div>
                      <div className="text-xs text-muted-foreground">Failed</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress value={platform.successRate} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
            {platformChartData.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center text-gray-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No platform data available</p>
                  <p className="text-sm">Start posting to see platform performance</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Detailed Platform Breakdown */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Platform Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              {platformChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={platformChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="platform" type="category" width={80} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="success" name="Successful Posts" fill="#22c55e" />
                    <Bar dataKey="failed" name="Failed Posts" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No data to display
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          {/* Daily Posts Trend */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Daily Posting Trend
              </CardTitle>
              <CardDescription>
                Posts created over the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailyPostData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyPostData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="posts" name="Total Posts" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="success" name="Successful" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Performance (if multiple profiles) */}
          {profiles.length > 1 && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Performance by Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profiles.map(profile => (
                    <div key={profile.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {profile.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{profile.name}</div>
                        <div className="text-sm text-gray-500">
                          {profile.lateProfileId ? 'Connected' : 'Not connected to Late'}
                        </div>
                      </div>
                      <Badge variant="outline">View Posts</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Post History Tab */}
        <TabsContent value="posts" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Post History</CardTitle>
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
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {postsData.posts.map((post) => (
                    <div key={post.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
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
                        <div className="flex items-center gap-1">
                          {post.platforms.map((platform) => (
                            <div key={platform} className="text-gray-400">
                              {getPlatformIcon(platform)}
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {post.content}
                      </p>
                      {post.status === 'FAILED' && post.errorMessage && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                          {post.errorMessage}
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
      </Tabs>
    </div>
  )
}
