
'use client'

import { useState, useMemo, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar'
import type { Event } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addDays, startOfDay, endOfDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = {
  'en-US': enUS
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
})

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource?: {
    content: string
    platforms: string[]
    isRecurring?: boolean
    recurringType?: 'daily' | 'weekly' | '2xweek' | '3xweek'
  }
}

interface DraftPost {
  id: string
  title: string
  content: string
  platforms: string[]
  createdAt: Date
}

// Mock draft posts - you'll replace this with actual data from your API
const mockDraftPosts: DraftPost[] = [
  {
    id: '1',
    title: 'Game Day Announcement',
    content: 'Big game tonight! Come support our team! 🏀',
    platforms: ['instagram', 'facebook', 'twitter'],
    createdAt: new Date()
  },
  {
    id: '2',
    title: 'Practice Schedule Update',
    content: 'Practice moved to 5 PM tomorrow. See you there!',
    platforms: ['instagram', 'twitter'],
    createdAt: new Date()
  },
  {
    id: '3',
    title: 'Team Photo',
    content: 'Team photo day this Friday! Don\'t forget your uniform 📸',
    platforms: ['facebook', 'instagram'],
    createdAt: new Date()
  }
]

export default function BulkScheduleCalendar() {
  const [view, setView] = useState<View>(Views.MONTH)
  const [date, setDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [selectedPost, setSelectedPost] = useState<DraftPost | null>(null)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkOptions, setBulkOptions] = useState({
    frequency: 'daily' as 'daily' | 'weekly' | '2xweek' | '3xweek',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    time: '09:00'
  })
  const { toast } = useToast()

  // Handle selecting a time slot on the calendar
  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    setSelectedSlot(slotInfo)
  }, [])

  // Handle dragging a draft post onto the calendar
  const handleDragStart = (e: React.DragEvent, post: DraftPost) => {
    e.dataTransfer.setData('postId', post.id)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const postId = e.dataTransfer.getData('postId')
    const post = mockDraftPosts.find(p => p.id === postId)
    
    if (post && selectedSlot) {
      const newEvent: CalendarEvent = {
        id: `event-${Date.now()}`,
        title: post.title,
        start: selectedSlot.start,
        end: selectedSlot.end,
        resource: {
          content: post.content,
          platforms: post.platforms
        }
      }
      setEvents([...events, newEvent])
      setSelectedSlot(null)
      
      toast({
        title: 'Post scheduled',
        description: `"${post.title}" has been scheduled for ${format(selectedSlot.start, 'PPpp')}`
      })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  // Handle bulk scheduling
  const handleBulkSchedule = () => {
    if (!selectedPost) return

    const startDate = new Date(bulkOptions.startDate + 'T' + bulkOptions.time)
    const endDate = new Date(bulkOptions.endDate + 'T' + bulkOptions.time)
    const newEvents: CalendarEvent[] = []

    let currentDate = startDate

    while (currentDate <= endDate) {
      let shouldSchedule = false

      switch (bulkOptions.frequency) {
        case 'daily':
          shouldSchedule = true
          currentDate = addDays(currentDate, 1)
          break
        case 'weekly':
          shouldSchedule = true
          currentDate = addDays(currentDate, 7)
          break
        case '2xweek':
          // Schedule on Mondays and Thursdays
          if (getDay(currentDate) === 1 || getDay(currentDate) === 4) {
            shouldSchedule = true
          }
          currentDate = addDays(currentDate, 1)
          break
        case '3xweek':
          // Schedule on Mondays, Wednesdays, and Fridays
          if (getDay(currentDate) === 1 || getDay(currentDate) === 3 || getDay(currentDate) === 5) {
            shouldSchedule = true
          }
          currentDate = addDays(currentDate, 1)
          break
      }

      if (shouldSchedule) {
        newEvents.push({
          id: `bulk-${Date.now()}-${newEvents.length}`,
          title: selectedPost.title,
          start: currentDate,
          end: addDays(currentDate, 0),
          resource: {
            content: selectedPost.content,
            platforms: selectedPost.platforms,
            isRecurring: true,
            recurringType: bulkOptions.frequency
          }
        })
      }
    }

    setEvents([...events, ...newEvents])
    setShowBulkDialog(false)
    setSelectedPost(null)

    toast({
      title: 'Bulk schedule created',
      description: `${newEvents.length} posts scheduled from ${format(startDate, 'PP')} to ${format(endDate, 'PP')}`
    })
  }

  // Custom event styling
  const eventStyleGetter = (event: CalendarEvent) => {
    const isRecurring = event.resource?.isRecurring
    return {
      style: {
        backgroundColor: isRecurring ? '#8b5cf6' : '#3b82f6',
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Draft Posts Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Draft Posts</h3>
            <Badge variant="secondary">{mockDraftPosts.length}</Badge>
          </div>
          
          <div className="space-y-2">
            {mockDraftPosts.map((post) => (
              <div
                key={post.id}
                draggable
                onDragStart={(e) => handleDragStart(e, post)}
                className="p-3 border rounded-lg cursor-move hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-sm mb-1">{post.title}</p>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{post.content}</p>
                <div className="flex gap-1 flex-wrap">
                  {post.platforms.map((platform) => (
                    <Badge key={platform} variant="outline" className="text-xs">
                      {platform}
                    </Badge>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => {
                    setSelectedPost(post)
                    setShowBulkDialog(true)
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Bulk Schedule
                </Button>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-900">
              💡 <strong>Tip:</strong> Drag posts onto the calendar or use bulk scheduling for recurring posts
            </p>
          </div>
        </Card>
      </div>

      {/* Calendar */}
      <div className="lg:col-span-3">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (view === Views.MONTH) {
                    setDate(addDays(date, -30))
                  } else if (view === Views.WEEK) {
                    setDate(addDays(date, -7))
                  } else {
                    setDate(addDays(date, -1))
                  }
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <h3 className="text-lg font-semibold">
                {format(date, 'MMMM yyyy')}
              </h3>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (view === Views.MONTH) {
                    setDate(addDays(date, 30))
                  } else if (view === Views.WEEK) {
                    setDate(addDays(date, 7))
                  } else {
                    setDate(addDays(date, 1))
                  }
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDate(new Date())}
              >
                Today
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant={view === Views.MONTH ? 'default' : 'outline'}
                onClick={() => setView(Views.MONTH)}
              >
                Month
              </Button>
              <Button
                size="sm"
                variant={view === Views.WEEK ? 'default' : 'outline'}
                onClick={() => setView(Views.WEEK)}
              >
                Week
              </Button>
              <Button
                size="sm"
                variant={view === Views.DAY ? 'default' : 'outline'}
                onClick={() => setView(Views.DAY)}
              >
                Day
              </Button>
            </div>
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="h-[600px]"
          >
            {/* @ts-ignore - react-big-calendar types compatibility */}
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectSlot={handleSelectSlot}
              selectable
              eventPropGetter={eventStyleGetter}
              className="rounded-lg border"
            />
          </div>
        </Card>
      </div>

      {/* Bulk Scheduling Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Schedule Post</DialogTitle>
            <DialogDescription>
              Schedule "{selectedPost?.title}" on a recurring basis
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={bulkOptions.frequency}
                onValueChange={(value: any) =>
                  setBulkOptions({ ...bulkOptions, frequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Every Day</SelectItem>
                  <SelectItem value="weekly">Once a Week</SelectItem>
                  <SelectItem value="2xweek">Twice a Week (Mon & Thu)</SelectItem>
                  <SelectItem value="3xweek">3 Times a Week (Mon, Wed, Fri)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={bulkOptions.startDate}
                  onChange={(e) =>
                    setBulkOptions({ ...bulkOptions, startDate: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={bulkOptions.endDate}
                  onChange={(e) =>
                    setBulkOptions({ ...bulkOptions, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={bulkOptions.time}
                onChange={(e) =>
                  setBulkOptions({ ...bulkOptions, time: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkDialog(false)
                setSelectedPost(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkSchedule}>
              Create Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
