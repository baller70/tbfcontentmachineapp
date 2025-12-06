'use client'

import { useState, useMemo, useCallback } from 'react'
import { Post, PostFilters } from './types'

// ============================================================================
// usePostSelection - Manages selection state for posts
// ============================================================================
export function usePostSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (selected) next.add(id)
      else next.delete(id)
      return next
    })
  }, [])

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids))
  }, [])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds])

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    toggleSelect,
    selectAll,
    deselectAll,
    isSelected
  }
}

// ============================================================================
// usePreviewModal - Manages preview modal state
// ============================================================================
export function usePreviewModal<T>() {
  const [previewItem, setPreviewItem] = useState<T | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const openPreview = useCallback((item: T) => {
    setPreviewItem(item)
    setShowPreview(true)
  }, [])

  const closePreview = useCallback(() => {
    setShowPreview(false)
  }, [])

  return {
    previewItem,
    showPreview,
    openPreview,
    closePreview,
    setShowPreview
  }
}

// ============================================================================
// usePostFilters - Manages filter state with default values
// ============================================================================
export function usePostFilters(initialFilters?: Partial<PostFilters>) {
  const defaultFilters: PostFilters = {
    status: 'all',
    platform: 'all',
    profile: 'all',
    dateRange: 'all',
    search: '',
    ...initialFilters
  }

  const [filters, setFilters] = useState<PostFilters>(defaultFilters)

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
  }, [])

  const updateFilter = useCallback(<K extends keyof PostFilters>(key: K, value: PostFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  return {
    filters,
    setFilters,
    resetFilters,
    updateFilter
  }
}

// ============================================================================
// filterPostsByDateRange - Utility function for date range filtering
// ============================================================================
export function filterByDateRange(post: Post, dateRange: PostFilters['dateRange']): boolean {
  if (dateRange === 'all') return true
  
  const postDate = new Date(post.scheduledAt || post.postedAt || post.createdAt)
  const now = new Date()
  const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 }
  const days = daysMap[dateRange]
  
  if (!days) return true
  
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  return postDate >= cutoff
}

// ============================================================================
// filterPostsBySearch - Utility function for search filtering
// ============================================================================
export function filterBySearch(post: Post, search: string): boolean {
  if (!search) return true
  
  const searchLower = search.toLowerCase()
  const content = (post.content || '').toLowerCase()
  const caption = (post.caption || '').toLowerCase()
  const hashtags = (post.hashtags || '').toLowerCase()
  
  return content.includes(searchLower) || 
         caption.includes(searchLower) || 
         hashtags.includes(searchLower)
}

// ============================================================================
// filterPostsByPlatform - Utility function for platform filtering
// ============================================================================
export function filterByPlatform(post: Post, platform: string): boolean {
  if (platform === 'all') return true
  return post.platforms.includes(platform)
}

// ============================================================================
// useFilteredPosts - Combined hook for filtering posts
// ============================================================================
export function useFilteredPosts(
  posts: Post[],
  filters: PostFilters,
  options?: {
    sortBy?: 'createdAt' | 'scheduledAt' | 'postedAt'
    sortOrder?: 'asc' | 'desc'
  }
) {
  const { sortBy = 'createdAt', sortOrder = 'desc' } = options || {}

  return useMemo(() => {
    let filtered = posts.filter(post => {
      if (!filterByPlatform(post, filters.platform)) return false
      if (!filterBySearch(post, filters.search)) return false
      if (!filterByDateRange(post, filters.dateRange)) return false
      if (filters.status !== 'all' && post.status !== filters.status) return false
      return true
    })

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a[sortBy] || a.createdAt).getTime()
      const dateB = new Date(b[sortBy] || b.createdAt).getTime()
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
    })

    return filtered
  }, [posts, filters, sortBy, sortOrder])
}

