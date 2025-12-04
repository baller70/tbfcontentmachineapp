
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function PreviewRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the Content Journey page on dashboard
    router.replace('/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Redirecting to Content Journey...</p>
      </div>
    </div>
  )
}
