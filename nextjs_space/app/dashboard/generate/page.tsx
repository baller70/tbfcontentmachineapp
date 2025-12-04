
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Sparkles,
  Copy,
  RefreshCw,
  Send,
  Instagram,
  Linkedin,
  Twitter,
  MessageSquare,
  Loader2,
  CheckCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface GeneratedContent {
  content: string
  isComplete: boolean
}

const contentTypes = [
  { id: 'post', label: 'Social Media Post', description: 'Complete post with engaging content' },
  { id: 'caption', label: 'Caption', description: 'Caption for images or videos' },
  { id: 'hashtags', label: 'Hashtags', description: 'Relevant hashtags for better reach' }
]

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

const tones = [
  'professional', 'casual', 'friendly', 'energetic', 'inspiring', 
  'humorous', 'informative', 'conversational', 'motivational'
]

const topics = [
  'Technology', 'Business', 'Marketing', 'Lifestyle', 'Health & Wellness',
  'Education', 'Travel', 'Food', 'Fashion', 'Entertainment', 'Sports',
  'Personal Development', 'Finance', 'Productivity', 'Innovation'
]

export default function GenerateContentPage() {
  const [prompt, setPrompt] = useState('')
  const [contentType, setContentType] = useState('post')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent>({ content: '', isComplete: false })
  const [error, setError] = useState('')
  const { toast } = useToast()

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }

  const generateContent = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }

    setIsGenerating(true)
    setGeneratedContent({ content: '', isComplete: false })
    setError('')

    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          contentType,
          platform: selectedPlatforms.length === 1 ? selectedPlatforms[0] : null,
          topic: topic && topic !== 'no-topic' ? topic : null,
          tone: tone && tone !== 'no-tone' ? tone : null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate content')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let partialRead = ''

      while (true) {
        const { done, value } = await reader?.read() ?? { done: true, value: undefined }
        if (done) break

        partialRead += decoder.decode(value, { stream: true })
        let lines = partialRead.split('\n')
        partialRead = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              return
            }
            
            try {
              const parsed = JSON.parse(data)
              if (parsed.status === 'streaming') {
                buffer += parsed.content
                setGeneratedContent({ content: buffer, isComplete: false })
              } else if (parsed.status === 'completed') {
                setGeneratedContent({ content: parsed.content, isComplete: true })
                toast({
                  title: 'Content Generated!',
                  description: 'Your content is ready to use.',
                })
                return
              } else if (parsed.status === 'error') {
                throw new Error(parsed.message || 'Generation failed')
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Generation error:', error)
      setError('Failed to generate content. Please try again.')
      toast({
        title: 'Error',
        description: 'Failed to generate content. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: 'Copied!',
        description: 'Content copied to clipboard.',
      })
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const createPost = () => {
    if (!generatedContent.content) return
    
    // Navigate to schedule page with generated content
    const params = new URLSearchParams({
      content: generatedContent.content,
      platforms: selectedPlatforms.join(','),
      topic: topic || '',
      contentType
    })
    
    window.location.href = `/dashboard/schedule?${params.toString()}`
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Generate Content</h1>
        <p className="text-gray-600">Create engaging social media content with AI assistance</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
              Content Generator
            </CardTitle>
            <CardDescription>
              Describe what you want to create and customize the settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Prompt */}
            <div className="space-y-2">
              <Label htmlFor="prompt">What would you like to create? *</Label>
              <Textarea
                id="prompt"
                placeholder="E.g., Write a motivational post about overcoming challenges in business..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Content Type */}
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-500">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Platforms */}
            <div className="space-y-2">
              <Label>Target Platforms (Optional)</Label>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => (
                  <div
                    key={platform.id}
                    className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer transition-colors ${
                      selectedPlatforms.includes(platform.id)
                        ? 'bg-blue-50 border-blue-300'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handlePlatformToggle(platform.id)}
                  >
                    <platform.icon className="w-4 h-4" />
                    <span className="text-sm">{platform.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Select platforms to optimize content for specific audiences
              </p>
            </div>

            {/* Topic */}
            <div className="space-y-2">
              <Label htmlFor="topic">Topic (Optional)</Label>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a topic..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-topic">No specific topic</SelectItem>
                  {topics.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <Label htmlFor="tone">Tone (Optional)</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a tone..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-tone">Natural tone</SelectItem>
                  {tones.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={generateContent} 
              disabled={isGenerating || !prompt.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Content */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated Content</span>
              {generatedContent.content && (
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(generatedContent.content)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateContent}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardTitle>
            <CardDescription>
              Your AI-generated content will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating && !generatedContent.content ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                  <p className="text-gray-600">Generating your content...</p>
                </div>
              </div>
            ) : generatedContent.content ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans">
                    {generatedContent.content}
                  </pre>
                </div>
                
                {generatedContent.isComplete && (
                  <div className="flex items-center space-x-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Content generation complete</span>
                  </div>
                )}

                {selectedPlatforms.length > 0 && (
                  <div className="space-y-2">
                    <Label>Target Platforms:</Label>
                    <div className="flex flex-wrap gap-1">
                      {selectedPlatforms.map((platformId) => {
                        const platform = platforms.find(p => p.id === platformId)
                        return (
                          <Badge key={platformId} variant="secondary" className="text-xs">
                            {platform?.label}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button onClick={createPost} className="flex-1">
                    <Send className="w-4 h-4 mr-2" />
                    Create Post
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => copyToClipboard(generatedContent.content)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>Click "Generate Content" to create your post</p>
                <p className="text-sm">AI will craft engaging content based on your prompt</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
