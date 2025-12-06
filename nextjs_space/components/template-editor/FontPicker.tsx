'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FONT_FAMILIES, GOOGLE_FONTS, FontCategory } from './types'

interface FontPickerProps {
  value: string
  onChange: (font: string) => void
  className?: string
}

// Load Google Fonts dynamically
const loadGoogleFonts = () => {
  if (typeof window === 'undefined') return
  
  const existingLink = document.getElementById('google-fonts-preview')
  if (existingLink) return // Already loaded
  
  // Load fonts in batches to avoid URL length limits
  const batchSize = 50
  const fonts = GOOGLE_FONTS
  
  for (let i = 0; i < fonts.length; i += batchSize) {
    const batch = fonts.slice(i, i + batchSize)
    const families = batch.map(f => f.replace(/ /g, '+')).join('&family=')
    const link = document.createElement('link')
    link.id = i === 0 ? 'google-fonts-preview' : `google-fonts-preview-${i}`
    link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }
}

// Category labels
const categoryLabels: Record<FontCategory, string> = {
  popular: '⭐ Popular',
  'sans-serif': 'Sans Serif',
  serif: 'Serif',
  display: 'Display',
  handwriting: 'Handwriting',
  monospace: 'Monospace',
  system: 'System Fonts',
}

// Category order
const categoryOrder: FontCategory[] = ['popular', 'sans-serif', 'serif', 'display', 'handwriting', 'monospace', 'system']

export default function FontPicker({ value, onChange, className }: FontPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  
  // Load Google Fonts when component mounts
  useEffect(() => {
    loadGoogleFonts()
  }, [])
  
  // Group fonts by category
  const fontsByCategory = useMemo(() => {
    const grouped: Record<FontCategory, typeof FONT_FAMILIES> = {
      popular: [],
      'sans-serif': [],
      serif: [],
      display: [],
      handwriting: [],
      monospace: [],
      system: [],
    }
    
    FONT_FAMILIES.forEach(font => {
      if (grouped[font.category]) {
        grouped[font.category].push(font)
      }
    })
    
    return grouped
  }, [])
  
  // Filter fonts based on search
  const filteredFonts = useMemo(() => {
    if (!search) return fontsByCategory
    
    const searchLower = search.toLowerCase()
    const result: Record<FontCategory, typeof FONT_FAMILIES> = {
      popular: [],
      'sans-serif': [],
      serif: [],
      display: [],
      handwriting: [],
      monospace: [],
      system: [],
    }
    
    FONT_FAMILIES.forEach(font => {
      if (font.label.toLowerCase().includes(searchLower)) {
        result[font.category].push(font)
      }
    })
    
    return result
  }, [search, fontsByCategory])
  
  const selectedFont = FONT_FAMILIES.find(f => f.value === value)
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between h-9 bg-gray-800 border-gray-600 hover:bg-gray-700', className)}
          style={{ fontFamily: value }}
        >
          <span className="truncate">{selectedFont?.label || value || 'Select font...'}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-gray-900 border-gray-700" align="start">
        <Command className="bg-gray-900">
          <div className="flex items-center border-b border-gray-700 px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-10 w-full bg-transparent py-3 text-sm text-white placeholder:text-gray-500 outline-none"
              placeholder="Search fonts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <CommandList className="max-h-[400px] overflow-auto">
            <CommandEmpty className="py-6 text-center text-sm text-gray-400">No font found.</CommandEmpty>
            {categoryOrder.map(category => {
              const fonts = filteredFonts[category]
              if (fonts.length === 0) return null
              
              return (
                <CommandGroup key={category} heading={categoryLabels[category]} className="text-gray-400">
                  {fonts.map(font => (
                    <CommandItem
                      key={font.value}
                      value={font.value}
                      onSelect={() => { onChange(font.value); setOpen(false) }}
                      className="cursor-pointer hover:bg-gray-800 text-white"
                    >
                      <Check className={cn('mr-2 h-4 w-4', value === font.value ? 'opacity-100' : 'opacity-0')} />
                      <span style={{ fontFamily: font.value }} className="text-base">
                        {font.label}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

