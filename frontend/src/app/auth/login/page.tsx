'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect to main login page to consolidate auth routes
export default function AuthLoginRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/login')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  )
}
