'use client'

import { useCallback } from 'react'
import { TemplateField, StagingElement } from '../types'
import { DEFAULT_FIELD } from '../constants'

interface UseFieldManagementProps {
  fields: TemplateField[]
  setFields: React.Dispatch<React.SetStateAction<TemplateField[]>>
  selectedFieldId: string | null
  setSelectedFieldId: React.Dispatch<React.SetStateAction<string | null>>
  saveToHistory: (fields: TemplateField[], selectedId: string | null) => void
}

export function useFieldManagement({
  fields,
  setFields,
  selectedFieldId,
  setSelectedFieldId,
  saveToHistory,
}: UseFieldManagementProps) {
  // Generate unique ID
  const generateId = useCallback(() => {
    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])
  
  // Add new field from staging element
  const addField = useCallback((staging: StagingElement, name: string, label: string): TemplateField => {
    const newField: TemplateField = {
      ...DEFAULT_FIELD as TemplateField,
      id: generateId(),
      fieldName: name.toLowerCase().replace(/\s+/g, '_'),
      fieldLabel: label,
      fieldType: staging.type as TemplateField['fieldType'],
      x: staging.x,
      y: staging.y,
      width: staging.width,
      height: staging.height,
      fontSize: staging.fontSize || DEFAULT_FIELD.fontSize || 48,
      fontFamily: staging.fontFamily || DEFAULT_FIELD.fontFamily || 'Arial',
      fontColor: staging.fontColor || DEFAULT_FIELD.fontColor || '#FFFFFF',
      fontWeight: staging.fontWeight || DEFAULT_FIELD.fontWeight || 'bold',
      textAlign: (staging.textAlign as 'left' | 'center' | 'right') || DEFAULT_FIELD.textAlign || 'center',
      opacity: staging.opacity ?? DEFAULT_FIELD.opacity ?? 1,
      rotation: staging.rotation ?? DEFAULT_FIELD.rotation ?? 0,
      zIndex: staging.zIndex ?? DEFAULT_FIELD.zIndex ?? 0,
      isRequired: false,
      order: fields.length,
      visible: true,
      letterSpacing: DEFAULT_FIELD.letterSpacing ?? 0,
      lineHeight: DEFAULT_FIELD.lineHeight ?? 1.2,
      textTransform: DEFAULT_FIELD.textTransform ?? 'none',
      shadowEnabled: DEFAULT_FIELD.shadowEnabled ?? false,
      shadowColor: DEFAULT_FIELD.shadowColor ?? '#000000',
      shadowBlur: DEFAULT_FIELD.shadowBlur ?? 4,
      shadowOffsetX: DEFAULT_FIELD.shadowOffsetX ?? 2,
      shadowOffsetY: DEFAULT_FIELD.shadowOffsetY ?? 2,
      borderRadius: DEFAULT_FIELD.borderRadius ?? 0,
      borderWidth: DEFAULT_FIELD.borderWidth ?? 0,
      borderColor: DEFAULT_FIELD.borderColor ?? '#000000',
      blendMode: staging.blendMode || DEFAULT_FIELD.blendMode || 'normal',
      effectIntensity: DEFAULT_FIELD.effectIntensity ?? 50,
      // Copy effects
      photoEffect: staging.photoEffect,
      filter: staging.filter,
      texture: staging.texture,
      cornerStyle: staging.cornerStyle,
      shape: staging.shape,
      paintSplatter: staging.paintSplatter,
      shadow: staging.shadow,
      backgroundColor: staging.backgroundColor,
    }
    
    setFields(prev => {
      const newFields = [...prev, newField]
      saveToHistory(newFields, newField.id)
      return newFields
    })
    setSelectedFieldId(newField.id)
    
    return newField
  }, [fields.length, generateId, saveToHistory, setFields, setSelectedFieldId])
  
  // Update field
  const updateField = useCallback((fieldId: string, updates: Partial<TemplateField>) => {
    setFields(prev => {
      const newFields = prev.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
      saveToHistory(newFields, selectedFieldId)
      return newFields
    })
  }, [saveToHistory, selectedFieldId, setFields])
  
  // Update selected field
  const updateSelectedField = useCallback((updates: Partial<TemplateField>) => {
    if (!selectedFieldId) return
    updateField(selectedFieldId, updates)
  }, [selectedFieldId, updateField])
  
  // Delete field
  const deleteField = useCallback((fieldId: string) => {
    setFields(prev => {
      const newFields = prev.filter(f => f.id !== fieldId)
      saveToHistory(newFields, null)
      return newFields
    })
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null)
    }
  }, [saveToHistory, selectedFieldId, setFields, setSelectedFieldId])
  
  // Duplicate field
  const duplicateField = useCallback((fieldId: string) => {
    const field = fields.find(f => f.id === fieldId)
    if (!field) return
    
    const newField: TemplateField = {
      ...field,
      id: generateId(),
      fieldName: `${field.fieldName}_copy`,
      fieldLabel: `${field.fieldLabel} (Copy)`,
      x: field.x + 20,
      y: field.y + 20,
      order: fields.length,
    }
    
    setFields(prev => {
      const newFields = [...prev, newField]
      saveToHistory(newFields, newField.id)
      return newFields
    })
    setSelectedFieldId(newField.id)
  }, [fields, generateId, saveToHistory, setFields, setSelectedFieldId])
  
  // Move field in layer order
  const moveFieldLayer = useCallback((fieldId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    setFields(prev => {
      const index = prev.findIndex(f => f.id === fieldId)
      if (index === -1) return prev
      
      const newFields = [...prev]
      const [field] = newFields.splice(index, 1)
      
      switch (direction) {
        case 'up':
          newFields.splice(Math.min(index + 1, newFields.length), 0, field)
          break
        case 'down':
          newFields.splice(Math.max(index - 1, 0), 0, field)
          break
        case 'top':
          newFields.push(field)
          break
        case 'bottom':
          newFields.unshift(field)
          break
      }
      
      // Update order values
      newFields.forEach((f, i) => f.order = i)
      saveToHistory(newFields, selectedFieldId)
      return newFields
    })
  }, [saveToHistory, selectedFieldId, setFields])
  
  // Toggle field visibility
  const toggleFieldVisibility = useCallback((fieldId: string) => {
    updateField(fieldId, { visible: !fields.find(f => f.id === fieldId)?.visible })
  }, [fields, updateField])

  // Get field by ID
  const getField = useCallback((fieldId: string) => {
    return fields.find(f => f.id === fieldId)
  }, [fields])

  // Reorder fields (for drag-and-drop)
  const reorderFields = useCallback((newFields: TemplateField[]) => {
    setFields(newFields)
    saveToHistory(newFields, selectedFieldId)
  }, [saveToHistory, selectedFieldId, setFields])

  return {
    addField,
    updateField,
    updateSelectedField,
    deleteField,
    duplicateField,
    moveFieldLayer,
    toggleFieldVisibility,
    getField,
    generateId,
    reorderFields,
  }
}

