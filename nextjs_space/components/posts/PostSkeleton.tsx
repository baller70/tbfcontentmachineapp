'use client'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface PostSkeletonProps {
  count?: number
  className?: string
}

export function PostSkeleton({ count = 5, className }: PostSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex gap-4">
            {/* Checkbox skeleton */}
            <Skeleton className="w-5 h-5 rounded mt-1" />
            
            {/* Media thumbnail skeleton */}
            <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
            
            {/* Content skeleton */}
            <div className="flex-1 space-y-3">
              {/* Status badge and menu */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-7 w-7 rounded" />
              </div>
              
              {/* Content lines */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              
              {/* Platform tags and date */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-5 w-14 rounded" />
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// Stats skeleton for the stats cards
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// Tabs skeleton
export function TabsSkeleton() {
  return (
    <div className="flex gap-2 border-b pb-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-24 rounded-md" />
      ))}
    </div>
  )
}

