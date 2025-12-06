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

// Font families list - 150+ fonts organized by category
// Google Fonts URL generator for dynamic loading
export const getGoogleFontsUrl = (fonts: string[]) => {
  const families = fonts.map(f => f.replace(/ /g, '+')).join('&family=')
  return `https://fonts.googleapis.com/css2?family=${families}&display=swap`
}

// Font categories for organization
export type FontCategory = 'popular' | 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace' | 'system'

export interface FontFamily {
  value: string
  label: string
  category: FontCategory
  googleFont?: boolean // If true, needs to be loaded from Google Fonts
}

export const FONT_FAMILIES: FontFamily[] = [
  // === POPULAR / SPORTS FONTS ===
  { value: 'Russo One', label: 'Russo One', category: 'popular', googleFont: true },
  { value: 'Anton', label: 'Anton', category: 'popular', googleFont: true },
  { value: 'Bebas Neue', label: 'Bebas Neue', category: 'popular', googleFont: true },
  { value: 'Oswald', label: 'Oswald', category: 'popular', googleFont: true },
  { value: 'Roboto', label: 'Roboto', category: 'popular', googleFont: true },
  { value: 'Montserrat', label: 'Montserrat', category: 'popular', googleFont: true },
  { value: 'Poppins', label: 'Poppins', category: 'popular', googleFont: true },
  { value: 'Inter', label: 'Inter', category: 'popular', googleFont: true },
  { value: 'Open Sans', label: 'Open Sans', category: 'popular', googleFont: true },
  { value: 'Lato', label: 'Lato', category: 'popular', googleFont: true },

  // === SANS-SERIF ===
  { value: 'Roboto Condensed', label: 'Roboto Condensed', category: 'sans-serif', googleFont: true },
  { value: 'Source Sans Pro', label: 'Source Sans Pro', category: 'sans-serif', googleFont: true },
  { value: 'Raleway', label: 'Raleway', category: 'sans-serif', googleFont: true },
  { value: 'Ubuntu', label: 'Ubuntu', category: 'sans-serif', googleFont: true },
  { value: 'Nunito', label: 'Nunito', category: 'sans-serif', googleFont: true },
  { value: 'Nunito Sans', label: 'Nunito Sans', category: 'sans-serif', googleFont: true },
  { value: 'Work Sans', label: 'Work Sans', category: 'sans-serif', googleFont: true },
  { value: 'Quicksand', label: 'Quicksand', category: 'sans-serif', googleFont: true },
  { value: 'Rubik', label: 'Rubik', category: 'sans-serif', googleFont: true },
  { value: 'Karla', label: 'Karla', category: 'sans-serif', googleFont: true },
  { value: 'Barlow', label: 'Barlow', category: 'sans-serif', googleFont: true },
  { value: 'Barlow Condensed', label: 'Barlow Condensed', category: 'sans-serif', googleFont: true },
  { value: 'Barlow Semi Condensed', label: 'Barlow Semi Condensed', category: 'sans-serif', googleFont: true },
  { value: 'Cabin', label: 'Cabin', category: 'sans-serif', googleFont: true },
  { value: 'Exo 2', label: 'Exo 2', category: 'sans-serif', googleFont: true },
  { value: 'Manrope', label: 'Manrope', category: 'sans-serif', googleFont: true },
  { value: 'Archivo', label: 'Archivo', category: 'sans-serif', googleFont: true },
  { value: 'Archivo Black', label: 'Archivo Black', category: 'sans-serif', googleFont: true },
  { value: 'Archivo Narrow', label: 'Archivo Narrow', category: 'sans-serif', googleFont: true },
  { value: 'Mulish', label: 'Mulish', category: 'sans-serif', googleFont: true },
  { value: 'Hind', label: 'Hind', category: 'sans-serif', googleFont: true },
  { value: 'Josefin Sans', label: 'Josefin Sans', category: 'sans-serif', googleFont: true },
  { value: 'Lexend', label: 'Lexend', category: 'sans-serif', googleFont: true },
  { value: 'DM Sans', label: 'DM Sans', category: 'sans-serif', googleFont: true },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', category: 'sans-serif', googleFont: true },
  { value: 'Outfit', label: 'Outfit', category: 'sans-serif', googleFont: true },
  { value: 'Figtree', label: 'Figtree', category: 'sans-serif', googleFont: true },
  { value: 'Space Grotesk', label: 'Space Grotesk', category: 'sans-serif', googleFont: true },
  { value: 'Red Hat Display', label: 'Red Hat Display', category: 'sans-serif', googleFont: true },
  { value: 'Sora', label: 'Sora', category: 'sans-serif', googleFont: true },
  { value: 'Public Sans', label: 'Public Sans', category: 'sans-serif', googleFont: true },
  { value: 'Overpass', label: 'Overpass', category: 'sans-serif', googleFont: true },
  { value: 'Asap', label: 'Asap', category: 'sans-serif', googleFont: true },
  { value: 'Signika', label: 'Signika', category: 'sans-serif', googleFont: true },
  { value: 'Maven Pro', label: 'Maven Pro', category: 'sans-serif', googleFont: true },
  { value: 'Catamaran', label: 'Catamaran', category: 'sans-serif', googleFont: true },
  { value: 'Abel', label: 'Abel', category: 'sans-serif', googleFont: true },
  { value: 'Questrial', label: 'Questrial', category: 'sans-serif', googleFont: true },
  { value: 'Prompt', label: 'Prompt', category: 'sans-serif', googleFont: true },
  { value: 'Encode Sans', label: 'Encode Sans', category: 'sans-serif', googleFont: true },

  // === SERIF ===
  { value: 'Playfair Display', label: 'Playfair Display', category: 'serif', googleFont: true },
  { value: 'Merriweather', label: 'Merriweather', category: 'serif', googleFont: true },
  { value: 'Lora', label: 'Lora', category: 'serif', googleFont: true },
  { value: 'Libre Baskerville', label: 'Libre Baskerville', category: 'serif', googleFont: true },
  { value: 'Noto Serif', label: 'Noto Serif', category: 'serif', googleFont: true },
  { value: 'PT Serif', label: 'PT Serif', category: 'serif', googleFont: true },
  { value: 'Source Serif Pro', label: 'Source Serif Pro', category: 'serif', googleFont: true },
  { value: 'Bitter', label: 'Bitter', category: 'serif', googleFont: true },
  { value: 'Crimson Text', label: 'Crimson Text', category: 'serif', googleFont: true },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond', category: 'serif', googleFont: true },
  { value: 'EB Garamond', label: 'EB Garamond', category: 'serif', googleFont: true },
  { value: 'Spectral', label: 'Spectral', category: 'serif', googleFont: true },
  { value: 'Cardo', label: 'Cardo', category: 'serif', googleFont: true },
  { value: 'Domine', label: 'Domine', category: 'serif', googleFont: true },
  { value: 'Vollkorn', label: 'Vollkorn', category: 'serif', googleFont: true },
  { value: 'Alegreya', label: 'Alegreya', category: 'serif', googleFont: true },
  { value: 'Rokkitt', label: 'Rokkitt', category: 'serif', googleFont: true },
  { value: 'Arvo', label: 'Arvo', category: 'serif', googleFont: true },
  { value: 'Unna', label: 'Unna', category: 'serif', googleFont: true },
  { value: 'Zilla Slab', label: 'Zilla Slab', category: 'serif', googleFont: true },
  { value: 'DM Serif Display', label: 'DM Serif Display', category: 'serif', googleFont: true },
  { value: 'Libre Caslon Text', label: 'Libre Caslon Text', category: 'serif', googleFont: true },

  // === DISPLAY / DECORATIVE ===
  { value: 'Bangers', label: 'Bangers', category: 'display', googleFont: true },
  { value: 'Righteous', label: 'Righteous', category: 'display', googleFont: true },
  { value: 'Alfa Slab One', label: 'Alfa Slab One', category: 'display', googleFont: true },
  { value: 'Passion One', label: 'Passion One', category: 'display', googleFont: true },
  { value: 'Bungee', label: 'Bungee', category: 'display', googleFont: true },
  { value: 'Teko', label: 'Teko', category: 'display', googleFont: true },
  { value: 'Saira', label: 'Saira', category: 'display', googleFont: true },
  { value: 'Saira Condensed', label: 'Saira Condensed', category: 'display', googleFont: true },
  { value: 'Saira Extra Condensed', label: 'Saira Extra Condensed', category: 'display', googleFont: true },
  { value: 'Black Ops One', label: 'Black Ops One', category: 'display', googleFont: true },
  { value: 'Fredoka One', label: 'Fredoka One', category: 'display', googleFont: true },
  { value: 'Fugaz One', label: 'Fugaz One', category: 'display', googleFont: true },
  { value: 'Staatliches', label: 'Staatliches', category: 'display', googleFont: true },
  { value: 'Orbitron', label: 'Orbitron', category: 'display', googleFont: true },
  { value: 'Press Start 2P', label: 'Press Start 2P', category: 'display', googleFont: true },
  { value: 'VT323', label: 'VT323', category: 'display', googleFont: true },
  { value: 'Audiowide', label: 'Audiowide', category: 'display', googleFont: true },
  { value: 'Monoton', label: 'Monoton', category: 'display', googleFont: true },
  { value: 'Racing Sans One', label: 'Racing Sans One', category: 'display', googleFont: true },
  { value: 'Ultra', label: 'Ultra', category: 'display', googleFont: true },
  { value: 'Special Elite', label: 'Special Elite', category: 'display', googleFont: true },
  { value: 'Graduate', label: 'Graduate', category: 'display', googleFont: true },
  { value: 'Luckiest Guy', label: 'Luckiest Guy', category: 'display', googleFont: true },
  { value: 'Bowlby One SC', label: 'Bowlby One SC', category: 'display', googleFont: true },
  { value: 'Boogaloo', label: 'Boogaloo', category: 'display', googleFont: true },
  { value: 'Bree Serif', label: 'Bree Serif', category: 'display', googleFont: true },
  { value: 'Titan One', label: 'Titan One', category: 'display', googleFont: true },
  { value: 'Lilita One', label: 'Lilita One', category: 'display', googleFont: true },
  { value: 'Squada One', label: 'Squada One', category: 'display', googleFont: true },
  { value: 'Carter One', label: 'Carter One', category: 'display', googleFont: true },
  { value: 'Changa One', label: 'Changa One', category: 'display', googleFont: true },
  { value: 'Coda', label: 'Coda', category: 'display', googleFont: true },
  { value: 'Contrail One', label: 'Contrail One', category: 'display', googleFont: true },
  { value: 'Aldrich', label: 'Aldrich', category: 'display', googleFont: true },
  { value: 'Michroma', label: 'Michroma', category: 'display', googleFont: true },
  { value: 'Jockey One', label: 'Jockey One', category: 'display', googleFont: true },

  // === HANDWRITING / SCRIPT ===
  { value: 'Pacifico', label: 'Pacifico', category: 'handwriting', googleFont: true },
  { value: 'Lobster', label: 'Lobster', category: 'handwriting', googleFont: true },
  { value: 'Dancing Script', label: 'Dancing Script', category: 'handwriting', googleFont: true },
  { value: 'Great Vibes', label: 'Great Vibes', category: 'handwriting', googleFont: true },
  { value: 'Satisfy', label: 'Satisfy', category: 'handwriting', googleFont: true },
  { value: 'Permanent Marker', label: 'Permanent Marker', category: 'handwriting', googleFont: true },
  { value: 'Caveat', label: 'Caveat', category: 'handwriting', googleFont: true },
  { value: 'Kalam', label: 'Kalam', category: 'handwriting', googleFont: true },
  { value: 'Indie Flower', label: 'Indie Flower', category: 'handwriting', googleFont: true },
  { value: 'Shadows Into Light', label: 'Shadows Into Light', category: 'handwriting', googleFont: true },
  { value: 'Sacramento', label: 'Sacramento', category: 'handwriting', googleFont: true },
  { value: 'Amatic SC', label: 'Amatic SC', category: 'handwriting', googleFont: true },
  { value: 'Architects Daughter', label: 'Architects Daughter', category: 'handwriting', googleFont: true },
  { value: 'Courgette', label: 'Courgette', category: 'handwriting', googleFont: true },
  { value: 'Kaushan Script', label: 'Kaushan Script', category: 'handwriting', googleFont: true },
  { value: 'Cookie', label: 'Cookie', category: 'handwriting', googleFont: true },
  { value: 'Gloria Hallelujah', label: 'Gloria Hallelujah', category: 'handwriting', googleFont: true },
  { value: 'Rock Salt', label: 'Rock Salt', category: 'handwriting', googleFont: true },
  { value: 'Covered By Your Grace', label: 'Covered By Your Grace', category: 'handwriting', googleFont: true },
  { value: 'Yellowtail', label: 'Yellowtail', category: 'handwriting', googleFont: true },
  { value: 'Marck Script', label: 'Marck Script', category: 'handwriting', googleFont: true },
  { value: 'Patrick Hand', label: 'Patrick Hand', category: 'handwriting', googleFont: true },
  { value: 'Handlee', label: 'Handlee', category: 'handwriting', googleFont: true },
  { value: 'Nothing You Could Do', label: 'Nothing You Could Do', category: 'handwriting', googleFont: true },
  { value: 'Reenie Beanie', label: 'Reenie Beanie', category: 'handwriting', googleFont: true },
  { value: 'Bad Script', label: 'Bad Script', category: 'handwriting', googleFont: true },
  { value: 'Homemade Apple', label: 'Homemade Apple', category: 'handwriting', googleFont: true },
  { value: 'Alex Brush', label: 'Alex Brush', category: 'handwriting', googleFont: true },
  { value: 'Allura', label: 'Allura', category: 'handwriting', googleFont: true },
  { value: 'Pinyon Script', label: 'Pinyon Script', category: 'handwriting', googleFont: true },

  // === MONOSPACE ===
  { value: 'Roboto Mono', label: 'Roboto Mono', category: 'monospace', googleFont: true },
  { value: 'Source Code Pro', label: 'Source Code Pro', category: 'monospace', googleFont: true },
  { value: 'Fira Code', label: 'Fira Code', category: 'monospace', googleFont: true },
  { value: 'JetBrains Mono', label: 'JetBrains Mono', category: 'monospace', googleFont: true },
  { value: 'IBM Plex Mono', label: 'IBM Plex Mono', category: 'monospace', googleFont: true },
  { value: 'Space Mono', label: 'Space Mono', category: 'monospace', googleFont: true },
  { value: 'Ubuntu Mono', label: 'Ubuntu Mono', category: 'monospace', googleFont: true },
  { value: 'Inconsolata', label: 'Inconsolata', category: 'monospace', googleFont: true },
  { value: 'Anonymous Pro', label: 'Anonymous Pro', category: 'monospace', googleFont: true },
  { value: 'PT Mono', label: 'PT Mono', category: 'monospace', googleFont: true },

  // === SYSTEM FONTS (No Google Fonts needed) ===
  { value: 'Arial', label: 'Arial', category: 'system' },
  { value: 'Arial Black', label: 'Arial Black', category: 'system' },
  { value: 'Helvetica', label: 'Helvetica', category: 'system' },
  { value: 'Impact', label: 'Impact', category: 'system' },
  { value: 'Times New Roman', label: 'Times New Roman', category: 'system' },
  { value: 'Georgia', label: 'Georgia', category: 'system' },
  { value: 'Verdana', label: 'Verdana', category: 'system' },
  { value: 'Tahoma', label: 'Tahoma', category: 'system' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS', category: 'system' },
  { value: 'Courier New', label: 'Courier New', category: 'system' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS', category: 'system' },
  { value: 'Lucida Console', label: 'Lucida Console', category: 'system' },
  { value: 'Palatino Linotype', label: 'Palatino Linotype', category: 'system' },
  { value: 'Book Antiqua', label: 'Book Antiqua', category: 'system' },
  { value: 'Century Gothic', label: 'Century Gothic', category: 'system' },
  { value: 'Garamond', label: 'Garamond', category: 'system' },
  { value: 'Brush Script MT', label: 'Brush Script MT', category: 'system' },
  { value: 'Copperplate', label: 'Copperplate', category: 'system' },
]

// Get all Google Fonts that need to be loaded
export const GOOGLE_FONTS = FONT_FAMILIES.filter(f => f.googleFont).map(f => f.value)

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

