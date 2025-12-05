'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  PlayCircle,
  MessageSquare,
  Instagram,
  Linkedin,
  Twitter,
  Loader2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Activity
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropboxFolderPicker } from '@/components/dropbox-folder-picker'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { MultiSeriesStatus } from '@/components/dashboard/multi-series-status'
import { BulkScheduleProgress } from '@/components/dashboard/bulk-schedule-progress'

interface TeamMember {
  id: string
  name: string
  handle?: string | null
  platform?: string | null
  order: number
}

interface Team {
  id: string
  name: string
  description?: string | null
  members: TeamMember[]
  order: number
}

interface PostSeries {
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

interface Schedule {
  id: string
  title: string
  content: string
  caption?: string
  hashtags?: string
  platforms: string[]
  scheduleType: string
  scheduledAt: string
  timezone: string
  isRecurring: boolean
  interval?: number
  endDate?: string
  status: string
  nextRun?: string
  runCount: number
}

const platforms = [
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'facebook', label: 'Facebook', icon: MessageSquare },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'twitter', label: 'X (Twitter)', icon: Twitter },
  { id: 'threads', label: 'Threads', icon: MessageSquare },
  { id: 'tiktok', label: 'TikTok', icon: MessageSquare },
  { id: 'bluesky', label: 'Bluesky', icon: MessageSquare },
  { id: 'youtube', label: 'YouTube', icon: MessageSquare }
]

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function PostPage() {
  const [activeTab, setActiveTab] = useState('tag-people')
  const { toast } = useToast()

  // Tag People State
  const [teams, setTeams] = useState<Team[]>([])
  const [showTeamDialog, setShowTeamDialog] = useState(false)
  const [showMemberDialog, setShowMemberDialog] = useState(false)
  const [currentTeamId, setCurrentTeamId] = useState<string>('')
  const [teamFormData, setTeamFormData] = useState({ name: '', description: '' })
  const [memberFormData, setMemberFormData] = useState({ name: '', handle: '', platform: '' })

  // Series State
  const [series, setSeries] = useState<PostSeries[]>([])
  const [seriesLoading, setSeriesLoading] = useState(false)
  const [showSeriesDialog, setShowSeriesDialog] = useState(false)
  const [editingSeries, setEditingSeries] = useState<PostSeries | null>(null)
  const [seriesFormData, setSeriesFormData] = useState({
    name: '',
    description: '',
    frequency: 'ONCE_WEEK',
    daysOfWeek: [] as string[],
    timeOfDay: '09:00',
    timezone: 'America/New_York',
    platforms: [] as string[],
    startDate: '',
    endDate: '',
    profileId: '',
    autoPost: true,
    deleteAfterPosting: false,
    dropboxFolderId: '',
    dropboxFolderPath: '',
    prompt: '',
    loopEnabled: false,
    bulkScheduleNow: false
  })
  const [showDropboxPicker, setShowDropboxPicker] = useState(false)
  const [selectedDropboxFolderName, setSelectedDropboxFolderName] = useState('')
  const [savedPrompts, setSavedPrompts] = useState<any[]>([])
  const [enhancingPrompt, setEnhancingPrompt] = useState(false)
  const [profiles, setProfiles] = useState<any[]>([])
  const [bulkScheduling, setBulkScheduling] = useState(false)
  const [bulkScheduleProgress, setBulkScheduleProgress] = useState({ current: 0, total: 0 })
  const [folderFileCount, setFolderFileCount] = useState<number | null>(null)
  const [bulkSchedulingSeriesId, setBulkSchedulingSeriesId] = useState<string | null>(null)

  // Manage State
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Rate Limits State
  const [rateLimitStatus, setRateLimitStatus] = useState<any>(null)
  const [rateLimitLoading, setRateLimitLoading] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)

  useEffect(() => {
    fetchTeams()
    fetchSeries()
    fetchSchedules()
    fetchSavedPrompts()
    fetchProfiles()
    fetchRateLimits()
  }, [])

  // Auto-refresh rate limits every 30 seconds when on the rate-limits tab
  useEffect(() => {
    if (activeTab === 'rate-limits') {
      fetchRateLimits()
      const interval = setInterval(fetchRateLimits, 30000) // 30 seconds
      return () => clearInterval(interval)
    }
  }, [activeTab])

  // Auto-select first profile when series dialog opens
  useEffect(() => {
    if (showSeriesDialog && profiles.length > 0 && !seriesFormData.profileId && !editingSeries) {
      setSeriesFormData(prev => ({
        ...prev,
        profileId: profiles[0].id
      }))
    }
  }, [showSeriesDialog, profiles, seriesFormData.profileId, editingSeries])

  // Team Management Functions
  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams || [])
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error)
    }
  }

  const createTeam = async () => {
    if (!teamFormData.name || !teamFormData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Team name is required',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamFormData)
      })

      if (response.ok) {
        toast({
          title: 'Team Created',
          description: 'You can now add members to this team.'
        })
        setTeamFormData({ name: '', description: '' })
        setShowTeamDialog(false)
        fetchTeams()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to create team',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to create team:', error)
      toast({
        title: 'Error',
        description: 'Failed to create team',
        variant: 'destructive'
      })
    }
  }

  const deleteTeam = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Team Deleted',
          description: 'The team and all its members have been removed.'
        })
        fetchTeams()
      }
    } catch (error) {
      console.error('Failed to delete team:', error)
    }
  }

  const addMember = async () => {
    if (!memberFormData.name || !memberFormData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Member name is required',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch(`/api/teams/${currentTeamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberFormData)
      })

      if (response.ok) {
        toast({
          title: 'Member Added',
          description: 'The member has been added to the team.'
        })
        setMemberFormData({ name: '', handle: '', platform: '' })
        setShowMemberDialog(false)
        fetchTeams()
      }
    } catch (error) {
      console.error('Failed to add member:', error)
      toast({
        title: 'Error',
        description: 'Failed to add member',
        variant: 'destructive'
      })
    }
  }

  const deleteMember = async (teamId: string, memberId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Member Removed',
          description: 'The member has been removed from the team.'
        })
        fetchTeams()
      }
    } catch (error) {
      console.error('Failed to delete member:', error)
    }
  }

  // Series Management Functions
  const fetchSeries = async () => {
    setSeriesLoading(true)
    try {
      const response = await fetch('/api/series')
      if (response.ok) {
        const data = await response.json()
        setSeries(data.series || [])
      }
    } catch (error) {
      console.error('Failed to fetch series:', error)
    } finally {
      setSeriesLoading(false)
    }
  }

  const createOrUpdateSeries = async () => {
    if (!seriesFormData.name || !seriesFormData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Series name is required',
        variant: 'destructive'
      })
      return
    }

    if (seriesFormData.daysOfWeek.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one day',
        variant: 'destructive'
      })
      return
    }

    if (seriesFormData.platforms.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one platform',
        variant: 'destructive'
      })
      return
    }

    if (!seriesFormData.profileId) {
      toast({
        title: 'Error',
        description: 'Please select a profile',
        variant: 'destructive'
      })
      return
    }

    if (!seriesFormData.startDate) {
      toast({
        title: 'Error',
        description: 'Start date is required',
        variant: 'destructive'
      })
      return
    }

    try {
      const url = editingSeries ? `/api/series/${editingSeries.id}` : '/api/series'
      const method = editingSeries ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seriesFormData)
      })

      if (response.ok) {
        const createdSeries = await response.json()
        const seriesId = editingSeries ? editingSeries.id : createdSeries.id
        
        // If bulk scheduling is enabled, trigger it
        if (seriesFormData.bulkScheduleNow && seriesId) {
          toast({
            title: 'Series Created - Starting Bulk Scheduling',
            description: 'Scheduling all files from the folder...'
          })
          setShowSeriesDialog(false)
          setBulkScheduling(true)
          
          // Trigger bulk scheduling
          try {
            const bulkResponse = await fetch(`/api/series/${seriesId}/bulk-schedule`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include'
            })
            
            if (bulkResponse.ok) {
              // Handle streaming progress updates
              const reader = bulkResponse.body?.getReader()
              const decoder = new TextDecoder()
              
              if (reader) {
                while (true) {
                  const { done, value } = await reader.read()
                  if (done) break
                  
                  const text = decoder.decode(value)
                  const lines = text.split('\n').filter(line => line.trim())
                  
                  for (const line of lines) {
                    if (line.startsWith('data: ')) {
                      try {
                        const data = JSON.parse(line.slice(6))
                        
                        if (data.progress) {
                          setBulkScheduleProgress({ current: data.current, total: data.total })
                        } else if (data.complete) {
                          toast({
                            title: 'Bulk Scheduling Complete!',
                            description: `Successfully scheduled ${data.successful} out of ${data.total} files. ${data.failed > 0 ? `${data.failed} failed.` : ''}`
                          })
                          setBulkScheduling(false)
                          setBulkScheduleProgress({ current: 0, total: 0 })
                        } else if (data.error) {
                          toast({
                            title: 'Bulk Scheduling Error',
                            description: data.error,
                            variant: 'destructive'
                          })
                          setBulkScheduling(false)
                          setBulkScheduleProgress({ current: 0, total: 0 })
                        }
                      } catch (e) {
                        console.error('Failed to parse progress update:', e)
                      }
                    }
                  }
                }
              }
            } else {
              const errorData = await bulkResponse.json()
              toast({
                title: 'Bulk Scheduling Failed',
                description: errorData.error || 'Failed to start bulk scheduling',
                variant: 'destructive'
              })
              setBulkScheduling(false)
            }
          } catch (error) {
            console.error('Bulk scheduling error:', error)
            toast({
              title: 'Error',
              description: 'Failed to complete bulk scheduling',
              variant: 'destructive'
            })
            setBulkScheduling(false)
          }
        } else {
          toast({
            title: editingSeries ? 'Series Updated' : 'Series Created',
            description: editingSeries ? 'Your series has been updated.' : 'Your series has been created.'
          })
          setShowSeriesDialog(false)
        }
        
        setEditingSeries(null)
        setSeriesFormData({
          name: '',
          description: '',
          frequency: 'ONCE_WEEK',
          daysOfWeek: [],
          timeOfDay: '09:00',
          timezone: 'America/New_York',
          platforms: [],
          startDate: '',
          endDate: '',
          profileId: '',
          autoPost: true,
          deleteAfterPosting: false,
          dropboxFolderId: '',
          dropboxFolderPath: '',
          prompt: '',
          loopEnabled: false,
          bulkScheduleNow: false
        })
        setSelectedDropboxFolderName('')
        setFolderFileCount(null)
        fetchSeries()
      } else {
        const errorData = await response.json()
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to save series',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Failed to create/update series:', error)
      toast({
        title: 'Error',
        description: 'Failed to save series',
        variant: 'destructive'
      })
    }
  }

  const deleteSeries = async (seriesId: string) => {
    try {
      const response = await fetch(`/api/series/${seriesId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Series Deleted',
          description: 'The series has been removed.'
        })
        fetchSeries()
      }
    } catch (error) {
      console.error('Failed to delete series:', error)
    }
  }

  const triggerBulkSchedule = async (seriesId: string) => {
    try {
      setBulkScheduling(true)
      setBulkSchedulingSeriesId(seriesId)
      setBulkScheduleProgress({ current: 0, total: 0 })
      
      toast({
        title: 'Starting Bulk Scheduling',
        description: 'Processing all files from the folder...'
      })
      
      const response = await fetch(`/api/series/${seriesId}/bulk-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      })
      
      if (response.ok) {
        // Handle streaming progress updates
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            const text = decoder.decode(value)
            const lines = text.split('\n').filter(line => line.trim())
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6))
                  
                  if (data.progress) {
                    setBulkScheduleProgress({ current: data.current, total: data.total })
                  } else if (data.complete) {
                    toast({
                      title: 'Bulk Scheduling Complete!',
                      description: `Successfully scheduled ${data.successful} out of ${data.total} files. ${data.failed > 0 ? `${data.failed} failed.` : ''}`
                    })
                    setBulkScheduling(false)
                    setBulkSchedulingSeriesId(null)
                    setBulkScheduleProgress({ current: 0, total: 0 })
                    fetchSeries()
                  } else if (data.error) {
                    toast({
                      title: 'Bulk Scheduling Error',
                      description: data.error,
                      variant: 'destructive'
                    })
                    setBulkScheduling(false)
                    setBulkSchedulingSeriesId(null)
                    setBulkScheduleProgress({ current: 0, total: 0 })
                  }
                } catch (e) {
                  console.error('Failed to parse progress update:', e)
                }
              }
            }
          }
        }
      } else {
        const errorData = await response.json()
        toast({
          title: 'Bulk Scheduling Failed',
          description: errorData.error || 'Failed to start bulk scheduling',
          variant: 'destructive'
        })
        setBulkScheduling(false)
        setBulkSchedulingSeriesId(null)
      }
    } catch (error) {
      console.error('Bulk scheduling error:', error)
      toast({
        title: 'Error',
        description: 'Failed to complete bulk scheduling',
        variant: 'destructive'
      })
      setBulkScheduling(false)
      setBulkSchedulingSeriesId(null)
    }
  }

  // Prompt Functions
  const fetchSavedPrompts = async () => {
    try {
      const response = await fetch('/api/prompts')
      if (response.ok) {
        const data = await response.json()
        setSavedPrompts(data.prompts || [])
      }
    } catch (error) {
      console.error('Failed to fetch prompts:', error)
    }
  }

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

  // Rate Limit Functions
  const fetchRateLimits = async () => {
    setRateLimitLoading(true)
    try {
      const response = await fetch('/api/late/rate-limit')
      if (response.ok) {
        const data = await response.json()
        setRateLimitStatus(data)
        setLastRefreshed(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch rate limits:', error)
    } finally {
      setRateLimitLoading(false)
    }
  }

  const enhancePrompt = async () => {
    if (!seriesFormData.prompt || !seriesFormData.prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt first',
        variant: 'destructive'
      })
      return
    }

    setEnhancingPrompt(true)
    try {
      const response = await fetch('/api/polish-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: seriesFormData.prompt,
          isInstructions: true
        })
      })

      if (!response.ok) throw new Error('Failed to enhance prompt')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let enhancedText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.content) {
                  enhancedText += data.content
                  setSeriesFormData({ ...seriesFormData, prompt: enhancedText })
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      toast({
        title: 'Prompt Enhanced',
        description: 'Your prompt has been improved by AI'
      })
    } catch (error) {
      console.error('Failed to enhance prompt:', error)
      toast({
        title: 'Error',
        description: 'Failed to enhance prompt',
        variant: 'destructive'
      })
    } finally {
      setEnhancingPrompt(false)
    }
  }

  // Manage Posts Functions
  const fetchSchedules = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/schedules')
      if (response.ok) {
        const data = await response.json()
        setSchedules(data.schedules || [])
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const cancelSchedule = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Schedule Cancelled',
          description: 'The scheduled post has been removed.'
        })
        fetchSchedules()
      }
    } catch (error) {
      console.error('Failed to cancel schedule:', error)
    }
  }

  // Helper Functions
  const formatFrequency = (freq: string) => {
    const map: Record<string, string> = {
      'ONCE_WEEK': 'Once a week',
      'TWICE_WEEK': 'Twice a week',
      'THREE_WEEK': '3 times a week',
      'DAILY': 'Daily',
      'WEEKDAYS': 'Weekdays only',
      'CUSTOM': 'Custom'
    }
    return map[freq] || freq
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) + ' EST'
  }

  const getPlatformIcon = (platform: string) => {
    const platformData = platforms.find(p => p.id === platform.toLowerCase())
    if (platformData) {
      const Icon = platformData.icon
      return <Icon className="w-3 h-3" />
    }
    return <MessageSquare className="w-3 h-3" />
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Post Management</h1>
        <p className="text-gray-600">Manage your teams, series, and scheduled posts</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-4xl grid-cols-5">
          <TabsTrigger value="tag-people">Tag People</TabsTrigger>
          <TabsTrigger value="series">Series</TabsTrigger>
          <TabsTrigger value="multi-status" className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            <span className="hidden sm:inline">Multi-Series</span>
            <span className="sm:hidden">Status</span>
          </TabsTrigger>
          <TabsTrigger value="manage">Manage ({schedules.length})</TabsTrigger>
          <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
        </TabsList>

        {/* Tag People Tab */}
        <TabsContent value="tag-people" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tag People</CardTitle>
                  <CardDescription>
                    Organize and tag people by teams
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTeamDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Team
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {teams.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No teams created yet</p>
                  <p className="text-xs">Create a team to organize people for easy tagging</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {teams.map((team) => (
                    <div key={team.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{team.name}</h4>
                          {team.description && (
                            <p className="text-xs text-gray-500">{team.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCurrentTeamId(team.id)
                              setShowMemberDialog(true)
                            }}
                            className="text-xs h-7"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Member
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTeam(team.id)}
                            className="h-7 w-7 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {team.members.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">No members yet</p>
                      ) : (
                        <div className="space-y-1">
                          {team.members.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium truncate">
                                    {member.name}
                                  </span>
                                  {member.handle && (
                                    <span className="text-xs text-gray-500">
                                      @{member.handle}
                                    </span>
                                  )}
                                </div>
                                {member.platform && (
                                  <Badge variant="secondary" className="text-xs mt-0.5">
                                    {member.platform}
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMember(team.id, member.id)}
                                className="h-7 w-7 p-0 ml-2"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Series Tab */}
        <TabsContent value="series">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Post Series</CardTitle>
                  <CardDescription>
                    Create series with recurring schedules and associate posts with them
                  </CardDescription>
                </div>
                <Button onClick={() => setShowSeriesDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Series
                </Button>
              </div>
            </CardHeader>
            
            {/* Bulk Scheduling Progress */}
            {bulkScheduling && bulkSchedulingSeriesId && (
              <div className="px-6 pb-4">
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                          📅 Bulk Scheduling in Progress...
                        </h4>
                        <span className="text-sm text-blue-700 dark:text-blue-300">
                          {bulkScheduleProgress.current} of {bulkScheduleProgress.total} files
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3">
                        <div 
                          className="bg-blue-600 dark:bg-blue-400 h-3 rounded-full transition-all duration-300"
                          style={{ 
                            width: bulkScheduleProgress.total > 0 
                              ? `${(bulkScheduleProgress.current / bulkScheduleProgress.total) * 100}%` 
                              : '0%' 
                          }}
                        />
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Processing files, generating AI content, and scheduling posts in Late API...
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-200 font-medium">
                        💡 All posts will appear in Late's "Scheduled Posts" section when complete
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <CardContent>
              {seriesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : series.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>No series yet</p>
                  <p className="text-sm mt-2">
                    Create a series to automate recurring posts on a schedule
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {series.map((s) => (
                    <div
                      key={s.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium">{s.name}</h3>
                            <Badge 
                              variant={s.status === 'ACTIVE' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {s.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {s._count?.posts || 0} posts
                            </Badge>
                          </div>
                          
                          {s.description && (
                            <p className="text-sm text-gray-600 mb-3">
                              {s.description}
                            </p>
                          )}
                          
                          <div className="flex flex-wrap gap-2 mb-2">
                            <div className="text-xs text-gray-500">
                              <strong>Schedule:</strong> {formatFrequency(s.frequency)}
                            </div>
                            <div className="text-xs text-gray-500">
                              <strong>Days:</strong> {s.daysOfWeek.join(', ')}
                            </div>
                            {s.timeOfDay && (
                              <div className="text-xs text-gray-500">
                                <strong>Time:</strong> {s.timeOfDay}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-2">
                            {s.platforms.map((platform: string) => (
                              <div key={platform} className="flex items-center space-x-1 text-xs text-gray-500">
                                {getPlatformIcon(platform)}
                                <span>{platform}</span>
                              </div>
                            ))}
                          </div>
                          
                          {/* Dropbox Status */}
                          {s.dropboxFolderId && (
                            <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-semibold text-blue-700">
                                    🗂️ Dropbox Enabled
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    File #{s.currentFileIndex || 1}
                                  </Badge>
                                  {s.loopEnabled && (
                                    <Badge variant="outline" className="text-xs">
                                      🔄 Loop
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={async () => {
                                      try {
                                        const response = await fetch(`/api/series/${s.id}/preview-next`)
                                        const data = await response.json()
                                        if (response.ok) {
                                          toast({
                                            title: 'Next File',
                                            description: `${data.message || data.nextFile?.name}`,
                                          })
                                        } else {
                                          toast({
                                            title: 'Preview Failed',
                                            description: data.error || 'Could not preview next file',
                                            variant: 'destructive'
                                          })
                                        }
                                      } catch (error) {
                                        toast({
                                          title: 'Error',
                                          description: 'Failed to preview next file',
                                          variant: 'destructive'
                                        })
                                      }
                                    }}
                                  >
                                    👁️ Preview
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={async () => {
                                      try {
                                        const response = await fetch(`/api/series/${s.id}/test-run`, {
                                          method: 'POST'
                                        })
                                        const data = await response.json()
                                        if (response.ok) {
                                          toast({
                                            title: 'Test Posted!',
                                            description: 'Check your social media accounts',
                                          })
                                          fetchSeries()
                                        } else {
                                          toast({
                                            title: 'Test Failed',
                                            description: data.error || 'Could not post test',
                                            variant: 'destructive'
                                          })
                                        }
                                      } catch (error) {
                                        toast({
                                          title: 'Error',
                                          description: 'Failed to run test',
                                          variant: 'destructive'
                                        })
                                      }
                                    }}
                                  >
                                    🧪 Test
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={async () => {
                                      try {
                                        const response = await fetch(`/api/series/${s.id}/reset-counter`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ newIndex: 1 })
                                        })
                                        const data = await response.json()
                                        if (response.ok) {
                                          toast({
                                            title: 'Counter Reset',
                                            description: 'File index reset to 1',
                                          })
                                          fetchSeries()
                                        } else {
                                          toast({
                                            title: 'Reset Failed',
                                            description: data.error || 'Could not reset counter',
                                            variant: 'destructive'
                                          })
                                        }
                                      } catch (error) {
                                        toast({
                                          title: 'Error',
                                          description: 'Failed to reset counter',
                                          variant: 'destructive'
                                        })
                                      }
                                    }}
                                  >
                                    🔄 Reset
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                Next: {s.nextScheduledAt ? formatDateTime(s.nextScheduledAt) : 'Not scheduled'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingSeries(s)
                              setSeriesFormData({
                                name: s.name,
                                description: s.description || '',
                                frequency: s.frequency,
                                daysOfWeek: s.daysOfWeek,
                                timeOfDay: s.timeOfDay || '09:00',
                                timezone: (s as any).timezone || 'America/New_York',
                                platforms: s.platforms,
                                startDate: s.startDate,
                                endDate: s.endDate || '',
                                profileId: (s as any).profileId || '',
                                autoPost: (s as any).autoPost !== undefined ? (s as any).autoPost : true,
                                deleteAfterPosting: (s as any).deleteAfterPosting || false,
                                dropboxFolderId: (s as any).dropboxFolderId || '',
                                dropboxFolderPath: (s as any).dropboxFolderPath || '',
                                prompt: s.prompt || '',
                                loopEnabled: s.loopEnabled || false,
                                bulkScheduleNow: false
                              })
                              setSelectedDropboxFolderName('')
                              setShowSeriesDialog(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {(s as any).dropboxFolderPath && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => triggerBulkSchedule(s.id)}
                              disabled={bulkScheduling && bulkSchedulingSeriesId === s.id}
                              title="Bulk Schedule All Files"
                            >
                              <Calendar className="w-4 h-4 mr-1" />
                              {bulkScheduling && bulkSchedulingSeriesId === s.id ? 'Scheduling...' : 'Bulk'}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSeries(s.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multi-Series Status Tab */}
        <TabsContent value="multi-status" className="space-y-6">
          <div className="grid gap-6">
            {/* Multi-Series Status Dashboard */}
            <MultiSeriesStatus />

            {/* Show Bulk Schedule Progress if scheduling is active */}
            {bulkScheduling && bulkSchedulingSeriesId && (
              <BulkScheduleProgress
                seriesId={bulkSchedulingSeriesId}
                seriesName={series.find((s: PostSeries) => s.id === bulkSchedulingSeriesId)?.name || 'Unknown Series'}
                onComplete={(result) => {
                  toast({
                    title: 'Bulk Schedule Complete',
                    description: `${result.successful} posts scheduled successfully, ${result.failed} failed.`
                  })
                  setBulkScheduling(false)
                  setBulkSchedulingSeriesId(null)
                  fetchSeries()
                }}
                onError={(error) => {
                  toast({
                    title: 'Bulk Schedule Error',
                    description: error,
                    variant: 'destructive'
                  })
                  setBulkScheduling(false)
                  setBulkSchedulingSeriesId(null)
                }}
              />
            )}

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Common bulk scheduling operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('series')}
                  >
                    <PlayCircle className="w-6 h-6 text-blue-500" />
                    <span className="text-sm font-medium">Start New Series</span>
                    <span className="text-xs text-gray-500">Create and configure a new series</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => fetchSeries()}
                  >
                    <RefreshCw className="w-6 h-6 text-green-500" />
                    <span className="text-sm font-medium">Refresh Series</span>
                    <span className="text-xs text-gray-500">Reload series data</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setActiveTab('rate-limits')}
                  >
                    <TrendingUp className="w-6 h-6 text-purple-500" />
                    <span className="text-sm font-medium">View Rate Limits</span>
                    <span className="text-xs text-gray-500">Check API usage and limits</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Manage Schedules Tab */}
        <TabsContent value="manage">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Scheduled Posts</CardTitle>
              <CardDescription>
                View and manage your upcoming and recurring posts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : schedules.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>No scheduled posts yet</p>
                  <p className="text-sm">Create your first scheduled post to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-medium">{schedule.title}</h3>
                            <Badge 
                              variant={schedule.status === 'ACTIVE' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {schedule.status}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {schedule.scheduleType}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {schedule.content}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mb-2">
                            {schedule.platforms.map((platform) => (
                              <div key={platform} className="flex items-center space-x-1 text-xs text-gray-500">
                                {getPlatformIcon(platform)}
                                <span>{platform}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                Next: {schedule.nextRun ? formatDateTime(schedule.nextRun) : 'Not scheduled'}
                              </span>
                            </div>
                            {schedule.isRecurring && (
                              <div className="flex items-center space-x-1">
                                <PlayCircle className="w-3 h-3" />
                                <span>Runs: {schedule.runCount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelSchedule(schedule.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rate Limits Tab */}
        <TabsContent value="rate-limits" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Rate Limits - All Platforms
                  </CardTitle>
                  <CardDescription>
                    Complete overview: 8 posts per day limit for each platform, per business
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {lastRefreshed && (
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Updated {lastRefreshed.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit', 
                        second: '2-digit',
                        hour12: true,
                        timeZone: 'America/New_York'
                      })} EST</span>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchRateLimits}
                    disabled={rateLimitLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${rateLimitLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {rateLimitLoading && !rateLimitStatus ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  {/* Comprehensive Table View */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                          <th className="text-left p-3 font-bold text-sm">Business / Platform</th>
                          <th className="text-center p-3 font-bold text-sm">Instagram</th>
                          <th className="text-center p-3 font-bold text-sm">Facebook</th>
                          <th className="text-center p-3 font-bold text-sm">LinkedIn</th>
                          <th className="text-center p-3 font-bold text-sm">Twitter</th>
                          <th className="text-center p-3 font-bold text-sm">Threads</th>
                          <th className="text-center p-3 font-bold text-sm">TikTok</th>
                          <th className="text-center p-3 font-bold text-sm">Bluesky</th>
                          <th className="text-center p-3 font-bold text-sm">YouTube</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profiles.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="text-center py-8 text-gray-500">
                              <p className="text-sm">Loading profiles...</p>
                            </td>
                          </tr>
                        ) : (
                          profiles.map((profile: any) => {
                            // Get rate limit data for this profile
                            const profileData = rateLimitStatus?.profiles?.find(
                              (p: any) => p.profileId === profile.id
                            )

                            // Helper function to get platform status
                            const getPlatformData = (platformName: string) => {
                              if (!profileData) {
                                return { count: 0, limit: 8, remaining: 8, resetTime: null }
                              }
                              const platform = profileData.platforms?.find(
                                (p: any) => p.platform.toLowerCase() === platformName.toLowerCase()
                              )
                              return platform || { count: 0, limit: 8, remaining: 8, resetTime: null }
                            }

                            const allPlatforms = ['instagram', 'facebook', 'linkedin', 'twitter', 'threads', 'tiktok', 'bluesky', 'youtube']

                            return (
                              <tr key={profile.id} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="p-3 font-semibold text-sm">{profile.name}</td>
                                {allPlatforms.map((platformName) => {
                                  const data = getPlatformData(platformName)
                                  const statusColor = 
                                    data.remaining === 0 ? 'bg-red-100 text-red-800' :
                                    data.remaining <= 2 ? 'bg-yellow-100 text-yellow-800' :
                                    data.count > 0 ? 'bg-green-100 text-green-800' :
                                    'bg-gray-50 text-gray-500'

                                  return (
                                    <td key={platformName} className="p-3 text-center">
                                      <div className={`inline-block px-3 py-2 rounded-md min-w-[80px] ${statusColor}`}>
                                        <div className="font-bold text-base">
                                          {data.count}/{data.limit}
                                        </div>
                                        {data.count > 0 && (
                                          <div className="text-xs mt-1">
                                            {data.remaining} left
                                          </div>
                                        )}
                                        {data.resetTimeFormatted && data.remaining <= 2 && (
                                          <div className="text-xs mt-1 font-semibold">
                                            ⏰ {data.resetTimeFormatted}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  )
                                })}
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 py-4 border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-gray-50 border border-gray-300"></div>
                      <span className="text-sm text-gray-700">Not Used Today</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-green-100 border border-green-300"></div>
                      <span className="text-sm text-gray-700">Good (3+ left)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-yellow-100 border border-yellow-300"></div>
                      <span className="text-sm text-gray-700">Warning (≤2 left)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-red-100 border border-red-300"></div>
                      <span className="text-sm text-gray-700">Limit Reached (0 left)</span>
                    </div>
                  </div>

                  {/* Information Footer */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="text-blue-600 mt-0.5 text-lg">ℹ️</div>
                      <div className="flex-1 text-sm text-gray-700 space-y-2">
                        <p className="font-bold text-base">What This Table Shows:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>
                            <strong>Every business</strong> (Basketball Factory, Rise As One) has its own row
                          </li>
                          <li>
                            <strong>Every platform</strong> (Instagram, Facebook, LinkedIn, etc.) has its own column
                          </li>
                          <li>
                            Each cell shows <strong>current usage / daily limit</strong> (e.g., "5/8" means 5 posts used, 3 remaining)
                          </li>
                          <li>
                            <strong>Daily limit is 8 posts per platform per business</strong>
                          </li>
                          <li>
                            The limit resets <strong>24 hours after your oldest post</strong> (rolling window)
                          </li>
                          <li>
                            Gray cells = no posts today, Green = plenty left, Yellow = approaching limit, Red = limit reached
                          </li>
                          <li>
                            Reset times shown when you're close to or at the limit
                          </li>
                          <li>
                            This page auto-refreshes every 30 seconds
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Team Dialog */}
      <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Organize people into teams for easy tagging in posts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name *</Label>
              <Input
                id="team-name"
                placeholder="e.g., Team A, Basketball Factory"
                value={teamFormData.name}
                onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-description">Description</Label>
              <Textarea
                id="team-description"
                placeholder="Optional description for this team"
                value={teamFormData.description}
                onChange={(e) => setTeamFormData({ ...teamFormData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTeamDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createTeam}>Create Team</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Dialog */}
      <Dialog open={showMemberDialog} onOpenChange={setShowMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a person to this team for tagging in posts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">Name *</Label>
              <Input
                id="member-name"
                placeholder="e.g., John Doe"
                value={memberFormData.name}
                onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-handle">Handle</Label>
              <Input
                id="member-handle"
                placeholder="e.g., johndoe (without @)"
                value={memberFormData.handle}
                onChange={(e) => setMemberFormData({ ...memberFormData, handle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-platform">Platform</Label>
              <Select
                value={memberFormData.platform}
                onValueChange={(value) => setMemberFormData({ ...memberFormData, platform: value })}
              >
                <SelectTrigger id="member-platform">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.label}>
                      {platform.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMemberDialog(false)}>
              Cancel
            </Button>
            <Button onClick={addMember}>Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Series Dialog */}
      <Dialog open={showSeriesDialog} onOpenChange={(open) => {
        setShowSeriesDialog(open)
        if (!open) {
          setEditingSeries(null)
          setSeriesFormData({
            name: '',
            description: '',
            frequency: 'ONCE_WEEK',
            daysOfWeek: [],
            timeOfDay: '09:00',
            timezone: 'America/New_York',
            platforms: [],
            startDate: '',
            endDate: '',
            profileId: '',
            autoPost: true,
            deleteAfterPosting: false,
            dropboxFolderId: '',
            dropboxFolderPath: '',
            prompt: '',
            loopEnabled: false,
            bulkScheduleNow: false
          })
          setSelectedDropboxFolderName('')
          setFolderFileCount(null)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSeries ? 'Edit Series' : 'Create New Series'}</DialogTitle>
            <DialogDescription>
              Set up a recurring schedule for automated posting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="series-name">Series Name *</Label>
              <Input
                id="series-name"
                placeholder="e.g., Weekly Highlights"
                value={seriesFormData.name}
                onChange={(e) => setSeriesFormData({ ...seriesFormData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="series-description">Description</Label>
              <Textarea
                id="series-description"
                placeholder="Optional description"
                value={seriesFormData.description}
                onChange={(e) => setSeriesFormData({ ...seriesFormData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Frequency *</Label>
              <Select
                value={seriesFormData.frequency}
                onValueChange={(value) => setSeriesFormData({ ...seriesFormData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONCE_WEEK">Once a week</SelectItem>
                  <SelectItem value="TWICE_WEEK">Twice a week</SelectItem>
                  <SelectItem value="THREE_WEEK">3 times a week</SelectItem>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKDAYS">Weekdays only</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Days of Week *</Label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day}`}
                      checked={seriesFormData.daysOfWeek.includes(day)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSeriesFormData({
                            ...seriesFormData,
                            daysOfWeek: [...seriesFormData.daysOfWeek, day]
                          })
                        } else {
                          setSeriesFormData({
                            ...seriesFormData,
                            daysOfWeek: seriesFormData.daysOfWeek.filter(d => d !== day)
                          })
                        }
                      }}
                    />
                    <Label htmlFor={`day-${day}`} className="text-sm cursor-pointer">
                      {day.slice(0, 3)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="series-time">Time of Day</Label>
              <Input
                id="series-time"
                type="time"
                value={seriesFormData.timeOfDay}
                onChange={(e) => setSeriesFormData({ ...seriesFormData, timeOfDay: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="series-timezone">Timezone</Label>
              <Select
                value={seriesFormData.timezone}
                onValueChange={(value) => setSeriesFormData({ ...seriesFormData, timezone: value })}
              >
                <SelectTrigger id="series-timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                  <SelectItem value="Pacific/Honolulu">Hawaii Time (HT)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Platforms *</Label>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => (
                  <div key={platform.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`series-platform-${platform.id}`}
                      checked={seriesFormData.platforms.includes(platform.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSeriesFormData({
                            ...seriesFormData,
                            platforms: [...seriesFormData.platforms, platform.id]
                          })
                        } else {
                          setSeriesFormData({
                            ...seriesFormData,
                            platforms: seriesFormData.platforms.filter(p => p !== platform.id)
                          })
                        }
                      }}
                    />
                    <Label htmlFor={`series-platform-${platform.id}`} className="text-sm cursor-pointer">
                      {platform.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Selection */}
            <div className="space-y-2">
              <Label htmlFor="series-profile">Profile *</Label>
              <Select
                value={seriesFormData.profileId || profiles[0]?.id || ""}
                onValueChange={(value) => setSeriesFormData({ ...seriesFormData, profileId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Profile" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This profile will be used for posting to connected social media platforms
              </p>
            </div>

            {/* Auto-post Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-post">Auto-post to social media</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically post content when the series runs
                </p>
              </div>
              <Switch
                id="auto-post"
                checked={seriesFormData.autoPost}
                onCheckedChange={(checked) => setSeriesFormData({ ...seriesFormData, autoPost: checked })}
              />
            </div>

            {/* Delete After Posting Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="delete-after">Delete from Dropbox after posting</Label>
                <p className="text-sm text-muted-foreground">
                  Remove the file from Dropbox after successfully posting
                </p>
              </div>
              <Switch
                id="delete-after"
                checked={seriesFormData.deleteAfterPosting}
                onCheckedChange={(checked) => setSeriesFormData({ ...seriesFormData, deleteAfterPosting: checked })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="series-start">Start Date *</Label>
                <Input
                  id="series-start"
                  type="date"
                  value={seriesFormData.startDate}
                  onChange={(e) => setSeriesFormData({ ...seriesFormData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="series-end">End Date</Label>
                <Input
                  id="series-end"
                  type="date"
                  value={seriesFormData.endDate}
                  onChange={(e) => setSeriesFormData({ ...seriesFormData, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* Dropbox Integration Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-4 text-sm">🗂️ Dropbox Auto-Posting (Optional)</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Automatically post numbered files from Dropbox. Files must be named: 1-something.jpg, 2-something.png, etc.
              </p>
              
              <div className="space-y-4">
                {/* Dropbox Folder Selection */}
                <div className="space-y-2">
                  <Label htmlFor="dropbox-folder">Dropbox Folder</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDropboxPicker(true)}
                      className="w-full justify-start"
                    >
                      {selectedDropboxFolderName || seriesFormData.dropboxFolderId ? (
                        <span className="flex items-center gap-2">
                          📁 {selectedDropboxFolderName || seriesFormData.dropboxFolderId}
                        </span>
                      ) : (
                        'Browse Dropbox...'
                      )}
                    </Button>
                    {seriesFormData.dropboxFolderId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSeriesFormData({ ...seriesFormData, dropboxFolderId: '', dropboxFolderPath: '' });
                          setSelectedDropboxFolderName('');
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select a folder containing numbered files (e.g., 1-video.mp4, 2-image.jpg)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="series-prompt">AI Content Prompt</Label>
                  
                  {/* Saved Prompts Selector - Always visible */}
                  <Select
                    value=""
                    onValueChange={(value) => {
                      const selectedPrompt = savedPrompts.find(p => p.id === value)
                      if (selectedPrompt) {
                        setSeriesFormData({ ...seriesFormData, prompt: selectedPrompt.prompt || '' })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={savedPrompts.length > 0 ? "💾 Select from saved prompts..." : "💾 No saved prompts (create one in Prompts page)"} />
                    </SelectTrigger>
                    <SelectContent>
                      {savedPrompts.length === 0 ? (
                        <SelectItem value="no-prompts" disabled>
                          No saved prompts available
                        </SelectItem>
                      ) : (
                        savedPrompts.map((prompt) => (
                          <SelectItem key={prompt.id} value={prompt.id}>
                            {prompt.title || (prompt.prompt?.substring(0, 50) + '...') || 'Untitled'}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  {/* Prompt Textarea */}
                  <Textarea
                    id="series-prompt"
                    placeholder="Instructions for AI to generate post content from images (e.g., 'Create an exciting post about this game highlight with player names and score')"
                    value={seriesFormData.prompt}
                    onChange={(e) => setSeriesFormData({ ...seriesFormData, prompt: e.target.value })}
                    rows={4}
                  />

                  {/* Enhance Button */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      AI will analyze each image and use this prompt to generate post content
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={enhancePrompt}
                      disabled={enhancingPrompt || !seriesFormData.prompt || !seriesFormData.prompt.trim()}
                    >
                      {enhancingPrompt ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enhancing...
                        </>
                      ) : (
                        <>
                          ✨ Enhance Prompt
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="loop-enabled"
                    checked={seriesFormData.loopEnabled}
                    onCheckedChange={(checked) => setSeriesFormData({ ...seriesFormData, loopEnabled: checked as boolean })}
                  />
                  <Label htmlFor="loop-enabled" className="text-sm cursor-pointer">
                    🔄 Loop back to file 1 after reaching the end
                  </Label>
                </div>

                {/* Bulk Schedule Checkbox */}
                {seriesFormData.dropboxFolderId && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="bulk-schedule"
                        checked={seriesFormData.bulkScheduleNow}
                        onCheckedChange={(checked) => setSeriesFormData({ ...seriesFormData, bulkScheduleNow: checked as boolean })}
                      />
                      <div className="flex-1">
                        <Label htmlFor="bulk-schedule" className="text-sm font-semibold cursor-pointer flex items-center gap-2">
                          📅 Schedule all files from folder immediately
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {folderFileCount !== null ? (
                            <>
                              This will schedule all {folderFileCount} files at once according to the schedule above. 
                              First post will be scheduled for {seriesFormData.startDate}, second for the next day, etc.
                            </>
                          ) : (
                            <>
                              This will schedule all files in the folder at once according to the schedule above.
                            </>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                          ℹ️ Series will remain active so you can add more files later and bulk schedule again.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowSeriesDialog(false)
              setEditingSeries(null)
              setSeriesFormData({
                name: '',
                description: '',
                frequency: 'ONCE_WEEK',
                daysOfWeek: [],
                timeOfDay: '09:00',
                timezone: 'America/New_York',
                platforms: [],
                startDate: '',
                endDate: '',
                profileId: '',
                autoPost: true,
                deleteAfterPosting: false,
                dropboxFolderId: '',
                dropboxFolderPath: '',
                prompt: '',
                loopEnabled: false,
                bulkScheduleNow: false
              })
              setSelectedDropboxFolderName('')
              setFolderFileCount(null)
            }}>
              Cancel
            </Button>
            <Button onClick={createOrUpdateSeries}>
              {editingSeries ? 'Update' : 'Create'} Series
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dropbox Folder Picker */}
      <DropboxFolderPicker
        open={showDropboxPicker}
        onOpenChange={setShowDropboxPicker}
        onFolderSelect={async (folderId, folderName, folderPath, fileCount) => {
          setSeriesFormData({ ...seriesFormData, dropboxFolderId: folderId, dropboxFolderPath: folderPath });
          setSelectedDropboxFolderName(folderName);
          // The file count is already provided by the folder picker
          setFolderFileCount(fileCount || null);
        }}
      />
    </div>
  )
}
