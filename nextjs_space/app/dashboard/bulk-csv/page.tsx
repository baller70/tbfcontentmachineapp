'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { DropboxFolderPicker } from '@/components/dropbox-folder-picker'
import { FolderOpen, FileText, Calendar, Sparkles, Download, Loader2, CheckCircle, AlertCircle, Wand2, Video, Image as ImageIcon } from 'lucide-react'

interface Profile {
  id: string
  name: string
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
    try {
      console.log(`📤 Submitting ${generatedPosts.length} posts with generated content`)
      
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

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process bulk schedule')
      }

      const data = await response.json()
      setResults(data)
      setStep(5) // Changed to step 5 for results
      
      toast({
        title: 'Success',
        description: `✅ ${data.valid || 0} posts scheduled successfully`,
      })
    } catch (error: any) {
      console.error('❌ Error completing bulk schedule:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete bulk schedule',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
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
            {/* AI Prompt Input */}
            <div>
              <Label htmlFor="ai-prompt">AI Content Instructions</Label>
              <Textarea
                id="ai-prompt"
                placeholder="Example: Analyze the image/video and create an inspiring basketball post with player details, game highlights, and motivational message. Include relevant hashtags."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                💡 The AI will analyze each {mediaFiles.some(f => /\.(mp4|mov|avi|webm)$/i.test(f.name)) ? 'video/image' : 'image'} and generate unique content based on these instructions
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
              <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
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

            {/* Platform Selection */}
            <div>
              <Label>Target Platforms</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                {platforms.map((platform) => (
                  <div key={platform.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={platform.id}
                      checked={selectedPlatforms.includes(platform.id)}
                      onCheckedChange={() => handlePlatformToggle(platform.id)}
                    />
                    <label htmlFor={platform.id} className="text-sm font-medium cursor-pointer">
                      {platform.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Ready to post:</strong> {generatedPosts.length} posts will be published to {selectedPlatforms.length} platform(s)
              </p>
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
          </div>
        </Card>
      )}

      {/* Step 5: Results */}
      {step === 5 && results && (
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Step 5: Results
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-lg font-semibold text-green-900">Bulk schedule completed!</p>
                  <p className="text-sm text-green-700">
                    ✅ {results.valid || 0} of {results.total || 0} posts scheduled successfully
                  </p>
                </div>
              </div>
            </div>

            {results.invalid > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">
                  ⚠️ {results.invalid} post(s) had errors
                </p>
              </div>
            )}

            {results.results && results.results.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Detailed Results:</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {results.results.map((result: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        result.ok
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <p className="text-sm">
                        Post {index + 1}: {result.ok ? '✅ Success' : '❌ Failed'}
                        {result.errors && ` - ${result.errors.join(', ')}`}
                        {result.createdPostId && ` (Post ID: ${result.createdPostId})`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <Button onClick={handleReset} variant="outline">
                Schedule More Posts
              </Button>
              <Button onClick={() => window.location.href = '/dashboard/post'}>
                View Series
              </Button>
            </div>
          </div>
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
