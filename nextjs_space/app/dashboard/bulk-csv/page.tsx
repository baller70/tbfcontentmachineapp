'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { DropboxFolderPicker } from '@/components/dropbox-folder-picker'
import { FolderOpen, FileText, Calendar, Sparkles, Download, Loader2, CheckCircle, AlertCircle, Wand2, Video, Image as ImageIcon, HelpCircle, Copy, ExternalLink, RefreshCw, XCircle, TrendingUp } from 'lucide-react'
import { RateLimitIndicator } from '@/components/rate-limit-indicator'

interface Profile {
  id: string
  name: string
  lateProfileId?: string
  platformSettings?: PlatformSetting[]
}

interface PlatformSetting {
  id: string
  platform: string
  isConnected: boolean
  platformId?: string
  platformUsername?: string
}

interface MediaFile {
  name: string
  path: string
  mimeType?: string
}

interface GeneratedPost {
  fileName: string
  filePath: string
  content: string
  mediaType: 'image' | 'video'
}

export default function BulkScheduleCSVPage() {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1: Media Selection
  const [dropboxFolderPath, setDropboxFolderPath] = useState('')
  const [dropboxFolderId, setDropboxFolderId] = useState('')
  const [fileCount, setFileCount] = useState(0)
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [showFolderPicker, setShowFolderPicker] = useState(false)

  // Step 2: AI Content Generation (NEW - happens before configuration)
  const [aiPrompt, setAiPrompt] = useState('')
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([])
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 })

  // Step 3: Profile & Platform Selection
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])

  // Step 4: Scheduling Configuration
  const [schedulingMode, setSchedulingMode] = useState<'now' | 'queue' | 'custom'>('custom')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('07:00')
  const [timezone, setTimezone] = useState('America/New_York')
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>([])

  const daysOfWeekOptions = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

  // Step 5: Results
  const [results, setResults] = useState<any>(null)
  const [postCreationProgress, setPostCreationProgress] = useState({ current: 0, total: 0, currentFile: '' })

  // Enhancement states
  const [enhancingPrompt, setEnhancingPrompt] = useState(false)
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])
  const [rateLimitWarning, setRateLimitWarning] = useState<{ canPost: boolean; blockedPlatforms: string[] }>({ canPost: true, blockedPlatforms: [] })

  const platforms = [
    { id: 'instagram', name: 'Instagram' },
    { id: 'facebook', name: 'Facebook' },
    { id: 'linkedin', name: 'LinkedIn' },
    { id: 'twitter', name: 'Twitter' },
    { id: 'threads', name: 'Threads' },
    { id: 'tiktok', name: 'TikTok' },
    { id: 'bluesky', name: 'Bluesky' },
  ]

  // Load profiles on mount
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const profilesRes = await fetch('/api/profiles')
        const profilesData = await profilesRes.json()

        // Handle profiles response - API returns { profiles: [...] }
        const profilesArray = Array.isArray(profilesData)
          ? profilesData
          : (profilesData?.profiles || [])

        setProfiles(profilesArray)

        if (profilesArray.length > 0) {
          setSelectedProfileId(profilesArray[0].id)
          // Set connected platforms for the first profile
          updateConnectedPlatforms(profilesArray[0])
        }
      } catch (error) {
        console.error('Error loading profiles:', error)
        toast({
          title: 'Error',
          description: 'Failed to load profiles',
          variant: 'destructive',
        })
      }
    }
    loadProfiles()
  }, [toast])

  // Update connected platforms when profile changes
  const updateConnectedPlatforms = (profile: Profile) => {
    if (!profile?.platformSettings) {
      setConnectedPlatforms([])
      return
    }
    const connected = profile.platformSettings
      .filter((ps: PlatformSetting) => ps.isConnected && ps.platformId && !['instagram', 'facebook', 'linkedin', 'threads', 'tiktok', 'bluesky', 'youtube', 'twitter'].includes(ps.platformId.toLowerCase()))
      .map((ps: PlatformSetting) => ps.platform.toLowerCase())
    setConnectedPlatforms(connected)
  }

  // Handle profile change
  const handleProfileChange = (profileId: string) => {
    setSelectedProfileId(profileId)
    const profile = profiles.find(p => p.id === profileId)
    if (profile) {
      updateConnectedPlatforms(profile)
      // Clear selected platforms that aren't connected to new profile
      setSelectedPlatforms(prev => prev.filter(p => {
        const setting = profile.platformSettings?.find((ps: PlatformSetting) => ps.platform.toLowerCase() === p.toLowerCase())
        return setting?.isConnected && setting?.platformId && !['instagram', 'facebook', 'linkedin', 'threads', 'tiktok', 'bluesky', 'youtube', 'twitter'].includes(setting.platformId.toLowerCase())
      }))
    }
  }

  // Load media files when folder is selected
  useEffect(() => {
    const loadMediaFiles = async () => {
      if (!dropboxFolderPath) return
      try {
        console.log('📁 Loading media files from:', dropboxFolderPath)
        const res = await fetch(`/api/dropbox/files?path=${encodeURIComponent(dropboxFolderPath)}`)
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          console.error('API Error:', res.status, errorData)
          throw new Error(errorData.error || 'Failed to load files')
        }
        const files = await res.json()
        console.log('✅ Loaded media files:', files.length)
        console.log('   Sample file:', files[0])
        setMediaFiles(files || [])
      } catch (error: any) {
        console.error('❌ Error loading media files:', error)
        toast({
          title: 'Failed to Load Files',
          description: error.message || 'Could not load files from Dropbox. Please try again.',
          variant: 'destructive',
        })
        setMediaFiles([])
      }
    }
    loadMediaFiles()
  }, [dropboxFolderPath, toast])

  const handleFolderSelect = (folderId: string, folderPath: string, folderName: string, count?: number) => {
    setDropboxFolderId(folderId)
    setDropboxFolderPath(folderPath)
    setFileCount(count || 0)
    setShowFolderPicker(false)
  }

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    )
  }

  // Enhancement 1: Enhance AI prompt
  const handleEnhancePrompt = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt to enhance',
        variant: 'destructive',
      })
      return
    }

    setEnhancingPrompt(true)
    try {
      const response = await fetch('/api/bulk-csv/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          platforms: selectedPlatforms.length > 0 ? selectedPlatforms : ['instagram', 'facebook', 'tiktok'],
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to enhance prompt')
      }

      const data = await response.json()
      setAiPrompt(data.enhancedPrompt)

      toast({
        title: 'Prompt Enhanced',
        description: 'Your prompt has been improved with AI suggestions',
      })
    } catch (error: any) {
      console.error('Error enhancing prompt:', error)
      toast({
        title: 'Enhancement Failed',
        description: error.message || 'Could not enhance prompt',
        variant: 'destructive',
      })
    } finally {
      setEnhancingPrompt(false)
    }
  }

  // Copy post ID to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Post ID copied to clipboard',
    })
  }

  const handleNext = async () => {
    // Step 1 → 2: Folder selected, now generate AI content
    if (step === 1) {
      if (!dropboxFolderPath) {
        toast({
          title: 'Error',
          description: 'Please select a Dropbox folder',
          variant: 'destructive',
        })
        return
      }
      if (mediaFiles.length === 0) {
        toast({
          title: 'Loading Files',
          description: 'Please wait while files are loaded from Dropbox...',
          variant: 'destructive',
        })
        return
      }
      setStep(2)
    }
    // Step 2 → 3: AI content generated, now select profile & platforms
    else if (step === 2) {
      if (!aiPrompt.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter AI prompt instructions for content generation',
          variant: 'destructive',
        })
        return
      }
      if (generatedPosts.length === 0) {
        await generateAllAIContent()
      }
      if (generatedPosts.length > 0) {
        setStep(3)
      }
    }
    // Step 3 → 4: Profile & platforms selected, now configure scheduling
    else if (step === 3) {
      if (!selectedProfileId) {
        toast({
          title: 'Error',
          description: 'Please select a profile',
          variant: 'destructive',
        })
        return
      }
      if (selectedPlatforms.length === 0) {
        toast({
          title: 'Error',
          description: 'Please select at least one platform',
          variant: 'destructive',
        })
        return
      }
      setStep(4)
    }
    // Step 4 → 5: Scheduling configured, now submit
    else if (step === 4) {
      if (schedulingMode === 'custom') {
        if (!startDate) {
          toast({
            title: 'Error',
            description: 'Please select a start date',
            variant: 'destructive',
          })
          return
        }
        if (daysOfWeek.length === 0) {
          toast({
            title: 'Error',
            description: 'Please select at least one day of the week',
            variant: 'destructive',
          })
          return
        }
      }
      await handleComplete()
    }
  }

  // NEW: Generate AI content for ALL files before configuration
  const generateAllAIContent = async () => {
    setLoading(true)
    setGenerationProgress({ current: 0, total: mediaFiles.length })
    
    try {
      console.log(`🤖 Starting AI content generation for ${mediaFiles.length} files`)
      toast({
        title: 'Analyzing Media',
        description: `Processing ${mediaFiles.length} files with AI vision...`,
      })
      
      const posts: GeneratedPost[] = []
      
      for (let i = 0; i < mediaFiles.length; i++) {
        const file = mediaFiles[i]
        setGenerationProgress({ current: i + 1, total: mediaFiles.length })
        console.log(`📷 Processing ${file.name} (${i + 1}/${mediaFiles.length})`)
        
        try {
          // Validate file path
          if (!file.path || file.path.trim() === '') {
            throw new Error('File path is missing')
          }
          
          // Determine media type (image or video)
          const isVideo = /\.(mp4|mov|avi|webm)$/i.test(file.name)
          const mediaType: 'image' | 'video' = isVideo ? 'video' : 'image'
          
          console.log(`   ${isVideo ? '🎬' : '🖼️'} ${mediaType.toUpperCase()}: ${file.path}`)
          
          // Call backend API to download, analyze, and generate content
          const analyzeRes = await fetch('/api/bulk-csv/analyze-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filePath: file.path,
              aiPrompt: aiPrompt,
              platforms: ['instagram', 'facebook', 'linkedin', 'threads', 'tiktok', 'bluesky'], // Temporary for analysis
            }),
          })
          
          if (!analyzeRes.ok) {
            const errorData = await analyzeRes.json().catch(() => ({}))
            throw new Error(errorData.error || `API error: ${analyzeRes.status}`)
          }
          
          const result = await analyzeRes.json()
          const content = result.content || 'Content generation failed'
          
          posts.push({
            fileName: file.name,
            filePath: file.path,
            content: content.trim(),
            mediaType,
          })
          
          console.log(`  ✅ Generated content: ${content.substring(0, 80)}...`)
          
        } catch (error: any) {
          console.error(`❌ Error processing ${file.name}:`, error)
          posts.push({
            fileName: file.name,
            filePath: file.path,
            content: `[AI analysis failed: ${error.message}]`,
            mediaType: 'image',
          })
        }
      }
      
      setGeneratedPosts(posts)
      console.log(`✅ Successfully generated ${posts.length} AI posts`)
      
      toast({
        title: 'Content Generated',
        description: `✅ ${posts.length} unique AI posts ready`,
      })
      
    } catch (error: any) {
      console.error('❌ Error in AI content generation:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate AI content',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setGenerationProgress({ current: 0, total: 0 })
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    setStep(5) // Go to step 5 immediately to show progress
    setPostCreationProgress({ current: 0, total: generatedPosts.length, currentFile: '' })

    try {
      console.log(`📤 Submitting ${generatedPosts.length} posts with generated content`)

      // Simulate progress updates (since the bulk API doesn't stream progress)
      const progressInterval = setInterval(() => {
        setPostCreationProgress(prev => {
          if (prev.current < prev.total - 1) {
            const nextIndex = prev.current + 1
            return {
              current: nextIndex,
              total: prev.total,
              currentFile: generatedPosts[nextIndex]?.fileName || '',
            }
          }
          return prev
        })
      }, 1500) // Update every 1.5 seconds

      const response = await fetch('/api/bulk-csv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dropboxFolderPath,
          profileId: selectedProfileId,
          platforms: selectedPlatforms,
          contentMode: 'ai', // Always AI mode in new workflow
          aiPrompt,
          schedulingMode,
          startDate,
          startTime,
          timezone,
          daysOfWeek,
          // Pass the pre-generated content so backend doesn't regenerate
          generatedContent: generatedPosts.map(p => ({
            fileName: p.fileName,
            content: p.content,
          })),
        }),
      })

      clearInterval(progressInterval)
      setPostCreationProgress({ current: generatedPosts.length, total: generatedPosts.length, currentFile: '' })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process bulk schedule')
      }

      const data = await response.json()
      setResults(data)

      toast({
        title: data.invalid > 0 ? 'Partially Complete' : 'Success',
        description: `✅ ${data.valid || 0} of ${data.total || 0} posts scheduled successfully`,
        variant: data.invalid > 0 ? 'default' : 'default',
      })
    } catch (error: any) {
      console.error('❌ Error completing bulk schedule:', error)
      setResults({
        success: false,
        total: generatedPosts.length,
        valid: 0,
        invalid: generatedPosts.length,
        results: generatedPosts.map((p, i) => ({
          rowIndex: i + 1,
          ok: false,
          file: p.fileName,
          errors: [error.message || 'Failed to create post'],
        })),
      })
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete bulk schedule',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
      setPostCreationProgress({ current: 0, total: 0, currentFile: '' })
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleReset = () => {
    setStep(1)
    setDropboxFolderPath('')
    setDropboxFolderId('')
    setFileCount(0)
    setMediaFiles([])
    setSelectedPlatforms([])
    setAiPrompt('')
    setGeneratedPosts([])
    setSchedulingMode('custom')
    setStartDate('')
    setDaysOfWeek([])
    setResults(null)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bulk Schedule CSV</h1>
          <p className="text-muted-foreground mt-1">
            Schedule multiple posts from a Dropbox folder using Late API CSV format
          </p>
        </div>
        {step > 1 && step < 5 && (
          <Button variant="outline" onClick={handleReset}>
            Start Over
          </Button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s ? 'bg-brand-primary text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {s}
            </div>
            {s < 5 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-brand-primary' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Media Selection */}
      {step === 1 && (
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Step 1: Select Media from Dropbox</h2>
          <div className="space-y-4">
            <div>
              <Label>Dropbox Folder</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={dropboxFolderPath || 'No folder selected'}
                  readOnly
                  className="flex-1"
                />
                <Button onClick={() => setShowFolderPicker(true)}>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Browse
                </Button>
              </div>
            </div>
            {fileCount > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Found {fileCount} media file(s)</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Step 2: AI Content Generation */}
      {step === 2 && (
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            Step 2: Generate AI Content
          </h2>
          
          <div className="space-y-6">
            {/* AI Prompt Input with Enhance Button */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="ai-prompt">AI Content Instructions</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEnhancePrompt}
                  disabled={enhancingPrompt || !aiPrompt.trim()}
                >
                  {enhancingPrompt ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Enhance Prompt
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                id="ai-prompt"
                placeholder="Example: Analyze the image/video and create an inspiring basketball post with player details, game highlights, and motivational message. Include relevant hashtags."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                💡 The AI will analyze each {mediaFiles.some(f => /\.(mp4|mov|avi|webm)$/i.test(f.name)) ? 'video/image' : 'image'} and generate unique content based on these instructions. Click "Enhance Prompt" to improve your instructions with AI.
              </p>
            </div>

            {/* Generate Button */}
            {generatedPosts.length === 0 && (
              <Button
                onClick={() => generateAllAIContent()}
                disabled={loading || !aiPrompt.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Content... {generationProgress.current}/{generationProgress.total}
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Generate AI Content for All {mediaFiles.length} Files
                  </>
                )}
              </Button>
            )}

            {/* Progress Bar */}
            {loading && generationProgress.total > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Processing files...</span>
                  <span>{generationProgress.current} / {generationProgress.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-brand-primary h-2 rounded-full transition-all"
                    style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Generated Content Preview */}
            {generatedPosts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Content Generated Successfully
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setGeneratedPosts([])
                      setGenerationProgress({ current: 0, total: 0 })
                    }}
                  >
                    Regenerate
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium">File</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Type</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Generated Content</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generatedPosts.map((post, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-3 text-sm">{post.fileName}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="inline-flex items-center gap-1">
                                {post.mediaType === 'video' ? (
                                  <><Video className="w-4 h-4" /> Video</>
                                ) : (
                                  <><ImageIcon className="w-4 h-4" /> Image</>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="max-w-md">
                                <p className="line-clamp-2">{post.content}</p>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  ✅ {generatedPosts.length} unique posts ready. Continue to select platforms and scheduling.
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Step 3: Profile & Platform Selection */}
      {step === 3 && (
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Step 3: Select Profile & Platforms</h2>

          <div className="space-y-6">
            {/* Profile Selection */}
            <div>
              <Label>Business Profile</Label>
              <Select value={selectedProfileId} onValueChange={handleProfileChange}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select profile" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(profiles) && profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Platform Selection with Connection Status */}
            <div>
              <Label>Target Platforms</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Select platforms to post to. Platforms must be connected via Late API in Settings.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                {platforms.map((platform) => {
                  const selectedProfile = profiles.find(p => p.id === selectedProfileId)
                  const platformSetting = selectedProfile?.platformSettings?.find(
                    (ps: PlatformSetting) => ps.platform.toLowerCase() === platform.id.toLowerCase()
                  )
                  // Check if platform has a real Late account ID (not a placeholder)
                  const hasRealAccountId = platformSetting?.platformId &&
                    !['instagram', 'facebook', 'linkedin', 'threads', 'tiktok', 'bluesky', 'youtube', 'twitter'].includes(platformSetting.platformId.toLowerCase())
                  const isConnected = platformSetting?.isConnected && hasRealAccountId

                  return (
                    <div key={platform.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={platform.id}
                        checked={selectedPlatforms.includes(platform.id)}
                        onCheckedChange={() => handlePlatformToggle(platform.id)}
                        disabled={!isConnected}
                      />
                      <label
                        htmlFor={platform.id}
                        className={`text-sm font-medium cursor-pointer flex items-center gap-1 ${!isConnected ? 'text-muted-foreground line-through' : ''}`}
                      >
                        {platform.name}
                        {!isConnected && (
                          <span className="text-xs text-yellow-600" title={platformSetting?.isConnected ? "Needs Late sync" : "Not connected"}>⚠️</span>
                        )}
                      </label>
                    </div>
                  )
                })}
              </div>

              {/* Warning for unconnected platforms */}
              {connectedPlatforms.length === 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>
                      <strong>No platforms connected!</strong> Go to{' '}
                      <a href="/dashboard/settings" className="underline font-medium">Settings → Platforms</a>{' '}
                      and click "Sync with Late" to connect your social accounts.
                    </span>
                  </p>
                </div>
              )}
              {selectedPlatforms.length === 0 && connectedPlatforms.length > 0 && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Please select at least one platform to continue.
                  </p>
                </div>
              )}
            </div>

            {/* Rate Limit Status - Show when profile and platforms are selected */}
            {selectedProfileId && selectedPlatforms.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Rate Limit Status
                </Label>
                <RateLimitIndicator
                  selectedProfileId={selectedProfileId}
                  selectedPlatforms={selectedPlatforms}
                  variant="compact"
                  onStatusChange={(canPost, details) => setRateLimitWarning({ canPost, blockedPlatforms: details.blockedPlatforms })}
                />
                {!rateLimitWarning.canPost && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      <span>
                        <strong>Warning:</strong> The following platforms have reached their daily limit: {rateLimitWarning.blockedPlatforms.join(', ')}.
                        Posts to these platforms will fail. Consider removing them or waiting for the limit to reset.
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Ready to post:</strong> {generatedPosts.length} posts will be published to {selectedPlatforms.length} platform(s)
              </p>
              {selectedPlatforms.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {selectedPlatforms.map(p => platforms.find(pl => pl.id === p)?.name).join(', ')}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: Scheduling Configuration */}
      {step === 4 && (
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Step 4: Configure Scheduling
          </h2>
          
          <div className="space-y-6">
            {/* Scheduling Mode */}
            <div>
              <Label>When to Post</Label>
              <Select value={schedulingMode} onValueChange={(v: any) => setSchedulingMode(v)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Publish All Now</SelectItem>
                  <SelectItem value="queue">Use Queue (auto-schedule)</SelectItem>
                  <SelectItem value="custom">Custom Schedule</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Schedule Settings */}
            {schedulingMode === 'custom' && (
              <div className="space-y-4">
                <div>
                  <Label>Days of Week</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {daysOfWeekOptions.map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day}`}
                          checked={daysOfWeek.includes(day)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setDaysOfWeek([...daysOfWeek, day])
                            } else {
                              setDaysOfWeek(daysOfWeek.filter(d => d !== day))
                            }
                          }}
                        />
                        <label htmlFor={`day-${day}`} className="text-sm cursor-pointer">
                          {day.slice(0, 3)}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Time of Day</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label>Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
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
              </div>
            )}

            {/* Enhancement 2: Queue Scheduling Explanation */}
            <Accordion type="single" collapsible className="mt-6">
              <AccordionItem value="queue-explanation" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2 text-sm">
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                    <span>How does Queue scheduling work?</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground mb-1">Basic Explanation</p>
                      <p>Queue scheduling automatically distributes your posts across available time slots based on your selected days and frequency. Posts are scheduled sequentially in chronological order.</p>
                    </div>

                    <div>
                      <p className="font-medium text-foreground mb-1">Multiple Series Behavior</p>
                      <p>If you have multiple series running simultaneously, Queue will interleave posts from different series to avoid scheduling conflicts and maintain balanced distribution across your content calendar.</p>
                    </div>

                    <div>
                      <p className="font-medium text-foreground mb-1">Concrete Example</p>
                      <div className="bg-muted/50 p-3 rounded-md mt-1">
                        <p className="mb-2">If you have <strong>10 posts</strong>, select <strong>Monday/Wednesday/Friday</strong>, start date <strong>Dec 10</strong>, and <strong>1 post per day</strong>:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Dec 10 (Mon) - Post 1</li>
                          <li>Dec 12 (Wed) - Post 2</li>
                          <li>Dec 14 (Fri) - Post 3</li>
                          <li>Dec 17 (Mon) - Post 4</li>
                          <li>Dec 19 (Wed) - Post 5</li>
                          <li>...and so on</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </Card>
      )}

      {/* Step 5: Results with Progress and Detailed Breakdown */}
      {step === 5 && (
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            ) : results?.invalid > 0 ? (
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            ) : (
              <CheckCircle className="w-6 h-6 text-green-600" />
            )}
            Step 5: {loading ? 'Creating Posts...' : 'Results'}
          </h2>

          {/* Enhancement 4: Progress Bar During Post Creation */}
          {loading && postCreationProgress.total > 0 && (
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Creating post {postCreationProgress.current} of {postCreationProgress.total}...
                </span>
                <span className="font-medium">
                  {Math.round((postCreationProgress.current / postCreationProgress.total) * 100)}%
                </span>
              </div>
              <Progress value={(postCreationProgress.current / postCreationProgress.total) * 100} className="h-3" />
              {postCreationProgress.currentFile && (
                <p className="text-xs text-muted-foreground">
                  Processing: {postCreationProgress.currentFile}
                </p>
              )}
            </div>
          )}

          {/* Enhancement 5: Detailed Results Breakdown */}
          {results && (
            <div className="space-y-6">
              {/* Summary Stats Banner */}
              <div className={`p-4 rounded-lg border ${
                results.invalid > 0
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center gap-4">
                  {results.invalid > 0 ? (
                    <AlertCircle className="w-10 h-10 text-yellow-600" />
                  ) : (
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  )}
                  <div>
                    <p className="text-lg font-semibold">
                      Successfully created {results.valid || 0} of {results.total || 0} posts
                    </p>
                    {results.invalid > 0 && (
                      <p className="text-sm text-yellow-700">
                        ⚠️ {results.invalid} post(s) failed - see details below
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Successful Posts Table */}
              {results.results && results.results.filter((r: any) => r.ok).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    Successful Posts ({results.results.filter((r: any) => r.ok).length})
                  </h3>
                  <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-green-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left">#</th>
                          <th className="px-3 py-2 text-left">File</th>
                          <th className="px-3 py-2 text-left">Content Preview</th>
                          <th className="px-3 py-2 text-left">Post ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {results.results.filter((r: any) => r.ok).map((result: any, index: number) => (
                          <tr key={index} className="hover:bg-green-50/50">
                            <td className="px-3 py-2">{result.rowIndex || index + 1}</td>
                            <td className="px-3 py-2 font-medium">{result.file || `Post ${index + 1}`}</td>
                            <td className="px-3 py-2 text-muted-foreground max-w-xs truncate">
                              {generatedPosts[index]?.content?.substring(0, 50) || '-'}...
                            </td>
                            <td className="px-3 py-2">
                              {result.createdPostId ? (
                                <div className="flex items-center gap-1">
                                  <code className="text-xs bg-muted px-1 rounded">{result.createdPostId.substring(0, 12)}...</code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => copyToClipboard(result.createdPostId)}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Failed Posts Table */}
              {results.results && results.results.filter((r: any) => !r.ok).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-700">
                    <XCircle className="w-5 h-5" />
                    Failed Posts ({results.results.filter((r: any) => !r.ok).length})
                  </h3>
                  <div className="border border-red-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-red-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left">#</th>
                          <th className="px-3 py-2 text-left">File</th>
                          <th className="px-3 py-2 text-left">Error</th>
                          <th className="px-3 py-2 text-left">Suggested Fix</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {results.results.filter((r: any) => !r.ok).map((result: any, index: number) => (
                          <tr key={index} className="hover:bg-red-50/50">
                            <td className="px-3 py-2">{result.rowIndex || index + 1}</td>
                            <td className="px-3 py-2 font-medium">{result.file || `Post ${index + 1}`}</td>
                            <td className="px-3 py-2 text-red-700 max-w-xs">
                              {result.errors?.join(', ') || 'Unknown error'}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground text-xs">
                              {result.errors?.[0]?.includes('account ID')
                                ? 'Connect platform in Settings'
                                : result.errors?.[0]?.includes('media')
                                  ? 'Check media file format'
                                  : 'Try again or contact support'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => window.open('https://getlate.dev/dashboard/posts', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View in Late Dashboard
                </Button>

                {results.invalid > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Keep only failed posts and go back to step 4
                      const failedIndices = results.results
                        .map((r: any, i: number) => r.ok ? -1 : i)
                        .filter((i: number) => i >= 0)
                      const failedPosts = failedIndices.map((i: number) => generatedPosts[i]).filter(Boolean)
                      if (failedPosts.length > 0) {
                        setGeneratedPosts(failedPosts)
                        setResults(null)
                        setStep(4)
                        toast({
                          title: 'Retry Mode',
                          description: `${failedPosts.length} failed post(s) ready to retry`,
                        })
                      }
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Failed Posts
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    // Download results as CSV
                    const csvData = [
                      ['#', 'File', 'Status', 'Post ID', 'Error'].join(','),
                      ...results.results.map((r: any, i: number) =>
                        [i + 1, r.file || `Post ${i + 1}`, r.ok ? 'Success' : 'Failed', r.createdPostId || '', r.errors?.join('; ') || ''].join(',')
                      )
                    ].join('\n')
                    const blob = new Blob([csvData], { type: 'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `bulk-schedule-results-${new Date().toISOString().split('T')[0]}.csv`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>

                <Button onClick={handleReset}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Create Another Batch
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Navigation Buttons */}
      {step < 5 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 1 || loading}>
            Back
          </Button>
          <Button onClick={handleNext} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {step === 4 ? 'Complete & Schedule' : step === 2 && generatedPosts.length === 0 ? 'Generate AI Content' : 'Next'}
          </Button>
        </div>
      )}

      {/* Dropbox Folder Picker Modal */}
      <DropboxFolderPicker
        open={showFolderPicker}
        onOpenChange={setShowFolderPicker}
        onFolderSelect={handleFolderSelect}
      />
    </div>
  )
}
