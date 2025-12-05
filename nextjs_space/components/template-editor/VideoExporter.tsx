'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Video, Download, Loader2, Play, Pause, X } from 'lucide-react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL, fetchFile } from '@ffmpeg/util'

interface VideoExporterProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
  templateName?: string
  width: number
  height: number
  fields: Array<{
    id: string
    fieldType: string
    animation?: string
  }>
  onClose?: () => void
  isOpen: boolean
}

const DURATIONS = [
  { value: '3', label: '3 seconds' },
  { value: '5', label: '5 seconds' },
  { value: '10', label: '10 seconds' },
  { value: '15', label: '15 seconds' },
  { value: '30', label: '30 seconds' },
]

const FORMATS = [
  { value: 'mp4', label: 'MP4 (Best compatibility)' },
  { value: 'webm', label: 'WebM (Smaller file)' },
  { value: 'gif', label: 'GIF (Animated image)' },
]

const FPS_OPTIONS = [
  { value: '15', label: '15 FPS' },
  { value: '24', label: '24 FPS' },
  { value: '30', label: '30 FPS' },
  { value: '60', label: '60 FPS' },
]

export default function VideoExporter({
  canvasRef,
  templateName = 'video',
  width,
  height,
  fields,
  onClose,
  isOpen,
}: VideoExporterProps) {
  const [duration, setDuration] = useState('5')
  const [format, setFormat] = useState('mp4')
  const [fps, setFps] = useState('30')
  const [quality, setQuality] = useState(80)
  const [progress, setProgress] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [status, setStatus] = useState('')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  
  // Load FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      if (ffmpegRef.current) return
      
      const ffmpeg = new FFmpeg()
      ffmpegRef.current = ffmpeg
      
      ffmpeg.on('progress', ({ progress }) => {
        setProgress(Math.round(progress * 100))
      })
      
      try {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        })
        setIsLoaded(true)
      } catch (error) {
        console.error('Failed to load FFmpeg:', error)
        setStatus('Failed to load video encoder')
      }
    }
    
    if (isOpen && !isLoaded) {
      loadFFmpeg()
    }
  }, [isOpen, isLoaded])
  
  // Export video
  const exportVideo = useCallback(async () => {
    if (!canvasRef.current || !ffmpegRef.current || !isLoaded) return
    
    setIsExporting(true)
    setProgress(0)
    setStatus('Capturing frames...')
    
    try {
      const ffmpeg = ffmpegRef.current
      const canvas = canvasRef.current
      const totalFrames = parseInt(duration) * parseInt(fps)
      const frameDelay = 1000 / parseInt(fps)
      
      // Capture frames
      for (let i = 0; i < totalFrames; i++) {
        // Get frame data from canvas
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/png')
        })
        const frameData = await fetchFile(blob)
        await ffmpeg.writeFile(`frame${i.toString().padStart(5, '0')}.png`, frameData)
        
        setProgress(Math.round((i / totalFrames) * 50))
        
        // Small delay to allow animations to update
        await new Promise(r => setTimeout(r, Math.min(frameDelay, 33)))
      }
      
      setStatus('Encoding video...')
      
      // Create video from frames
      const outputName = `output.${format}`
      let ffmpegCommand: string[]
      
      if (format === 'gif') {
        ffmpegCommand = ['-framerate', fps, '-i', 'frame%05d.png', '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos`, outputName]
      } else if (format === 'webm') {
        ffmpegCommand = ['-framerate', fps, '-i', 'frame%05d.png', '-c:v', 'libvpx', '-b:v', `${quality * 10}K`, '-auto-alt-ref', '0', outputName]
      } else {
        ffmpegCommand = ['-framerate', fps, '-i', 'frame%05d.png', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', String(Math.round(51 - (quality / 2))), outputName]
      }
      
      await ffmpeg.exec(ffmpegCommand)
      
      // Read output file
      const data = await ffmpeg.readFile(outputName)
      const mimeType = format === 'gif' ? 'image/gif' : format === 'webm' ? 'video/webm' : 'video/mp4'
      const blob = new Blob([data], { type: mimeType })
      const url = URL.createObjectURL(blob)
      
      setVideoUrl(url)
      setStatus('Export complete!')
      setProgress(100)
      
      // Cleanup temp files
      for (let i = 0; i < totalFrames; i++) {
        await ffmpeg.deleteFile(`frame${i.toString().padStart(5, '0')}.png`)
      }
    } catch (error) {
      console.error('Export failed:', error)
      setStatus('Export failed. Try a shorter duration or lower quality.')
    } finally {
      setIsExporting(false)
    }
  }, [canvasRef, duration, format, fps, quality, width, isLoaded])

  // Download video
  const downloadVideo = useCallback(() => {
    if (!videoUrl) return
    const link = document.createElement('a')
    link.href = videoUrl
    link.download = `${templateName}.${format}`
    link.click()
  }, [videoUrl, templateName, format])

  // Toggle preview
  const togglePreview = useCallback(() => {
    if (!previewVideoRef.current) return
    if (isPreviewPlaying) {
      previewVideoRef.current.pause()
    } else {
      previewVideoRef.current.play()
    }
    setIsPreviewPlaying(!isPreviewPlaying)
  }, [isPreviewPlaying])

  // Cleanup
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl)
    }
  }, [videoUrl])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="bg-gray-900 border-gray-800 max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-500" />
            Export Video
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preview / Result */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
            {videoUrl ? (
              <>
                <video
                  ref={previewVideoRef}
                  src={videoUrl}
                  loop
                  className="w-full h-full object-contain"
                  onPlay={() => setIsPreviewPlaying(true)}
                  onPause={() => setIsPreviewPlaying(false)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePreview}
                  className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70"
                >
                  {isPreviewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </>
            ) : (
              <div className="text-gray-500 text-sm text-center p-4">
                {isLoaded ? 'Configure settings and click Export' : 'Loading video encoder...'}
              </div>
            )}
          </div>

          {/* Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{status}</span>
                <span className="text-gray-400">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Settings */}
          {!videoUrl && !isExporting && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-gray-400">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-400">Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FORMATS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-400">Frame Rate</Label>
                <Select value={fps} onValueChange={setFps}>
                  <SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FPS_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-xs text-gray-400">Quality</Label>
                  <span className="text-xs text-gray-500">{quality}%</span>
                </div>
                <Slider value={[quality]} min={10} max={100} step={10} onValueChange={([v]) => setQuality(v)} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {videoUrl ? (
            <>
              <Button variant="ghost" onClick={() => { setVideoUrl(null); setProgress(0); setStatus('') }}>
                <X className="w-4 h-4 mr-2" /> New Export
              </Button>
              <Button onClick={downloadVideo} className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" /> Download {format.toUpperCase()}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={exportVideo} disabled={isExporting || !isLoaded} className="bg-blue-600 hover:bg-blue-700">
                {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Video className="w-4 h-4 mr-2" />}
                {isExporting ? 'Exporting...' : 'Export Video'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

