'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OrganizerRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Immediately redirect to dashboard
    router.replace('/organizer/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
        <span className="text-gray-600">Redirecting to dashboard...</span>
      </div>
    </div>
  )
}
