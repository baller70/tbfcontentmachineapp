
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { BrandingProvider } from '@/contexts/branding-context'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession() || {}
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // Will redirect
  }

  return (
    <BrandingProvider>
      <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
        <DashboardNav />
        {/* Main content area - responsive margins */}
        <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </BrandingProvider>
  )
}
