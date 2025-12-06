'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PostFilters as PostFiltersType, Profile, PLATFORMS } from './types'
import { Search, X, Filter, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PostFiltersProps {
  filters: PostFiltersType
  onFiltersChange: (filters: PostFiltersType) => void
  profiles?: Profile[]
  showStatusFilter?: boolean
  showPlatformFilter?: boolean
  showDateFilter?: boolean
  className?: string
}

export function PostFilters({
  filters,
  onFiltersChange,
  profiles = [],
  showStatusFilter = true,
  showPlatformFilter = true,
  showDateFilter = true,
  className
}: PostFiltersProps) {
  const hasActiveFilters = 
    filters.status !== 'all' || 
    filters.platform !== 'all' || 
    filters.profile !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.search !== ''

  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      platform: 'all',
      profile: 'all',
      dateRange: 'all',
      search: ''
    })
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search posts by content..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="pl-10 pr-10"
        />
        {filters.search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => onFiltersChange({ ...filters, search: '' })}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters:</span>
        </div>

        {showStatusFilter && (
          <Select
            value={filters.status}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value as PostFiltersType['status'] })}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="POSTED">Published</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        )}

        {showPlatformFilter && (
          <Select
            value={filters.platform}
            onValueChange={(value) => onFiltersChange({ ...filters, platform: value })}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {PLATFORMS.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {profiles.length > 0 && (
          <Select
            value={filters.profile}
            onValueChange={(value) => onFiltersChange({ ...filters, profile: value })}
          >
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Profile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Profiles</SelectItem>
              {profiles.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {showDateFilter && (
          <Select
            value={filters.dateRange}
            onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value as PostFiltersType['dateRange'] })}
          >
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}

