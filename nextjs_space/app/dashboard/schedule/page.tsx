'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { format, parse, startOfWeek, getDay, addDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Image,
  Video,
  Loader2,
  Filter,
  List,
  Grid3X3
} from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'

const locales = { 'en-US': enUS }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })
const DnDCalendar = withDragAndDrop(Calendar)

interface ScheduledPost {
  id: string
  source: 'late' | 'local'
  content: string
  caption: string
  platforms: string[]
  platformDetails: any[]
  mediaUrls: string[]
  mediaItems: { url: string; type: string }[]
  status: string
  scheduledFor: string | null
  publishedAt: string | null
  createdAt: string
  profileId: string | null
  profileName: string
  latePostId: string | null
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: ScheduledPost
}

interface Profile {
  id: string
  name: string
  lateProfileId: string | null
}

const platformColors: Record<string, string> = {
  instagram: '#E4405F',
  facebook: '#1877F2',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  tiktok: '#000000',
  youtube: '#FF0000',
  bluesky: '#0085FF'
}

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
  published: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2 },
  failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertCircle }
}

export default function SchedulePage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [view, setView] = useState<View>(Views.MONTH)
  const [date, setDate] = useState(new Date())
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null)
  const [showPostDialog, setShowPostDialog] = useState(false)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('09:00')
  const [rescheduling, setRescheduling] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterProfile, setFilterProfile] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const { toast } = useToast()

  // Fetch scheduled posts
  const fetchPosts = useCallback(async () => {
    try {
      setRefreshing(true)
      const startDate = startOfMonth(addDays(date, -30)).toISOString()
      const endDate = endOfMonth(addDays(date, 60)).toISOString()

      const response = await fetch(`/api/late/scheduled-posts?startDate=${startDate}&endDate=${endDate}`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts || [])
        setProfiles(data.profiles || [])
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast({ title: 'Error', description: 'Failed to fetch scheduled posts', variant: 'destructive' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [date, toast])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Convert posts to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return posts
      .filter(post => post.scheduledFor)
      .filter(post => filterStatus === 'all' || post.status === filterStatus)
      .filter(post => filterProfile === 'all' || post.profileId === filterProfile)
      .map(post => ({
        id: post.id,
        title: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
        start: new Date(post.scheduledFor!),
        end: new Date(post.scheduledFor!),
        resource: post
      }))
  }, [posts, filterStatus, filterProfile])

  // Handle event click
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedPost(event.resource)
    setShowPostDialog(true)
  }, [])

  // Handle drag and drop reschedule
  const handleEventDrop = useCallback(async ({ event, start }: { event: CalendarEvent; start: Date }) => {
    const post = event.resource
    if (post.status !== 'scheduled') {
      toast({ title: 'Cannot reschedule', description: 'Only scheduled posts can be rescheduled', variant: 'destructive' })
      return
    }

    try {
      const response = await fetch('/api/late/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.latePostId || post.id,
          newScheduledTime: start.toISOString(),
          timezone: 'America/New_York'
        })
      })

      if (response.ok) {
        toast({ title: 'Post rescheduled', description: `Moved to ${format(start, 'PPpp')}` })
        fetchPosts()
      } else {
        const error = await response.json()
        toast({ title: 'Reschedule failed', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reschedule post', variant: 'destructive' })
    }
  }, [fetchPosts, toast])

  // Handle manual reschedule
  const handleReschedule = async () => {
    if (!selectedPost || !rescheduleDate) return

    setRescheduling(true)
    try {
      const newDateTime = new Date(`${rescheduleDate}T${rescheduleTime}`)
      const response = await fetch('/api/late/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: selectedPost.latePostId || selectedPost.id,
          newScheduledTime: newDateTime.toISOString(),
          timezone: 'America/New_York'
        })
      })

      if (response.ok) {
        toast({ title: 'Post rescheduled', description: `Moved to ${format(newDateTime, 'PPpp')}` })
        setShowRescheduleDialog(false)
        setShowPostDialog(false)
        fetchPosts()
      } else {
        const error = await response.json()
        toast({ title: 'Reschedule failed', description: error.error, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to reschedule post', variant: 'destructive' })
    } finally {
      setRescheduling(false)
    }
  }

  // Custom event styling
  const eventStyleGetter = (event: CalendarEvent) => {
    const status = event.resource.status
    const colors = statusColors[status] || statusColors.scheduled
    return {
      style: {
        backgroundColor: status === 'published' ? '#22c55e' : status === 'failed' ? '#ef4444' : '#3b82f6',
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        fontSize: '11px',
        padding: '2px 4px'
      }
    }
  }

  // Stats
  const stats = useMemo(() => {
    const scheduled = posts.filter(p => p.status === 'scheduled').length
    const published = posts.filter(p => p.status === 'published').length
    const failed = posts.filter(p => p.status === 'failed').length
    const today = posts.filter(p => p.scheduledFor && isSameDay(new Date(p.scheduledFor), new Date())).length
    return { scheduled, published, failed, today }
  }, [posts])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600">View and manage your scheduled posts across all platforms</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchPosts} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => window.open('https://getlate.dev/dashboard', '_blank')}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Late Dashboard
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.scheduled}</p>
                <p className="text-sm text-gray-600">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.published}</p>
                <p className="text-sm text-gray-600">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.failed}</p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.today}</p>
                <p className="text-sm text-gray-600">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Select value={filterProfile} onValueChange={setFilterProfile}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Profiles</SelectItem>
                  {profiles.map(profile => (
                    <SelectItem key={profile.id} value={profile.lateProfileId || profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                onClick={() => setViewMode('calendar')}
              >
                <Grid3X3 className="w-4 h-4 mr-1" />
                Calendar
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4 mr-1" />
                List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar or List View */}
      {viewMode === 'calendar' ? (
        <Card>
          <CardContent className="p-6">
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => setDate(addDays(date, view === Views.MONTH ? -30 : view === Views.WEEK ? -7 : -1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h3 className="text-lg font-semibold">{format(date, 'MMMM yyyy')}</h3>
                <Button variant="outline" size="sm" onClick={() => setDate(addDays(date, view === Views.MONTH ? 30 : view === Views.WEEK ? 7 : 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>Today</Button>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant={view === Views.MONTH ? 'default' : 'outline'} onClick={() => setView(Views.MONTH)}>Month</Button>
                <Button size="sm" variant={view === Views.WEEK ? 'default' : 'outline'} onClick={() => setView(Views.WEEK)}>Week</Button>
                <Button size="sm" variant={view === Views.DAY ? 'default' : 'outline'} onClick={() => setView(Views.DAY)}>Day</Button>
              </div>
            </div>

            {/* Calendar */}
            <div className="h-[600px]">
              {/* @ts-ignore */}
              <DnDCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                onSelectEvent={handleSelectEvent}
                onEventDrop={handleEventDrop}
                eventPropGetter={eventStyleGetter}
                draggableAccessor={(event: CalendarEvent) => event.resource.status === 'scheduled'}
                resizable={false}
                className="rounded-lg border"
              />
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500"></div>
                <span className="text-sm text-gray-600">Scheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span className="text-sm text-gray-600">Published</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span className="text-sm text-gray-600">Failed</span>
              </div>
              <p className="text-sm text-gray-500 ml-4">💡 Drag scheduled posts to reschedule</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* List View */
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {events.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No posts found matching your filters</p>
                </div>
              ) : (
                events.map(event => (
                  <div
                    key={event.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => { setSelectedPost(event.resource); setShowPostDialog(true) }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Media Preview */}
                      {event.resource.mediaUrls.length > 0 ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {event.resource.mediaItems[0]?.type === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <Video className="w-6 h-6 text-gray-500" />
                            </div>
                          ) : (
                            <img src={event.resource.mediaUrls[0]} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Image className="w-6 h-6 text-gray-400" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">{event.resource.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {event.resource.platforms.map(platform => (
                            <Badge key={platform} variant="outline" className="text-xs" style={{ borderColor: platformColors[platform.toLowerCase()] || '#666' }}>
                              {platform}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Status & Time */}
                      <div className="text-right flex-shrink-0">
                        <Badge className={`${statusColors[event.resource.status]?.bg || 'bg-gray-100'} ${statusColors[event.resource.status]?.text || 'text-gray-800'}`}>
                          {event.resource.status}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">
                          {event.resource.scheduledFor ? format(new Date(event.resource.scheduledFor), 'MMM d, h:mm a') : 'No date'}
                        </p>
                        <p className="text-xs text-gray-400">{event.resource.profileName}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Post Detail Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
            <DialogDescription>
              {selectedPost?.profileName} • {selectedPost?.scheduledFor ? format(new Date(selectedPost.scheduledFor), 'PPpp') : 'No date'}
            </DialogDescription>
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2">
                <Badge className={`${statusColors[selectedPost.status]?.bg} ${statusColors[selectedPost.status]?.text}`}>
                  {selectedPost.status}
                </Badge>
                {selectedPost.source === 'late' && (
                  <Badge variant="outline">Late API</Badge>
                )}
              </div>

              {/* Media */}
              {selectedPost.mediaUrls.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedPost.mediaUrls.slice(0, 4).map((url, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      {selectedPost.mediaItems[i]?.type === 'video' ? (
                        <video src={url} className="w-full h-full object-cover" controls />
                      ) : (
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{selectedPost.content}</p>
              </div>

              {/* Platforms */}
              <div className="flex flex-wrap gap-2">
                {selectedPost.platforms.map(platform => (
                  <Badge key={platform} style={{ backgroundColor: platformColors[platform.toLowerCase()] || '#666', color: 'white' }}>
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedPost?.status === 'scheduled' && (
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedPost.scheduledFor) {
                    const d = new Date(selectedPost.scheduledFor)
                    setRescheduleDate(format(d, 'yyyy-MM-dd'))
                    setRescheduleTime(format(d, 'HH:mm'))
                  }
                  setShowRescheduleDialog(true)
                }}
              >
                <Clock className="w-4 h-4 mr-2" />
                Reschedule
              </Button>
            )}
            {selectedPost?.latePostId && (
              <Button variant="outline" onClick={() => window.open(`https://getlate.dev/posts/${selectedPost.latePostId}`, '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View in Late
              </Button>
            )}
            <Button onClick={() => setShowPostDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Post</DialogTitle>
            <DialogDescription>Choose a new date and time for this post</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>Cancel</Button>
            <Button onClick={handleReschedule} disabled={rescheduling || !rescheduleDate}>
              {rescheduling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Clock className="w-4 h-4 mr-2" />}
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
