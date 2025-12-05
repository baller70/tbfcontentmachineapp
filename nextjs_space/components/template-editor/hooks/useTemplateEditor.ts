'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { TemplateField, StagingElement, EditorMode, AlignmentGuide, GRID_SIZE, SNAP_THRESHOLD } from '../types'
import { DEFAULT_FIELD } from '../constants'

interface UseTemplateEditorProps {
  initialFields?: TemplateField[]
  canvasWidth: number
  canvasHeight: number
  onFieldsChange?: (fields: TemplateField[]) => void
}

interface HistoryState {
  fields: TemplateField[]
  selectedFieldId: string | null
}

export function useTemplateEditor({
  initialFields = [],
  canvasWidth,
  canvasHeight,
  onFieldsChange,
}: UseTemplateEditorProps) {
  // Core state
  const [fields, setFields] = useState<TemplateField[]>(initialFields)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [stagingElement, setStagingElement] = useState<StagingElement | null>(null)
  const [editorMode, setEditorMode] = useState<EditorMode>('select')
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([])
  
  // Interaction state
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [initialRotation, setInitialRotation] = useState(0)
  const [initialAngle, setInitialAngle] = useState(0)
  
  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([{ fields: initialFields, selectedFieldId: null }])
  const [historyIndex, setHistoryIndex] = useState(0)
  const maxHistory = 50
  
  // Refs
  const lastActionTime = useRef(Date.now())
  
  // Update parent when fields change
  useEffect(() => {
    onFieldsChange?.(fields)
  }, [fields, onFieldsChange])
  
  // Save to history
  const saveToHistory = useCallback((newFields: TemplateField[], newSelectedId: string | null) => {
    const now = Date.now()
    // Debounce history saves
    if (now - lastActionTime.current < 100) return
    lastActionTime.current = now
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push({ fields: newFields, selectedFieldId: newSelectedId })
      if (newHistory.length > maxHistory) newHistory.shift()
      return newHistory
    })
    setHistoryIndex(prev => Math.min(prev + 1, maxHistory - 1))
  }, [historyIndex])
  
  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1]
      setFields(prevState.fields)
      setSelectedFieldId(prevState.selectedFieldId)
      setHistoryIndex(prev => prev - 1)
    }
  }, [history, historyIndex])
  
  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      setFields(nextState.fields)
      setSelectedFieldId(nextState.selectedFieldId)
      setHistoryIndex(prev => prev + 1)
    }
  }, [history, historyIndex])
  
  // Snap to grid
  const snapToGrid = useCallback((value: number): number => {
    const snapped = Math.round(value / GRID_SIZE) * GRID_SIZE
    return Math.abs(value - snapped) < SNAP_THRESHOLD ? snapped : value
  }, [])
  
  // Find alignment guides
  const findAlignmentGuides = useCallback((field: TemplateField | StagingElement, excludeId?: string): AlignmentGuide[] => {
    const guides: AlignmentGuide[] = []
    const fieldCenterX = field.x + field.width / 2
    const fieldCenterY = field.y + field.height / 2
    
    // Canvas center guides
    if (Math.abs(fieldCenterX - canvasWidth / 2) < SNAP_THRESHOLD) {
      guides.push({ type: 'vertical', position: canvasWidth / 2, label: 'Center' })
    }
    if (Math.abs(fieldCenterY - canvasHeight / 2) < SNAP_THRESHOLD) {
      guides.push({ type: 'horizontal', position: canvasHeight / 2, label: 'Center' })
    }
    
    // Edge guides from other fields
    fields.forEach(other => {
      if (other.id === excludeId) return
      
      // Left edge alignment
      if (Math.abs(field.x - other.x) < SNAP_THRESHOLD) {
        guides.push({ type: 'vertical', position: other.x, label: 'Left' })
      }
      // Right edge alignment
      if (Math.abs(field.x + field.width - (other.x + other.width)) < SNAP_THRESHOLD) {
        guides.push({ type: 'vertical', position: other.x + other.width, label: 'Right' })
      }
      // Top edge alignment
      if (Math.abs(field.y - other.y) < SNAP_THRESHOLD) {
        guides.push({ type: 'horizontal', position: other.y, label: 'Top' })
      }
      // Bottom edge alignment
      if (Math.abs(field.y + field.height - (other.y + other.height)) < SNAP_THRESHOLD) {
        guides.push({ type: 'horizontal', position: other.y + other.height, label: 'Bottom' })
      }
    })
    
    return guides
  }, [fields, canvasWidth, canvasHeight])
  
  // Get selected field
  const selectedField = fields.find(f => f.id === selectedFieldId) || null
  
  // Can undo/redo
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1
  
  return {
    // State
    fields,
    setFields,
    selectedFieldId,
    setSelectedFieldId,
    selectedField,
    stagingElement,
    setStagingElement,
    editorMode,
    setEditorMode,
    alignmentGuides,
    setAlignmentGuides,
    // Interaction state
    isDragging,
    setIsDragging,
    isResizing,
    setIsResizing,
    isRotating,
    setIsRotating,
    dragOffset,
    setDragOffset,
    resizeHandle,
    setResizeHandle,
    initialRotation,
    setInitialRotation,
    initialAngle,
    setInitialAngle,
    // History
    undo,
    redo,
    canUndo,
    canRedo,
    saveToHistory,
    // Utilities
    snapToGrid,
    findAlignmentGuides,
  }
}

