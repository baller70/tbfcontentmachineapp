
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
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
  Undo,
  Redo,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Save,
  Crop as CropIcon,
  RotateCw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyEnd,
  Layers,
  Eraser,
  Droplet
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { SketchPicker } from 'react-color'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

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

// Visual Effects System
const PHOTO_EFFECTS = [
  { value: 'none', label: 'None', file: '' },
  { value: 'lens-flare-01', label: 'Lens Flare 1', file: '/effects/photo-effects/lens-flare-01.png' },
  { value: 'lens-flare-02', label: 'Lens Flare 2', file: '/effects/photo-effects/lens-flare-02.png' },
  { value: 'lens-flare-03', label: 'Lens Flare 3', file: '/effects/photo-effects/lens-flare-03.png' },
  { value: 'light-rays-01', label: 'Light Rays 1', file: '/effects/photo-effects/light-rays-01.png' },
  { value: 'light-rays-02', label: 'Light Rays 2', file: '/effects/photo-effects/light-rays-02.png' },
  { value: 'bokeh-01', label: 'Bokeh 1', file: '/effects/photo-effects/bokeh-01.png' },
  { value: 'bokeh-02', label: 'Bokeh 2', file: '/effects/photo-effects/bokeh-02.png' },
  { value: 'glow-01', label: 'Glow 1', file: '/effects/photo-effects/glow-01.png' },
  { value: 'glow-02', label: 'Glow 2', file: '/effects/photo-effects/glow-02.png' },
  { value: 'particle-01', label: 'Particle 1', file: '/effects/photo-effects/particle-01.png' },
  { value: 'particle-02', label: 'Particle 2', file: '/effects/photo-effects/particle-02.png' },
  { value: 'smoke-01', label: 'Smoke 1', file: '/effects/photo-effects/smoke-01.png' },
  { value: 'smoke-02', label: 'Smoke 2', file: '/effects/photo-effects/smoke-02.png' },
  { value: 'explosion-01', label: 'Explosion 1', file: '/effects/photo-effects/explosion-01.png' },
  { value: 'explosion-02', label: 'Explosion 2', file: '/effects/photo-effects/explosion-02.png' },
  { value: 'sparkle-01', label: 'Sparkle 1', file: '/effects/photo-effects/sparkle-01.png' },
  { value: 'sparkle-02', label: 'Sparkle 2', file: '/effects/photo-effects/sparkle-02.png' },
  { value: 'neon-glow-01', label: 'Neon Glow 1', file: '/effects/photo-effects/neon-glow-01.png' },
  { value: 'neon-glow-02', label: 'Neon Glow 2', file: '/effects/photo-effects/neon-glow-02.png' },
  { value: 'speed-lines-01', label: 'Speed Lines 1', file: '/effects/photo-effects/speed-lines-01.png' },
  { value: 'speed-lines-02', label: 'Speed Lines 2', file: '/effects/photo-effects/speed-lines-02.png' }
]

const FILTERS = [
  { value: 'none', label: 'None', file: '' },
  // CSS-based filters (applied via ctx.filter)
  { value: 'grayscale', label: 'Black & White', file: '' },
  { value: 'sepia', label: 'Sepia', file: '' },
  { value: 'retro', label: 'Retro', file: '' },
  { value: 'vintage', label: 'Vintage', file: '' },
  { value: 'polaroid', label: 'Polaroid', file: '' },
  // Image overlay filters
  { value: 'red-gradient', label: 'Red Gradient', file: '/effects/filters/red-gradient-01.png' },
  { value: 'blue-gradient', label: 'Blue Gradient', file: '/effects/filters/blue-gradient-01.png' },
  { value: 'orange-gradient', label: 'Orange Gradient', file: '/effects/filters/orange-gradient-01.png' },
  { value: 'purple-gradient', label: 'Purple Gradient', file: '/effects/filters/purple-gradient-01.png' },
  { value: 'black-gradient', label: 'Black Gradient', file: '/effects/filters/black-gradient-01.png' },
  { value: 'light-gradient', label: 'Light Gradient', file: '/effects/filters/light-gradient-01.png' },
  { value: 'vignette-01', label: 'Vignette 1', file: '/effects/filters/vignette-01.png' },
  { value: 'vignette-02', label: 'Vignette 2', file: '/effects/filters/vignette-02.png' }
]

const TEXTURES = [
  { value: 'none', label: 'None', file: '' },
  { value: 'grunge-01', label: 'Grunge 1', file: '/effects/textures/grunge-01.png' },
  { value: 'grunge-02', label: 'Grunge 2', file: '/effects/textures/grunge-02.png' },
  { value: 'grunge-03', label: 'Grunge 3', file: '/effects/textures/grunge-03.png' },
  { value: 'grunge-04', label: 'Grunge 4', file: '/effects/textures/grunge-04.png' },
  { value: 'concrete-01', label: 'Concrete 1', file: '/effects/textures/concrete-01.png' },
  { value: 'concrete-02', label: 'Concrete 2', file: '/effects/textures/concrete-02.png' },
  { value: 'metal-01', label: 'Metal', file: '/effects/textures/metal-01.png' },
  { value: 'carbon-fiber-01', label: 'Carbon Fiber', file: '/effects/textures/carbon-fiber-01.png' },
  { value: 'distressed-01', label: 'Distressed', file: '/effects/textures/distressed-01.png' },
  { value: 'halftone-01', label: 'Halftone 1', file: '/effects/textures/halftone-01.png' },
  { value: 'halftone-02', label: 'Halftone 2', file: '/effects/textures/halftone-02.png' },
  { value: 'halftone-03', label: 'Halftone 3', file: '/effects/textures/halftone-03.png' },
  { value: 'geometric-01', label: 'Geometric', file: '/effects/textures/geometric-01.png' },
  { value: 'diagonal-lines-01', label: 'Diagonal Lines', file: '/effects/textures/diagonal-lines-01.png' },
  { value: 'hexagon-01', label: 'Hexagon 1', file: '/effects/textures/hexagon-01.png' },
  { value: 'hexagon-02', label: 'Hexagon 2', file: '/effects/textures/hexagon-02.png' },
  { value: 'paint-stroke-01', label: 'Paint Stroke', file: '/effects/textures/paint-stroke-01.png' },
  { value: 'scratched-01', label: 'Scratched', file: '/effects/textures/scratched-01.png' },
  { value: 'noise-01', label: 'Noise', file: '/effects/textures/noise-01.png' }
]

const CORNER_STYLES = [
  { value: 'sharp', label: 'Sharp' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'circular', label: 'Circular' }
]

const SHAPES = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'circle', label: 'Circle' },
  { value: 'ellipse', label: 'Ellipse' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'star', label: 'Star' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'heart', label: 'Heart' },
  { value: 'arrow', label: 'Arrow' },
  { value: 'badge', label: 'Badge' },
  { value: 'ribbon', label: 'Ribbon' }
]

const PAINT_SPLATTERS = [
  { value: 'none', label: 'None', file: '' },
  { value: 'splatter-01', label: 'Splatter 1', file: '/effects/splatters/splatter-01.png' },
  { value: 'splatter-02', label: 'Splatter 2', file: '/effects/splatters/splatter-02.png' },
  { value: 'splatter-03', label: 'Splatter 3', file: '/effects/splatters/splatter-03.png' },
  { value: 'splatter-04', label: 'Splatter 4', file: '/effects/splatters/splatter-04.png' },
  { value: 'splatter-05', label: 'Splatter 5', file: '/effects/splatters/splatter-05.png' },
  { value: 'splatter-06', label: 'Splatter 6', file: '/effects/splatters/splatter-06.png' },
  { value: 'splatter-07', label: 'Splatter 7', file: '/effects/splatters/splatter-07.png' },
  { value: 'splatter-08', label: 'Splatter 8', file: '/effects/splatters/splatter-08.png' },
  { value: 'splatter-09', label: 'Splatter 9', file: '/effects/splatters/splatter-09.png' },
  { value: 'splatter-10', label: 'Splatter 10', file: '/effects/splatters/splatter-10.png' }
]

const ANIMATIONS = [
  { value: 'none', label: 'None' },
  { value: 'fade-in', label: 'Fade In' },
  { value: 'fade-out', label: 'Fade Out' },
  { value: 'slide-left', label: 'Slide Left' },
  { value: 'slide-right', label: 'Slide Right' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'slide-down', label: 'Slide Down' },
  { value: 'zoom-in', label: 'Zoom In' },
  { value: 'zoom-out', label: 'Zoom Out' },
  { value: 'rotate-cw', label: 'Rotate Clockwise' },
  { value: 'rotate-ccw', label: 'Rotate Counter-Clockwise' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'pulse', label: 'Pulse' },
  { value: 'shake', label: 'Shake' },
  { value: 'wobble', label: 'Wobble' },
  { value: 'flip-horizontal', label: 'Flip Horizontal' },
  { value: 'flip-vertical', label: 'Flip Vertical' },
  { value: 'swing', label: 'Swing' },
  { value: 'roll', label: 'Roll' },
  { value: 'blur-in', label: 'Blur In' },
  { value: 'blur-out', label: 'Blur Out' }
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
  rotation: number // Rotation angle in degrees
  defaultValue?: string
  isRequired: boolean
  order: number
  visible?: boolean
  imagePreview?: string
  videoPreview?: string
  // Visual effects
  photoEffect?: string
  filter?: string
  texture?: string
  cornerStyle?: string
  shape?: string
  paintSplatter?: string
  animation?: string
  outlineColor?: string
  outlineWidth?: number
  blur?: number
  // Effect-specific properties
  effectValue?: string // Stores the specific effect/filter/texture/splatter value
  effectFilePath?: string // Stores the file path for image-based effects
  // Context toolbar properties
  blendMode?: string
  backgroundColor?: string
  fill?: string
  shadow?: {
    color: string
    x: number
    y: number
    blur: number
  }
  // Crop properties
  cropArea?: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface StagingElement {
  id: string
  type: 'text' | 'number' | 'image' | 'logo' | 'video' | 'shape' | 'photo-effect' | 'filter' | 'texture' | 'paint-splatter'
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
  rotation: number // Rotation angle in degrees
  imagePreview?: string
  videoPreview?: string
  // Visual effects
  photoEffect?: string
  filter?: string
  texture?: string
  cornerStyle?: string
  shape?: string
  paintSplatter?: string
  animation?: string
  outlineColor?: string
  outlineWidth?: number
  blur?: number
  // Effect-specific properties
  effectValue?: string // Stores the specific effect/filter/texture/splatter value
  effectFilePath?: string // Stores the file path for image-based effects
  shadow?: {
    color: string
    x: number
    y: number
    blur: number
  }
  // Crop properties
  cropArea?: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface WorkspaceBranding {
  logoUrl: string | null
  brandColors: string[]
}

type EditorMode = 'select' | 'place-text' | 'place-number' | 'place-image' | 'place-logo' | 'place-video'

// Snap-to-grid configuration
const GRID_SIZE = 10 // pixels
const SNAP_THRESHOLD = 15 // pixels - distance to trigger snapping

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

export default function CreateTemplatePage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('custom')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageDimensions, setImageDimensions] = useState({ width: 1080, height: 1080 })
  const [fields, setFields] = useState<TemplateField[]>([])
  const [stagingElement, setStagingElement] = useState<StagingElement | null>(null)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [editorMode, setEditorMode] = useState<EditorMode>('select')
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [isRotating, setIsRotating] = useState(false)
  const [rotationStartAngle, setRotationStartAngle] = useState(0)
  const [canvasScale, setCanvasScale] = useState(1)
  const [branding, setBranding] = useState<WorkspaceBranding>({ logoUrl: null, brandColors: [] })
  const [showBrandingCard, setShowBrandingCard] = useState(false)
  const [isLoadingBranding, setIsLoadingBranding] = useState(false)
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([])
  
  // Undo/Redo state management
  const [history, setHistory] = useState<TemplateField[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false)
  
  // Global Visual Effects State
  const [globalCornerStyle, setGlobalCornerStyle] = useState<string>('sharp')
  const [globalAnimation, setGlobalAnimation] = useState<string>('none')
  const [globalOpacity, setGlobalOpacity] = useState<number>(100)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false)
  
  // Context Toolbar State
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showTransparency, setShowTransparency] = useState(false)
  const [showBlendMode, setShowBlendMode] = useState(false)
  const [showAlign, setShowAlign] = useState(false)
  const [showArrange, setShowArrange] = useState(false)
  const [showEffects, setShowEffects] = useState(false)
  const [showShadow, setShowShadow] = useState(false)
  const [showPattern, setShowPattern] = useState(false)
  const [cropMode, setCropMode] = useState(false)
  
  // Effects panel state
  const [expandedEffectSection, setExpandedEffectSection] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  
  // Shadow state
  const [shadowColor, setShadowColor] = useState('#000000')
  const [shadowX, setShadowX] = useState(0)
  const [shadowY, setShadowY] = useState(0)
  const [shadowBlur, setShadowBlur] = useState(0)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const stagingImageInputRef = useRef<HTMLInputElement>(null)
  const stagingVideoInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const loadedImageRef = useRef<HTMLImageElement | null>(null) // Cache the loaded template image
  const loadedFieldImagesRef = useRef<Map<string, HTMLImageElement>>(new Map()) // Cache for field images
  const loadedStagingImageRef = useRef<HTMLImageElement | null>(null) // Cache for staging element image
  const loadedEffectImagesRef = useRef<Map<string, HTMLImageElement>>(new Map()) // Cache for effect images
  const { toast } = useToast()
  const router = useRouter()

  // Fetch workspace branding on mount
  useEffect(() => {
    fetchBranding()
  }, [])

  // Load and cache the template image when imagePreview changes
  useEffect(() => {
    if (!imagePreview) {
      loadedImageRef.current = null
      return
    }

    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      loadedImageRef.current = img
      // Trigger a canvas redraw after image is loaded
      if (canvasRef.current) {
        drawCanvas()
      }
    }
    img.onerror = () => {
      console.error('Failed to load template image')
      loadedImageRef.current = null
    }
    img.src = imagePreview
  }, [imagePreview])

  // Load and cache field images
  useEffect(() => {
    const imageCache = loadedFieldImagesRef.current
    
    // Load images for all fields
    fields.forEach(field => {
      if ((field.fieldType === 'image' || field.fieldType === 'logo' || field.fieldType === 'video') && field.imagePreview) {
        // Check if image URL has changed or not yet cached
        const cachedImg = imageCache.get(field.id)
        const needsReload = !cachedImg || cachedImg.src !== field.imagePreview
        
        if (needsReload) {
          const img = new window.Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            imageCache.set(field.id, img)
            drawCanvas() // Redraw when image loads
          }
          img.onerror = () => {
            console.error(`Failed to load field image for ${field.id}`)
          }
          img.src = field.imagePreview
        }
      } else {
        // Remove from cache if no longer an image field
        imageCache.delete(field.id)
      }
    })
    
    // Clean up cached images for removed fields
    const currentFieldIds = new Set(fields.map(f => f.id))
    Array.from(imageCache.keys()).forEach(cachedId => {
      if (!currentFieldIds.has(cachedId)) {
        imageCache.delete(cachedId)
      }
    })
  }, [fields])

  // Load and cache effect images for visual effect fields
  useEffect(() => {
    const effectCache = loadedEffectImagesRef.current
    
    // Load effect images for visual effect fields
    fields.forEach(field => {
      if ((field.fieldType === 'photo-effect' || field.fieldType === 'filter' || field.fieldType === 'texture' || field.fieldType === 'paint-splatter') && field.effectFilePath) {
        // Check if already cached
        if (!effectCache.has(field.effectFilePath)) {
          const img = new window.Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            effectCache.set(field.effectFilePath!, img)
            drawCanvas() // Redraw when image loads
          }
          img.onerror = () => {
            console.error(`Failed to load effect image: ${field.effectFilePath}`)
          }
          img.src = field.effectFilePath
        }
      }
    })
    
    // Clean up cached effect images for removed fields
    const currentEffectPaths = new Set(
      fields
        .filter(f => f.effectFilePath)
        .map(f => f.effectFilePath!)
    )
    Array.from(effectCache.keys()).forEach(cachedPath => {
      if (!currentEffectPaths.has(cachedPath)) {
        effectCache.delete(cachedPath)
      }
    })
  }, [fields])

  // Load and cache staging element image
  useEffect(() => {
    if (!stagingElement || !stagingElement.imagePreview) {
      loadedStagingImageRef.current = null
      return
    }

    if ((stagingElement.type === 'image' || stagingElement.type === 'logo' || stagingElement.type === 'video')) {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        loadedStagingImageRef.current = img
        drawCanvas() // Redraw when image loads
      }
      img.onerror = () => {
        console.error('Failed to load staging element image')
        loadedStagingImageRef.current = null
      }
      img.src = stagingElement.imagePreview
    }
  }, [stagingElement?.imagePreview, stagingElement?.type])

  // Calculate canvas scale to fit container
  useEffect(() => {
    if (containerRef.current && imageDimensions.width > 0) {
      const containerWidth = containerRef.current.clientWidth
      const maxWidth = containerWidth - 40 // padding
      const scale = Math.min(maxWidth / imageDimensions.width, 1)
      setCanvasScale(scale)
    }
  }, [imageDimensions])

  const fetchBranding = async () => {
    try {
      const response = await fetch('/api/branding')
      if (response.ok) {
        const data = await response.json()
        // Ensure branding is not null/undefined
        if (data.branding) {
          setBranding(data.branding)
        }
      }
    } catch (error) {
      console.error('Failed to fetch branding:', error)
    }
  }

  // Save current state to history
  const saveToHistory = (newFields: TemplateField[]) => {
    if (isUndoRedoAction) return
    
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.parse(JSON.stringify(newFields)))
    
    // Keep only last 50 states
    if (newHistory.length > 50) {
      newHistory.shift()
    } else {
      setHistoryIndex(prev => prev + 1)
    }
    
    setHistory(newHistory)
  }

  // Undo action
  const undo = () => {
    if (historyIndex <= 0) return
    
    setIsUndoRedoAction(true)
    const previousState = history[historyIndex - 1]
    setFields(JSON.parse(JSON.stringify(previousState)))
    setHistoryIndex(prev => prev - 1)
    
    setTimeout(() => setIsUndoRedoAction(false), 100)
  }

  // Redo action
  const redo = () => {
    if (historyIndex >= history.length - 1) return
    
    setIsUndoRedoAction(true)
    const nextState = history[historyIndex + 1]
    setFields(JSON.parse(JSON.stringify(nextState)))
    setHistoryIndex(prev => prev + 1)
    
    setTimeout(() => setIsUndoRedoAction(false), 100)
  }

  // Track fields changes for undo/redo
  useEffect(() => {
    if (!isUndoRedoAction && fields.length > 0) {
      saveToHistory(fields)
    }
  }, [fields])

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [historyIndex, history])

  // Optimized canvas redraw with requestAnimationFrame to prevent flashing
  const animationFrameRef = useRef<number | null>(null)
  
  // Debounced canvas redraw to prevent flashing
  const redrawTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    // Cancel any pending timeout
    if (redrawTimeoutRef.current) {
      clearTimeout(redrawTimeoutRef.current)
    }
    
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    // Immediate redraw for staging element (smoother interaction)
    if (stagingElement || dragOffset || resizeHandle) {
      animationFrameRef.current = requestAnimationFrame(() => {
        drawCanvas()
      })
    } else {
      // Debounce other redraws to prevent flashing
      redrawTimeoutRef.current = setTimeout(() => {
        animationFrameRef.current = requestAnimationFrame(() => {
          drawCanvas()
        })
      }, 10) // Small delay to batch updates
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (redrawTimeoutRef.current) {
        clearTimeout(redrawTimeoutRef.current)
      }
    }
  }, [fields, selectedFieldId, stagingElement, imagePreview, imageDimensions, canvasScale, alignmentGuides, dragOffset, resizeHandle, globalCornerStyle, globalAnimation, globalOpacity])

  // Load draft on mount
  useEffect(() => {
    const draftStr = localStorage.getItem('template_draft')
    if (draftStr) {
      try {
        const draft = JSON.parse(draftStr)
        const draftAge = Date.now() - new Date(draft.timestamp).getTime()
        const oneDay = 24 * 60 * 60 * 1000
        
        // Only show prompt if draft is less than 7 days old
        if (draftAge < 7 * oneDay) {
          // Show a non-intrusive notification
          const shouldLoad = confirm('Found a saved draft. Would you like to restore it?')
          if (shouldLoad) {
            loadDraft()
          } else {
            clearDraft()
          }
        } else {
          clearDraft()
        }
      } catch (error) {
        console.error('Error checking draft:', error)
      }
    }
  }, [])

  // Mark changes as unsaved
  useEffect(() => {
    if (fields.length > 0 || name || description) {
      setHasUnsavedChanges(true)
    }
  }, [fields, name, description, category, imageFile])

  // Auto-save draft every 2 minutes
  useEffect(() => {
    if (!hasUnsavedChanges) return
    
    const autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges && (name || fields.length > 0)) {
        saveDraft()
      }
    }, 2 * 60 * 1000) // 2 minutes
    
    return () => clearInterval(autoSaveInterval)
  }, [hasUnsavedChanges, name, fields])

  // Sync shadow state with selected field
  useEffect(() => {
    if (selectedFieldId) {
      const selectedField = fields.find(f => f.id === selectedFieldId)
      if (selectedField?.shadow) {
        setShadowColor(selectedField.shadow.color || '#000000')
        setShadowX(selectedField.shadow.x || 0)
        setShadowY(selectedField.shadow.y || 0)
        setShadowBlur(selectedField.shadow.blur || 0)
      } else {
        // Reset to defaults if no shadow
        setShadowColor('#000000')
        setShadowX(0)
        setShadowY(0)
        setShadowBlur(0)
      }
    }
  }, [selectedFieldId, fields])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive'
      })
      return
    }

    setImageFile(file)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height })
      }
      img.src = e.target?.result as string
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Helper functions for applying visual effects
  const applyFilter = (ctx: CanvasRenderingContext2D, filter: string) => {
    switch (filter) {
      case 'grayscale':
        // Black & White - pure grayscale with high contrast
        ctx.filter = 'grayscale(100%) contrast(110%)'
        break
      case 'sepia':
        // Sepia - classic brown/tan tone
        ctx.filter = 'sepia(90%) contrast(105%)'
        break
      case 'retro':
        // Retro - black and white with very high contrast
        ctx.filter = 'grayscale(100%) contrast(140%) brightness(95%)'
        break
      case 'vintage':
        // Vintage - warm nostalgic tone
        ctx.filter = 'sepia(40%) saturate(110%) contrast(115%) brightness(105%) hue-rotate(-5deg)'
        break
      case 'polaroid':
        // Polaroid - blue/purple tinted vintage effect
        ctx.filter = 'saturate(110%) contrast(105%) brightness(108%) hue-rotate(10deg)'
        break
      case 'invert':
        ctx.filter = 'invert(100%)'
        break
      case 'brightness-high':
        ctx.filter = 'brightness(150%)'
        break
      case 'brightness-low':
        ctx.filter = 'brightness(70%)'
        break
      case 'contrast-high':
        ctx.filter = 'contrast(150%)'
        break
      case 'contrast-low':
        ctx.filter = 'contrast(70%)'
        break
      case 'saturate':
        ctx.filter = 'saturate(200%)'
        break
      case 'desaturate':
        ctx.filter = 'saturate(50%)'
        break
      case 'hue-rotate':
        ctx.filter = 'hue-rotate(90deg)'
        break
      case 'warm':
        ctx.filter = 'sepia(20%) saturate(120%) brightness(105%) hue-rotate(-10deg)'
        break
      case 'cool':
        ctx.filter = 'hue-rotate(180deg) saturate(110%) brightness(95%)'
        break
      case 'dramatic':
        ctx.filter = 'contrast(150%) brightness(90%) saturate(130%)'
        break
      case 'film-noir':
        ctx.filter = 'grayscale(100%) contrast(150%)'
        break
      case 'technicolor':
        ctx.filter = 'saturate(180%) contrast(120%) brightness(105%)'
        break
      case 'kodachrome':
        ctx.filter = 'saturate(150%) contrast(125%) brightness(95%) hue-rotate(-5deg)'
        break
      case 'cyan-tint':
        ctx.filter = 'sepia(40%) hue-rotate(140deg) saturate(150%)'
        break
      case 'magenta-tint':
        ctx.filter = 'sepia(40%) hue-rotate(280deg) saturate(150%)'
        break
      case 'yellow-tint':
        ctx.filter = 'sepia(80%) hue-rotate(10deg) saturate(140%)'
        break
      case 'red-tint':
        ctx.filter = 'sepia(60%) hue-rotate(-10deg) saturate(170%)'
        break
      case 'blue-tint':
        ctx.filter = 'sepia(40%) hue-rotate(180deg) saturate(140%)'
        break
      case 'green-tint':
        ctx.filter = 'sepia(40%) hue-rotate(60deg) saturate(130%)'
        break
      case 'purple-tint':
        ctx.filter = 'sepia(40%) hue-rotate(260deg) saturate(150%)'
        break
      case 'orange-tint':
        ctx.filter = 'sepia(70%) hue-rotate(-20deg) saturate(160%)'
        break
      case 'duotone-blue':
        ctx.filter = 'grayscale(100%) sepia(50%) hue-rotate(180deg) saturate(300%)'
        break
      case 'duotone-red':
        ctx.filter = 'grayscale(100%) sepia(50%) hue-rotate(-10deg) saturate(300%)'
        break
      case 'duotone-green':
        ctx.filter = 'grayscale(100%) sepia(50%) hue-rotate(60deg) saturate(300%)'
        break
      default:
        ctx.filter = 'none'
    }
  }

  const applyPhotoEffect = (ctx: CanvasRenderingContext2D, effect: string) => {
    switch (effect) {
      case 'blur':
        ctx.filter = 'blur(5px)'
        break
      case 'gaussian-blur':
        ctx.filter = 'blur(10px)'
        break
      case 'motion-blur':
        ctx.filter = 'blur(8px)'
        break
      case 'radial-blur':
        ctx.filter = 'blur(6px)'
        break
      case 'sharpen':
        ctx.filter = 'contrast(120%) brightness(110%)'
        break
      case 'emboss':
        ctx.filter = 'grayscale(100%) contrast(200%) brightness(120%)'
        break
      case 'edge-detect':
        ctx.filter = 'invert(100%) contrast(200%) brightness(50%)'
        break
      case 'pixelate':
        // Pixelation requires canvas manipulation, using contrast as approximation
        ctx.filter = 'contrast(150%)'
        break
      case 'mosaic':
        ctx.filter = 'contrast(140%)'
        break
      case 'oil-paint':
        ctx.filter = 'saturate(130%) contrast(110%) blur(1px)'
        break
      case 'watercolor':
        ctx.filter = 'saturate(120%) brightness(110%) blur(2px)'
        break
      case 'sketch':
        ctx.filter = 'grayscale(100%) contrast(200%) brightness(150%)'
        break
      case 'cartoon':
        ctx.filter = 'saturate(150%) contrast(130%) brightness(105%)'
        break
      case 'posterize':
        ctx.filter = 'contrast(200%) saturate(150%)'
        break
      case 'solarize':
        ctx.filter = 'invert(50%) contrast(150%)'
        break
      case 'crystallize':
        ctx.filter = 'contrast(160%) saturate(120%)'
        break
      case 'pointillize':
        ctx.filter = 'contrast(140%) saturate(130%)'
        break
      case 'halftone':
        ctx.filter = 'contrast(170%) brightness(110%)'
        break
      case 'crosshatch':
        ctx.filter = 'grayscale(70%) contrast(180%)'
        break
      case 'glow':
        ctx.filter = 'brightness(130%) blur(3px) saturate(140%)'
        break
      case 'neon':
        ctx.filter = 'saturate(300%) brightness(120%) contrast(150%)'
        break
      case 'outline':
        ctx.filter = 'invert(100%) contrast(300%) brightness(80%)'
        break
      case 'relief':
        ctx.filter = 'grayscale(80%) contrast(180%) brightness(130%)'
        break
      case 'lens-flare':
        ctx.filter = 'brightness(140%) saturate(120%) contrast(110%)'
        break
      case 'vignette':
        ctx.filter = 'brightness(90%) contrast(110%)'
        break
      case 'tilt-shift':
        ctx.filter = 'blur(4px) saturate(130%)'
        break
      case 'bokeh':
        ctx.filter = 'blur(8px) brightness(110%) saturate(120%)'
        break
      case 'depth-of-field':
        ctx.filter = 'blur(5px) contrast(105%)'
        break
      case 'fisheye':
        ctx.filter = 'contrast(110%) brightness(105%)'
        break
      default:
        // No effect applied
        break
    }
  }

  const applyTexture = (ctx: CanvasRenderingContext2D, texture: string, x: number, y: number, width: number, height: number) => {
    if (!texture || texture === 'none') return
    
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.globalAlpha = 0.15
    
    switch (texture) {
      case 'paper':
      case 'canvas':
      case 'fabric':
      case 'vintage-paper':
      case 'parchment':
        // Create paper-like texture with noise
        ctx.fillStyle = '#f5f5dc'
        ctx.fillRect(x, y, width, height)
        for (let i = 0; i < 1000; i++) {
          ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)'
          ctx.fillRect(
            x + Math.random() * width,
            y + Math.random() * height,
            2, 2
          )
        }
        break
      case 'leather':
      case 'distressed':
        // Rough texture pattern
        ctx.fillStyle = '#8B4513'
        for (let i = 0; i < 500; i++) {
          ctx.fillRect(
            x + Math.random() * width,
            y + Math.random() * height,
            Math.random() * 3 + 1,
            Math.random() * 3 + 1
          )
        }
        break
      case 'wood':
        // Wood grain lines
        ctx.strokeStyle = '#654321'
        for (let i = 0; i < 20; i++) {
          ctx.beginPath()
          ctx.moveTo(x, y + (height / 20) * i)
          ctx.lineTo(x + width, y + (height / 20) * i + Math.random() * 10)
          ctx.stroke()
        }
        break
      case 'metal':
      case 'concrete':
      case 'stone':
        // Metallic/concrete texture
        ctx.fillStyle = '#888888'
        for (let i = 0; i < 800; i++) {
          ctx.fillRect(
            x + Math.random() * width,
            y + Math.random() * height,
            1, 1
          )
        }
        break
      case 'grunge':
        // Random grunge spots
        for (let i = 0; i < 300; i++) {
          ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.3})`
          ctx.beginPath()
          ctx.arc(
            x + Math.random() * width,
            y + Math.random() * height,
            Math.random() * 5,
            0, Math.PI * 2
          )
          ctx.fill()
        }
        break
      case 'dots':
        // Dot pattern
        const dotSpacing = 10
        for (let dx = 0; dx < width; dx += dotSpacing) {
          for (let dy = 0; dy < height; dy += dotSpacing) {
            ctx.beginPath()
            ctx.arc(x + dx, y + dy, 2, 0, Math.PI * 2)
            ctx.fill()
          }
        }
        break
      case 'lines':
        // Horizontal lines
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'
        for (let i = 0; i < height; i += 5) {
          ctx.beginPath()
          ctx.moveTo(x, y + i)
          ctx.lineTo(x + width, y + i)
          ctx.stroke()
        }
        break
      case 'grid':
        // Grid pattern
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'
        const gridSize = 20
        for (let i = 0; i < width; i += gridSize) {
          ctx.beginPath()
          ctx.moveTo(x + i, y)
          ctx.lineTo(x + i, y + height)
          ctx.stroke()
        }
        for (let i = 0; i < height; i += gridSize) {
          ctx.beginPath()
          ctx.moveTo(x, y + i)
          ctx.lineTo(x + width, y + i)
          ctx.stroke()
        }
        break
      case 'noise':
      case 'static':
        // Random noise
        for (let i = 0; i < 2000; i++) {
          ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
          ctx.fillRect(
            x + Math.random() * width,
            y + Math.random() * height,
            1, 1
          )
        }
        break
      default:
        // Generic texture overlay
        ctx.fillStyle = 'rgba(0,0,0,0.05)'
        ctx.fillRect(x, y, width, height)
        break
    }
    
    ctx.restore()
  }

  const applyPaintSplatter = (ctx: CanvasRenderingContext2D, splatter: string, x: number, y: number, width: number, height: number, color: string = '#000000') => {
    if (!splatter || splatter === 'none') return
    
    ctx.save()
    ctx.globalAlpha = 0.3
    ctx.fillStyle = color
    
    // Extract splatter number
    const splatterNum = parseInt(splatter.replace('splatter-', ''))
    const centerX = x + width / 2
    const centerY = y + height / 2
    const maxRadius = Math.min(width, height) / 3
    
    // Generate consistent random pattern based on splatter number
    const seed = splatterNum * 12345
    const random = (i: number) => {
      const x = Math.sin(seed + i * 9999) * 10000
      return x - Math.floor(x)
    }
    
    // Draw main splatter blob
    const blobCount = 8 + (splatterNum % 5)
    for (let i = 0; i < blobCount; i++) {
      const angle = (Math.PI * 2 * i) / blobCount + random(i)
      const distance = maxRadius * (0.3 + random(i + 100) * 0.7)
      const radius = maxRadius * (0.1 + random(i + 200) * 0.3)
      
      ctx.beginPath()
      ctx.arc(
        centerX + Math.cos(angle) * distance,
        centerY + Math.sin(angle) * distance,
        radius,
        0, Math.PI * 2
      )
      ctx.fill()
    }
    
    // Add drips
    const dripCount = 3 + (splatterNum % 4)
    for (let i = 0; i < dripCount; i++) {
      const angle = random(i + 300) * Math.PI * 2
      const startDist = maxRadius * 0.8
      const dripLength = maxRadius * (0.5 + random(i + 400) * 0.8)
      
      ctx.beginPath()
      ctx.ellipse(
        centerX + Math.cos(angle) * startDist,
        centerY + Math.sin(angle) * startDist,
        maxRadius * 0.08,
        dripLength,
        angle,
        0, Math.PI * 2
      )
      ctx.fill()
    }
    
    // Add small splatter dots
    const dotCount = 10 + splatterNum * 2
    for (let i = 0; i < dotCount; i++) {
      const angle = random(i + 500) * Math.PI * 2
      const distance = maxRadius * (1.2 + random(i + 600) * 0.8)
      const dotRadius = maxRadius * (0.02 + random(i + 700) * 0.05)
      
      ctx.beginPath()
      ctx.arc(
        centerX + Math.cos(angle) * distance,
        centerY + Math.sin(angle) * distance,
        dotRadius,
        0, Math.PI * 2
      )
      ctx.fill()
    }
    
    ctx.restore()
  }

  const drawWithCorners = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    cornerStyle: string = 'sharp'
  ) => {
    ctx.save()
    ctx.beginPath()
    
    switch (cornerStyle) {
      case 'rounded':
        const radius = Math.min(width, height) * 0.1
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + width - radius, y)
        ctx.arcTo(x + width, y, x + width, y + radius, radius)
        ctx.lineTo(x + width, y + height - radius)
        ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
        ctx.lineTo(x + radius, y + height)
        ctx.arcTo(x, y + height, x, y + height - radius, radius)
        ctx.lineTo(x, y + radius)
        ctx.arcTo(x, y, x + radius, y, radius)
        break
      case 'circular':
        const circleRadius = Math.min(width, height) * 0.5
        ctx.arc(x + width / 2, y + height / 2, circleRadius, 0, Math.PI * 2)
        break
      default: // sharp
        ctx.rect(x, y, width, height)
        break
    }
    
    ctx.closePath()
    ctx.clip()
  }

  const drawShape = (
    ctx: CanvasRenderingContext2D,
    shape: string,
    x: number,
    y: number,
    width: number,
    height: number,
    fillColor: string,
    outlineColor?: string,
    outlineWidth?: number
  ) => {
    ctx.save()
    ctx.fillStyle = fillColor
    
    if (outlineColor && outlineWidth) {
      ctx.strokeStyle = outlineColor
      ctx.lineWidth = outlineWidth
    }
    
    ctx.beginPath()
    
    switch (shape) {
      case 'rectangle':
        ctx.rect(x, y, width, height)
        break
      case 'circle':
        const radius = Math.min(width, height) / 2
        ctx.arc(x + width / 2, y + height / 2, radius, 0, Math.PI * 2)
        break
      case 'ellipse':
        ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2)
        break
      case 'triangle':
        ctx.moveTo(x + width / 2, y)
        ctx.lineTo(x + width, y + height)
        ctx.lineTo(x, y + height)
        ctx.closePath()
        break
      case 'star':
        const centerX = x + width / 2
        const centerY = y + height / 2
        const outerRadius = Math.min(width, height) / 2
        const innerRadius = outerRadius * 0.4
        const spikes = 5
        
        for (let i = 0; i < spikes * 2; i++) {
          const angle = (i * Math.PI) / spikes - Math.PI / 2
          const r = i % 2 === 0 ? outerRadius : innerRadius
          const pointX = centerX + Math.cos(angle) * r
          const pointY = centerY + Math.sin(angle) * r
          
          if (i === 0) {
            ctx.moveTo(pointX, pointY)
          } else {
            ctx.lineTo(pointX, pointY)
          }
        }
        ctx.closePath()
        break
      case 'heart':
        const heartCenterX = x + width / 2
        const heartTopY = y + height * 0.3
        ctx.moveTo(heartCenterX, heartTopY + height * 0.3)
        ctx.bezierCurveTo(
          heartCenterX, heartTopY,
          heartCenterX - width / 2, heartTopY,
          heartCenterX - width / 2, heartTopY + height * 0.3
        )
        ctx.bezierCurveTo(
          heartCenterX - width / 2, heartTopY + height * 0.5,
          heartCenterX, heartTopY + height * 0.7,
          heartCenterX, y + height
        )
        ctx.bezierCurveTo(
          heartCenterX, heartTopY + height * 0.7,
          heartCenterX + width / 2, heartTopY + height * 0.5,
          heartCenterX + width / 2, heartTopY + height * 0.3
        )
        ctx.bezierCurveTo(
          heartCenterX + width / 2, heartTopY,
          heartCenterX, heartTopY,
          heartCenterX, heartTopY + height * 0.3
        )
        ctx.closePath()
        break
      default:
        ctx.rect(x, y, width, height)
        break
    }
    
    ctx.fill()
    if (outlineColor && outlineWidth) {
      ctx.stroke()
    }
    
    ctx.restore()
  }

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imagePreview) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = imageDimensions.width
    canvas.height = imageDimensions.height

    // Check if template image is loaded
    if (!loadedImageRef.current) {
      // Image not loaded yet, will be drawn when it loads
      return
    }

    const img = loadedImageRef.current

    // Apply global corner style to the entire canvas
    ctx.save()
    if (globalCornerStyle && globalCornerStyle !== 'sharp') {
      drawWithCorners(ctx, 0, 0, imageDimensions.width, imageDimensions.height, globalCornerStyle)
    }
    
    // Apply global opacity
    ctx.globalAlpha = globalOpacity / 100
    
    ctx.drawImage(img, 0, 0, imageDimensions.width, imageDimensions.height)
    
    // Reset alpha
    ctx.globalAlpha = 1.0
    ctx.restore()

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

    // Draw confirmed fields with preview content
    fields.forEach(field => {
      if (field.visible === false) return // Skip hidden fields
      
      const isSelected = field.id === selectedFieldId
      
      // Apply rotation transform if field has rotation
      const fieldHeight = getFieldActualHeight(field)
      const centerX = field.x + field.width / 2
      const centerY = field.y + fieldHeight / 2
      const rotation = field.rotation || 0
      
      if (rotation !== 0) {
        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate((rotation * Math.PI) / 180)
        ctx.translate(-centerX, -centerY)
      }
        
      // Draw field content
      if ((field.fieldType === 'image' || field.fieldType === 'logo' || field.fieldType === 'video') && field.imagePreview) {
        // Use cached image if available
        const fieldImg = loadedFieldImagesRef.current.get(field.id)
        if (fieldImg) {
          // Save context before applying any effects
          ctx.save()
          
          // Apply shadow first (before clipping, so shadow appears outside the clipped area)
          if (field.shadow) {
            ctx.shadowColor = field.shadow.color
            ctx.shadowOffsetX = field.shadow.x
            ctx.shadowOffsetY = field.shadow.y
            ctx.shadowBlur = field.shadow.blur
          }
          
          // Apply blend mode
          if (field.blendMode && field.blendMode !== 'normal') {
            ctx.globalCompositeOperation = field.blendMode as GlobalCompositeOperation
          }
          
          // Apply opacity
          ctx.globalAlpha = (field.opacity !== undefined ? field.opacity / 100 : 1.0)
          
          // Apply filters
          if (field.filter && field.filter !== 'none') {
            applyFilter(ctx, field.filter)
          }
          
          // Apply blur
          if (field.blur && field.blur > 0) {
            const currentFilter = ctx.filter !== 'none' ? ctx.filter + ' ' : ''
            ctx.filter = currentFilter + `blur(${field.blur}px)`
          }
          
          // Apply photo effects
          if (field.photoEffect && field.photoEffect !== 'none') {
            applyPhotoEffect(ctx, field.photoEffect)
          }
          
          // Apply corner clipping if specified
          if (field.cornerStyle && field.cornerStyle !== 'sharp') {
            drawWithCorners(ctx, field.x, field.y, field.width, field.height, field.cornerStyle)
          }
          
          // Draw the image with all effects applied
          ctx.drawImage(fieldImg, field.x, field.y, field.width, field.height)
          
          // Restore context (resets all effects)
          ctx.restore()
          
          // Apply texture overlay
          if (field.texture && field.texture !== 'none') {
            applyTexture(ctx, field.texture, field.x, field.y, field.width, field.height)
          }
          
          // Apply paint splatter
          if (field.paintSplatter && field.paintSplatter !== 'none') {
            applyPaintSplatter(ctx, field.paintSplatter, field.x, field.y, field.width, field.height, field.fontColor)
          }
          
          // Draw video play icon overlay for video fields
          if (field.fieldType === 'video') {
            ctx.globalAlpha = 0.8
            const iconSize = Math.min(field.width, field.height) * 0.3
            const iconX = field.x + field.width / 2 - iconSize / 2
            const iconY = field.y + field.height / 2 - iconSize / 2
            
            // Draw semi-transparent circle
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
            ctx.beginPath()
            ctx.arc(field.x + field.width / 2, field.y + field.height / 2, iconSize / 2, 0, Math.PI * 2)
            ctx.fill()
            
            // Draw play triangle
            ctx.fillStyle = '#ffffff'
            ctx.beginPath()
            ctx.moveTo(iconX + iconSize * 0.3, iconY + iconSize * 0.2)
            ctx.lineTo(iconX + iconSize * 0.3, iconY + iconSize * 0.8)
            ctx.lineTo(iconX + iconSize * 0.75, iconY + iconSize * 0.5)
            ctx.closePath()
            ctx.fill()
          }
        }
        
        // Draw border and label (always, regardless of image load status)
        ctx.globalAlpha = 1
        ctx.strokeStyle = isSelected ? '#3b82f6' : 'rgba(107, 114, 128, 0.3)'
        ctx.lineWidth = isSelected ? 2 : 1
        ctx.strokeRect(field.x, field.y, field.width, field.height)
        
        // Label badge
        ctx.fillStyle = isSelected ? '#3b82f6' : 'rgba(107, 114, 128, 0.8)'
        const labelWidth = ctx.measureText(field.fieldLabel).width + 10
        ctx.fillRect(field.x, field.y - 18, labelWidth, 18)
        ctx.fillStyle = '#ffffff'
        ctx.font = '12px Arial'
        ctx.fillText(field.fieldLabel, field.x + 5, field.y - 5)
        
        // Draw resize handles if selected
        if (isSelected) {
          drawResizeHandles(ctx, field)
          drawCenterIndicator(ctx, field)
          drawDimensions(ctx, field)
        }
      } else if (field.fieldType === 'text' || field.fieldType === 'number') {
        // Draw text/number preview
        ctx.save()
        
        // Apply blend mode
        if (field.blendMode && field.blendMode !== 'normal') {
          ctx.globalCompositeOperation = field.blendMode as GlobalCompositeOperation
        }
        
        // Apply opacity
        ctx.globalAlpha = (field.opacity !== undefined ? field.opacity / 100 : 1.0)
        
        ctx.font = `${field.fontWeight} ${field.fontSize}px ${field.fontFamily}`
        ctx.fillStyle = field.fontColor
        ctx.textAlign = field.textAlign as CanvasTextAlign
        ctx.textBaseline = 'middle'
        
        const previewText = field.defaultValue || `${field.fieldLabel}`
        const metrics = ctx.measureText(previewText)
        // Calculate actual text height using font size and metrics
        const actualTextHeight = field.fontSize * 1.2 // Approximate text height with some padding
        
        // Use the calculated text height for positioning
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
        
        // Label badge
        ctx.fillStyle = isSelected ? '#3b82f6' : 'rgba(107, 114, 128, 0.8)'
        const labelWidth = ctx.measureText(field.fieldLabel).width + 10
        ctx.fillRect(field.x, field.y - 18, labelWidth, 18)
        ctx.fillStyle = '#ffffff'
        ctx.font = '12px Arial'
        ctx.fillText(field.fieldLabel, field.x + 5, field.y - 5)
        
        // Draw resize handles if selected (with actual text height)
        if (isSelected) {
          const fieldWithTextHeight = { ...field, height: actualTextHeight }
          drawResizeHandles(ctx, fieldWithTextHeight)
          drawCenterIndicator(ctx, fieldWithTextHeight)
          drawDimensions(ctx, fieldWithTextHeight)
        }
      } else if (field.fieldType === 'photo-effect' || field.fieldType === 'filter' || field.fieldType === 'texture' || field.fieldType === 'paint-splatter') {
        // Draw effect-type fields as image overlays
        if (field.effectFilePath) {
          const effectImg = loadedEffectImagesRef.current.get(field.effectFilePath)
          if (effectImg) {
            ctx.save()
            ctx.globalAlpha = (field.opacity !== undefined ? field.opacity / 100 : 1.0)
            
            // Draw the effect image
            ctx.drawImage(
              effectImg,
              field.x,
              field.y,
              field.width,
              field.height
            )
            ctx.restore()
          }
        }
        
        // Draw border and label
        ctx.strokeStyle = isSelected ? '#3b82f6' : 'rgba(147, 51, 234, 0.3)'
        ctx.lineWidth = isSelected ? 2 : 1
        ctx.strokeRect(field.x, field.y, field.width, field.height)
        
        // Label badge
        ctx.fillStyle = isSelected ? '#3b82f6' : 'rgba(147, 51, 234, 0.8)'
        const labelWidth = ctx.measureText(field.fieldLabel).width + 10
        ctx.fillRect(field.x, field.y - 18, labelWidth, 18)
        ctx.fillStyle = '#ffffff'
        ctx.font = '12px Arial'
        ctx.fillText(field.fieldLabel, field.x + 5, field.y - 5)
        
        // Draw resize handles if selected
        if (isSelected) {
          drawResizeHandles(ctx, field)
          drawCenterIndicator(ctx, field)
          drawDimensions(ctx, field)
        }
      }
      
      // Restore rotation transform
      if (rotation !== 0) {
        ctx.restore()
      }
      })

      // Draw staging element with actual content
      if (stagingElement) {
      // Apply rotation transform if staging element has rotation
      const stagingHeight = (stagingElement.type === 'text' || stagingElement.type === 'number') 
        ? stagingElement.fontSize * 1.2 
        : stagingElement.height
      const stagingCenterX = stagingElement.x + stagingElement.width / 2
      const stagingCenterY = stagingElement.y + stagingHeight / 2
      const stagingRotation = stagingElement.rotation || 0
      
      if (stagingRotation !== 0) {
        ctx.save()
        ctx.translate(stagingCenterX, stagingCenterY)
        ctx.rotate((stagingRotation * Math.PI) / 180)
        ctx.translate(-stagingCenterX, -stagingCenterY)
      }
      
      // Draw the actual content
      if ((stagingElement.type === 'image' || stagingElement.type === 'logo' || stagingElement.type === 'video') && stagingElement.imagePreview) {
        // Use cached image if available
        const elemImg = loadedStagingImageRef.current
        if (elemImg) {
          ctx.save()
          
          // Apply corner clipping if specified
          if (stagingElement.cornerStyle && stagingElement.cornerStyle !== 'sharp') {
            drawWithCorners(ctx, stagingElement.x, stagingElement.y, stagingElement.width, stagingElement.height, stagingElement.cornerStyle)
          }
          
          // Apply filters
          if (stagingElement.filter && stagingElement.filter !== 'none') {
            applyFilter(ctx, stagingElement.filter)
          }
          
          // Apply photo effects
          if (stagingElement.photoEffect && stagingElement.photoEffect !== 'none') {
            applyPhotoEffect(ctx, stagingElement.photoEffect)
          }
          
          // Apply shadow
          if (stagingElement.shadow) {
            ctx.shadowColor = stagingElement.shadow.color
            ctx.shadowOffsetX = stagingElement.shadow.x
            ctx.shadowOffsetY = stagingElement.shadow.y
            ctx.shadowBlur = stagingElement.shadow.blur
          }
          
          ctx.globalAlpha = (stagingElement.opacity !== undefined ? stagingElement.opacity / 100 : 1.0)
          ctx.drawImage(elemImg, stagingElement.x, stagingElement.y, stagingElement.width, stagingElement.height)
          
          // Reset shadow
          ctx.shadowColor = 'transparent'
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 0
          ctx.shadowBlur = 0
          
          // Reset filters
          ctx.filter = 'none'
          ctx.restore()
          
          // Apply texture overlay
          if (stagingElement.texture && stagingElement.texture !== 'none') {
            applyTexture(ctx, stagingElement.texture, stagingElement.x, stagingElement.y, stagingElement.width, stagingElement.height)
          }
          
          // Apply paint splatter
          if (stagingElement.paintSplatter && stagingElement.paintSplatter !== 'none') {
            applyPaintSplatter(ctx, stagingElement.paintSplatter, stagingElement.x, stagingElement.y, stagingElement.width, stagingElement.height, stagingElement.fontColor)
          }
          
          // Draw video play icon overlay for video fields
          if (stagingElement.type === 'video') {
            ctx.globalAlpha = 0.8
            const iconSize = Math.min(stagingElement.width, stagingElement.height) * 0.3
            const iconX = stagingElement.x + stagingElement.width / 2 - iconSize / 2
            const iconY = stagingElement.y + stagingElement.height / 2 - iconSize / 2
            
            // Draw semi-transparent circle
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
            ctx.beginPath()
            ctx.arc(stagingElement.x + stagingElement.width / 2, stagingElement.y + stagingElement.height / 2, iconSize / 2, 0, Math.PI * 2)
            ctx.fill()
            
            // Draw play triangle
            ctx.fillStyle = '#ffffff'
            ctx.beginPath()
            ctx.moveTo(iconX + iconSize * 0.3, iconY + iconSize * 0.2)
            ctx.lineTo(iconX + iconSize * 0.3, iconY + iconSize * 0.8)
            ctx.lineTo(iconX + iconSize * 0.75, iconY + iconSize * 0.5)
            ctx.closePath()
            ctx.fill()
          }
        }
        
        // Draw blue border (full opacity) - always, regardless of image load status
        ctx.globalAlpha = 1
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 3
        ctx.strokeRect(stagingElement.x, stagingElement.y, stagingElement.width, stagingElement.height)
        
        // Draw resize handles, center indicator, and dimensions
        drawResizeHandles(ctx, stagingElement)
        drawCenterIndicator(ctx, stagingElement)
        drawDimensions(ctx, stagingElement)
      } else if (stagingElement.type === 'shape') {
        // Draw shape
        drawShape(
          ctx,
          stagingElement.shape || 'rectangle',
          stagingElement.x,
          stagingElement.y,
          stagingElement.width,
          stagingElement.height,
          stagingElement.fontColor,
          stagingElement.outlineColor,
          stagingElement.outlineWidth
        )
        
        // Draw blue border
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 3
        ctx.strokeRect(stagingElement.x, stagingElement.y, stagingElement.width, stagingElement.height)
        
        // Draw resize handles, center indicator, and dimensions
        drawResizeHandles(ctx, stagingElement)
        drawCenterIndicator(ctx, stagingElement)
        drawDimensions(ctx, stagingElement)
      } else if (stagingElement.type === 'photo-effect' || stagingElement.type === 'filter' || stagingElement.type === 'texture' || stagingElement.type === 'paint-splatter') {
        // Draw effect/filter/texture/splatter as an image overlay
        ctx.save()
        
        // If we have an effectFilePath, try to load and render the image
        if (stagingElement.effectFilePath) {
          loadEffectImage(stagingElement.effectFilePath).then(img => {
            ctx.save()
            ctx.globalAlpha = (stagingElement.opacity !== undefined ? stagingElement.opacity / 100 : 1.0)
            
            // Draw the effect image
            ctx.drawImage(
              img,
              stagingElement.x,
              stagingElement.y,
              stagingElement.width,
              stagingElement.height
            )
            ctx.restore()
            
            // Redraw the canvas to show the loaded image
            if (canvasRef.current) {
              drawCanvas()
            }
          }).catch(err => {
            console.error('Failed to load effect image:', err)
          })
        }
        
        // Draw a semi-transparent colored rectangle as background to show the effect area (while loading)
        ctx.fillStyle = 'rgba(147, 51, 234, 0.05)' // Very light purple tint
        ctx.fillRect(stagingElement.x, stagingElement.y, stagingElement.width, stagingElement.height)
        
        ctx.restore()
        
        // Draw label text showing effect name (small, in corner)
        ctx.save()
        ctx.font = 'bold 12px Arial'
        ctx.fillStyle = '#7c3aed'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(stagingElement.content, stagingElement.x + 8, stagingElement.y + 8)
        ctx.restore()
        
        // Draw purple border
        ctx.strokeStyle = '#7c3aed'
        ctx.lineWidth = 3
        ctx.setLineDash([8, 4])
        ctx.strokeRect(stagingElement.x, stagingElement.y, stagingElement.width, stagingElement.height)
        ctx.setLineDash([])
        
        // Draw resize handles, center indicator, and dimensions
        drawResizeHandles(ctx, stagingElement)
        drawCenterIndicator(ctx, stagingElement)
        drawDimensions(ctx, stagingElement)
      } else {
        // Draw text/number
        ctx.save()
        
        // Setup text style
        ctx.font = `${stagingElement.fontWeight} ${stagingElement.fontSize}px ${stagingElement.fontFamily}`
        ctx.fillStyle = stagingElement.fontColor
        ctx.textAlign = stagingElement.textAlign as CanvasTextAlign
        ctx.textBaseline = 'middle'
        
        // Calculate actual text height
        const metrics = ctx.measureText(stagingElement.content)
        const actualTextHeight = stagingElement.fontSize * 1.2 // Approximate text height with some padding
        
        // Calculate text position based on alignment
        let textX = stagingElement.x
        if (stagingElement.textAlign === 'center') {
          textX = stagingElement.x + stagingElement.width / 2
        } else if (stagingElement.textAlign === 'right') {
          textX = stagingElement.x + stagingElement.width
        }
        
        const textY = stagingElement.y + actualTextHeight / 2
        
        // Draw text
        ctx.fillText(stagingElement.content, textX, textY)
        
        ctx.restore()
        
        // Draw blue border with actual text height
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 3
        ctx.strokeRect(stagingElement.x, stagingElement.y, stagingElement.width, actualTextHeight)
        
        // Draw resize handles, center indicator, and dimensions with actual text height
        const elementWithTextHeight = { ...stagingElement, height: actualTextHeight }
        drawResizeHandles(ctx, elementWithTextHeight)
        drawCenterIndicator(ctx, elementWithTextHeight)
        drawDimensions(ctx, elementWithTextHeight)
      }
      
      // Restore rotation transform for staging element
      if (stagingRotation !== 0) {
        ctx.restore()
      }
    }
  }, [imagePreview, imageDimensions, fields, selectedFieldId, stagingElement, globalOpacity, globalCornerStyle, alignmentGuides])

  // Redraw canvas when fields or drawCanvas changes (for effects, opacity, blur, etc.)
  useEffect(() => {
    if (canvasRef.current) {
      drawCanvas()
    }
  }, [drawCanvas])

  // Force redraw when field properties change (filters, opacity, blur, etc.)
  useEffect(() => {
    if (canvasRef.current && fields.length > 0) {
      // Use a small delay to ensure state updates have propagated
      const timer = setTimeout(() => {
        drawCanvas()
      }, 10)
      return () => clearTimeout(timer)
    }
  }, [fields])

  const drawResizeHandles = (ctx: CanvasRenderingContext2D, element: StagingElement | TemplateField) => {
    const handleSize = 28 // Much larger for easier grabbing
    const midX = element.x + element.width / 2
    const midY = element.y + element.height / 2
    
    // 10 resize handles: 4 corners + 4 edge midpoints + 2 quarter points
    const handles = [
      // 4 corners
      { x: element.x, y: element.y, name: 'nw' },
      { x: element.x + element.width, y: element.y, name: 'ne' },
      { x: element.x, y: element.y + element.height, name: 'sw' },
      { x: element.x + element.width, y: element.y + element.height, name: 'se' },
      // 4 edge midpoints
      { x: midX, y: element.y, name: 'n' },
      { x: element.x + element.width, y: midY, name: 'e' },
      { x: midX, y: element.y + element.height, name: 's' },
      { x: element.x, y: midY, name: 'w' },
      // 2 additional quarter points on top and bottom for better control
      { x: element.x + element.width * 0.25, y: element.y, name: 'nq1' },
      { x: element.x + element.width * 0.75, y: element.y + element.height, name: 'sq2' }
    ]
    
    ctx.lineWidth = 3
    
    handles.forEach(handle => {
      // Draw outer glow for better visibility
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'
      ctx.fillRect(
        handle.x - handleSize / 2 - 4,
        handle.y - handleSize / 2 - 4,
        handleSize + 8,
        handleSize + 8
      )
      
      // Draw main handle
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      )
      
      // Draw border
      ctx.strokeStyle = '#3b82f6'
      ctx.strokeRect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      )
      
      // Draw center dot for extra clarity
      ctx.fillStyle = '#3b82f6'
      ctx.beginPath()
      ctx.arc(handle.x, handle.y, 4, 0, Math.PI * 2)
      ctx.fill()
    })
    
    // Draw rotation handle above the element
    const rotateHandleY = element.y - 50
    const rotateHandleX = midX
    const rotateHandleSize = 32
    
    // Draw connection line from element to rotation handle
    ctx.strokeStyle = '#3b82f6'
    ctx.setLineDash([5, 5])
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(midX, element.y)
    ctx.lineTo(rotateHandleX, rotateHandleY)
    ctx.stroke()
    ctx.setLineDash([])
    
    // Draw rotation handle background (circular)
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'
    ctx.beginPath()
    ctx.arc(rotateHandleX, rotateHandleY, rotateHandleSize / 2 + 4, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw main circle
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(rotateHandleX, rotateHandleY, rotateHandleSize / 2, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw circle border
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(rotateHandleX, rotateHandleY, rotateHandleSize / 2, 0, Math.PI * 2)
    ctx.stroke()
    
    // Draw rotation arrow icon inside
    ctx.save()
    ctx.translate(rotateHandleX, rotateHandleY)
    ctx.strokeStyle = '#3b82f6'
    ctx.fillStyle = '#3b82f6'
    ctx.lineWidth = 2.5
    
    // Draw circular arrow
    ctx.beginPath()
    ctx.arc(0, 0, 8, -Math.PI / 4, Math.PI * 1.5, false)
    ctx.stroke()
    
    // Draw arrowhead
    const arrowSize = 5
    ctx.beginPath()
    ctx.moveTo(-8 * Math.cos(Math.PI / 4), -8 * Math.sin(Math.PI / 4))
    ctx.lineTo(-8 * Math.cos(Math.PI / 4) - arrowSize, -8 * Math.sin(Math.PI / 4) - arrowSize * 0.5)
    ctx.lineTo(-8 * Math.cos(Math.PI / 4) + arrowSize * 0.5, -8 * Math.sin(Math.PI / 4) - arrowSize)
    ctx.closePath()
    ctx.fill()
    
    ctx.restore()
  }

  // Helper function to load effect images
  const loadEffectImage = (filePath: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      // Check cache first
      if (loadedEffectImagesRef.current.has(filePath)) {
        resolve(loadedEffectImagesRef.current.get(filePath)!)
        return
      }

      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        loadedEffectImagesRef.current.set(filePath, img)
        resolve(img)
      }
      img.onerror = () => {
        console.error(`Failed to load effect image: ${filePath}`)
        reject(new Error(`Failed to load effect image: ${filePath}`))
      }
      img.src = filePath
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

  // Helper function to get actual height for a field
  const getFieldActualHeight = (field: TemplateField) => {
    if (field.fieldType === 'text' || field.fieldType === 'number') {
      return field.fontSize * 1.2 // Match the rendering logic
    }
    return field.height
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e)

    // If there's a staging element, handle interaction with it
    if (stagingElement) {
      const handleSize = 28 // Match the visual handle size (larger now)
      const stagingHeight = (stagingElement.type === 'text' || stagingElement.type === 'number') 
        ? stagingElement.fontSize * 1.2 
        : stagingElement.height
      
      const midX = stagingElement.x + stagingElement.width / 2
      const midY = stagingElement.y + stagingElement.height / 2

      // Check rotation handle first (priority over other handles)
      const rotateHandleY = stagingElement.y - 50
      const rotateHandleX = midX
      const rotateHandleSize = 32
      const distToRotateHandle = Math.sqrt(
        Math.pow(coords.x - rotateHandleX, 2) + Math.pow(coords.y - rotateHandleY, 2)
      )
      
      if (distToRotateHandle < rotateHandleSize / 2) {
        setIsRotating(true)
        // Calculate initial angle
        const angle = Math.atan2(coords.y - midY, coords.x - midX) * (180 / Math.PI)
        setRotationStartAngle(angle - (stagingElement.rotation || 0))
        return
      }

      // All 10 handles: 4 corners + 4 edge midpoints + 2 quarter points
      const handles = [
        { name: 'nw', x: stagingElement.x, y: stagingElement.y },
        { name: 'ne', x: stagingElement.x + stagingElement.width, y: stagingElement.y },
        { name: 'sw', x: stagingElement.x, y: stagingElement.y + stagingHeight },
        { name: 'se', x: stagingElement.x + stagingElement.width, y: stagingElement.y + stagingHeight },
        { name: 'n', x: midX, y: stagingElement.y },
        { name: 'e', x: stagingElement.x + stagingElement.width, y: midY },
        { name: 's', x: midX, y: stagingElement.y + stagingHeight },
        { name: 'w', x: stagingElement.x, y: midY },
        { name: 'nq1', x: stagingElement.x + stagingElement.width * 0.25, y: stagingElement.y },
        { name: 'sq2', x: stagingElement.x + stagingElement.width * 0.75, y: stagingElement.y + stagingHeight }
      ]

      // Check if clicking on resize handle (increased detection area)
      for (const handle of handles) {
        if (
          Math.abs(coords.x - handle.x) < handleSize &&
          Math.abs(coords.y - handle.y) < handleSize
        ) {
          setResizeHandle(handle.name)
          return
        }
      }

      // Check if clicking inside staging element (to move it)
      if (
        coords.x >= stagingElement.x &&
        coords.x <= stagingElement.x + stagingElement.width &&
        coords.y >= stagingElement.y &&
        coords.y <= stagingElement.y + stagingHeight
      ) {
        setDragOffset({
          x: coords.x - stagingElement.x,
          y: coords.y - stagingElement.y
        })
        return
      }
    }

    // Check if clicking on resize handle of selected field
    const selectedField = fields.find(f => f.id === selectedFieldId)
    if (selectedField) {
      const selectedHeight = getFieldActualHeight(selectedField)
      const handleSize = 28 // Match the visual handle size (larger now)
      
      const midX = selectedField.x + selectedField.width / 2
      const midY = selectedField.y + selectedHeight / 2
      
      // Check rotation handle first (priority over other handles)
      const rotateHandleY = selectedField.y - 50
      const rotateHandleX = midX
      const rotateHandleSize = 32
      const distToRotateHandle = Math.sqrt(
        Math.pow(coords.x - rotateHandleX, 2) + Math.pow(coords.y - rotateHandleY, 2)
      )
      
      if (distToRotateHandle < rotateHandleSize / 2) {
        setIsRotating(true)
        // Calculate initial angle
        const angle = Math.atan2(coords.y - midY, coords.x - midX) * (180 / Math.PI)
        setRotationStartAngle(angle - (selectedField.rotation || 0))
        return
      }
      
      // All 10 handles: 4 corners + 4 edge midpoints + 2 quarter points
      const handles = [
        { name: 'nw', x: selectedField.x, y: selectedField.y },
        { name: 'ne', x: selectedField.x + selectedField.width, y: selectedField.y },
        { name: 'sw', x: selectedField.x, y: selectedField.y + selectedHeight },
        { name: 'se', x: selectedField.x + selectedField.width, y: selectedField.y + selectedHeight },
        { name: 'n', x: midX, y: selectedField.y },
        { name: 'e', x: selectedField.x + selectedField.width, y: midY },
        { name: 's', x: midX, y: selectedField.y + selectedHeight },
        { name: 'w', x: selectedField.x, y: midY },
        { name: 'nq1', x: selectedField.x + selectedField.width * 0.25, y: selectedField.y },
        { name: 'sq2', x: selectedField.x + selectedField.width * 0.75, y: selectedField.y + selectedHeight }
      ]

      for (const handle of handles) {
        if (
          Math.abs(coords.x - handle.x) < handleSize &&
          Math.abs(coords.y - handle.y) < handleSize
        ) {
          setResizeHandle(handle.name)
          return
        }
      }

      // Check if clicking inside selected field (to move it)
      if (
        coords.x >= selectedField.x &&
        coords.x <= selectedField.x + selectedField.width &&
        coords.y >= selectedField.y &&
        coords.y <= selectedField.y + selectedHeight
      ) {
        setDragOffset({
          x: coords.x - selectedField.x,
          y: coords.y - selectedField.y
        })
        return
      }
    }

    // Check if clicking on any field (use actual height for text/number fields)
    const clickedField = [...fields].reverse().find(field => {
      if (field.visible === false) return false
      
      const fieldHeight = getFieldActualHeight(field)
      return (
        coords.x >= field.x &&
        coords.x <= field.x + field.width &&
        coords.y >= field.y &&
        coords.y <= field.y + fieldHeight
      )
    })

    if (clickedField) {
      setSelectedFieldId(clickedField.id)
      setDragOffset({
        x: coords.x - clickedField.x,
        y: coords.y - clickedField.y
      })
    } else {
      setSelectedFieldId(null)
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e)

    // Get alignment values from other elements (edges and centers)
    const otherXValues: number[] = []
    const otherYValues: number[] = []
    fields.forEach(f => {
      const fHeight = getFieldActualHeight(f)
      otherXValues.push(f.x, f.x + f.width, f.x + f.width / 2) // left, right, center
      otherYValues.push(f.y, f.y + fHeight, f.y + fHeight / 2) // top, bottom, center
    })
    // Add canvas centers
    otherXValues.push(imageDimensions.width / 2)
    otherYValues.push(imageDimensions.height / 2)

    // Handle staging element rotation
    if (stagingElement && isRotating) {
      const midX = stagingElement.x + stagingElement.width / 2
      const stagingHeight = (stagingElement.type === 'text' || stagingElement.type === 'number') 
        ? stagingElement.fontSize * 1.2 
        : stagingElement.height
      const midY = stagingElement.y + stagingHeight / 2
      
      // Calculate angle from center to mouse
      const angle = Math.atan2(coords.y - midY, coords.x - midX) * (180 / Math.PI)
      let newRotation = angle - rotationStartAngle
      
      // Snap to 15-degree increments
      newRotation = Math.round(newRotation / 15) * 15
      
      setStagingElement({
        ...stagingElement,
        rotation: newRotation
      })
      return
    }
    
    // Handle staging element interactions
    if (stagingElement && dragOffset && !resizeHandle) {
      // Get actual height for text/number staging elements
      const stagingHeight = (stagingElement.type === 'text' || stagingElement.type === 'number') 
        ? stagingElement.fontSize * 1.2 
        : stagingElement.height

      // Move staging element (no boundary restrictions - allow hanging off canvas)
      let newX = coords.x - dragOffset.x
      let newY = coords.y - dragOffset.y
      
      // Apply snapping and collect guides
      const guides: AlignmentGuide[] = []
      
      // Snap X position (left edge, right edge, and center)
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
      
      // Snap Y position (top edge, bottom edge, and center)
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
    } else if (stagingElement && resizeHandle) {
      // Resize staging element
      const newElement = { ...stagingElement }
      
      if (resizeHandle.includes('e')) {
        newElement.width = Math.max(50, snapToGrid(coords.x - stagingElement.x))
      }
      if (resizeHandle.includes('w')) {
        const newX = Math.min(coords.x, stagingElement.x + stagingElement.width - 50)
        newElement.width = stagingElement.width + (stagingElement.x - newX)
        newElement.x = snapToGrid(newX)
      }
      if (resizeHandle.includes('s')) {
        newElement.height = Math.max(30, snapToGrid(coords.y - stagingElement.y))
      }
      if (resizeHandle.includes('n')) {
        const newY = Math.min(coords.y, stagingElement.y + stagingElement.height - 30)
        newElement.height = stagingElement.height + (stagingElement.y - newY)
        newElement.y = snapToGrid(newY)
      }
      
      setStagingElement(newElement)
    } else if (isRotating && selectedFieldId) {
      // Handle field rotation
      const selectedField = fields.find(f => f.id === selectedFieldId)
      if (selectedField) {
        const midX = selectedField.x + selectedField.width / 2
        const fieldHeight = getFieldActualHeight(selectedField)
        const midY = selectedField.y + fieldHeight / 2
        
        // Calculate angle from center to mouse
        const angle = Math.atan2(coords.y - midY, coords.x - midX) * (180 / Math.PI)
        let newRotation = angle - rotationStartAngle
        
        // Snap to 15-degree increments
        newRotation = Math.round(newRotation / 15) * 15
        
        setFields(fields.map(field => 
          field.id === selectedFieldId 
            ? { ...field, rotation: newRotation }
            : field
        ))
      }
      return
    } else if (dragOffset && selectedFieldId && !resizeHandle) {
      // Move field with snapping
      const guides: AlignmentGuide[] = []
      
      setFields(fields.map(field => {
        if (field.id === selectedFieldId) {
          const fieldHeight = getFieldActualHeight(field)
          // No boundary restrictions - allow hanging off canvas
          let newX = coords.x - dragOffset.x
          let newY = coords.y - dragOffset.y
          
          // Filter out the current field's positions from alignment values
          const otherFieldsX = otherXValues.filter(v => !([field.x, field.x + field.width, field.x + field.width / 2].includes(v)))
          const otherFieldsY = otherYValues.filter(v => !([field.y, field.y + fieldHeight, field.y + fieldHeight / 2].includes(v)))
          
          // Snap X position (left edge, right edge, and center)
          const leftSnap = snapToNearby(newX, otherFieldsX)
          const rightSnap = snapToNearby(newX + field.width, otherFieldsX)
          const centerXSnap = snapToNearby(newX + field.width / 2, otherFieldsX)
          
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
          
          // Snap Y position (top edge, bottom edge, and center)
          const topSnap = snapToNearbyY(newY, otherFieldsY)
          const bottomSnap = snapToNearbyY(newY + fieldHeight, otherFieldsY)
          const centerYSnap = snapToNearbyY(newY + fieldHeight / 2, otherFieldsY)
          
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
          
          return {
            ...field,
            x: newX,
            y: newY
          }
        }
        return field
      }))
      
      setAlignmentGuides(guides)
    } else if (resizeHandle && selectedFieldId) {
      // Resize field
      setFields(fields.map(field => {
        if (field.id === selectedFieldId) {
          const newField = { ...field }
          
          if (resizeHandle.includes('e')) {
            newField.width = Math.max(50, snapToGrid(coords.x - field.x))
          }
          if (resizeHandle.includes('w')) {
            const newX = Math.min(coords.x, field.x + field.width - 50)
            newField.width = field.width + (field.x - newX)
            newField.x = snapToGrid(newX)
          }
          if (resizeHandle.includes('s')) {
            newField.height = Math.max(30, snapToGrid(coords.y - field.y))
          }
          if (resizeHandle.includes('n')) {
            const newY = Math.min(coords.y, field.y + field.height - 30)
            newField.height = field.height + (field.y - newY)
            newField.y = snapToGrid(newY)
          }
          
          return newField
        }
        return field
      }))
    }
  }

  const handleCanvasMouseUp = () => {
    setDragOffset(null)
    setResizeHandle(null)
    setIsRotating(false)
    setAlignmentGuides([]) // Clear alignment guides when mouse is released
  }

  // Create a staging element for text or number
  const createTextElement = (type: 'text' | 'number') => {
    if (stagingElement) {
      toast({
        title: 'Please complete current element',
        description: 'Confirm or cancel the current element before adding a new one',
        variant: 'destructive'
      })
      return
    }

    const centerX = imageDimensions.width / 2 - 150
    const centerY = imageDimensions.height / 2 - 25

    setStagingElement({
      id: `staging-${Date.now()}`,
      type,
      x: Math.max(50, centerX),
      y: Math.max(50, centerY),
      width: 300,
      height: 50,
      fontSize: 36,
      fontFamily: 'Arial',
      fontColor: '#000000',
      fontWeight: 'bold',
      textAlign: 'center',
      opacity: 100,
      rotation: 0,
      content: type === 'text' ? 'Sample Text' : '123'
    })
    setEditorMode('select')
  }

  // Create a staging element for image
  const createImageElement = () => {
    if (stagingElement) {
      toast({
        title: 'Please complete current element',
        description: 'Confirm or cancel the current element before adding a new one',
        variant: 'destructive'
      })
      return
    }

    // Directly open file picker
    stagingImageInputRef.current?.click()
  }

  const createLogoElement = () => {
    if (stagingElement) {
      toast({
        title: 'Please complete current element',
        description: 'Confirm or cancel the current element before adding a new one',
        variant: 'destructive'
      })
      return
    }

    if (!branding?.logoUrl) {
      toast({
        title: 'No logo uploaded',
        description: 'Please upload a workspace logo first in the branding section',
        variant: 'destructive'
      })
      return
    }

    // Position in top right corner by default at 300x300
    const logoWidth = 300
    const logoHeight = 300
    const padding = 20

    setStagingElement({
      id: `staging-${Date.now()}`,
      type: 'logo',
      x: imageDimensions.width - logoWidth - padding,
      y: padding,
      width: logoWidth,
      height: logoHeight,
      fontSize: 24,
      fontFamily: 'Arial',
      fontColor: '#000000',
      fontWeight: 'normal',
      textAlign: 'left',
      opacity: 100,
      rotation: 0,
      content: 'Logo',
      imagePreview: branding.logoUrl
    })
  }

  const createVideoElement = () => {
    if (stagingElement) {
      toast({
        title: 'Please complete current element',
        description: 'Confirm or cancel the current element before adding a new one',
        variant: 'destructive'
      })
      return
    }

    stagingVideoInputRef.current?.click()
  }

  const createShapeElement = () => {
    if (stagingElement) {
      toast({
        title: 'Please complete current element',
        description: 'Confirm or cancel the current element before adding a new one',
        variant: 'destructive'
      })
      return
    }

    const centerX = imageDimensions.width / 2 - 100
    const centerY = imageDimensions.height / 2 - 100

    setStagingElement({
      id: `staging-${Date.now()}`,
      type: 'shape',
      x: Math.max(50, centerX),
      y: Math.max(50, centerY),
      width: 200,
      height: 200,
      fontSize: 0,
      fontFamily: 'Arial',
      fontColor: '#3b82f6',
      fontWeight: 'normal',
      textAlign: 'center',
      opacity: 100,
      rotation: 0,
      content: 'Shape',
      shape: 'rectangle',
      outlineColor: '#000000',
      outlineWidth: 2
    })
    setEditorMode('select')
  }

  const createPhotoEffectElement = (effectValue: string) => {
    if (stagingElement) {
      toast({
        title: 'Please complete current element',
        description: 'Confirm or cancel the current element before adding a new one',
        variant: 'destructive'
      })
      return
    }

    // Find the file path for this effect
    const effect = PHOTO_EFFECTS.find(e => e.value === effectValue)
    const effectFilePath = effect?.file || ''
    const effectLabel = effect?.label || effectValue

    // Make these MUCH larger - 900x900 default for better visibility
    const centerX = imageDimensions.width / 2 - 450
    const centerY = imageDimensions.height / 2 - 450

    // Add directly to fields without staging - makes it immediately movable
    const newField: TemplateField = {
      id: `photo-effect-${Date.now()}`,
      fieldName: effectLabel,
      fieldLabel: effectLabel,
      fieldType: 'photo-effect',
      x: Math.max(50, centerX),
      y: Math.max(50, centerY),
      width: 900,
      height: 900,
      fontSize: 0,
      fontFamily: 'Arial',
      fontColor: '#000000',
      fontWeight: 'normal',
      textAlign: 'center',
      opacity: 0.7,
      rotation: 0,
      isRequired: false,
      order: fields.length,
      photoEffect: effectValue,
      effectValue,
      effectFilePath,
      visible: true
    }
    
    setFields([...fields, newField])
    setSelectedFieldId(newField.id)
    setEditorMode('select')
  }

  const createFilterElement = (filterValue: string) => {
    if (stagingElement) {
      toast({
        title: 'Please complete current element',
        description: 'Confirm or cancel the current element before adding a new one',
        variant: 'destructive'
      })
      return
    }

    // Find the file path for this filter
    const filter = FILTERS.find(f => f.value === filterValue)
    const effectFilePath = filter?.file || ''
    const effectLabel = filter?.label || filterValue

    // Make these MUCH larger - 1100x900 for better control
    const centerX = imageDimensions.width / 2 - 550
    const centerY = imageDimensions.height / 2 - 450

    // Add directly to fields without staging - makes it immediately movable
    const newField: TemplateField = {
      id: `filter-${Date.now()}`,
      fieldName: effectLabel,
      fieldLabel: effectLabel,
      fieldType: 'filter',
      x: Math.max(50, centerX),
      y: Math.max(50, centerY),
      width: 1100,
      height: 900,
      fontSize: 0,
      fontFamily: 'Arial',
      fontColor: '#000000',
      fontWeight: 'normal',
      textAlign: 'center',
      opacity: 0.5,
      rotation: 0,
      isRequired: false,
      order: fields.length,
      filter: filterValue,
      effectValue: filterValue,
      effectFilePath,
      visible: true
    }
    
    setFields([...fields, newField])
    setSelectedFieldId(newField.id)
    setEditorMode('select')
  }

  const createTextureElement = (textureValue: string) => {
    if (stagingElement) {
      toast({
        title: 'Please complete current element',
        description: 'Confirm or cancel the current element before adding a new one',
        variant: 'destructive'
      })
      return
    }

    // Find the file path for this texture
    const texture = TEXTURES.find(t => t.value === textureValue)
    const effectFilePath = texture?.file || ''
    const effectLabel = texture?.label || textureValue

    // Make these MUCH larger - 1000x1000 for textures
    const centerX = imageDimensions.width / 2 - 500
    const centerY = imageDimensions.height / 2 - 500

    // Add directly to fields without staging - makes it immediately movable
    const newField: TemplateField = {
      id: `texture-${Date.now()}`,
      fieldName: effectLabel,
      fieldLabel: effectLabel,
      fieldType: 'texture',
      x: Math.max(50, centerX),
      y: Math.max(50, centerY),
      width: 1000,
      height: 1000,
      fontSize: 0,
      fontFamily: 'Arial',
      fontColor: '#000000',
      fontWeight: 'normal',
      textAlign: 'center',
      opacity: 0.4,
      rotation: 0,
      isRequired: false,
      order: fields.length,
      texture: textureValue,
      effectValue: textureValue,
      effectFilePath,
      visible: true
    }
    
    setFields([...fields, newField])
    setSelectedFieldId(newField.id)
    setEditorMode('select')
  }

  const createPaintSplatterElement = (splatterValue: string) => {
    if (stagingElement) {
      toast({
        title: 'Please complete current element',
        description: 'Confirm or cancel the current element before adding a new one',
        variant: 'destructive'
      })
      return
    }

    // Find the file path for this splatter
    const splatter = PAINT_SPLATTERS.find(s => s.value === splatterValue)
    const effectFilePath = splatter?.file || ''
    const effectLabel = splatter?.label || splatterValue

    // Make these MUCH larger - 850x850 for splatters
    const centerX = imageDimensions.width / 2 - 425
    const centerY = imageDimensions.height / 2 - 425

    // Add directly to fields without staging - makes it immediately movable
    const newField: TemplateField = {
      id: `paint-splatter-${Date.now()}`,
      fieldName: effectLabel,
      fieldLabel: effectLabel,
      fieldType: 'paint-splatter',
      x: Math.max(50, centerX),
      y: Math.max(50, centerY),
      width: 850,
      height: 850,
      fontSize: 0,
      fontFamily: 'Arial',
      fontColor: '#000000',
      fontWeight: 'normal',
      textAlign: 'center',
      opacity: 0.8,
      rotation: 0,
      isRequired: false,
      order: fields.length,
      paintSplatter: splatterValue,
      effectValue: splatterValue,
      effectFilePath,
      visible: true
    }
    
    setFields([...fields, newField])
    setSelectedFieldId(newField.id)
    setEditorMode('select')
  }

  const handleStagingImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive'
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const centerX = imageDimensions.width / 2 - 150
      const centerY = imageDimensions.height / 2 - 100

      setStagingElement({
        id: `staging-${Date.now()}`,
        type: 'image',
        x: Math.max(50, centerX),
        y: Math.max(50, centerY),
        width: 300,
        height: 200,
        fontSize: 0,
        fontFamily: 'Arial',
        fontColor: '#000000',
        fontWeight: 'normal',
        textAlign: 'left',
        opacity: 100,
        rotation: 0,
        content: '',
        imagePreview: e.target?.result as string
      })
      setEditorMode('select')
    }
    reader.readAsDataURL(file)
  }

  const handleStagingVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload a video file',
        variant: 'destructive'
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const videoUrl = e.target?.result as string
      
      // Create video element to generate thumbnail
      const video = document.createElement('video')
      video.src = videoUrl
      video.crossOrigin = 'anonymous'
      
      video.addEventListener('loadeddata', () => {
        // Generate thumbnail from first frame
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const thumbnail = canvas.toDataURL('image/png')
          
          const centerX = imageDimensions.width / 2 - 200
          const centerY = imageDimensions.height / 2 - 150

          setStagingElement({
            id: `staging-${Date.now()}`,
            type: 'video',
            x: Math.max(50, centerX),
            y: Math.max(50, centerY),
            width: 400,
            height: 300,
            fontSize: 0,
            fontFamily: 'Arial',
            fontColor: '#000000',
            fontWeight: 'normal',
            textAlign: 'left',
            opacity: 100,
            rotation: 0,
            content: '',
            videoPreview: videoUrl,
            imagePreview: thumbnail // Use thumbnail for canvas display
          })
          setEditorMode('select')
        }
      })
      
      video.load()
    }
    reader.readAsDataURL(file)
  }

  // Confirm staging element and convert to field
  const confirmStagingElement = () => {
    if (!stagingElement) return

    const newField: TemplateField = {
      id: `field-${Date.now()}`,
      fieldName: `field${fields.length + 1}`,
      fieldLabel: `${stagingElement.type.charAt(0).toUpperCase() + stagingElement.type.slice(1)} ${fields.length + 1}`,
      fieldType: stagingElement.type,
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
      rotation: stagingElement.rotation || 0,
      defaultValue: stagingElement.content,
      imagePreview: stagingElement.imagePreview, // Preserve image
      videoPreview: stagingElement.videoPreview, // Preserve video
      // Preserve effect properties
      photoEffect: stagingElement.photoEffect,
      filter: stagingElement.filter,
      texture: stagingElement.texture,
      cornerStyle: stagingElement.cornerStyle,
      shape: stagingElement.shape,
      paintSplatter: stagingElement.paintSplatter,
      animation: stagingElement.animation,
      outlineColor: stagingElement.outlineColor,
      outlineWidth: stagingElement.outlineWidth,
      effectValue: stagingElement.effectValue,
      effectFilePath: stagingElement.effectFilePath,
      visible: true,
      isRequired: false,
      order: fields.length
    }

    setFields([...fields, newField])
    setSelectedFieldId(newField.id)
    setStagingElement(null)
    setEditorMode('select')

    toast({
      title: 'Element added',
      description: 'You can now configure the field properties or edit it by clicking'
    })
  }

  // Convert a confirmed field back to staging for editing
  const editField = (field: TemplateField) => {
    setStagingElement({
      id: field.id,
      type: field.fieldType as 'text' | 'number' | 'image' | 'logo' | 'video',
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      fontSize: field.fontSize,
      fontFamily: field.fontFamily,
      fontColor: field.fontColor,
      fontWeight: field.fontWeight,
      textAlign: field.textAlign,
      opacity: field.opacity,
      rotation: field.rotation || 0,
      content: field.defaultValue || '',
      imagePreview: field.imagePreview,
      videoPreview: field.videoPreview
    })
    // Remove from fields list temporarily
    setFields(fields.filter(f => f.id !== field.id))
    setSelectedFieldId(null)
  }
  
  // Toggle field visibility
  const toggleFieldVisibility = (id: string) => {
    setFields(fields.map(field =>
      field.id === id ? { ...field, visible: field.visible === false ? true : false } : field
    ))
  }

  // Cancel staging element
  const cancelStagingElement = () => {
    setStagingElement(null)
    setEditorMode('select')
  }

  // Update staging element properties
  const updateStagingElement = (updates: Partial<StagingElement>) => {
    if (!stagingElement) return
    setStagingElement({ ...stagingElement, ...updates })
  }

  // Update field properties
  const updateField = (fieldId: string, updates: Partial<TemplateField>) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ))
  }

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id))
    if (selectedFieldId === id) {
      setSelectedFieldId(null)
    }
  }

  const updateSelectedField = (updates: Partial<TemplateField>) => {
    if (!selectedFieldId) return
    setFields(fields.map(field =>
      field.id === selectedFieldId ? { ...field, ...updates } : field
    ))
  }

  const duplicateField = () => {
    if (!selectedFieldId) return
    const fieldToDuplicate = fields.find(f => f.id === selectedFieldId)
    if (!fieldToDuplicate) return

    const newField: TemplateField = {
      ...fieldToDuplicate,
      id: `field-${Date.now()}`,
      fieldName: `${fieldToDuplicate.fieldName}_copy`,
      fieldLabel: `${fieldToDuplicate.fieldLabel} Copy`,
      x: Math.min(fieldToDuplicate.x + 20, imageDimensions.width - fieldToDuplicate.width),
      y: Math.min(fieldToDuplicate.y + 20, imageDimensions.height - fieldToDuplicate.height),
      order: fields.length
    }

    setFields([...fields, newField])
    setSelectedFieldId(newField.id)

    toast({
      title: 'Field duplicated',
      description: `Created a copy of ${fieldToDuplicate.fieldLabel}`
    })
  }

  // Layering controls
  const bringForward = () => {
    if (!selectedFieldId) return
    const selectedIndex = fields.findIndex(f => f.id === selectedFieldId)
    if (selectedIndex === -1 || selectedIndex === fields.length - 1) return
    
    const newFields = [...fields]
    const currentOrder = newFields[selectedIndex].order
    const nextField = newFields.find((f, i) => i > selectedIndex && f.order > currentOrder)
    
    if (nextField) {
      const temp = nextField.order
      nextField.order = currentOrder
      newFields[selectedIndex].order = temp
      setFields(newFields.sort((a, b) => a.order - b.order))
      saveToHistory(newFields)
    }
  }

  const sendBackward = () => {
    if (!selectedFieldId) return
    const selectedIndex = fields.findIndex(f => f.id === selectedFieldId)
    if (selectedIndex === -1 || selectedIndex === 0) return
    
    const newFields = [...fields]
    const currentOrder = newFields[selectedIndex].order
    const prevField = newFields.slice(0, selectedIndex).reverse().find(f => f.order < currentOrder)
    
    if (prevField) {
      const temp = prevField.order
      prevField.order = currentOrder
      newFields[selectedIndex].order = temp
      setFields(newFields.sort((a, b) => a.order - b.order))
      saveToHistory(newFields)
    }
  }

  const bringToFront = () => {
    if (!selectedFieldId) return
    const selectedIndex = fields.findIndex(f => f.id === selectedFieldId)
    if (selectedIndex === -1) return
    
    const newFields = [...fields]
    const maxOrder = Math.max(...newFields.map(f => f.order))
    newFields[selectedIndex].order = maxOrder + 1
    setFields(newFields.sort((a, b) => a.order - b.order))
    saveToHistory(newFields)
    
    toast({
      title: 'Brought to front',
      description: 'Element moved to the top layer'
    })
  }

  const sendToBack = () => {
    if (!selectedFieldId) return
    const selectedIndex = fields.findIndex(f => f.id === selectedFieldId)
    if (selectedIndex === -1) return
    
    const newFields = [...fields]
    const minOrder = Math.min(...newFields.map(f => f.order))
    newFields[selectedIndex].order = minOrder - 1
    setFields(newFields.sort((a, b) => a.order - b.order))
    saveToHistory(newFields)
    
    toast({
      title: 'Sent to back',
      description: 'Element moved to the bottom layer'
    })
  }

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) throw new Error('No image file')

    setIsUploadingImage(true)
    const formData = new FormData()
    formData.append('file', imageFile)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      return data.url
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !category || !imageFile) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields and upload an image',
        variant: 'destructive'
      })
      return
    }

    if (fields.length === 0) {
      toast({
        title: 'No fields',
        description: 'Please add at least one field to your template',
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
      const imageUrl = await uploadImage()

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
        videoPreview: field.videoPreview || null,
        visible: field.visible !== false,
        isRequired: field.isRequired || false,
        order: field.order || 0
      }))

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          category,
          imageUrl,
          width: imageDimensions.width,
          height: imageDimensions.height,
          fields: cleanedFields
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create template')
      }

      toast({
        title: 'Success!',
        description: 'Template created successfully'
      })

      // Clear draft after successful creation
      clearDraft()
      
      router.push('/dashboard/templates')
    } catch (error: any) {
      console.error('Error creating template:', error)
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create template',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Save draft to localStorage
  const saveDraft = () => {
    if (!name && fields.length === 0) return // Don't save empty drafts
    
    setIsSavingDraft(true)
    try {
      const draft = {
        name,
        description,
        category,
        fields: fields.map(f => ({
          ...f,
          id: f.id // Keep IDs for consistency
        })),
        imageDimensions,
        imagePreview,
        timestamp: new Date().toISOString()
      }
      
      localStorage.setItem('template_draft', JSON.stringify(draft))
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      
      toast({
        title: 'Draft saved',
        description: 'Your work has been saved locally',
      })
    } catch (error) {
      console.error('Error saving draft:', error)
      toast({
        title: 'Error',
        description: 'Failed to save draft',
        variant: 'destructive'
      })
    } finally {
      setIsSavingDraft(false)
    }
  }

  // Load draft from localStorage
  const loadDraft = () => {
    try {
      const draftStr = localStorage.getItem('template_draft')
      if (!draftStr) return
      
      const draft = JSON.parse(draftStr)
      setName(draft.name || '')
      setDescription(draft.description || '')
      setCategory(draft.category || '')
      setFields(draft.fields || [])
      setImageDimensions(draft.imageDimensions || { width: 1080, height: 1080 })
      setImagePreview(draft.imagePreview || '')
      setLastSaved(new Date(draft.timestamp))
      
      toast({
        title: 'Draft loaded',
        description: 'Your previous work has been restored',
      })
    } catch (error) {
      console.error('Error loading draft:', error)
    }
  }

  // Clear draft from localStorage
  const clearDraft = () => {
    localStorage.removeItem('template_draft')
    setLastSaved(null)
    setHasUnsavedChanges(false)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive'
      })
      return
    }

    setIsLoadingBranding(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) throw new Error('Upload failed')

      const uploadData = await uploadResponse.json()
      
      const response = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoUrl: uploadData.url,
          brandColors: branding?.brandColors || []
        })
      })

      if (response.ok) {
        const data = await response.json()
        setBranding(data.branding)
        toast({
          title: 'Logo uploaded',
          description: 'Your workspace logo has been updated'
        })
      }
    } catch (error) {
      console.error('Failed to upload logo:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload logo',
        variant: 'destructive'
      })
    } finally {
      setIsLoadingBranding(false)
    }
  }

  const addBrandColor = async (color: string) => {
    if ((branding?.brandColors || []).includes(color)) {
      toast({
        title: 'Color exists',
        description: 'This color is already in your brand colors',
        variant: 'destructive'
      })
      return
    }

    const updatedColors = [...(branding?.brandColors || []), color]
    
    try {
      const response = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoUrl: branding?.logoUrl || null,
          brandColors: updatedColors
        })
      })

      if (response.ok) {
        const data = await response.json()
        setBranding(data.branding)
        toast({
          title: 'Color added',
          description: 'Brand color added successfully'
        })
      }
    } catch (error) {
      console.error('Failed to add color:', error)
      toast({
        title: 'Error',
        description: 'Failed to add brand color',
        variant: 'destructive'
      })
    }
  }

  const removeBrandColor = async (color: string) => {
    const updatedColors = (branding?.brandColors || []).filter(c => c !== color)
    
    try {
      const response = await fetch('/api/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoUrl: branding?.logoUrl || null,
          brandColors: updatedColors
        })
      })

      if (response.ok) {
        const data = await response.json()
        setBranding(data.branding)
        toast({
          title: 'Color removed',
          description: 'Brand color removed successfully'
        })
      }
    } catch (error) {
      console.error('Failed to remove color:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove brand color',
        variant: 'destructive'
      })
    }
  }

  const shuffleColors = () => {
    if ((branding?.brandColors || []).length === 0) {
      toast({
        title: 'No brand colors',
        description: 'Add brand colors first to shuffle them',
        variant: 'destructive'
      })
      return
    }

    const textFields = fields.filter(f => f.fieldType !== 'image' && f.fieldType !== 'logo' && f.fieldType !== 'video')
    if (textFields.length === 0) {
      toast({
        title: 'No text fields',
        description: 'Add text or number fields first',
        variant: 'destructive'
      })
      return
    }

    const updatedFields = fields.map(field => {
      if (field.fieldType !== 'image' && field.fieldType !== 'logo' && field.fieldType !== 'video') {
        const brandColors = branding?.brandColors || []
        const randomColor = brandColors[Math.floor(Math.random() * brandColors.length)]
        return { ...field, fontColor: randomColor }
      } else if (field.fieldType === 'logo') {
        // Position logo in top right corner at 300x300
        const logoWidth = 300
        const logoHeight = 300
        const padding = 20
        return {
          ...field,
          x: imageDimensions.width - logoWidth - padding,
          y: padding,
          width: logoWidth,
          height: logoHeight
        }
      }
      return field
    })

    setFields(updatedFields)
    toast({
      title: 'Colors shuffled',
      description: 'Brand colors applied to text fields, logo moved to top right'
    })
  }

  const applyColorToField = (color: string) => {
    if (!selectedFieldId) return
    
    const field = fields.find(f => f.id === selectedFieldId)
    if (!field || field.fieldType === 'image' || field.fieldType === 'video') {
      toast({
        title: 'Cannot apply color',
        description: 'Select a text or number field first',
        variant: 'destructive'
      })
      return
    }

    updateSelectedField({ fontColor: color })
    toast({
      title: 'Color applied',
      description: 'Brand color applied to selected field'
    })
  }

  const selectedField = fields.find(f => f.id === selectedFieldId)

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/templates">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Create Template</h1>
          <p className="text-gray-600">
            Design a template with visual field placement
            {lastSaved && (
              <span className="ml-2 text-sm text-green-600">
                • Saved {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
            {hasUnsavedChanges && !isSavingDraft && (
              <span className="ml-2 text-sm text-orange-600">
                • Unsaved changes
              </span>
            )}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={saveDraft}
          disabled={isSavingDraft || (!name && fields.length === 0)}
        >
          {isSavingDraft ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </>
          )}
        </Button>
      </div>

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
                <Label>Upload Template Image *</Label>
                {imagePreview ? (
                  <div className="space-y-2">
                    <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={imagePreview}
                        alt="Template"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <p className="text-xs text-gray-600">
                      {imageDimensions.width} × {imageDimensions.height}px
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview('')
                        setFields([])
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
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
                    {showBrandingCard ? 'Hide' : 'Edit'}
                  </Button>
                </div>
              </CardHeader>
              {showBrandingCard && (
                <CardContent className="space-y-4">
                  {/* Logo */}
                  <div className="space-y-2">
                    <Label className="text-xs">Logo</Label>
                    {branding?.logoUrl ? (
                      <div className="space-y-2">
                        <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border">
                          <Image
                            src={branding.logoUrl}
                            alt="Workspace Logo"
                            fill
                            className="object-contain p-4"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={isLoadingBranding}
                        >
                          <Upload className="w-3 h-3 mr-2" />
                          Change Logo
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isLoadingBranding}
                        className="w-full"
                      >
                        <Upload className="w-3 h-3 mr-2" />
                        Upload Logo
                      </Button>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Brand Colors */}
                  <div className="space-y-2">
                    <Label className="text-xs">Brand Colors</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {(branding?.brandColors || []).map((color, index) => (
                        <div key={index} className="relative group">
                          <div
                            className="aspect-square rounded border-2 cursor-pointer hover:scale-105 transition-transform"
                            style={{ backgroundColor: color }}
                            onClick={() => applyColorToField(color)}
                            title={`Click to apply ${color}`}
                          />
                          <button
                            type="button"
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeBrandColor(color)
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {(branding?.brandColors || []).length < 8 && (
                        <div className="aspect-square rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <Input
                            type="color"
                            onChange={(e) => addBrandColor(e.target.value)}
                            className="w-8 h-8 cursor-pointer border-0 p-0"
                            title="Add new color"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shuffle Colors Button */}
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={shuffleColors}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={(branding?.brandColors || []).length === 0}
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Shuffle colors
                  </Button>

                  <p className="text-xs text-gray-500">
                    Click on a color to apply it to the selected field, or use shuffle to apply random colors to all text fields.
                  </p>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Canvas Editor */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Visual Editor</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={undo}
                      disabled={historyIndex <= 0}
                      title="Undo (Ctrl+Z)"
                    >
                      <Undo className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={redo}
                      disabled={historyIndex >= history.length - 1}
                      title="Redo (Ctrl+Y)"
                    >
                      <Redo className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
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
                    <Type className="w-4 h-4 mr-1" />
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
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Add Video
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={createLogoElement}
                    disabled={!!stagingElement || !branding?.logoUrl}
                    title={!branding?.logoUrl ? 'Upload a logo in the branding section first' : 'Add logo'}
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
              
              <CardDescription className="mt-3">
                {stagingElement 
                  ? 'Position and resize the element, then press OK to confirm'
                  : 'Add text, numbers, images, or shapes to your template'}
              </CardDescription>
              
            </CardHeader>
            <CardContent>
              {/* Context Toolbar - Shows when element is selected */}
              {selectedFieldId && !stagingElement && (
                <div className="mb-4 flex items-center justify-center">
                  <div className="inline-flex items-center gap-1 p-2 bg-white border border-gray-300 rounded-xl shadow-lg">
                    {/* Effects Button with Dropdown */}
                    <Popover open={showEffects} onOpenChange={setShowEffects}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-10 px-3 hover:bg-gray-100"
                        >
                          <Shuffle className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">Effects</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-0" align="start">
                        <div className="bg-white rounded-lg shadow-xl border">
                          {/* Filters Section */}
                          <div className="border-b">
                            <button
                              type="button"
                              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                              onClick={() => setExpandedEffectSection(expandedEffectSection === 'filters' ? null : 'filters')}
                            >
                              <span className="font-medium">Filters</span>
                              <span className="text-gray-400">{expandedEffectSection === 'filters' ? '∧' : '∨'}</span>
                            </button>
                            {expandedEffectSection === 'filters' && (
                              <div className="px-4 pb-3 space-y-2">
                                {['grayscale', 'retro', 'sepia', 'vintage', 'polaroid'].map((filterValue) => {
                                  const currentFilter = fields.find(f => f.id === selectedFieldId)?.filter
                                  const isChecked = currentFilter === filterValue
                                  return (
                                    <label key={filterValue} className="flex items-center gap-2 cursor-pointer">
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          if (selectedFieldId) {
                                            // If checking this filter, uncheck all others
                                            // If unchecking, set to 'none'
                                            setFields(prevFields => prevFields.map(field =>
                                              field.id === selectedFieldId
                                                ? { ...field, filter: checked ? filterValue : 'none' }
                                                : field
                                            ))
                                          }
                                        }}
                                      />
                                      <span className="text-sm capitalize">{filterValue === 'grayscale' ? 'Black & White' : filterValue}</span>
                                    </label>
                                  )
                                })}
                              </div>
                            )}
                          </div>

                          {/* Opacity Section */}
                          <div className="border-b">
                            <button
                              type="button"
                              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                              onClick={() => setExpandedEffectSection(expandedEffectSection === 'opacity' ? null : 'opacity')}
                            >
                              <span className="font-medium">Opacity</span>
                              <span className="text-gray-400">{expandedEffectSection === 'opacity' ? '∧' : '∨'}</span>
                            </button>
                            {expandedEffectSection === 'opacity' && (
                              <div className="px-4 pb-4 space-y-2">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-2xl font-medium">{fields.find(f => f.id === selectedFieldId)?.opacity || 100}%</span>
                                  <Checkbox checked={false} />
                                </div>
                                <Slider
                                  min={0}
                                  max={100}
                                  step={1}
                                  value={[fields.find(f => f.id === selectedFieldId)?.opacity || 100]}
                                  onValueChange={([value]) => {
                                    if (selectedFieldId) {
                                      setFields(prevFields => prevFields.map(field =>
                                        field.id === selectedFieldId
                                          ? { ...field, opacity: value }
                                          : field
                                      ))
                                    }
                                  }}
                                  className="w-full"
                                />
                              </div>
                            )}
                          </div>

                          {/* Blur Section */}
                          <div>
                            <button
                              type="button"
                              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                              onClick={() => setExpandedEffectSection(expandedEffectSection === 'blur' ? null : 'blur')}
                            >
                              <span className="font-medium">Blur</span>
                              <span className="text-gray-400">{expandedEffectSection === 'blur' ? '∧' : '∨'}</span>
                            </button>
                            {expandedEffectSection === 'blur' && (
                              <div className="px-4 pb-4 space-y-2">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-2xl font-medium">{fields.find(f => f.id === selectedFieldId)?.blur || 0}px</span>
                                  <Checkbox 
                                    checked={(fields.find(f => f.id === selectedFieldId)?.blur || 0) > 0}
                                    onCheckedChange={(checked) => {
                                      if (selectedFieldId) {
                                        setFields(prevFields => prevFields.map(field =>
                                          field.id === selectedFieldId
                                            ? { ...field, blur: checked ? 5 : 0 }
                                            : field
                                        ))
                                      }
                                    }}
                                  />
                                </div>
                                <Slider
                                  min={0}
                                  max={20}
                                  step={1}
                                  value={[fields.find(f => f.id === selectedFieldId)?.blur || 0]}
                                  onValueChange={([value]) => {
                                    if (selectedFieldId) {
                                      setFields(prevFields => prevFields.map(field =>
                                        field.id === selectedFieldId
                                          ? { ...field, blur: value }
                                          : field
                                      ))
                                    }
                                  }}
                                  className="w-full"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>

                    <div className="w-px h-6 bg-gray-300" />

                    {/* Remove Background Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-10 px-3 hover:bg-gray-100"
                      onClick={async () => {
                        if (!selectedFieldId) return
                        const selectedField = fields.find(f => f.id === selectedFieldId)
                        if (!selectedField || !selectedField.imagePreview) {
                          toast({
                            title: 'Error',
                            description: 'Please select an image to remove background',
                            variant: 'destructive'
                          })
                          return
                        }

                        try {
                          toast({ title: 'Processing...', description: 'Removing background from image' })
                          
                          // Create a canvas to get image data
                          const tempCanvas = document.createElement('canvas')
                          const tempCtx = tempCanvas.getContext('2d')
                          const img = new window.Image()
                          img.crossOrigin = 'anonymous'
                          
                          await new Promise((resolve, reject) => {
                            img.onload = resolve
                            img.onerror = reject
                            img.src = selectedField.imagePreview || ''
                          })
                          
                          tempCanvas.width = img.width
                          tempCanvas.height = img.height
                          tempCtx?.drawImage(img, 0, 0)
                          
                          // Convert to blob
                          const blob = await new Promise<Blob | null>((resolve) => {
                            tempCanvas.toBlob(resolve, 'image/png')
                          })
                          
                          if (!blob) throw new Error('Failed to create blob')
                          
                          // Upload to Remove.bg API
                          const formData = new FormData()
                          formData.append('image_file', blob, 'image.png')
                          
                          const response = await fetch('/api/remove-background', {
                            method: 'POST',
                            body: formData,
                          })

                          if (!response.ok) {
                            throw new Error('Failed to remove background')
                          }

                          const data = await response.json()
                          
                          // Update the field with the processed image
                          setFields(prevFields => prevFields.map(field =>
                            field.id === selectedFieldId
                              ? { ...field, imagePreview: data.imageUrl }
                              : field
                          ))
                          
                          toast({
                            title: 'Success',
                            description: 'Background removed successfully'
                          })
                        } catch (error) {
                          console.error('Background removal error:', error)
                          toast({
                            title: 'Error',
                            description: 'Failed to remove background',
                            variant: 'destructive'
                          })
                        }
                      }}
                    >
                      <Eraser className="w-4 h-4 mr-2" />
                      <span className="text-sm">Remove background</span>
                    </Button>

                    <div className="w-px h-6 bg-gray-300" />

                    {/* Color Picker */}
                    <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 hover:bg-gray-100"
                        >
                          <div 
                            className="w-6 h-6 rounded border-2 border-gray-300"
                            style={{ 
                              backgroundColor: (() => {
                                const selectedField = fields.find(f => f.id === selectedFieldId)
                                if (!selectedField) return '#A4A1A1'
                                if (selectedField.fieldType === 'text' || selectedField.fieldType === 'number') {
                                  return selectedField.fontColor || '#000000'
                                }
                                return selectedField.fill || '#A4A1A1'
                              })()
                            }}
                          />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="start">
                        <div className="bg-white rounded-lg shadow-xl border p-4">
                          <SketchPicker
                            color={(() => {
                              const selectedField = fields.find(f => f.id === selectedFieldId)
                              if (!selectedField) return '#A4A1A1'
                              if (selectedField.fieldType === 'text' || selectedField.fieldType === 'number') {
                                return selectedField.fontColor || '#000000'
                              }
                              return selectedField.fill || '#A4A1A1'
                            })()}
                            onChange={(color) => {
                              if (selectedFieldId) {
                                const selectedField = fields.find(f => f.id === selectedFieldId)
                                if (selectedField?.fieldType === 'text' || selectedField?.fieldType === 'number') {
                                  updateField(selectedFieldId, { fontColor: color.hex })
                                } else {
                                  updateField(selectedFieldId, { fill: color.hex })
                                }
                              }
                            }}
                            presetColors={branding.brandColors}
                          />
                          <div className="mt-3 flex gap-2 border-t pt-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="flex-1 text-green-600 font-medium"
                            >
                              Workspace colors
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="flex-1"
                            >
                              Personal colors
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>

                    <div className="w-px h-6 bg-gray-300" />

                    {/* Crop Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={`h-10 px-3 hover:bg-gray-100 ${cropMode ? 'bg-gray-200' : ''}`}
                      onClick={async () => {
                        if (!selectedFieldId) return
                        const selectedField = fields.find(f => f.id === selectedFieldId)
                        if (!selectedField || !selectedField.imagePreview) {
                          toast({
                            title: 'Error',
                            description: 'Please select an image to crop',
                            variant: 'destructive'
                          })
                          return
                        }
                        
                        if (!cropMode) {
                          // Enter crop mode
                          setCropMode(true)
                          toast({
                            title: 'Crop Mode',
                            description: 'Resize the image to define crop area, then click Crop again to apply'
                          })
                        } else {
                          // Apply crop - create a cropped version of the image
                          try {
                            const tempCanvas = document.createElement('canvas')
                            const tempCtx = tempCanvas.getContext('2d')
                            const img = new window.Image()
                            img.crossOrigin = 'anonymous'
                            
                            await new Promise((resolve, reject) => {
                              img.onload = resolve
                              img.onerror = reject
                              img.src = selectedField.imagePreview || ''
                            })
                            
                            // Use current field dimensions as crop area
                            tempCanvas.width = selectedField.width
                            tempCanvas.height = selectedField.height
                            
                            // Draw the entire image scaled to fit the current field size
                            tempCtx?.drawImage(img, 0, 0, selectedField.width, selectedField.height)
                            
                            // Convert to data URL
                            const croppedImage = tempCanvas.toDataURL('image/png')
                            
                            // Update the field with cropped image
                            setFields(prevFields => prevFields.map(field =>
                              field.id === selectedFieldId
                                ? { ...field, imagePreview: croppedImage }
                                : field
                            ))
                            
                            setCropMode(false)
                            toast({
                              title: 'Crop Applied',
                              description: 'Image has been cropped successfully'
                            })
                          } catch (error) {
                            console.error('Crop error:', error)
                            toast({
                              title: 'Error',
                              description: 'Failed to crop image',
                              variant: 'destructive'
                            })
                          }
                        }
                      }}
                    >
                      <CropIcon className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Crop</span>
                    </Button>

                    <div className="w-px h-6 bg-gray-300" />

                    {/* Transparency Button */}
                    <Popover open={showTransparency} onOpenChange={setShowTransparency}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-10 px-3 hover:bg-gray-100"
                        >
                          <span className="text-sm font-medium">Transparency</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-0" align="start">
                        <div className="bg-white rounded-lg shadow-xl border p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Transparency</span>
                            <span className="text-2xl font-medium">{100 - (fields.find(f => f.id === selectedFieldId)?.opacity || 100)}%</span>
                          </div>
                          <Slider
                            min={0}
                            max={100}
                            step={1}
                            value={[100 - (fields.find(f => f.id === selectedFieldId)?.opacity || 100)]}
                            onValueChange={([value]) => {
                              if (selectedFieldId) {
                                setFields(prevFields => prevFields.map(field =>
                                  field.id === selectedFieldId
                                    ? { ...field, opacity: 100 - value }
                                    : field
                                ))
                              }
                            }}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Opaque</span>
                            <span>Transparent</span>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>

                    <div className="w-px h-6 bg-gray-300" />

                    {/* Shadow Button with Dropdown */}
                    <Popover open={showShadow} onOpenChange={setShowShadow}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 hover:bg-gray-100"
                        >
                          <Palette className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-96 p-0" align="start">
                        <div className="bg-white rounded-lg shadow-xl border p-4">
                          <div className="flex items-center gap-3 mb-4">
                            {/* Color picker for shadow */}
                            <div 
                              className="w-10 h-10 rounded border-2 border-gray-300 cursor-pointer"
                              style={{ background: 'linear-gradient(135deg, red 0%, yellow 20%, lime 40%, cyan 60%, blue 80%, magenta 100%)' }}
                            />
                            <div className="flex-1">
                              <Input
                                value={shadowColor}
                                onChange={(e) => {
                                  const value = e.target.value
                                  setShadowColor(value)
                                  if (selectedFieldId) {
                                    setFields(prevFields => prevFields.map(field =>
                                      field.id === selectedFieldId
                                        ? { 
                                            ...field, 
                                            shadow: {
                                              color: value,
                                              x: shadowX,
                                              y: shadowY,
                                              blur: shadowBlur
                                            }
                                          }
                                        : field
                                    ))
                                  }
                                }}
                                placeholder="#000000"
                                className="font-mono"
                              />
                            </div>
                            <div className="w-8 h-8 rounded border-2 border-gray-300" style={{ backgroundColor: shadowColor }} />
                          </div>

                          {/* X, Y, Blur controls */}
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            <div>
                              <Label className="text-xs mb-1 block">X</Label>
                              <Input
                                type="number"
                                value={shadowX}
                                onChange={(e) => {
                                  const value = Number(e.target.value)
                                  setShadowX(value)
                                  if (selectedFieldId) {
                                    setFields(prevFields => prevFields.map(field =>
                                      field.id === selectedFieldId
                                        ? { 
                                            ...field, 
                                            shadow: {
                                              color: shadowColor,
                                              x: value,
                                              y: shadowY,
                                              blur: shadowBlur
                                            }
                                          }
                                        : field
                                    ))
                                  }
                                }}
                                className="text-center"
                              />
                            </div>
                            <div>
                              <Label className="text-xs mb-1 block">Y</Label>
                              <Input
                                type="number"
                                value={shadowY}
                                onChange={(e) => {
                                  const value = Number(e.target.value)
                                  setShadowY(value)
                                  if (selectedFieldId) {
                                    setFields(prevFields => prevFields.map(field =>
                                      field.id === selectedFieldId
                                        ? { 
                                            ...field, 
                                            shadow: {
                                              color: shadowColor,
                                              x: shadowX,
                                              y: value,
                                              blur: shadowBlur
                                            }
                                          }
                                        : field
                                    ))
                                  }
                                }}
                                className="text-center"
                              />
                            </div>
                            <div>
                              <Label className="text-xs mb-1 block">Blur</Label>
                              <Input
                                type="number"
                                value={shadowBlur}
                                onChange={(e) => {
                                  const value = Number(e.target.value)
                                  setShadowBlur(value)
                                  if (selectedFieldId) {
                                    setFields(prevFields => prevFields.map(field =>
                                      field.id === selectedFieldId
                                        ? { 
                                            ...field, 
                                            shadow: {
                                              color: shadowColor,
                                              x: shadowX,
                                              y: shadowY,
                                              blur: value
                                            }
                                          }
                                        : field
                                    ))
                                  }
                                }}
                                className="text-center"
                              />
                            </div>
                          </div>

                          {/* Shadow presets */}
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {[...Array(9)].map((_, i) => {
                              const x = i % 3
                              const y = Math.floor(i / 3) + 1
                              const blur = i + 2
                              return (
                                <Button
                                  key={i}
                                  type="button"
                                  variant="outline"
                                  className="h-12 flex items-center justify-center"
                                  style={{
                                    boxShadow: `${x}px ${y}px ${blur}px rgba(0,0,0,0.3)`
                                  }}
                                  onClick={() => {
                                    setShadowX(x)
                                    setShadowY(y)
                                    setShadowBlur(blur)
                                    setShadowColor('#000000')
                                    if (selectedFieldId) {
                                      setFields(prevFields => prevFields.map(field =>
                                        field.id === selectedFieldId
                                          ? { 
                                              ...field, 
                                              shadow: {
                                                color: '#000000',
                                                x,
                                                y,
                                                blur
                                              }
                                            }
                                          : field
                                      ))
                                    }
                                  }}
                                >
                                  <div className="w-6 h-6 bg-green-500 rounded-sm flex items-center justify-center">
                                    <Star className="w-4 h-4 text-white" />
                                  </div>
                                </Button>
                              )
                            })}
                          </div>

                          {/* No shadow button */}
                          <Button
                            type="button"
                            variant="default"
                            className="w-full bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => {
                              setShadowX(0)
                              setShadowY(0)
                              setShadowBlur(0)
                              setShadowColor('#000000')
                              if (selectedFieldId) {
                                setFields(prevFields => prevFields.map(field =>
                                  field.id === selectedFieldId
                                    ? { 
                                        ...field, 
                                        shadow: undefined
                                      }
                                    : field
                                ))
                              }
                            }}
                          >
                            No shadow
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>

                    <div className="w-px h-6 bg-gray-300" />

                    {/* Align Button */}
                    <Popover open={showAlign} onOpenChange={setShowAlign}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-10 px-3 hover:bg-gray-100"
                        >
                          <AlignCenter className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">Align</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3" align="start">
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 h-10"
                            onClick={() => {
                              if (selectedFieldId) {
                                updateField(selectedFieldId, { x: 0 })
                              }
                              setShowAlign(false)
                            }}
                          >
                            <AlignHorizontalJustifyStart className="w-4 h-4" />
                            <span className="text-sm">Left</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 h-10"
                            onClick={() => {
                              if (selectedFieldId) {
                                const field = fields.find(f => f.id === selectedFieldId)
                                if (field) {
                                  updateField(selectedFieldId, { 
                                    x: (imageDimensions.width - field.width) / 2 
                                  })
                                }
                              }
                              setShowAlign(false)
                            }}
                          >
                            <AlignHorizontalJustifyCenter className="w-4 h-4" />
                            <span className="text-sm">Center</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 h-10"
                            onClick={() => {
                              if (selectedFieldId) {
                                const field = fields.find(f => f.id === selectedFieldId)
                                if (field) {
                                  updateField(selectedFieldId, { 
                                    x: imageDimensions.width - field.width 
                                  })
                                }
                              }
                              setShowAlign(false)
                            }}
                          >
                            <AlignHorizontalJustifyEnd className="w-4 h-4" />
                            <span className="text-sm">Right</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 h-10"
                            onClick={() => {
                              if (selectedFieldId) {
                                updateField(selectedFieldId, { y: 0 })
                              }
                              setShowAlign(false)
                            }}
                          >
                            <AlignVerticalJustifyStart className="w-4 h-4" />
                            <span className="text-sm">Top</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 h-10"
                            onClick={() => {
                              if (selectedFieldId) {
                                const field = fields.find(f => f.id === selectedFieldId)
                                if (field) {
                                  updateField(selectedFieldId, { 
                                    y: (imageDimensions.height - field.height) / 2 
                                  })
                                }
                              }
                              setShowAlign(false)
                            }}
                          >
                            <AlignVerticalJustifyCenter className="w-4 h-4" />
                            <span className="text-sm">Middle</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 h-10"
                            onClick={() => {
                              if (selectedFieldId) {
                                const field = fields.find(f => f.id === selectedFieldId)
                                if (field) {
                                  updateField(selectedFieldId, { 
                                    y: imageDimensions.height - field.height 
                                  })
                                }
                              }
                              setShowAlign(false)
                            }}
                          >
                            <AlignVerticalJustifyEnd className="w-4 h-4" />
                            <span className="text-sm">Bottom</span>
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>

                    <div className="w-px h-6 bg-gray-300" />

                    {/* Rotate Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-0 hover:bg-gray-100"
                      onClick={() => {
                        if (selectedFieldId) {
                          const field = fields.find(f => f.id === selectedFieldId)
                          if (field) {
                            updateField(selectedFieldId, { rotation: (field.rotation || 0) + 90 })
                          }
                        }
                      }}
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>

                    <div className="w-px h-6 bg-gray-300" />

                    {/* Arrange/Layer Button */}
                    <Popover open={showArrange} onOpenChange={setShowArrange}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 hover:bg-gray-100"
                        >
                          <Layers className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="start">
                        <div className="flex flex-col gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="justify-start h-9 gap-2"
                            onClick={() => {
                              if (selectedFieldId) {
                                const index = fields.findIndex(f => f.id === selectedFieldId)
                                if (index < fields.length - 1) {
                                  const newFields = [...fields]
                                  const temp = newFields[index]
                                  newFields.splice(index, 1)
                                  newFields.push(temp)
                                  setFields(newFields)
                                }
                              }
                              setShowArrange(false)
                            }}
                          >
                            <ChevronsUp className="w-4 h-4" />
                            <span>Bring to front</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="justify-start h-9 gap-2"
                            onClick={() => {
                              if (selectedFieldId) {
                                const index = fields.findIndex(f => f.id === selectedFieldId)
                                if (index < fields.length - 1) {
                                  const newFields = [...fields]
                                  ;[newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]]
                                  setFields(newFields)
                                }
                              }
                              setShowArrange(false)
                            }}
                          >
                            <ArrowUp className="w-4 h-4" />
                            <span>Bring forward</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="justify-start h-9 gap-2"
                            onClick={() => {
                              if (selectedFieldId) {
                                const index = fields.findIndex(f => f.id === selectedFieldId)
                                if (index > 0) {
                                  const newFields = [...fields]
                                  ;[newFields[index], newFields[index - 1]] = [newFields[index - 1], newFields[index]]
                                  setFields(newFields)
                                }
                              }
                              setShowArrange(false)
                            }}
                          >
                            <ArrowDown className="w-4 h-4" />
                            <span>Send backward</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="justify-start h-9 gap-2"
                            onClick={() => {
                              if (selectedFieldId) {
                                const index = fields.findIndex(f => f.id === selectedFieldId)
                                if (index > 0) {
                                  const newFields = [...fields]
                                  const temp = newFields[index]
                                  newFields.splice(index, 1)
                                  newFields.unshift(temp)
                                  setFields(newFields)
                                }
                              }
                              setShowArrange(false)
                            }}
                          >
                            <ChevronsDown className="w-4 h-4" />
                            <span>Send to back</span>
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
              
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
                    Upload a template image to start
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

              {/* Hidden file input for staging videos */}
              <input
                ref={stagingVideoInputRef}
                type="file"
                accept="video/*"
                onChange={handleStagingVideoUpload}
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
                          variant="default"
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
                      {stagingElement.type !== 'image' && (
                        <>
                          <div className="col-span-2">
                            <Label className="text-xs">Preview Text</Label>
                            <Input
                              value={stagingElement.content}
                              onChange={(e) => updateStagingElement({ content: e.target.value })}
                              className="text-sm"
                              placeholder="Enter sample text..."
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
                                  <SelectItem 
                                    key={font.value} 
                                    value={font.value}
                                    style={{ fontFamily: font.value }}
                                  >
                                    {font.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                            <Label className="text-xs">Font Color</Label>
                            <Input
                              type="color"
                              value={stagingElement.fontColor}
                              onChange={(e) => updateStagingElement({ fontColor: e.target.value })}
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Font Weight</Label>
                            <Select
                              value={stagingElement.fontWeight}
                              onValueChange={(value) => updateStagingElement({ fontWeight: value })}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="bold">Bold</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Text Align</Label>
                            <Select
                              value={stagingElement.textAlign}
                              onValueChange={(value) => updateStagingElement({ textAlign: value })}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                      {stagingElement.type === 'shape' && (
                        <div className="col-span-2 space-y-3">
                          <div className="text-sm text-gray-600">
                            Customize the shape properties below.
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Shape Type</Label>
                              <Select
                                value={stagingElement.shape || 'rectangle'}
                                onValueChange={(value) => updateStagingElement({ shape: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SHAPES.map(shape => (
                                    <SelectItem key={shape.value} value={shape.value}>
                                      {shape.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Fill Color</Label>
                              <Input
                                type="color"
                                value={stagingElement.fontColor}
                                onChange={(e) => updateStagingElement({ fontColor: e.target.value })}
                                className="h-9"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Outline Color</Label>
                              <Input
                                type="color"
                                value={stagingElement.outlineColor || '#000000'}
                                onChange={(e) => updateStagingElement({ outlineColor: e.target.value })}
                                className="h-9"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Outline Width</Label>
                              <Input
                                type="number"
                                min="0"
                                max="20"
                                value={stagingElement.outlineWidth || 2}
                                onChange={(e) => updateStagingElement({ outlineWidth: parseInt(e.target.value) || 2 })}
                                className="text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      {(stagingElement.type === 'image' || stagingElement.type === 'logo' || stagingElement.type === 'video') && (
                        <div className="col-span-2 space-y-3">
                          <div className="text-sm text-gray-600">
                            Position and resize the {stagingElement.type} on the canvas, then press OK when ready.
                          </div>
                          <div className="col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                              <Palette className="w-4 h-4" />
                              Design Tools & Effects
                            </h4>
                            <p className="text-xs text-blue-700 mt-1">
                              Apply filters, effects, textures, and animations to your {stagingElement.type}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs">Opacity</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={stagingElement.opacity}
                                onChange={(e) => updateStagingElement({ opacity: parseFloat(e.target.value) })}
                                className="flex-1"
                              />
                              <span className="text-sm text-gray-600 w-12">{Math.round(stagingElement.opacity * 100)}%</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Corner Style</Label>
                              <Select
                                value={stagingElement.cornerStyle || 'sharp'}
                                onValueChange={(value) => updateStagingElement({ cornerStyle: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CORNER_STYLES.map(style => (
                                    <SelectItem key={style.value} value={style.value}>
                                      {style.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Filter</Label>
                              <Select
                                value={stagingElement.filter || 'none'}
                                onValueChange={(value) => updateStagingElement({ filter: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {FILTERS.map(filter => (
                                    <SelectItem key={filter.value} value={filter.value}>
                                      {filter.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Photo Effect</Label>
                              <Select
                                value={stagingElement.photoEffect || 'none'}
                                onValueChange={(value) => updateStagingElement({ photoEffect: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {PHOTO_EFFECTS.map(effect => (
                                    <SelectItem key={effect.value} value={effect.value}>
                                      {effect.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Texture</Label>
                              <Select
                                value={stagingElement.texture || 'none'}
                                onValueChange={(value) => updateStagingElement({ texture: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {TEXTURES.map(texture => (
                                    <SelectItem key={texture.value} value={texture.value}>
                                      {texture.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Paint Splatter</Label>
                              <Select
                                value={stagingElement.paintSplatter || 'none'}
                                onValueChange={(value) => updateStagingElement({ paintSplatter: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PAINT_SPLATTERS.map(splatter => (
                                    <SelectItem key={splatter.value} value={splatter.value}>
                                      {splatter.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Animation</Label>
                              <Select
                                value={stagingElement.animation || 'none'}
                                onValueChange={(value) => updateStagingElement({ animation: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {ANIMATIONS.map(animation => (
                                    <SelectItem key={animation.value} value={animation.value}>
                                      {animation.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Field Properties */}
              {selectedField && !stagingElement && (
                <Card className="mt-4">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Field Properties</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={bringToFront}
                          title="Bring to front"
                        >
                          <ChevronsUp className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={bringForward}
                          title="Bring forward"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={sendBackward}
                          title="Send backward"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={sendToBack}
                          title="Send to back"
                        >
                          <ChevronsDown className="w-4 h-4" />
                        </Button>
                        <div className="w-px bg-gray-300 mx-1"></div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={duplicateField}
                          title="Duplicate field"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(selectedField.id)}
                          title="Delete field"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
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
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={selectedField.fieldType}
                          onValueChange={(value) => updateSelectedField({ fieldType: value })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="image">Image</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedField.fieldType !== 'image' && selectedField.fieldType !== 'logo' && selectedField.fieldType !== 'video' && (
                        <>
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
                                  <SelectItem 
                                    key={font.value} 
                                    value={font.value}
                                    style={{ fontFamily: font.value }}
                                  >
                                    {font.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                            <Label className="text-xs">Font Color</Label>
                            <Input
                              type="color"
                              value={selectedField.fontColor}
                              onChange={(e) => updateSelectedField({ fontColor: e.target.value })}
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Font Weight</Label>
                            <Select
                              value={selectedField.fontWeight}
                              onValueChange={(value) => updateSelectedField({ fontWeight: value })}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="bold">Bold</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Text Align</Label>
                            <Select
                              value={selectedField.textAlign}
                              onValueChange={(value) => updateSelectedField({ textAlign: value })}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Default Value</Label>
                            <Input
                              value={selectedField.defaultValue || ''}
                              onChange={(e) => updateSelectedField({ defaultValue: e.target.value })}
                              className="text-sm"
                            />
                          </div>
                        </>
                      )}
                      {(selectedField.fieldType === 'image' || selectedField.fieldType === 'logo' || selectedField.fieldType === 'video') && (
                        <div className="col-span-2 space-y-3">
                          <div className="col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                              <Palette className="w-4 h-4" />
                              Design Tools & Effects
                            </h4>
                            <p className="text-xs text-blue-700 mt-1">
                              Apply filters, effects, textures, and animations to your {selectedField.fieldType}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs">Opacity</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={selectedField.opacity}
                                onChange={(e) => updateSelectedField({ opacity: parseFloat(e.target.value) })}
                                className="flex-1"
                              />
                              <span className="text-sm text-gray-600 w-12">{Math.round(selectedField.opacity * 100)}%</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Corner Style</Label>
                              <Select
                                value={selectedField.cornerStyle || 'sharp'}
                                onValueChange={(value) => updateSelectedField({ cornerStyle: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CORNER_STYLES.map(style => (
                                    <SelectItem key={style.value} value={style.value}>
                                      {style.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Filter</Label>
                              <Select
                                value={selectedField.filter || 'none'}
                                onValueChange={(value) => updateSelectedField({ filter: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {FILTERS.map(filter => (
                                    <SelectItem key={filter.value} value={filter.value}>
                                      {filter.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Photo Effect</Label>
                              <Select
                                value={selectedField.photoEffect || 'none'}
                                onValueChange={(value) => updateSelectedField({ photoEffect: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {PHOTO_EFFECTS.map(effect => (
                                    <SelectItem key={effect.value} value={effect.value}>
                                      {effect.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Texture</Label>
                              <Select
                                value={selectedField.texture || 'none'}
                                onValueChange={(value) => updateSelectedField({ texture: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {TEXTURES.map(texture => (
                                    <SelectItem key={texture.value} value={texture.value}>
                                      {texture.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Paint Splatter</Label>
                              <Select
                                value={selectedField.paintSplatter || 'none'}
                                onValueChange={(value) => updateSelectedField({ paintSplatter: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PAINT_SPLATTERS.map(splatter => (
                                    <SelectItem key={splatter.value} value={splatter.value}>
                                      {splatter.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Animation</Label>
                              <Select
                                value={selectedField.animation || 'none'}
                                onValueChange={(value) => updateSelectedField({ animation: value })}
                              >
                                <SelectTrigger className="text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {ANIMATIONS.map(animation => (
                                    <SelectItem key={animation.value} value={animation.value}>
                                      {animation.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="required"
                          checked={selectedField.isRequired}
                          onCheckedChange={(checked) => updateSelectedField({ isRequired: checked as boolean })}
                        />
                        <Label htmlFor="required" className="text-xs">Required</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Fields List */}
              {fields.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label className="text-sm font-medium">Fields ({fields.length})</Label>
                  <div className="space-y-1">
                    {fields.map(field => (
                      <div
                        key={field.id}
                        className={`p-2 rounded border text-sm ${
                          field.id === selectedFieldId
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white hover:bg-gray-50'
                        } ${field.visible === false ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => setSelectedFieldId(field.id)}
                          >
                            <div className="font-medium">{field.fieldLabel}</div>
                            <div className="text-xs text-gray-500">
                              {field.fieldType === 'image' && '🖼️ Image'}
                              {field.fieldType === 'video' && '🎬 Video'}
                              {field.fieldType === 'logo' && '⭐ Logo'}
                              {field.fieldType === 'text' && '📝 Text'}
                              {field.fieldType === 'number' && '🔢 Number'}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFieldVisibility(field.id)
                              }}
                              title={field.visible === false ? 'Show element' : 'Hide element'}
                            >
                              {field.visible === false ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                editField(field)
                              }}
                              title="Edit element"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/templates">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting || isUploadingImage}>
            {isSubmitting || isUploadingImage ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Template'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
