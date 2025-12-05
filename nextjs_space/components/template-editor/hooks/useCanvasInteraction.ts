'use client'

import { useCallback, useRef } from 'react'
import { TemplateField, StagingElement, EditorMode, GRID_SIZE, SNAP_THRESHOLD } from '../types'

interface UseCanvasInteractionProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
  canvasScale: number
  fields: TemplateField[]
  selectedFieldId: string | null
  setSelectedFieldId: React.Dispatch<React.SetStateAction<string | null>>
  stagingElement: StagingElement | null
  setStagingElement: React.Dispatch<React.SetStateAction<StagingElement | null>>
  editorMode: EditorMode
  // Drag state
  isDragging: boolean
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>
  dragOffset: { x: number; y: number } | null
  setDragOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>
  // Resize state
  isResizing: boolean
  setIsResizing: React.Dispatch<React.SetStateAction<boolean>>
  resizeHandle: string | null
  setResizeHandle: React.Dispatch<React.SetStateAction<string | null>>
  // Rotate state
  isRotating: boolean
  setIsRotating: React.Dispatch<React.SetStateAction<boolean>>
  initialRotation: number
  setInitialRotation: React.Dispatch<React.SetStateAction<number>>
  initialAngle: number
  setInitialAngle: React.Dispatch<React.SetStateAction<number>>
  // Actions
  updateField: (fieldId: string, updates: Partial<TemplateField>) => void
  snapToGrid: (value: number) => number
  findAlignmentGuides: (field: TemplateField | StagingElement, excludeId?: string) => void
  setAlignmentGuides: React.Dispatch<React.SetStateAction<any[]>>
}

const RESIZE_HANDLE_SIZE = 12 // Larger for mobile

export function useCanvasInteraction({
  canvasRef,
  canvasScale,
  fields,
  selectedFieldId,
  setSelectedFieldId,
  stagingElement,
  setStagingElement,
  editorMode,
  isDragging,
  setIsDragging,
  dragOffset,
  setDragOffset,
  isResizing,
  setIsResizing,
  resizeHandle,
  setResizeHandle,
  isRotating,
  setIsRotating,
  initialRotation,
  setInitialRotation,
  initialAngle,
  setInitialAngle,
  updateField,
  snapToGrid,
  findAlignmentGuides,
  setAlignmentGuides,
}: UseCanvasInteractionProps) {
  const interactionStartPos = useRef<{ x: number; y: number } | null>(null)
  const initialFieldState = useRef<TemplateField | null>(null)
  
  // Get canvas coordinates from mouse/touch event
  const getCanvasCoords = useCallback((e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    
    const rect = canvas.getBoundingClientRect()
    let clientX: number, clientY: number
    
    if ('touches' in e) {
      if (e.touches.length === 0) return null
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    // Account for scale
    const x = (clientX - rect.left) / canvasScale
    const y = (clientY - rect.top) / canvasScale
    
    return { x, y }
  }, [canvasRef, canvasScale])
  
  // Check if point is on resize handle
  const getResizeHandle = useCallback((x: number, y: number, field: TemplateField): string | null => {
    const handles = [
      { name: 'nw', x: field.x, y: field.y },
      { name: 'n', x: field.x + field.width / 2, y: field.y },
      { name: 'ne', x: field.x + field.width, y: field.y },
      { name: 'e', x: field.x + field.width, y: field.y + field.height / 2 },
      { name: 'se', x: field.x + field.width, y: field.y + field.height },
      { name: 's', x: field.x + field.width / 2, y: field.y + field.height },
      { name: 'sw', x: field.x, y: field.y + field.height },
      { name: 'w', x: field.x, y: field.y + field.height / 2 },
    ]
    
    const handleSize = RESIZE_HANDLE_SIZE / canvasScale
    
    for (const handle of handles) {
      if (
        x >= handle.x - handleSize / 2 &&
        x <= handle.x + handleSize / 2 &&
        y >= handle.y - handleSize / 2 &&
        y <= handle.y + handleSize / 2
      ) {
        return handle.name
      }
    }
    
    // Check rotation handle (above top center)
    const rotateHandleY = field.y - 30 / canvasScale
    const rotateHandleX = field.x + field.width / 2
    if (
      x >= rotateHandleX - handleSize &&
      x <= rotateHandleX + handleSize &&
      y >= rotateHandleY - handleSize &&
      y <= rotateHandleY + handleSize
    ) {
      return 'rotate'
    }
    
    return null
  }, [canvasScale])
  
  // Find field at point
  const findFieldAtPoint = useCallback((x: number, y: number): TemplateField | null => {
    // Search in reverse order (top layer first)
    for (let i = fields.length - 1; i >= 0; i--) {
      const field = fields[i]
      if (
        x >= field.x &&
        x <= field.x + field.width &&
        y >= field.y &&
        y <= field.y + field.height
      ) {
        return field
      }
    }
    return null
  }, [fields])

  return {
    getCanvasCoords,
    getResizeHandle,
    findFieldAtPoint,
    interactionStartPos,
    initialFieldState,
    RESIZE_HANDLE_SIZE,
  }
}

