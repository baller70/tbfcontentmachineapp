'use client'

import BulkScheduleCalendar from '@/components/dashboard/bulk-schedule-calendar'

export default function SchedulePage() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Schedule Posts</h1>
        <p className="text-gray-600">Schedule multiple posts across your social media platforms</p>
      </div>

      <BulkScheduleCalendar />
    </div>
  )
}
