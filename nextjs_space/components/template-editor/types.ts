// Template Editor Types

export interface TemplateField {
  id: string
  fieldName: string
  fieldLabel: string
  fieldType: 'text' | 'number' | 'image' | 'logo' | 'video' | 'shape' | 'photo-effect' | 'filter' | 'texture' | 'paint-splatter'
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  fontFamily: string
  fontColor: string
  fontWeight: string
  textAlign: 'left' | 'center' | 'right'
  opacity: number
  rotation: number
  defaultValue?: string
  isRequired: boolean
  order: number
  zIndex: number
  visible?: boolean
  imagePreview?: string
  videoPreview?: string
  // Text styling
  letterSpacing: number
  lineHeight: number
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  // Shadow properties
  shadowEnabled: boolean
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  // Border/shape properties
  borderRadius: number
  borderWidth: number
  borderColor: string
  // Blend mode
  blendMode: string
  // Effect
  effectType?: string
  effectIntensity: number
  // Legacy visual effects (for backwards compatibility)
  photoEffect?: string
  filter?: string
  texture?: string
  cornerStyle?: 'sharp' | 'rounded' | 'circular'
  shape?: string
  paintSplatter?: string
  animation?: string
  outlineColor?: string
  outlineWidth?: number
  blur?: number
  backgroundColor?: string
  fill?: string
  shadow?: {
    color: string
    x: number
    y: number
    blur: number
  }
  cropArea?: {
    x: number
    y: number
    width: number
    height: number
  }
  effectValue?: string
  effectFilePath?: string
}

export interface StagingElement extends Omit<TemplateField, 'fieldName' | 'fieldLabel' | 'isRequired' | 'order'> {
  type: TemplateField['fieldType']
  content: string
}

export interface Template {
  id: string
  name: string
  description: string | null
  category: string
  imageUrl: string
  width: number
  height: number
  companyId?: string
  isPublic?: boolean
  fields: TemplateField[]
}

export interface AlignmentGuide {
  type: 'vertical' | 'horizontal'
  position: number
  label: string
}

export type EditorMode = 'select' | 'place-text' | 'place-number' | 'place-image' | 'place-logo' | 'place-video' | 'place-shape'

export interface EditorState {
  fields: TemplateField[]
  selectedFieldId: string | null
  stagingElement: StagingElement | null
  editorMode: EditorMode
  canvasScale: number
  imageDimensions: { width: number; height: number }
  imagePreview: string
  alignmentGuides: AlignmentGuide[]
  // Interaction state
  isDragging: boolean
  isResizing: boolean
  isRotating: boolean
  dragOffset: { x: number; y: number } | null
  resizeHandle: string | null
}

export interface CanvasInteraction {
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void
  onMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void
  onTouchStart: (e: React.TouchEvent<HTMLCanvasElement>) => void
  onTouchMove: (e: React.TouchEvent<HTMLCanvasElement>) => void
  onTouchEnd: (e: React.TouchEvent<HTMLCanvasElement>) => void
}

// Font families list
export const FONT_FAMILIES = [
  { value: 'Russo One', label: 'Russo One' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Impact', label: 'Impact' },
  { value: 'Arial Black', label: 'Arial Black' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Oswald', label: 'Oswald' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Bebas Neue', label: 'Bebas Neue' },
  { value: 'Anton', label: 'Anton' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Tahoma', label: 'Tahoma' },
  { value: 'Lobster', label: 'Lobster' },
  { value: 'Pacifico', label: 'Pacifico' },
  { value: 'Bangers', label: 'Bangers' },
  { value: 'Permanent Marker', label: 'Permanent Marker' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS' },
] as const

// Grid and snap settings
export const GRID_SIZE = 10
export const SNAP_THRESHOLD = 15

// Category options
export const CATEGORIES = [
  { value: 'sports', label: 'Sports' },
  { value: 'scoreboards', label: 'Scoreboards' },
  { value: 'player-highlights', label: 'Player Highlights' },
  { value: 'video-highlights', label: 'Video Highlights' },
  { value: 'game-announcements', label: 'Game Announcements' },
  { value: 'quotes', label: 'Quotes' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'events', label: 'Events' },
  { value: 'custom', label: 'Custom' },
] as const

