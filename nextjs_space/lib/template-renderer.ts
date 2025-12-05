/**
 * Template Renderer - Shared rendering logic for template editor and generation
 * This ensures consistent text/image positioning across the entire system
 */

import type { TemplateField } from '@/components/template-editor/types'

export interface RenderOptions {
  showPlaceholders?: boolean
  showLabels?: boolean
  selectedFieldId?: string | null
  scale?: number
}

/**
 * Load an image with CORS handling and fallback to proxy
 */
export async function loadImageSafely(src: string, templateId?: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => {
      if (templateId && !src.includes('/api/templates/')) {
        const proxyImg = new Image()
        proxyImg.crossOrigin = 'anonymous'
        proxyImg.onload = () => resolve(proxyImg)
        proxyImg.onerror = () => reject(new Error(`Failed to load image: ${src}`))
        proxyImg.src = `/api/templates/${templateId}/image?url=${encodeURIComponent(src)}`
      } else {
        reject(new Error(`Failed to load image: ${src}`))
      }
    }
    img.src = src
  })
}

/**
 * Calculate the actual text position for rendering - SINGLE SOURCE OF TRUTH
 */
export function calculateTextPosition(
  field: TemplateField,
  textWidth: number
): { x: number; y: number } {
  let x = field.x
  if (field.textAlign === 'center') {
    x = field.x + field.width / 2
  } else if (field.textAlign === 'right') {
    x = field.x + field.width
  }
  // Y position: use middle baseline for consistent vertical centering
  const y = field.y + field.height / 2
  return { x, y }
}

/**
 * Draw a rounded rectangle path
 */
function roundRect(
  ctx: CanvasRenderingContext2D, x: number, y: number,
  width: number, height: number, radius: number
): void {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/**
 * Render a text field onto a canvas context
 */
export function renderTextField(
  ctx: CanvasRenderingContext2D,
  field: TemplateField,
  text: string
): void {
  ctx.save()

  // Apply rotation
  if (field.rotation) {
    const cx = field.x + field.width / 2, cy = field.y + field.height / 2
    ctx.translate(cx, cy)
    ctx.rotate((field.rotation * Math.PI) / 180)
    ctx.translate(-cx, -cy)
  }

  if (field.blendMode && field.blendMode !== 'normal') {
    ctx.globalCompositeOperation = field.blendMode as GlobalCompositeOperation
  }
  ctx.globalAlpha = field.opacity ?? 1

  // Apply shadow
  if (field.shadowEnabled) {
    ctx.shadowColor = field.shadowColor || '#000000'
    ctx.shadowBlur = field.shadowBlur || 4
    ctx.shadowOffsetX = field.shadowOffsetX || 2
    ctx.shadowOffsetY = field.shadowOffsetY || 2
  }

  // Set font
  ctx.font = `${field.fontWeight || 'normal'} ${field.fontSize || 24}px ${field.fontFamily || 'Arial'}`
  ctx.fillStyle = field.fontColor || '#000000'
  ctx.textAlign = (field.textAlign as CanvasTextAlign) || 'left'
  ctx.textBaseline = 'middle'

  // Calculate position and render
  const position = calculateTextPosition(field, ctx.measureText(text).width)
  let displayText = text
  if (field.textTransform === 'uppercase') displayText = text.toUpperCase()
  else if (field.textTransform === 'lowercase') displayText = text.toLowerCase()
  else if (field.textTransform === 'capitalize') displayText = text.replace(/\b\w/g, l => l.toUpperCase())

  ctx.fillText(displayText, position.x, position.y)
  ctx.restore()
}

/**
 * Render an image field onto a canvas context
 */
export async function renderImageField(
  ctx: CanvasRenderingContext2D,
  field: TemplateField,
  imageSrc: string,
  templateId?: string
): Promise<void> {
  try {
    const img = await loadImageSafely(imageSrc, templateId)
    ctx.save()

    if (field.rotation) {
      const cx = field.x + field.width / 2, cy = field.y + field.height / 2
      ctx.translate(cx, cy)
      ctx.rotate((field.rotation * Math.PI) / 180)
      ctx.translate(-cx, -cy)
    }

    if (field.blendMode && field.blendMode !== 'normal') {
      ctx.globalCompositeOperation = field.blendMode as GlobalCompositeOperation
    }
    ctx.globalAlpha = field.opacity ?? 1

    if (field.borderRadius && field.borderRadius > 0) {
      ctx.beginPath()
      roundRect(ctx, field.x, field.y, field.width, field.height, field.borderRadius)
      ctx.clip()
    }

    ctx.drawImage(img, field.x, field.y, field.width, field.height)

    if (field.borderWidth && field.borderWidth > 0) {
      ctx.strokeStyle = field.borderColor || '#000000'
      ctx.lineWidth = field.borderWidth
      ctx.strokeRect(field.x, field.y, field.width, field.height)
    }
    ctx.restore()
  } catch (error) {
    console.error('Failed to render image field:', error)
  }
}

/**
 * Render a placeholder box for editor mode
 */
export function renderPlaceholder(
  ctx: CanvasRenderingContext2D,
  field: TemplateField,
  isSelected: boolean = false
): void {
  ctx.save()

  if (field.rotation) {
    const cx = field.x + field.width / 2, cy = field.y + field.height / 2
    ctx.translate(cx, cy)
    ctx.rotate((field.rotation * Math.PI) / 180)
    ctx.translate(-cx, -cy)
  }

  const isImageField = ['image', 'logo', 'video'].includes(field.fieldType)

  if (isImageField) {
    ctx.fillStyle = 'rgba(168, 85, 247, 0.1)'
    ctx.fillRect(field.x, field.y, field.width, field.height)
    ctx.strokeStyle = isSelected ? '#3b82f6' : 'rgba(168, 85, 247, 0.5)'
    ctx.lineWidth = isSelected ? 2 : 1
    ctx.setLineDash([5, 5])
    ctx.strokeRect(field.x, field.y, field.width, field.height)
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(168, 85, 247, 0.8)'
    ctx.font = '24px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🖼️', field.x + field.width / 2, field.y + field.height / 2)
  } else {
    const previewText = field.defaultValue || `{${field.fieldLabel}}`
    ctx.font = `${field.fontWeight || 'normal'} ${field.fontSize || 24}px ${field.fontFamily || 'Arial'}`
    ctx.fillStyle = field.fontColor || '#FFFFFF'
    ctx.textAlign = (field.textAlign as CanvasTextAlign) || 'left'
    ctx.textBaseline = 'middle'
    ctx.globalAlpha = field.opacity ?? 1
    const position = calculateTextPosition(field, ctx.measureText(previewText).width)
    ctx.fillText(previewText, position.x, position.y)
    ctx.globalAlpha = 1
    ctx.strokeStyle = isSelected ? '#3b82f6' : 'rgba(107, 114, 128, 0.3)'
    ctx.lineWidth = isSelected ? 2 : 1
    ctx.strokeRect(field.x, field.y, field.width, field.height)
  }

  // Draw label badge
  ctx.fillStyle = isSelected ? '#3b82f6' : 'rgba(107, 114, 128, 0.8)'
  ctx.font = '12px Arial'
  const labelWidth = ctx.measureText(field.fieldLabel).width + 10
  ctx.fillRect(field.x, field.y - 20, labelWidth, 18)
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(field.fieldLabel, field.x + 5, field.y - 11)
  ctx.restore()
}

/** Render resize handles for selected field */
export function renderResizeHandles(ctx: CanvasRenderingContext2D, field: TemplateField): void {
  const hs = 8
  const handles = [
    { x: field.x, y: field.y }, { x: field.x + field.width / 2, y: field.y },
    { x: field.x + field.width, y: field.y }, { x: field.x + field.width, y: field.y + field.height / 2 },
    { x: field.x + field.width, y: field.y + field.height }, { x: field.x + field.width / 2, y: field.y + field.height },
    { x: field.x, y: field.y + field.height }, { x: field.x, y: field.y + field.height / 2 },
  ]
  ctx.save()
  handles.forEach(h => {
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.fillRect(h.x - hs / 2, h.y - hs / 2, hs, hs)
    ctx.strokeRect(h.x - hs / 2, h.y - hs / 2, hs, hs)
  })
  ctx.restore()
}

/** Get the resize handle at a given position */
export function getResizeHandleAt(field: TemplateField, x: number, y: number, tolerance: number = 10): string | null {
  const handles: Record<string, { x: number; y: number }> = {
    'nw': { x: field.x, y: field.y }, 'n': { x: field.x + field.width / 2, y: field.y },
    'ne': { x: field.x + field.width, y: field.y }, 'e': { x: field.x + field.width, y: field.y + field.height / 2 },
    'se': { x: field.x + field.width, y: field.y + field.height }, 's': { x: field.x + field.width / 2, y: field.y + field.height },
    'sw': { x: field.x, y: field.y + field.height }, 'w': { x: field.x, y: field.y + field.height / 2 },
  }
  for (const [name, pos] of Object.entries(handles)) {
    if (Math.abs(x - pos.x) <= tolerance && Math.abs(y - pos.y) <= tolerance) return name
  }
  return null
}

/** Check if a point is inside a field */
export function isPointInField(field: TemplateField, x: number, y: number): boolean {
  return x >= field.x && x <= field.x + field.width && y >= field.y && y <= field.y + field.height
}

/** Sort fields by zIndex for proper layer ordering */
export function sortFieldsByLayer(fields: TemplateField[]): TemplateField[] {
  return [...fields].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
}

