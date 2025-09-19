'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// This page is no longer public - redirect to login for internal staff access
export default function EventRegistrationPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login page for internal staff access
    router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Staff Access Required
        </h1>
        <p className="text-gray-600 mb-4">
          This is an internal staff management tool. Please log in to continue.
        </p>
        <p className="text-sm text-gray-500">
          Redirecting to login page...
        </p>
      </div>
    </div>
  )
}
