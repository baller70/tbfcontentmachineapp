
'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ArrowLeft,
  Loader2,
  Download,
  Send,
  Wand2,
  Upload,
  Sparkles,
  Crop as CropIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Layers,
  Palette,
  Grid3x3,
  Droplet,
  Link as LinkIcon,
  ChevronDown,
  X,
  Video
} from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { loadImageSafely as loadImageSafelyOld, toCanvasSafeUrl, isCanvasSafeUrl } from '@/lib/image-url-validator'
import { renderTextField, renderImageField, loadImageSafely, calculateTextPosition } from '@/lib/template-renderer'
import type { TemplateField as TemplateFieldType } from '@/components/template-editor/types'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { VideoExporter } from '@/components/template-editor'

interface TemplateField {
  id: string
  fieldName: string
  fieldLabel: string
  fieldType: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  fontFamily: string
  fontColor: string
  fontWeight: string
  textAlign: string
  opacity: number
  defaultValue?: string
  isRequired: boolean
}

interface Template {
  id: string
  name: string
  description: string | null
  imageUrl: string
  width: number
  height: number
  fields: TemplateField[]
}

export default function GenerateGraphicPage({ params }: { params: { id: string } }) {
  const [template, setTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [imageFiles, setImageFiles] = useState<Record<string, File>>({})
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('')
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [showVideoExporter, setShowVideoExporter] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Visual Effects State
  const [transparency, setTransparency] = useState(100)
  const [blendMode, setBlendMode] = useState('none')
  const [selectedColor, setSelectedColor] = useState('#FF0000')
  const [workspaceColors, setWorkspaceColors] = useState(['#FF0000', '#808080', '#000000', '#FFFFFF'])
  
  // Filters
  const [filterBlackWhite, setFilterBlackWhite] = useState(false)
  const [filterRetro, setFilterRetro] = useState(false)
  const [filterSepia, setFilterSepia] = useState(false)
  const [filterVintage, setFilterVintage] = useState(false)
  const [filterPolaroid, setFilterPolaroid] = useState(false)
  
  // Effects
  const [opacity, setOpacity] = useState(100)
  const [blur, setBlur] = useState(0)
  
  // Layer ordering
  const [layerOrder, setLayerOrder] = useState('normal')

  useEffect(() => {
    fetchTemplate()
  }, [])

  // Live preview effect - updates canvas in real-time
  useEffect(() => {
    if (template) {
      renderPreview()
    }
  }, [template, formData, imagePreviews, transparency, blendMode, filterBlackWhite, filterRetro, filterSepia, filterVintage, filterPolaroid, opacity, blur])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/templates/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch template')
      const data = await response.json()
      setTemplate(data.template)
      
      // Initialize form data with default values
      const initialData: Record<string, string> = {}
      data.template.fields.forEach((field: TemplateField) => {
        initialData[field.fieldName] = field.defaultValue || ''
      })
      setFormData(initialData)
    } catch (error) {
      console.error('Error fetching template:', error)
      toast({
        title: 'Error',
        description: 'Failed to load template',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageFieldChange = (fieldName: string, file: File | null) => {
    if (!file) {
      const newImageFiles = { ...imageFiles }
      const newImagePreviews = { ...imagePreviews }
      delete newImageFiles[fieldName]
      delete newImagePreviews[fieldName]
      setImageFiles(newImageFiles)
      setImagePreviews(newImagePreviews)
      return
    }

    setImageFiles({ ...imageFiles, [fieldName]: file })
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreviews({ ...imagePreviews, [fieldName]: e.target?.result as string })
    }
    reader.readAsDataURL(file)
  }

  const uploadImageField = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) throw new Error('Upload failed')
    const data = await response.json()
    return data.url
  }

  // Apply filters to canvas
  const applyFilters = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!filterBlackWhite && !filterRetro && !filterSepia && !filterVintage && !filterPolaroid && blur === 0) {
      return
    }

    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      if (filterBlackWhite) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        data[i] = data[i + 1] = data[i + 2] = gray
      } else if (filterSepia) {
        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189)
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168)
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131)
      } else if (filterRetro) {
        data[i] = Math.min(255, r * 1.2)
        data[i + 1] = Math.min(255, g * 0.9)
        data[i + 2] = Math.min(255, b * 0.8)
      } else if (filterVintage) {
        data[i] = Math.min(255, r * 0.9 + 40)
        data[i + 1] = Math.min(255, g * 0.85 + 30)
        data[i + 2] = Math.min(255, b * 0.7 + 10)
      } else if (filterPolaroid) {
        data[i] = Math.min(255, r * 1.1 + 20)
        data[i + 1] = Math.min(255, g * 1.05 + 15)
        data[i + 2] = Math.min(255, b * 0.95 + 10)
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }

  // Live preview function - renders canvas with current form data
  const renderPreview = async () => {
    if (!template || !canvasRef.current) {
      console.log('Preview skipped - missing template or canvas ref', { 
        hasTemplate: !!template, 
        hasCanvasRef: !!canvasRef.current 
      })
      return
    }

    // Clear any previous errors
    setPreviewError(null)

    try {
      console.log('Starting preview render for template:', template.id, {
        width: template.width,
        height: template.height,
        imageUrl: template.imageUrl
      })

      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        const errorMsg = 'Failed to get canvas context'
        console.error(errorMsg)
        setPreviewError(errorMsg)
        return
      }

      // Set canvas dimensions (internal resolution)
      canvas.width = template.width
      canvas.height = template.height
      
      // Set canvas display size (CSS) to maintain aspect ratio
      const aspectRatio = template.height / template.width
      const displayHeight = canvas.clientWidth * aspectRatio
      canvas.style.height = `${displayHeight}px`
      
      console.log('Canvas dimensions set:', {
        internalWidth: canvas.width,
        internalHeight: canvas.height,
        displayWidth: canvas.clientWidth,
        displayHeight: displayHeight
      })

      // Clear canvas with white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Apply global transparency and blend mode
      ctx.globalAlpha = transparency / 100
      if (blendMode !== 'none') {
        ctx.globalCompositeOperation = blendMode as GlobalCompositeOperation
      }

      // Load and draw template background image
      console.log('Loading template image from:', `/api/templates/${template.id}/image`)
      try {
        const img = await loadImageSafely(`/api/templates/${template.id}/image`)
        console.log('Template image loaded successfully, dimensions:', img.width, 'x', img.height)
        ctx.drawImage(img, 0, 0, template.width, template.height)
        console.log('Template background drawn')
      } catch (imgError) {
        console.error('Failed to load template image:', imgError)
        // Draw a placeholder with template info
        ctx.fillStyle = '#f3f4f6'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#6b7280'
        ctx.font = '20px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('Template Image Loading...', canvas.width / 2, canvas.height / 2)
        throw new Error(`Failed to load template image: ${imgError}`)
      }

      // Apply blur if needed
      if (blur > 0) {
        ctx.filter = `blur(${blur}px)`
      }

      // Draw fields using shared renderer for consistent positioning
      for (const field of template.fields) {
        // Convert to TemplateFieldType with defaults and apply preview opacity
        const typedField = {
          ...field,
          opacity: (field.opacity || 1.0) * (opacity / 100),
          rotation: (field as any).rotation || 0,
          zIndex: (field as any).zIndex || 0,
          letterSpacing: (field as any).letterSpacing || 0,
          lineHeight: (field as any).lineHeight || 1.2,
          textTransform: (field as any).textTransform || 'none',
          shadowEnabled: (field as any).shadowEnabled || false,
          shadowColor: (field as any).shadowColor || '#000000',
          shadowBlur: (field as any).shadowBlur || 4,
          shadowOffsetX: (field as any).shadowOffsetX || 2,
          shadowOffsetY: (field as any).shadowOffsetY || 2,
          borderRadius: (field as any).borderRadius || 0,
          borderWidth: (field as any).borderWidth || 0,
          borderColor: (field as any).borderColor || '#000000',
          blendMode: (field as any).blendMode || 'normal',
          effectIntensity: (field as any).effectIntensity || 50,
        } as TemplateFieldType

        if (field.fieldType === 'image' || field.fieldType === 'logo') {
          const imagePreview = imagePreviews[field.fieldName]
          if (imagePreview) {
            await renderImageField(ctx, typedField, imagePreview, template.id)
          }
        } else {
          const value = formData[field.fieldName]
          if (value) {
            renderTextField(ctx, typedField, value)
          }
        }
      }

      // Reset filter
      ctx.filter = 'none'

      // Apply color filters
      applyFilters(ctx, template.width, template.height)
      
      console.log('Preview rendered successfully')
    } catch (error) {
      console.error('Error rendering preview:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to render preview'
      setPreviewError(errorMessage)
      toast({
        title: 'Preview Error',
        description: errorMessage,
        variant: 'destructive'
      })
    }
  }

  const generateGraphic = async () => {
    if (!template || !canvasRef.current) return

    // Validate required fields
    const missingFields = template.fields
      .filter(field => field.isRequired && !formData[field.fieldName] && field.fieldType !== 'image')
      .map(field => field.fieldLabel)
    
    const missingImages = template.fields
      .filter(field => field.isRequired && field.fieldType === 'image' && !imageFiles[field.fieldName])
      .map(field => field.fieldLabel)

    if (missingFields.length > 0 || missingImages.length > 0) {
      toast({
        title: 'Missing required fields',
        description: `Please fill in: ${[...missingFields, ...missingImages].join(', ')}`,
        variant: 'destructive'
      })
      return
    }

    setIsGenerating(true)

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context not available')

      // Set canvas dimensions
      canvas.width = template.width
      canvas.height = template.height

      // Load and draw template image using safe loader (auto-handles CORS & proxy)
      const img = await loadImageSafely(`/api/templates/${template.id}/image`)
      ctx.drawImage(img, 0, 0, template.width, template.height)

      // Draw fields using shared renderer for consistent positioning
      for (const field of template.fields) {
        // Convert to TemplateFieldType with defaults for missing properties
        const typedField = {
          ...field,
          rotation: (field as any).rotation || 0,
          zIndex: (field as any).zIndex || 0,
          letterSpacing: (field as any).letterSpacing || 0,
          lineHeight: (field as any).lineHeight || 1.2,
          textTransform: (field as any).textTransform || 'none',
          shadowEnabled: (field as any).shadowEnabled || false,
          shadowColor: (field as any).shadowColor || '#000000',
          shadowBlur: (field as any).shadowBlur || 4,
          shadowOffsetX: (field as any).shadowOffsetX || 2,
          shadowOffsetY: (field as any).shadowOffsetY || 2,
          borderRadius: (field as any).borderRadius || 0,
          borderWidth: (field as any).borderWidth || 0,
          borderColor: (field as any).borderColor || '#000000',
          blendMode: (field as any).blendMode || 'normal',
          effectIntensity: (field as any).effectIntensity || 50,
        } as TemplateFieldType

        if (field.fieldType === 'image' || field.fieldType === 'logo') {
          // Draw image field using shared renderer
          const imagePreview = imagePreviews[field.fieldName]
          if (imagePreview) {
            await renderImageField(ctx, typedField, imagePreview, template.id)
          }
        } else {
          // Draw text field using shared renderer
          const value = formData[field.fieldName]
          if (!value) continue
          renderTextField(ctx, typedField, value)
        }
      }

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Failed to generate image')

        // Upload generated image
        const uploadFormData = new FormData()
        uploadFormData.append('file', blob, 'generated-graphic.png')

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        })

        if (!uploadResponse.ok) throw new Error('Upload failed')

        const uploadData = await uploadResponse.json()
        setGeneratedImageUrl(uploadData.url)

        // Save to database
        await fetch('/api/graphics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            templateId: template.id,
            name: `${template.name} - ${new Date().toLocaleDateString()}`,
            imageUrl: uploadData.url,
            formData: formData,
            width: template.width,
            height: template.height
          })
        })

        toast({
          title: 'Success!',
          description: 'Graphic generated successfully'
        })
      }, 'image/png')
    } catch (error) {
      console.error('Error generating graphic:', error)
      toast({
        title: 'Error',
        description: 'Failed to generate graphic',
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadGraphic = () => {
    if (!canvasRef.current) return
    
    const link = document.createElement('a')
    link.download = `${template?.name || 'graphic'}.png`
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  const schedulePost = () => {
    if (!generatedImageUrl) return
    
    const params = new URLSearchParams({
      imageUrl: generatedImageUrl,
      content: `Generated from ${template?.name}`,
      source: 'template'
    })
    
    router.push(`/dashboard/schedule?${params.toString()}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Template not found</p>
        <Link href="/dashboard/templates">
          <Button className="mt-4">Back to Templates</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/templates">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generate Graphic</h1>
          <p className="text-gray-600">{template.name}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:gap-6 lg:grid-cols-2">
        {/* Form - Mobile Optimized */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Fill Template Data</CardTitle>
            <CardDescription className="text-sm">Enter values for each field</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            {/* Group fields by type for better organization, sorted by Y position (top-to-bottom) */}
            {(() => {
              // Sort by Y position for logical top-to-bottom form flow
              const sortByPosition = (a: TemplateField, b: TemplateField) => a.y - b.y
              const textFields = template.fields.filter(f => f.fieldType === 'text' || f.fieldType === 'number').sort(sortByPosition)
              const imageFields = template.fields.filter(f => f.fieldType === 'image' || f.fieldType === 'logo').sort(sortByPosition)
              const otherFields = template.fields.filter(f => !['text', 'number', 'image', 'logo'].includes(f.fieldType)).sort(sortByPosition)

              return (
                <>
                  {/* Text Fields Section */}
                  {textFields.length > 0 && (
                    <Collapsible defaultOpen className="border rounded-lg">
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 sm:p-4 hover:bg-gray-50 rounded-t-lg">
                        <span className="font-medium text-sm sm:text-base">Text Fields ({textFields.length})</span>
                        <ChevronDown className="w-4 h-4 transition-transform" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-3 sm:p-4 pt-0 space-y-3">
                        {textFields.map((field) => (
                          <div key={field.id} className="space-y-1.5">
                            <Label htmlFor={field.fieldName} className="text-sm font-medium">
                              {field.fieldLabel}
                              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            <Input
                              id={field.fieldName}
                              type={field.fieldType}
                              value={formData[field.fieldName] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.fieldName]: e.target.value })}
                              placeholder={field.defaultValue || `Enter ${field.fieldLabel.toLowerCase()}`}
                              required={field.isRequired}
                              className="h-11 sm:h-10 text-base sm:text-sm"
                            />
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Image Fields Section */}
                  {imageFields.length > 0 && (
                    <Collapsible defaultOpen className="border rounded-lg">
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 sm:p-4 hover:bg-gray-50 rounded-t-lg">
                        <span className="font-medium text-sm sm:text-base">Images ({imageFields.length})</span>
                        <ChevronDown className="w-4 h-4 transition-transform" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-3 sm:p-4 pt-0 space-y-3">
                        {imageFields.map((field) => (
                          <div key={field.id} className="space-y-1.5">
                            <Label className="text-sm font-medium">
                              {field.fieldLabel}
                              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            {imagePreviews[field.fieldName] ? (
                              <div className="space-y-2">
                                <div className="relative w-full h-24 sm:h-32 bg-gray-100 rounded-lg overflow-hidden">
                                  <img src={imagePreviews[field.fieldName]} alt={field.fieldLabel} className="w-full h-full object-contain" />
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={() => handleImageFieldChange(field.fieldName, null)} className="w-full sm:w-auto">
                                  Remove Image
                                </Button>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center active:bg-gray-50 transition-colors">
                                <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageFieldChange(field.fieldName, file) }} className="hidden" id={`image-${field.fieldName}`} />
                                <label htmlFor={`image-${field.fieldName}`} className="cursor-pointer block">
                                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                  <p className="text-sm text-gray-600">Tap to upload image</p>
                                </label>
                              </div>
                            )}
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Other Fields Section */}
                  {otherFields.length > 0 && (
                    <Collapsible defaultOpen className="border rounded-lg">
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 sm:p-4 hover:bg-gray-50 rounded-t-lg">
                        <span className="font-medium text-sm sm:text-base">Other Fields ({otherFields.length})</span>
                        <ChevronDown className="w-4 h-4 transition-transform" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-3 sm:p-4 pt-0 space-y-3">
                        {otherFields.map((field) => (
                          <div key={field.id} className="space-y-1.5">
                            <Label htmlFor={field.fieldName} className="text-sm font-medium">
                              {field.fieldLabel}
                              {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            <Input
                              id={field.fieldName}
                              type="text"
                              value={formData[field.fieldName] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.fieldName]: e.target.value })}
                              placeholder={field.defaultValue || `Enter ${field.fieldLabel.toLowerCase()}`}
                              required={field.isRequired}
                              className="h-11 sm:h-10 text-base sm:text-sm"
                            />
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </>
              )
            })()}

            <Button onClick={generateGraphic} disabled={isGenerating} className="w-full mt-4 h-12 sm:h-10 text-base sm:text-sm">
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2" />Generate Graphic</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Your generated graphic with visual effects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Visual Effects Toolbar */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border flex-wrap">
                {/* Effects Button */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Sparkles className="w-4 h-4" />
                      Effects
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-4">
                      {/* Filters */}
                      <Collapsible defaultOpen>
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded">
                          <span className="font-medium">Filters</span>
                          <ChevronDown className="w-4 h-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-2 pt-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="bw" 
                              checked={filterBlackWhite}
                              onCheckedChange={(checked) => setFilterBlackWhite(checked as boolean)}
                            />
                            <Label htmlFor="bw" className="cursor-pointer">Black & white</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="retro"
                              checked={filterRetro}
                              onCheckedChange={(checked) => setFilterRetro(checked as boolean)}
                            />
                            <Label htmlFor="retro" className="cursor-pointer">Retro</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="sepia"
                              checked={filterSepia}
                              onCheckedChange={(checked) => setFilterSepia(checked as boolean)}
                            />
                            <Label htmlFor="sepia" className="cursor-pointer">Sepia</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="vintage"
                              checked={filterVintage}
                              onCheckedChange={(checked) => setFilterVintage(checked as boolean)}
                            />
                            <Label htmlFor="vintage" className="cursor-pointer">Vintage</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="polaroid"
                              checked={filterPolaroid}
                              onCheckedChange={(checked) => setFilterPolaroid(checked as boolean)}
                            />
                            <Label htmlFor="polaroid" className="cursor-pointer">Polaroid</Label>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Opacity */}
                      <Collapsible defaultOpen>
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded">
                          <span className="font-medium">Opacity</span>
                          <ChevronDown className="w-4 h-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{opacity}%</span>
                            </div>
                            <Slider 
                              value={[opacity]} 
                              onValueChange={(value) => setOpacity(value[0])}
                              min={0}
                              max={100}
                              step={1}
                            />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Blur */}
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded">
                          <span className="font-medium">Blur</span>
                          <ChevronDown className="w-4 h-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{blur}%</span>
                            </div>
                            <Slider 
                              value={[blur]} 
                              onValueChange={(value) => setBlur(value[0])}
                              min={0}
                              max={20}
                              step={1}
                            />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Transparency */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Droplet className="w-4 h-4" />
                      Transparency
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Transparency</Label>
                        <Input 
                          type="number" 
                          value={transparency} 
                          onChange={(e) => setTransparency(Number(e.target.value))}
                          className="w-20 h-8"
                          min={0}
                          max={100}
                        />
                      </div>
                      <Slider 
                        value={[transparency]} 
                        onValueChange={(value) => setTransparency(value[0])}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Color Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <div 
                        className="w-4 h-4 rounded border border-gray-300" 
                        style={{ backgroundColor: selectedColor }}
                      />
                      Color
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Workspace colors</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {workspaceColors.map((color, idx) => (
                            <button
                              key={idx}
                              className="w-full h-12 rounded border-2 hover:border-gray-400 transition-colors"
                              style={{ backgroundColor: color }}
                              onClick={() => setSelectedColor(color)}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Custom color</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={selectedColor}
                            onChange={(e) => setSelectedColor(e.target.value)}
                            placeholder="#A4A1A1"
                          />
                          <input 
                            type="color" 
                            value={selectedColor}
                            onChange={(e) => setSelectedColor(e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer border"
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Crop */}
                <Button variant="outline" size="sm" className="gap-2">
                  <CropIcon className="w-4 h-4" />
                  Crop
                </Button>

                {/* Align */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <AlignCenter className="w-4 h-4" />
                      Align
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="start">
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <AlignLeft className="w-4 h-4" />
                          Left
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <AlignCenter className="w-4 h-4" />
                          Center
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <AlignRight className="w-4 h-4" />
                          Right
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <AlignVerticalJustifyStart className="w-4 h-4" />
                          Top
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <AlignVerticalJustifyCenter className="w-4 h-4" />
                          Middle
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <AlignVerticalJustifyEnd className="w-4 h-4" />
                          Bottom
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Arrange/Layers */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Layers className="w-4 h-4" />
                      Arrange
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-60" align="start">
                    <div className="space-y-1">
                      <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                        ↑ Bring to front
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                        ↑ Bring forward
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                        ↓ Send backward
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                        ↓ Send to back
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Blend Mode */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Grid3x3 className="w-4 h-4" />
                      Blend
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-60" align="start">
                    <div className="space-y-2">
                      <Label>Blend Mode</Label>
                      <Select value={blendMode} onValueChange={setBlendMode}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="multiply">Multiply</SelectItem>
                          <SelectItem value="screen">Screen</SelectItem>
                          <SelectItem value="overlay">Overlay</SelectItem>
                          <SelectItem value="darken">Darken</SelectItem>
                          <SelectItem value="lighten">Lighten</SelectItem>
                          <SelectItem value="color-dodge">Add</SelectItem>
                          <SelectItem value="color-burn">Subtract</SelectItem>
                          <SelectItem value="difference">Diff</SelectItem>
                          <SelectItem value="exclusion">Exclusion</SelectItem>
                          <SelectItem value="hue">Tint</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Canvas Preview */}
              <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden border-2 border-blue-200" style={{ minHeight: '500px' }}>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Loading template...</p>
                    </div>
                  </div>
                )}
                
                {previewError && !isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10 p-6">
                    <div className="text-center max-w-md">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                        <X className="w-6 h-6 text-red-600" />
                      </div>
                      <h3 className="font-semibold text-red-900 mb-2">Preview Error</h3>
                      <p className="text-sm text-red-700 mb-4 whitespace-pre-wrap">{previewError}</p>
                      <Button 
                        onClick={() => {
                          setPreviewError(null)
                          fetchTemplate().then(() => renderPreview())
                        }} 
                        size="sm" 
                        variant="outline"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                )}
                
                {!template && !isLoading && !previewError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-sm text-gray-500">No template selected</p>
                  </div>
                )}
                
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto min-h-[400px] bg-white"
                  style={{ display: 'block', maxWidth: '100%' }}
                />
              </div>

              {generatedImageUrl && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button onClick={downloadGraphic} variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Download PNG
                    </Button>
                    <Button onClick={() => setShowVideoExporter(true)} variant="outline" className="flex-1">
                      <Video className="w-4 h-4 mr-2" />
                      Export Video
                    </Button>
                  </div>
                  <Button onClick={schedulePost} className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Schedule Post
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Video Exporter Dialog */}
      <VideoExporter
        canvasRef={canvasRef}
        templateName={template?.name}
        width={template?.width || 1080}
        height={template?.height || 1080}
        fields={template?.fields || []}
        isOpen={showVideoExporter}
        onClose={() => setShowVideoExporter(false)}
      />
    </div>
  )
}
