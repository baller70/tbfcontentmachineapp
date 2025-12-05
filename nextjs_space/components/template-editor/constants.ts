// Template Editor Constants

// Photo Effects
export const PHOTO_EFFECTS = [
  { id: 'none', name: 'None', description: 'No effect' },
  { id: 'lens-flare', name: 'Lens Flare', description: 'Add light streaks' },
  { id: 'bokeh', name: 'Bokeh', description: 'Blurred light circles' },
  { id: 'glow', name: 'Glow', description: 'Soft glowing effect' },
  { id: 'particles', name: 'Particles', description: 'Floating particles' },
  { id: 'smoke', name: 'Smoke', description: 'Smoke overlay' },
  { id: 'fire', name: 'Fire', description: 'Fire overlay' },
  { id: 'sparkle', name: 'Sparkle', description: 'Sparkling effect' },
  { id: 'dust', name: 'Dust', description: 'Dust particles' },
  { id: 'rain', name: 'Rain', description: 'Rain drops' },
  { id: 'snow', name: 'Snow', description: 'Snowflakes' },
  { id: 'lightning', name: 'Lightning', description: 'Lightning bolt' },
  { id: 'neon', name: 'Neon Glow', description: 'Neon light effect' },
  { id: 'vhs', name: 'VHS', description: 'Retro VHS look' },
  { id: 'glitch', name: 'Glitch', description: 'Digital glitch' },
  { id: 'chromatic', name: 'Chromatic', description: 'Color aberration' },
  { id: 'film-grain', name: 'Film Grain', description: 'Grainy film look' },
  { id: 'light-leak', name: 'Light Leak', description: 'Light leak overlay' },
  { id: 'prism', name: 'Prism', description: 'Rainbow prism' },
  { id: 'halo', name: 'Halo', description: 'Halo ring effect' },
]

// Filters (CSS filters)
export const FILTERS = [
  { id: 'none', name: 'None', css: '' },
  { id: 'grayscale', name: 'Grayscale', css: 'grayscale(100%)' },
  { id: 'sepia', name: 'Sepia', css: 'sepia(100%)' },
  { id: 'saturate', name: 'Saturate', css: 'saturate(200%)' },
  { id: 'contrast', name: 'High Contrast', css: 'contrast(150%)' },
  { id: 'brightness', name: 'Bright', css: 'brightness(130%)' },
  { id: 'dark', name: 'Dark', css: 'brightness(70%)' },
  { id: 'invert', name: 'Invert', css: 'invert(100%)' },
  { id: 'hue-rotate', name: 'Hue Shift', css: 'hue-rotate(90deg)' },
  { id: 'blur', name: 'Blur', css: 'blur(2px)' },
  { id: 'warm', name: 'Warm', css: 'sepia(30%) saturate(120%)' },
  { id: 'cool', name: 'Cool', css: 'hue-rotate(180deg) saturate(80%)' },
  { id: 'vintage', name: 'Vintage', css: 'sepia(50%) contrast(90%) brightness(90%)' },
  { id: 'dramatic', name: 'Dramatic', css: 'contrast(150%) saturate(130%)' },
  { id: 'faded', name: 'Faded', css: 'contrast(80%) brightness(110%) saturate(70%)' },
]

// Textures
export const TEXTURES = [
  { id: 'none', name: 'None' },
  { id: 'grunge', name: 'Grunge' },
  { id: 'paper', name: 'Paper' },
  { id: 'concrete', name: 'Concrete' },
  { id: 'metal', name: 'Metal' },
  { id: 'wood', name: 'Wood' },
  { id: 'fabric', name: 'Fabric' },
  { id: 'noise', name: 'Noise' },
  { id: 'halftone', name: 'Halftone' },
  { id: 'lines', name: 'Lines' },
  { id: 'dots', name: 'Dots' },
  { id: 'grid', name: 'Grid' },
]

// Paint Splatters
export const PAINT_SPLATTERS = [
  { id: 'splatter-1', name: 'Splatter 1', color: '#FF0000' },
  { id: 'splatter-2', name: 'Splatter 2', color: '#00FF00' },
  { id: 'splatter-3', name: 'Splatter 3', color: '#0000FF' },
  { id: 'splatter-4', name: 'Splatter 4', color: '#FFFF00' },
  { id: 'splatter-5', name: 'Splatter 5', color: '#FF00FF' },
  { id: 'splatter-6', name: 'Splatter 6', color: '#00FFFF' },
  { id: 'splatter-7', name: 'Splatter 7', color: '#FFA500' },
  { id: 'splatter-8', name: 'Splatter 8', color: '#800080' },
  { id: 'splatter-9', name: 'Splatter 9', color: '#008000' },
  { id: 'splatter-10', name: 'Splatter 10', color: '#000000' },
]

// Shape options
export const SHAPES = [
  { id: 'rectangle', name: 'Rectangle', icon: '⬜' },
  { id: 'circle', name: 'Circle', icon: '⚪' },
  { id: 'ellipse', name: 'Ellipse', icon: '⬭' },
  { id: 'triangle', name: 'Triangle', icon: '△' },
  { id: 'star', name: 'Star', icon: '⭐' },
  { id: 'heart', name: 'Heart', icon: '❤️' },
  { id: 'arrow', name: 'Arrow', icon: '➡️' },
  { id: 'diamond', name: 'Diamond', icon: '◆' },
  { id: 'hexagon', name: 'Hexagon', icon: '⬡' },
  { id: 'pentagon', name: 'Pentagon', icon: '⬠' },
]

// Blend modes
export const BLEND_MODES = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'darken', label: 'Darken' },
  { value: 'lighten', label: 'Lighten' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' },
  { value: 'hue', label: 'Hue' },
  { value: 'saturation', label: 'Saturation' },
  { value: 'color', label: 'Color' },
  { value: 'luminosity', label: 'Luminosity' },
]

// Corner styles
export const CORNER_STYLES = [
  { value: 'sharp', label: 'Sharp', radius: 0 },
  { value: 'rounded', label: 'Rounded', radius: 10 },
  { value: 'circular', label: 'Circular', radius: 50 },
]

// Animation presets (for video)
export const ANIMATIONS = [
  { id: 'none', name: 'None' },
  { id: 'fade-in', name: 'Fade In' },
  { id: 'slide-left', name: 'Slide Left' },
  { id: 'slide-right', name: 'Slide Right' },
  { id: 'slide-up', name: 'Slide Up' },
  { id: 'slide-down', name: 'Slide Down' },
  { id: 'zoom-in', name: 'Zoom In' },
  { id: 'zoom-out', name: 'Zoom Out' },
  { id: 'bounce', name: 'Bounce' },
  { id: 'rotate', name: 'Rotate' },
  { id: 'pulse', name: 'Pulse' },
  { id: 'shake', name: 'Shake' },
]

// Default field values
export const DEFAULT_FIELD: Partial<import('./types').TemplateField> = {
  fontSize: 48,
  fontFamily: 'Arial',
  fontColor: '#FFFFFF',
  fontWeight: 'bold',
  textAlign: 'center',
  opacity: 1,
  rotation: 0,
  visible: true,
  cornerStyle: 'sharp',
  blendMode: 'normal',
}

