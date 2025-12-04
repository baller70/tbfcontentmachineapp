
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface BrandingColors {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  logoUrl: string | null
}

interface BrandingContextType {
  branding: BrandingColors
  refreshBranding: () => Promise<void>
  isLoading: boolean
}

const defaultBranding: BrandingColors = {
  primaryColor: '#3b82f6',
  secondaryColor: '#6b7280',
  accentColor: '#10b981',
  logoUrl: null
}

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  refreshBranding: async () => {},
  isLoading: true
})

export function useBranding() {
  return useContext(BrandingContext)
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingColors>(defaultBranding)
  const [isLoading, setIsLoading] = useState(true)

  const fetchBranding = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/branding/current')
      if (response.ok) {
        const data = await response.json()
        setBranding(data.branding)
        applyBrandingColors(data.branding)
      }
    } catch (error) {
      console.error('Failed to fetch branding:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyBrandingColors = (colors: BrandingColors) => {
    const root = document.documentElement
    
    // Set CSS custom properties for dynamic theming
    root.style.setProperty('--color-primary', colors.primaryColor)
    root.style.setProperty('--color-secondary', colors.secondaryColor)
    root.style.setProperty('--color-accent', colors.accentColor)
    
    // Convert hex to RGB for Tailwind compatibility
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result 
        ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
        : '59 130 246' // Default blue
    }
    
    root.style.setProperty('--color-primary-rgb', hexToRgb(colors.primaryColor))
    root.style.setProperty('--color-secondary-rgb', hexToRgb(colors.secondaryColor))
    root.style.setProperty('--color-accent-rgb', hexToRgb(colors.accentColor))
    
    // Also update standard blue colors to use brand primary
    // This makes existing blue-600, blue-500, etc. use brand colors
    const primaryRgb = hexToRgb(colors.primaryColor)
    root.style.setProperty('--tw-color-blue-600', colors.primaryColor)
    root.style.setProperty('--tw-color-blue-500', colors.primaryColor)
    root.style.setProperty('--tw-color-blue-700', colors.primaryColor)
  }

  useEffect(() => {
    fetchBranding()
  }, [])

  return (
    <BrandingContext.Provider value={{ 
      branding, 
      refreshBranding: fetchBranding, 
      isLoading 
    }}>
      {children}
    </BrandingContext.Provider>
  )
}
