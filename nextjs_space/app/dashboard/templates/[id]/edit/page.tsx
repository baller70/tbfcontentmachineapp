
'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  Plus,
  Upload,
  Trash2,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  Type,
  Move,
  Square,
  MousePointer,
  Check,
  X,
  Copy,
  Palette,
  Shuffle,
  Eye,
  EyeOff,
  Edit2,
  Star,
  Save,
  Wand2,
  Hash,
  Video,
  Undo,
  Redo,
  Circle
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

// Web-safe fonts that will work across all platforms
// Comprehensive font list with 100+ fonts including Google Fonts and system fonts
const FONT_FAMILIES = [
  // Popular/Essential Fonts
  { value: 'Russo One', label: 'Russo One' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Impact', label: 'Impact' },
  { value: 'Arial Black', label: 'Arial Black' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Oswald', label: 'Oswald' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Bebas Neue', label: 'Bebas Neue' },
  { value: 'Anton', label: 'Anton' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  
  // Serif Fonts
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Garamond', label: 'Garamond' },
  { value: 'Palatino', label: 'Palatino' },
  { value: 'Bookman', label: 'Bookman' },
  { value: 'Merriweather', label: 'Merriweather' },
  { value: 'PT Serif', label: 'PT Serif' },
  { value: 'Crimson Text', label: 'Crimson Text' },
  { value: 'Libre Baskerville', label: 'Libre Baskerville' },
  { value: 'EB Garamond', label: 'EB Garamond' },
  { value: 'Lora', label: 'Lora' },
  { value: 'Spectral', label: 'Spectral' },
  { value: 'Cormorant', label: 'Cormorant' },
  
  // Sans-Serif Fonts
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS' },
  { value: 'Tahoma', label: 'Tahoma' },
  { value: 'Ubuntu', label: 'Ubuntu' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Rubik', label: 'Rubik' },
  { value: 'Work Sans', label: 'Work Sans' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Barlow', label: 'Barlow' },
  { value: 'Nunito Sans', label: 'Nunito Sans' },
  { value: 'Oxygen', label: 'Oxygen' },
  { value: 'Mukta', label: 'Mukta' },
  { value: 'Quicksand', label: 'Quicksand' },
  { value: 'Karla', label: 'Karla' },
  { value: 'Hind', label: 'Hind' },
  { value: 'Cabin', label: 'Cabin' },
  { value: 'Asap', label: 'Asap' },
  { value: 'Exo 2', label: 'Exo 2' },
  { value: 'Titillium Web', label: 'Titillium Web' },
  { value: 'Fira Sans', label: 'Fira Sans' },
  
  // Display/Decorative Fonts
  { value: 'Lobster', label: 'Lobster' },
  { value: 'Pacifico', label: 'Pacifico' },
  { value: 'Righteous', label: 'Righteous' },
  { value: 'Permanent Marker', label: 'Permanent Marker' },
  { value: 'Fredoka One', label: 'Fredoka One' },
  { value: 'Archivo Black', label: 'Archivo Black' },
  { value: 'Alfa Slab One', label: 'Alfa Slab One' },
  { value: 'Bangers', label: 'Bangers' },
  { value: 'Bungee', label: 'Bungee' },
  { value: 'Fugaz One', label: 'Fugaz One' },
  { value: 'Passion One', label: 'Passion One' },
  { value: 'Righteous', label: 'Righteous' },
  { value: 'Shadows Into Light', label: 'Shadows Into Light' },
  { value: 'Satisfy', label: 'Satisfy' },
  { value: 'Great Vibes', label: 'Great Vibes' },
  { value: 'Dancing Script', label: 'Dancing Script' },
  { value: 'Kaushan Script', label: 'Kaushan Script' },
  { value: 'Amatic SC', label: 'Amatic SC' },
  { value: 'Indie Flower', label: 'Indie Flower' },
  { value: 'Caveat', label: 'Caveat' },
  
  // Condensed/Extended Fonts
  { value: 'Fjalla One', label: 'Fjalla One' },
  { value: 'Yanone Kaffeesatz', label: 'Yanone Kaffeesatz' },
  { value: 'Pathway Gothic One', label: 'Pathway Gothic One' },
  { value: 'Squada One', label: 'Squada One' },
  { value: 'Staatliches', label: 'Staatliches' },
  { value: 'Barlow Condensed', label: 'Barlow Condensed' },
  { value: 'Saira Condensed', label: 'Saira Condensed' },
  { value: 'Archivo Narrow', label: 'Archivo Narrow' },
  { value: 'Abel', label: 'Abel' },
  { value: 'Economica', label: 'Economica' },
  
  // Monospace Fonts
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Lucida Console', label: 'Lucida Console' },
  { value: 'Roboto Mono', label: 'Roboto Mono' },
  { value: 'Source Code Pro', label: 'Source Code Pro' },
  { value: 'Space Mono', label: 'Space Mono' },
  { value: 'Inconsolata', label: 'Inconsolata' },
  { value: 'IBM Plex Mono', label: 'IBM Plex Mono' },
  { value: 'Fira Mono', label: 'Fira Mono' },
  { value: 'Anonymous Pro', label: 'Anonymous Pro' },
  { value: 'Overpass Mono', label: 'Overpass Mono' },
  
  // Additional Popular Fonts
  { value: 'Comic Sans MS', label: 'Comic Sans MS' },
  { value: 'Comfortaa', label: 'Comfortaa' },
  { value: 'Zilla Slab', label: 'Zilla Slab' },
  { value: 'Bitter', label: 'Bitter' },
  { value: 'Arvo', label: 'Arvo' },
  { value: 'Slabo 27px', label: 'Slabo 27px' },
  { value: 'Dosis', label: 'Dosis' },
  { value: 'Signika', label: 'Signika' },
  { value: 'Francois One', label: 'Francois One' },
  { value: 'Kanit', label: 'Kanit' },
  { value: 'Josefin Sans', label: 'Josefin Sans' },
  { value: 'Varela Round', label: 'Varela Round' },
  { value: 'Muli', label: 'Muli' },
  { value: 'Prompt', label: 'Prompt' },
  { value: 'Noto Sans', label: 'Noto Sans' },
  { value: 'Heebo', label: 'Heebo' },
  { value: 'Libre Franklin', label: 'Libre Franklin' },
  { value: 'Bitter', label: 'Bitter' },
  { value: 'Crete Round', label: 'Crete Round' },
  { value: 'Rokkitt', label: 'Rokkitt' }
]

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
  order: number
  visible?: boolean
  imagePreview?: string
  blendMode?: string
}

interface StagingElement {
  id: string
  type: 'text' | 'number' | 'image' | 'logo' | 'video' | 'shape'
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
  content: string
  imagePreview?: string
  blendMode?: string
}

interface WorkspaceBranding {
  logoUrl: string | null
  brandColors: string[]
}

interface Template {
  id: string
  name: string
  description: string | null
  category: string
  imageUrl: string
  width: number
  height: number
  fields: TemplateField[]
  isOwner?: boolean
  isPublic?: boolean
}

// Snap-to-grid configuration
const GRID_SIZE = 10
const SNAP_THRESHOLD = 15

const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE

interface AlignmentGuide {
  type: 'vertical' | 'horizontal'
  position: number
  label: string
}

const snapToNearby = (value: number, otherValues: number[]): { snappedValue: number; guide: AlignmentGuide | null } => {
  for (const other of otherValues) {
    if (Math.abs(value - other) < SNAP_THRESHOLD) {
      return {
        snappedValue: other,
        guide: {
          type: 'vertical',
          position: other,
          label: `${Math.round(other)}px`
        }
      }
    }
  }
  return { snappedValue: value, guide: null }
}

const snapToNearbyY = (value: number, otherValues: number[]): { snappedValue: number; guide: AlignmentGuide | null } => {
  for (const other of otherValues) {
    if (Math.abs(value - other) < SNAP_THRESHOLD) {
      return {
        snappedValue: other,
        guide: {
          type: 'horizontal',
          position: other,
          label: `${Math.round(other)}px`
        }
      }
    }
  }
  return { snappedValue: value, guide: null }
}

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  const [template, setTemplate] = useState<Template | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('custom')
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageDimensions, setImageDimensions] = useState({ width: 1080, height: 1080 })
  const [fields, setFields] = useState<TemplateField[]>([])
  const [stagingElement, setStagingElement] = useState<StagingElement | null>(null)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [canvasScale, setCanvasScale] = useState(1)
  const [branding, setBranding] = useState<WorkspaceBranding>({ logoUrl: null, brandColors: [] })
  const [showBrandingCard, setShowBrandingCard] = useState(false)
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([])
  const [history, setHistory] = useState<TemplateField[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const stagingImageInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Fetch template data
  useEffect(() => {
    fetchTemplate()
    fetchBranding()
  }, [])

  // Calculate canvas scale to fit container
  useEffect(() => {
    if (containerRef.current && imageDimensions.width > 0) {
      const containerWidth = containerRef.current.clientWidth
      const maxWidth = containerWidth - 40
      const scale = Math.min(maxWidth / imageDimensions.width, 1)
      setCanvasScale(scale)
    }
  }, [imageDimensions])

  // Redraw canvas whenever fields, staging element, or selection changes
  useEffect(() => {
    drawCanvas()
  }, [fields, selectedFieldId, stagingElement, imagePreview, imageDimensions, canvasScale, alignmentGuides])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/templates/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch template')
      const data = await response.json()
      
      const tpl = data.template
      setTemplate(tpl)
      setName(tpl.name)
      setDescription(tpl.description || '')
      setCategory(tpl.category)
      setImagePreview(tpl.imageUrl)
      setImageDimensions({ width: tpl.width, height: tpl.height })
      
      // Format fields with proper typing
      const formattedFields = (tpl.fields || []).map((f: any) => ({
        id: f.id || Math.random().toString(),
        fieldName: f.fieldName,
        fieldLabel: f.fieldLabel,
        fieldType: f.fieldType,
        x: f.x,
        y: f.y,
        width: f.width || 200,
        height: f.height || 50,
        fontSize: f.fontSize || 24,
        fontFamily: f.fontFamily || 'Arial',
        fontColor: f.fontColor || '#000000',
        fontWeight: f.fontWeight || 'normal',
        textAlign: f.textAlign || 'left',
        opacity: f.opacity || 1.0,
        defaultValue: f.defaultValue || '',
        isRequired: f.isRequired || false,
        order: f.order || 0,
        visible: f.visible !== false,
        imagePreview: f.imagePreview || undefined
      }))
      setFields(formattedFields)
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

  const fetchBranding = async () => {
    try {
      const response = await fetch('/api/branding')
      if (response.ok) {
        const data = await response.json()
        // API returns { brandings: [...] }, get the default one or first one
        const defaultBranding = data.brandings?.find((b: any) => b.isDefault) || data.brandings?.[0]
        if (defaultBranding) {
          setBranding(defaultBranding)
        }
      }
    } catch (error) {
      console.error('Failed to fetch branding:', error)
    }
  }

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas || !imagePreview) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = imageDimensions.width
    canvas.height = imageDimensions.height

    const img = new window.Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, imageDimensions.width, imageDimensions.height)

      // Draw grid lines for better alignment
      ctx.save()
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.2)'
      ctx.lineWidth = 1
      const gridSpacing = 50
      
      // Vertical grid lines
      for (let x = 0; x <= imageDimensions.width; x += gridSpacing) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, imageDimensions.height)
        ctx.stroke()
      }
      
      // Horizontal grid lines
      for (let y = 0; y <= imageDimensions.height; y += gridSpacing) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(imageDimensions.width, y)
        ctx.stroke()
      }
      
      // Draw center lines (canvas center)
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      
      // Vertical center line
      ctx.beginPath()
      ctx.moveTo(imageDimensions.width / 2, 0)
      ctx.lineTo(imageDimensions.width / 2, imageDimensions.height)
      ctx.stroke()
      
      // Horizontal center line
      ctx.beginPath()
      ctx.moveTo(0, imageDimensions.height / 2)
      ctx.lineTo(imageDimensions.width, imageDimensions.height / 2)
      ctx.stroke()
      
      ctx.setLineDash([])
      ctx.restore()

      // Draw alignment guides
      if (alignmentGuides.length > 0) {
        ctx.save()
        ctx.strokeStyle = '#10b981' // Green color for alignment guides
        ctx.lineWidth = 2
        ctx.setLineDash([10, 5])
        
        alignmentGuides.forEach(guide => {
          if (guide.type === 'vertical') {
            ctx.beginPath()
            ctx.moveTo(guide.position, 0)
            ctx.lineTo(guide.position, imageDimensions.height)
            ctx.stroke()
          } else {
            ctx.beginPath()
            ctx.moveTo(0, guide.position)
            ctx.lineTo(imageDimensions.width, guide.position)
            ctx.stroke()
          }
        })
        
        ctx.setLineDash([])
        ctx.restore()
      }

      // Draw confirmed fields
      fields.forEach(field => {
        if (field.visible === false) return
        
        const isSelected = field.id === selectedFieldId
        
        if ((field.fieldType === 'image' || field.fieldType === 'logo') && field.imagePreview) {
          const fieldImg = new window.Image()
          fieldImg.onload = () => {
            ctx.save()
            ctx.globalAlpha = field.opacity || 1.0
            ctx.drawImage(fieldImg, field.x, field.y, field.width, field.height)
            ctx.restore()
            
            ctx.globalAlpha = 1
            ctx.strokeStyle = isSelected ? '#3b82f6' : 'rgba(107, 114, 128, 0.3)'
            ctx.lineWidth = isSelected ? 2 : 1
            ctx.strokeRect(field.x, field.y, field.width, field.height)
            
            ctx.fillStyle = isSelected ? '#3b82f6' : 'rgba(107, 114, 128, 0.8)'
            const labelWidth = ctx.measureText(field.fieldLabel).width + 10
            ctx.fillRect(field.x, field.y - 18, labelWidth, 18)
            ctx.fillStyle = '#ffffff'
            ctx.font = '12px Arial'
            ctx.fillText(field.fieldLabel, field.x + 5, field.y - 5)
            
            if (isSelected) {
              drawResizeHandles(ctx, field)
              drawCenterIndicator(ctx, field)
              drawDimensions(ctx, field)
            }
          }
          fieldImg.src = field.imagePreview
        } else if (field.fieldType === 'text' || field.fieldType === 'number') {
          ctx.save()
          ctx.font = `${field.fontWeight} ${field.fontSize}px ${field.fontFamily}`
          ctx.fillStyle = field.fontColor
          ctx.textAlign = field.textAlign as CanvasTextAlign
          ctx.textBaseline = 'middle'
          
          const previewText = field.defaultValue || `${field.fieldLabel}`
          const metrics = ctx.measureText(previewText)
          // Calculate actual text height using font size and metrics
          const actualTextHeight = field.fontSize * 1.2 // Approximate text height with some padding
          
          let textX = field.x
          if (field.textAlign === 'center') {
            textX = field.x + field.width / 2
          } else if (field.textAlign === 'right') {
            textX = field.x + field.width
          }
          
          const textY = field.y + actualTextHeight / 2
          ctx.fillText(previewText, textX, textY)
          ctx.restore()
          
          // Draw border with height matching the text
          ctx.strokeStyle = isSelected ? '#3b82f6' : 'rgba(107, 114, 128, 0.3)'
          ctx.lineWidth = isSelected ? 2 : 1
          ctx.strokeRect(field.x, field.y, field.width, actualTextHeight)
          
          ctx.fillStyle = isSelected ? '#3b82f6' : 'rgba(107, 114, 128, 0.8)'
          const labelWidth = ctx.measureText(field.fieldLabel).width + 10
          ctx.fillRect(field.x, field.y - 18, labelWidth, 18)
          ctx.fillStyle = '#ffffff'
          ctx.font = '12px Arial'
          ctx.fillText(field.fieldLabel, field.x + 5, field.y - 5)
          
          if (isSelected) {
            const fieldWithTextHeight = { ...field, height: actualTextHeight }
            drawResizeHandles(ctx, fieldWithTextHeight)
            drawCenterIndicator(ctx, fieldWithTextHeight)
            drawDimensions(ctx, fieldWithTextHeight)
          }
        }
      })

      // Draw staging element
      if (stagingElement) {
        if (stagingElement.type === 'image' && stagingElement.imagePreview) {
          const elemImg = new window.Image()
          elemImg.onload = () => {
            ctx.save()
            ctx.globalAlpha = stagingElement.opacity
            ctx.drawImage(elemImg, stagingElement.x, stagingElement.y, stagingElement.width, stagingElement.height)
            ctx.restore()
            
            ctx.globalAlpha = 1
            ctx.strokeStyle = '#3b82f6'
            ctx.lineWidth = 3
            ctx.strokeRect(stagingElement.x, stagingElement.y, stagingElement.width, stagingElement.height)
            
            drawResizeHandles(ctx, stagingElement)
            drawCenterIndicator(ctx, stagingElement)
            drawDimensions(ctx, stagingElement)
          }
          elemImg.src = stagingElement.imagePreview
        } else {
          ctx.save()
          ctx.font = `${stagingElement.fontWeight} ${stagingElement.fontSize}px ${stagingElement.fontFamily}`
          ctx.fillStyle = stagingElement.fontColor
          ctx.textAlign = stagingElement.textAlign as CanvasTextAlign
          ctx.textBaseline = 'middle'
          
          // Calculate actual text height
          const metrics = ctx.measureText(stagingElement.content)
          const actualTextHeight = stagingElement.fontSize * 1.2 // Approximate text height with some padding
          
          let textX = stagingElement.x
          if (stagingElement.textAlign === 'center') {
            textX = stagingElement.x + stagingElement.width / 2
          } else if (stagingElement.textAlign === 'right') {
            textX = stagingElement.x + stagingElement.width
          }
          
          const textY = stagingElement.y + actualTextHeight / 2
          ctx.fillText(stagingElement.content, textX, textY)
          ctx.restore()
          
          // Draw border with actual text height
          ctx.strokeStyle = '#3b82f6'
          ctx.lineWidth = 3
          ctx.strokeRect(stagingElement.x, stagingElement.y, stagingElement.width, actualTextHeight)
          
          // Draw resize handles, center indicator, and dimensions with actual text height
          const elementWithTextHeight = { ...stagingElement, height: actualTextHeight }
          drawResizeHandles(ctx, elementWithTextHeight)
          drawCenterIndicator(ctx, elementWithTextHeight)
          drawDimensions(ctx, elementWithTextHeight)
        }
      }
    }
    img.src = imagePreview
  }

  const drawResizeHandles = (ctx: CanvasRenderingContext2D, element: StagingElement | TemplateField) => {
    const handleSize = 10
    const handles = [
      { x: element.x, y: element.y },
      { x: element.x + element.width, y: element.y },
      { x: element.x, y: element.y + element.height },
      { x: element.x + element.width, y: element.y + element.height }
    ]
    
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    
    handles.forEach(handle => {
      ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize)
      ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize)
    })
  }

  const drawCenterIndicator = (ctx: CanvasRenderingContext2D, element: StagingElement | TemplateField) => {
    // Calculate center point
    const centerX = element.x + element.width / 2
    const centerY = element.y + element.height / 2
    const crossSize = 15
    
    ctx.save()
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.setLineDash([])
    
    // Draw horizontal line
    ctx.beginPath()
    ctx.moveTo(centerX - crossSize, centerY)
    ctx.lineTo(centerX + crossSize, centerY)
    ctx.stroke()
    
    // Draw vertical line
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - crossSize)
    ctx.lineTo(centerX, centerY + crossSize)
    ctx.stroke()
    
    // Draw center circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#3b82f6'
    ctx.fill()
    
    ctx.restore()
  }

  const drawDimensions = (ctx: CanvasRenderingContext2D, element: StagingElement | TemplateField) => {
    ctx.save()
    ctx.fillStyle = 'rgba(59, 130, 246, 0.9)'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    const width = Math.round(element.width)
    const height = Math.round(element.height)
    const centerX = element.x + element.width / 2
    const centerY = element.y + element.height / 2
    
    // Draw width measurement at top
    const widthText = `W: ${width}px`
    const widthTextWidth = ctx.measureText(widthText).width + 10
    ctx.fillStyle = 'rgba(59, 130, 246, 0.95)'
    ctx.fillRect(centerX - widthTextWidth / 2, element.y - 30, widthTextWidth, 18)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(widthText, centerX, element.y - 21)
    
    // Draw height measurement on right
    const heightText = `H: ${height}px`
    const heightTextWidth = ctx.measureText(heightText).width + 10
    ctx.fillStyle = 'rgba(59, 130, 246, 0.95)'
    ctx.fillRect(element.x + element.width + 10, centerY - 9, heightTextWidth, 18)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(heightText, element.x + element.width + 10 + heightTextWidth / 2, centerY)
    
    // Draw position (x, y) at bottom
    const posText = `X: ${Math.round(element.x)} Y: ${Math.round(element.y)}`
    const posTextWidth = ctx.measureText(posText).width + 10
    ctx.fillStyle = 'rgba(59, 130, 246, 0.95)'
    ctx.fillRect(centerX - posTextWidth / 2, element.y + element.height + 12, posTextWidth, 18)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(posText, centerX, element.y + element.height + 21)
    
    ctx.restore()
  }

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = imageDimensions.width / rect.width
    const scaleY = imageDimensions.height / rect.height
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e)

    // Check if clicking on staging element
    if (stagingElement) {
      const handle = getResizeHandleAt(coords, stagingElement)
      if (handle) {
        setResizeHandle(handle)
        return
      }
      
      if (isInsideElement(coords, stagingElement)) {
        setDragOffset({
          x: coords.x - stagingElement.x,
          y: coords.y - stagingElement.y
        })
        return
      }
    }

    // Check if clicking on existing field
    const clickedField = [...fields].reverse().find(f => 
      f.visible !== false && isInsideElement(coords, f)
    )

    if (clickedField) {
      const handle = getResizeHandleAt(coords, clickedField)
      if (handle) {
        setResizeHandle(handle)
        setSelectedFieldId(clickedField.id)
        return
      }
      
      setSelectedFieldId(clickedField.id)
      setDragOffset({
        x: coords.x - clickedField.x,
        y: coords.y - clickedField.y
      })
      return
    }

    setSelectedFieldId(null)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e)

    if (resizeHandle && stagingElement) {
      const newElement = { ...stagingElement }
      
      if (resizeHandle === 'nw') {
        const deltaX = coords.x - newElement.x
        const deltaY = coords.y - newElement.y
        newElement.x = snapToGrid(coords.x)
        newElement.y = snapToGrid(coords.y)
        newElement.width = Math.max(50, newElement.width - deltaX)
        newElement.height = Math.max(30, newElement.height - deltaY)
      } else if (resizeHandle === 'ne') {
        const deltaY = coords.y - newElement.y
        newElement.y = snapToGrid(coords.y)
        newElement.width = Math.max(50, snapToGrid(coords.x - newElement.x))
        newElement.height = Math.max(30, newElement.height - deltaY)
      } else if (resizeHandle === 'sw') {
        const deltaX = coords.x - newElement.x
        newElement.x = snapToGrid(coords.x)
        newElement.width = Math.max(50, newElement.width - deltaX)
        newElement.height = Math.max(30, snapToGrid(coords.y - newElement.y))
      } else if (resizeHandle === 'se') {
        newElement.width = Math.max(50, snapToGrid(coords.x - newElement.x))
        newElement.height = Math.max(30, snapToGrid(coords.y - newElement.y))
      }
      
      setStagingElement(newElement)
    } else if (resizeHandle && selectedFieldId) {
      const fieldIndex = fields.findIndex(f => f.id === selectedFieldId)
      if (fieldIndex !== -1) {
        const newFields = [...fields]
        const field = { ...newFields[fieldIndex] }
        
        if (resizeHandle === 'nw') {
          const deltaX = coords.x - field.x
          const deltaY = coords.y - field.y
          field.x = snapToGrid(coords.x)
          field.y = snapToGrid(coords.y)
          field.width = Math.max(50, field.width - deltaX)
          field.height = Math.max(30, field.height - deltaY)
        } else if (resizeHandle === 'ne') {
          const deltaY = coords.y - field.y
          field.y = snapToGrid(coords.y)
          field.width = Math.max(50, snapToGrid(coords.x - field.x))
          field.height = Math.max(30, field.height - deltaY)
        } else if (resizeHandle === 'sw') {
          const deltaX = coords.x - field.x
          field.x = snapToGrid(coords.x)
          field.width = Math.max(50, field.width - deltaX)
          field.height = Math.max(30, snapToGrid(coords.y - field.y))
        } else if (resizeHandle === 'se') {
          field.width = Math.max(50, snapToGrid(coords.x - field.x))
          field.height = Math.max(30, snapToGrid(coords.y - field.y))
        }
        
        newFields[fieldIndex] = field
        setFields(newFields)
      }
    } else if (dragOffset && stagingElement) {
      // Get alignment values from other elements (edges and centers)
      const otherXValues: number[] = []
      const otherYValues: number[] = []
      fields.forEach(f => {
        const fHeight = getElementActualHeight(f)
        otherXValues.push(f.x, f.x + f.width, f.x + f.width / 2)
        otherYValues.push(f.y, f.y + fHeight, f.y + fHeight / 2)
      })
      // Add canvas centers
      otherXValues.push(imageDimensions.width / 2)
      otherYValues.push(imageDimensions.height / 2)
      
      const stagingHeight = getElementActualHeight(stagingElement)
      let newX = Math.max(0, Math.min(coords.x - dragOffset.x, imageDimensions.width - stagingElement.width))
      let newY = Math.max(0, Math.min(coords.y - dragOffset.y, imageDimensions.height - stagingHeight))
      
      // Apply snapping and collect guides
      const guides: AlignmentGuide[] = []
      
      // Snap X position
      const leftSnap = snapToNearby(newX, otherXValues)
      const rightSnap = snapToNearby(newX + stagingElement.width, otherXValues)
      const centerXSnap = snapToNearby(newX + stagingElement.width / 2, otherXValues)
      
      if (leftSnap.guide) {
        newX = leftSnap.snappedValue
        guides.push(leftSnap.guide)
      } else if (rightSnap.guide) {
        newX = rightSnap.snappedValue - stagingElement.width
        guides.push(rightSnap.guide)
      } else if (centerXSnap.guide) {
        newX = centerXSnap.snappedValue - stagingElement.width / 2
        guides.push(centerXSnap.guide)
      } else {
        newX = snapToGrid(newX)
      }
      
      // Snap Y position
      const topSnap = snapToNearbyY(newY, otherYValues)
      const bottomSnap = snapToNearbyY(newY + stagingHeight, otherYValues)
      const centerYSnap = snapToNearbyY(newY + stagingHeight / 2, otherYValues)
      
      if (topSnap.guide) {
        newY = topSnap.snappedValue
        guides.push(topSnap.guide)
      } else if (bottomSnap.guide) {
        newY = bottomSnap.snappedValue - stagingHeight
        guides.push(bottomSnap.guide)
      } else if (centerYSnap.guide) {
        newY = centerYSnap.snappedValue - stagingHeight / 2
        guides.push(centerYSnap.guide)
      } else {
        newY = snapToGrid(newY)
      }
      
      setAlignmentGuides(guides)
      setStagingElement({
        ...stagingElement,
        x: newX,
        y: newY
      })
    } else if (dragOffset && selectedFieldId) {
      const fieldIndex = fields.findIndex(f => f.id === selectedFieldId)
      if (fieldIndex !== -1) {
        const newFields = [...fields]
        const field = { ...newFields[fieldIndex] }
        
        // Get alignment values from other elements (excluding current field)
        const otherXValues: number[] = []
        const otherYValues: number[] = []
        fields.filter(f => f.id !== selectedFieldId).forEach(f => {
          const fHeight = getElementActualHeight(f)
          otherXValues.push(f.x, f.x + f.width, f.x + f.width / 2)
          otherYValues.push(f.y, f.y + fHeight, f.y + fHeight / 2)
        })
        // Add canvas centers
        otherXValues.push(imageDimensions.width / 2)
        otherYValues.push(imageDimensions.height / 2)
        
        const fieldHeight = getElementActualHeight(field)
        let newX = Math.max(0, Math.min(coords.x - dragOffset.x, imageDimensions.width - field.width))
        let newY = Math.max(0, Math.min(coords.y - dragOffset.y, imageDimensions.height - fieldHeight))
        
        // Apply snapping and collect guides
        const guides: AlignmentGuide[] = []
        
        // Snap X position
        const leftSnap = snapToNearby(newX, otherXValues)
        const rightSnap = snapToNearby(newX + field.width, otherXValues)
        const centerXSnap = snapToNearby(newX + field.width / 2, otherXValues)
        
        if (leftSnap.guide) {
          newX = leftSnap.snappedValue
          guides.push(leftSnap.guide)
        } else if (rightSnap.guide) {
          newX = rightSnap.snappedValue - field.width
          guides.push(rightSnap.guide)
        } else if (centerXSnap.guide) {
          newX = centerXSnap.snappedValue - field.width / 2
          guides.push(centerXSnap.guide)
        } else {
          newX = snapToGrid(newX)
        }
        
        // Snap Y position
        const topSnap = snapToNearbyY(newY, otherYValues)
        const bottomSnap = snapToNearbyY(newY + fieldHeight, otherYValues)
        const centerYSnap = snapToNearbyY(newY + fieldHeight / 2, otherYValues)
        
        if (topSnap.guide) {
          newY = topSnap.snappedValue
          guides.push(topSnap.guide)
        } else if (bottomSnap.guide) {
          newY = bottomSnap.snappedValue - fieldHeight
          guides.push(bottomSnap.guide)
        } else if (centerYSnap.guide) {
          newY = centerYSnap.snappedValue - fieldHeight / 2
          guides.push(centerYSnap.guide)
        } else {
          newY = snapToGrid(newY)
        }
        
        setAlignmentGuides(guides)
        field.x = newX
        field.y = newY
        
        newFields[fieldIndex] = field
        setFields(newFields)
      }
    }
  }

  const handleCanvasMouseUp = () => {
    setDragOffset(null)
    setResizeHandle(null)
    setAlignmentGuides([]) // Clear alignment guides when mouse is released
  }

  // Helper function to get actual height for a field
  const getElementActualHeight = (element: StagingElement | TemplateField) => {
    const elementType = 'type' in element ? element.type : element.fieldType
    if (elementType === 'text' || elementType === 'number') {
      return element.fontSize * 1.2 // Match the rendering logic
    }
    return element.height
  }

  const isInsideElement = (point: { x: number; y: number }, element: StagingElement | TemplateField) => {
    const elementHeight = getElementActualHeight(element)
    return (
      point.x >= element.x &&
      point.x <= element.x + element.width &&
      point.y >= element.y &&
      point.y <= element.y + elementHeight
    )
  }

  const getResizeHandleAt = (point: { x: number; y: number }, element: StagingElement | TemplateField) => {
    const handleSize = 15
    const elementHeight = getElementActualHeight(element)
    const handles = {
      nw: { x: element.x, y: element.y },
      ne: { x: element.x + element.width, y: element.y },
      sw: { x: element.x, y: element.y + elementHeight },
      se: { x: element.x + element.width, y: element.y + elementHeight }
    }
    
    for (const [key, handle] of Object.entries(handles)) {
      if (
        Math.abs(point.x - handle.x) < handleSize &&
        Math.abs(point.y - handle.y) < handleSize
      ) {
        return key
      }
    }
    return null
  }

  const createTextElement = (type: 'text' | 'number') => {
    const newElement: StagingElement = {
      id: Math.random().toString(),
      type,
      x: 100,
      y: 100,
      width: 300,
      height: 60,
      fontSize: 32,
      fontFamily: 'Arial',
      fontColor: '#000000',
      fontWeight: 'bold',
      textAlign: 'left',
      opacity: 1.0,
      content: type === 'text' ? 'Text' : '0'
    }
    setStagingElement(newElement)
    setSelectedFieldId(null)
  }

  const createImageElement = () => {
    stagingImageInputRef.current?.click()
  }

  const createLogoElement = () => {
    if (branding.logoUrl) {
      const logoWidth = 120
      const logoHeight = 120
      const logoX = Math.max(0, imageDimensions.width - logoWidth - 20)
      const logoY = 20

      const newElement: StagingElement = {
        id: Math.random().toString(),
        type: 'logo',
        x: snapToGrid(logoX),
        y: snapToGrid(logoY),
        width: logoWidth,
        height: logoHeight,
        fontSize: 0,
        fontFamily: 'Arial',
        fontColor: '#000000',
        fontWeight: 'normal',
        textAlign: 'left',
        opacity: 1.0,
        content: '',
        imagePreview: branding.logoUrl
      }
      setStagingElement(newElement)
      setSelectedFieldId(null)
    }
  }

  const createVideoElement = () => {
    const newElement: StagingElement = {
      id: Math.random().toString(),
      type: 'video',
      x: snapToGrid(100),
      y: snapToGrid(100),
      width: 400,
      height: 225,
      fontSize: 0,
      fontFamily: 'Arial',
      fontColor: '#000000',
      fontWeight: 'normal',
      textAlign: 'left',
      opacity: 1.0,
      content: 'video_url'
    }
    setStagingElement(newElement)
    setSelectedFieldId(null)
  }

  const createShapeElement = () => {
    const newElement: StagingElement = {
      id: Math.random().toString(),
      type: 'shape',
      x: snapToGrid(100),
      y: snapToGrid(100),
      width: 150,
      height: 150,
      fontSize: 0,
      fontFamily: 'Arial',
      fontColor: '#000000',
      fontWeight: 'normal',
      textAlign: 'left',
      opacity: 1.0,
      content: 'rectangle'
    }
    setStagingElement(newElement)
    setSelectedFieldId(null)
  }

  const saveToHistory = (newFields: TemplateField[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.parse(JSON.stringify(newFields)))
    if (newHistory.length > 50) {
      newHistory.shift()
    } else {
      setHistoryIndex(historyIndex + 1)
    }
    setHistory(newHistory)
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setFields(JSON.parse(JSON.stringify(history[newIndex])))
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setFields(JSON.parse(JSON.stringify(history[newIndex])))
    }
  }

  const handleStagingImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      const newElement: StagingElement = {
        id: Math.random().toString(),
        type: 'image',
        x: snapToGrid(100),
        y: snapToGrid(100),
        width: 200,
        height: 200,
        fontSize: 0,
        fontFamily: 'Arial',
        fontColor: '#000000',
        fontWeight: 'normal',
        textAlign: 'left',
        opacity: 1.0,
        content: '',
        imagePreview: imageUrl
      }
      setStagingElement(newElement)
      setSelectedFieldId(null)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const confirmStagingElement = () => {
    if (!stagingElement) return

    const newField: TemplateField = {
      id: Math.random().toString(),
      fieldName: `field${fields.length + 1}`,
      fieldLabel: stagingElement.type === 'logo' ? 'Logo' : `Field ${fields.length + 1}`,
      fieldType: stagingElement.type === 'image' || stagingElement.type === 'logo' ? 'image' : stagingElement.type,
      x: stagingElement.x,
      y: stagingElement.y,
      width: stagingElement.width,
      height: stagingElement.height,
      fontSize: stagingElement.fontSize,
      fontFamily: stagingElement.fontFamily,
      fontColor: stagingElement.fontColor,
      fontWeight: stagingElement.fontWeight,
      textAlign: stagingElement.textAlign,
      opacity: stagingElement.opacity,
      defaultValue: stagingElement.content || '',
      isRequired: false,
      order: fields.length,
      visible: true,
      imagePreview: stagingElement.imagePreview
    }

    setFields([...fields, newField])
    setStagingElement(null)
    setSelectedFieldId(newField.id)
  }

  const cancelStagingElement = () => {
    setStagingElement(null)
  }

  const updateStagingElement = (updates: Partial<StagingElement>) => {
    if (stagingElement) {
      setStagingElement({ ...stagingElement, ...updates })
    }
  }

  const updateSelectedField = (updates: Partial<TemplateField>) => {
    if (!selectedFieldId) return
    
    const fieldIndex = fields.findIndex(f => f.id === selectedFieldId)
    if (fieldIndex !== -1) {
      const newFields = [...fields]
      newFields[fieldIndex] = { ...newFields[fieldIndex], ...updates }
      setFields(newFields)
    }
  }

  const deleteSelectedField = () => {
    if (!selectedFieldId) return
    
    const confirmed = window.confirm('Are you sure you want to delete this field?')
    if (confirmed) {
      setFields(fields.filter(f => f.id !== selectedFieldId))
      setSelectedFieldId(null)
    }
  }

  const toggleFieldVisibility = (fieldId: string) => {
    const fieldIndex = fields.findIndex(f => f.id === fieldId)
    if (fieldIndex !== -1) {
      const newFields = [...fields]
      newFields[fieldIndex].visible = !newFields[fieldIndex].visible
      setFields(newFields)
      if (selectedFieldId === fieldId) {
        setSelectedFieldId(null)
      }
    }
  }

  const shuffleLogoPosition = () => {
    if (!selectedFieldId) return
    
    const fieldIndex = fields.findIndex(f => f.id === selectedFieldId)
    if (fieldIndex !== -1 && fields[fieldIndex].fieldLabel === 'Logo') {
      const newFields = [...fields]
      const field = newFields[fieldIndex]
      
      const logoWidth = field.width
      const logoHeight = field.height
      const logoX = Math.max(0, imageDimensions.width - logoWidth - 20)
      const logoY = 20
      
      field.x = snapToGrid(logoX)
      field.y = snapToGrid(logoY)
      
      setFields(newFields)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !category) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    if (stagingElement) {
      toast({
        title: 'Unconfirmed element',
        description: 'Please confirm or cancel the current element before saving',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Clean fields - remove id and ensure all required fields are present
      const cleanedFields = fields.map(field => ({
        fieldName: field.fieldName,
        fieldLabel: field.fieldLabel,
        fieldType: field.fieldType,
        x: Math.round(field.x),
        y: Math.round(field.y),
        width: Math.round(field.width || 200),
        height: Math.round(field.height || 50),
        fontSize: field.fontSize || 24,
        fontFamily: field.fontFamily || 'Arial',
        fontColor: field.fontColor || '#000000',
        fontWeight: field.fontWeight || 'normal',
        textAlign: field.textAlign || 'left',
        opacity: field.opacity || 1.0,
        defaultValue: field.defaultValue || '',
        imagePreview: field.imagePreview || null,
        visible: field.visible !== false,
        isRequired: field.isRequired || false,
        order: field.order || 0
      }))

      const response = await fetch(`/api/templates/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          category,
          fields: cleanedFields
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update template')
      }

      toast({
        title: 'Success!',
        description: 'Template updated successfully'
      })

      router.push('/dashboard/templates')
    } catch (error: any) {
      console.error('Error updating template:', error)
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update template',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
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

  const selectedField = selectedFieldId ? fields.find(f => f.id === selectedFieldId) : null

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/templates">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {template?.isOwner === false ? 'View Template' : 'Edit Template'}
          </h1>
          <p className="text-gray-600">
            {template?.isOwner === false ? 'This is a public template' : 'Update template design and fields'}
          </p>
        </div>
      </div>

      {template?.isOwner === false && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Viewing Public Template</h3>
                <p className="text-sm text-blue-700 mb-3">
                  This is a public template that you don't own. You can view its design but cannot save changes. 
                  To customize this template, use the Content Journey to create posts based on it.
                </p>
                <div className="flex gap-2">
                  <Link href="/dashboard">
                    <Button size="sm" className="gap-2">
                      <Wand2 className="w-4 h-4" />
                      Use in Content Journey
                    </Button>
                  </Link>
                  <Link href="/dashboard/templates">
                    <Button size="sm" variant="outline">
                      Browse Templates
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Template Info & Branding */}
          <div className="space-y-6">
            {/* Template Info */}
            <Card>
              <CardHeader>
                <CardTitle>Template Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My Template"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Template description..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="quotes">Quotes</SelectItem>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="events">Events</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Template Image</Label>
                  <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt={name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    {imageDimensions.width} × {imageDimensions.height}px
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Workspace Branding */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    <CardTitle className="text-base">Workspace branding</CardTitle>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBrandingCard(!showBrandingCard)}
                  >
                    {showBrandingCard ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </CardHeader>
              {showBrandingCard && (
                <CardContent className="space-y-4">
                  {/* Logo */}
                  <div className="space-y-2">
                    <Label className="text-xs">Logo</Label>
                    {branding.logoUrl && (
                      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border">
                        <Image
                          src={branding.logoUrl}
                          alt="Workspace logo"
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                    )}
                  </div>

                  {/* Brand Colors */}
                  {branding.brandColors.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs">Brand Colors</Label>
                      <div className="flex gap-2 flex-wrap">
                        {branding.brandColors.map((color, idx) => (
                          <div
                            key={idx}
                            className="w-12 h-12 rounded border border-gray-300"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Click on a color to apply it to the selected field
                  </p>
                </CardContent>
              )}
            </Card>

            {/* Selected Field Properties */}
            {selectedField && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Field Properties</CardTitle>
                    <div className="flex gap-1">
                      {selectedField.fieldLabel === 'Logo' && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={shuffleLogoPosition}
                          title="Move to top right"
                        >
                          <Shuffle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => toggleFieldVisibility(selectedFieldId!)}
                      >
                        {selectedField.visible === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={deleteSelectedField}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Field Name</Label>
                    <Input
                      value={selectedField.fieldName}
                      onChange={(e) => updateSelectedField({ fieldName: e.target.value })}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={selectedField.fieldLabel}
                      onChange={(e) => updateSelectedField({ fieldLabel: e.target.value })}
                      className="text-sm"
                    />
                  </div>

                  {(selectedField.fieldType === 'text' || selectedField.fieldType === 'number') && (
                    <>
                      <div>
                        <Label className="text-xs">Default Value</Label>
                        <Input
                          value={selectedField.defaultValue || ''}
                          onChange={(e) => updateSelectedField({ defaultValue: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Font Size</Label>
                        <Input
                          type="number"
                          value={selectedField.fontSize}
                          onChange={(e) => updateSelectedField({ fontSize: parseInt(e.target.value) || 24 })}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Font Family</Label>
                        <Select
                          value={selectedField.fontFamily}
                          onValueChange={(value) => updateSelectedField({ fontFamily: value })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_FAMILIES.map(font => (
                              <SelectItem key={font.value} value={font.value}>
                                {font.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={selectedField.fontColor}
                            onChange={(e) => updateSelectedField({ fontColor: e.target.value })}
                            className="w-16 h-9"
                          />
                          {branding.brandColors.length > 0 && (
                            <div className="flex gap-1">
                              {branding.brandColors.map((color, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className="w-8 h-9 rounded border border-gray-300"
                                  style={{ backgroundColor: color }}
                                  onClick={() => updateSelectedField({ fontColor: color })}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {(selectedField.fieldType === 'image') && (
                    <div>
                      <Label className="text-xs">Opacity</Label>
                      <Slider
                        value={[selectedField.opacity || 1.0]}
                        onValueChange={(values) => updateSelectedField({ opacity: values[0] })}
                        min={0}
                        max={1}
                        step={0.1}
                        className="mt-2"
                      />
                      <div className="text-xs text-gray-600 mt-1">
                        {Math.round((selectedField.opacity || 1.0) * 100)}%
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Canvas Editor */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Visual Editor</CardTitle>
                <div className="flex gap-2">
                  {/* Undo/Redo */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={undo}
                    disabled={historyIndex <= 0}
                    title="Undo"
                  >
                    <Undo className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={redo}
                    disabled={historyIndex >= history.length - 1}
                    title="Redo"
                  >
                    <Redo className="w-4 h-4" />
                  </Button>
                  
                  <div className="w-px bg-gray-300 mx-1" />
                  
                  {/* Add Elements */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => createTextElement('text')}
                    disabled={!!stagingElement}
                  >
                    <Type className="w-4 h-4 mr-1" />
                    Add Text
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => createTextElement('number')}
                    disabled={!!stagingElement}
                  >
                    <Hash className="w-4 h-4 mr-1" />
                    Add Number
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={createImageElement}
                    disabled={!!stagingElement}
                  >
                    <ImageIcon className="w-4 h-4 mr-1" />
                    Add Image
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={createVideoElement}
                    disabled={!!stagingElement}
                  >
                    <Video className="w-4 h-4 mr-1" />
                    Add Video
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={createLogoElement}
                    disabled={!!stagingElement || !branding.logoUrl}
                    title={!branding.logoUrl ? 'Upload a logo in the branding section first' : 'Add logo'}
                  >
                    <Star className="w-4 h-4 mr-1" />
                    Add Logo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={createShapeElement}
                    disabled={!!stagingElement}
                  >
                    <Square className="w-4 h-4 mr-1" />
                    Add Shape
                  </Button>
                </div>
              </div>
              <CardDescription>
                {stagingElement 
                  ? 'Position and resize the element, then press OK to confirm'
                  : 'Add text, numbers, or images to your template'}
              </CardDescription>
              
              {/* Context Toolbar - Shows when element is selected */}
              {selectedField && !stagingElement && (
                <div className="mt-3 px-6 pb-3 border-b">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-600 font-medium mr-2">
                      {selectedField.fieldLabel}:
                    </span>
                    
                    {/* Effects */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toast({ title: 'Effects', description: 'Effects panel coming soon' })}
                      title="Effects"
                    >
                      <Palette className="w-4 h-4 mr-1" />
                      Effects
                    </Button>
                    
                    {/* Color Picker (for text/shapes) */}
                    {(selectedField.fieldType === 'text' || selectedField.fieldType === 'number' || selectedField.fieldType === 'shape') && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-600">Color:</span>
                        <input
                          type="color"
                          value={selectedField.fontColor || '#000000'}
                          onChange={(e) => updateSelectedField({ fontColor: e.target.value })}
                          className="w-8 h-8 rounded cursor-pointer border"
                          title="Text Color"
                        />
                      </div>
                    )}
                    
                    {/* Crop (for images) */}
                    {(selectedField.fieldType === 'image' || selectedField.fieldType === 'logo') && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toast({ title: 'Crop', description: 'Crop tool coming soon' })}
                        title="Crop"
                      >
                        <Square className="w-4 h-4 mr-1" />
                        Crop
                      </Button>
                    )}
                    
                    {/* Arrange */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toast({ title: 'Arrange', description: 'Use arrow keys: ↑ (bring forward) ↓ (send backward)' })}
                      title="Arrange layers"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Arrange
                    </Button>
                    
                    {/* Align */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toast({ title: 'Align', description: 'Alignment tools coming soon' })}
                      title="Align"
                    >
                      <Move className="w-4 h-4 mr-1" />
                      Align
                    </Button>
                    
                    {/* Transparency Slider */}
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-xs text-gray-600">Opacity:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round((selectedField.opacity || 1) * 100)}
                        onChange={(e) => updateSelectedField({ opacity: parseFloat(e.target.value) / 100 })}
                        className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        title="Transparency"
                      />
                      <span className="text-xs text-gray-600 w-10">
                        {Math.round((selectedField.opacity || 1) * 100)}%
                      </span>
                    </div>
                    
                    {/* Blend Mode (for images) */}
                    {(selectedField.fieldType === 'image' || selectedField.fieldType === 'logo') && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-600">Blend:</span>
                        <select
                          value={selectedField.blendMode || 'normal'}
                          onChange={(e) => updateSelectedField({ blendMode: e.target.value })}
                          className="text-xs border rounded px-2 py-1"
                          title="Blend Mode"
                        >
                          <option value="normal">Normal</option>
                          <option value="multiply">Multiply</option>
                          <option value="screen">Screen</option>
                          <option value="overlay">Overlay</option>
                          <option value="darken">Darken</option>
                          <option value="lighten">Lighten</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div ref={containerRef} className="bg-gray-100 rounded-lg overflow-auto">
                {imagePreview ? (
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    style={{
                      width: `${imageDimensions.width * canvasScale}px`,
                      height: `${imageDimensions.height * canvasScale}px`,
                      cursor: 'default'
                    }}
                    className="mx-auto"
                  />
                ) : (
                  <div className="flex items-center justify-center h-96 text-gray-500">
                    Template image loading...
                  </div>
                )}
              </div>

              {/* Hidden file input for staging images */}
              <input
                ref={stagingImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleStagingImageUpload}
                className="hidden"
              />

              {/* Staging Element Editor */}
              {stagingElement && (
                <Card className="mt-4 border-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Edit {stagingElement.type} Element</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={cancelStagingElement}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={confirmStagingElement}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          OK
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {(stagingElement.type === 'text' || stagingElement.type === 'number') && (
                        <>
                          <div className="col-span-2">
                            <Label className="text-xs">Preview Text</Label>
                            <Input
                              value={stagingElement.content}
                              onChange={(e) => updateStagingElement({ content: e.target.value })}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Font Size</Label>
                            <Input
                              type="number"
                              value={stagingElement.fontSize}
                              onChange={(e) => updateStagingElement({ fontSize: parseInt(e.target.value) || 24 })}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Font Family</Label>
                            <Select
                              value={stagingElement.fontFamily}
                              onValueChange={(value) => updateStagingElement({ fontFamily: value })}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FONT_FAMILIES.map(font => (
                                  <SelectItem key={font.value} value={font.value}>
                                    {font.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Color</Label>
                            <Input
                              type="color"
                              value={stagingElement.fontColor}
                              onChange={(e) => updateStagingElement({ fontColor: e.target.value })}
                              className="h-9"
                            />
                          </div>
                        </>
                      )}

                      {(stagingElement.type === 'image' || stagingElement.type === 'logo') && (
                        <div className="col-span-2">
                          <Label className="text-xs">Opacity</Label>
                          <Slider
                            value={[stagingElement.opacity]}
                            onValueChange={(values) => updateStagingElement({ opacity: values[0] })}
                            min={0}
                            max={1}
                            step={0.1}
                            className="mt-2"
                          />
                          <div className="text-xs text-gray-600 mt-1">
                            {Math.round(stagingElement.opacity * 100)}%
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Fields List */}
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">All Fields ({fields.length})</h4>
                <div className="space-y-2">
                  {fields.map(field => (
                    <div
                      key={field.id}
                      className={`flex items-center justify-between p-2 rounded border cursor-pointer ${
                        selectedFieldId === field.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedFieldId(field.id)}
                    >
                      <div className="flex items-center gap-2">
                        {field.fieldType === 'text' && <Type className="w-4 h-4" />}
                        {field.fieldType === 'number' && <Hash className="w-4 h-4" />}
                        {field.fieldType === 'image' && <ImageIcon className="w-4 h-4" />}
                        <span className="text-sm font-medium">{field.fieldLabel}</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFieldVisibility(field.id)
                        }}
                      >
                        {field.visible === false ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard/templates">
            <Button type="button" variant="outline">
              {template?.isOwner === false ? 'Back to Templates' : 'Cancel'}
            </Button>
          </Link>
          {template?.isOwner !== false && (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
