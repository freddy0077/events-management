'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth-simple'
import { getRoleDashboardPath, UserRole } from '@/lib/role-routing'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: string
  redirectTo?: string
  fallback?: React.ReactNode
}

export function AuthGuard({ 
  children, 
  requiredRole, 
  redirectTo = '/login',
  fallback 
}: AuthGuardProps) {
  const { isAuthenticated, hasRole, loading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push(redirectTo)
        return
      }

      if (requiredRole && !hasRole(requiredRole)) {
        // Instead of redirecting to unauthorized, redirect to user's appropriate dashboard
        if (user?.role) {
          const userDashboard = getRoleDashboardPath(user.role as UserRole)
          router.push(userDashboard)
        } else {
          router.push('/unauthorized')
        }
        return
      }
    }
  }, [isAuthenticated, hasRole, requiredRole, loading, router, redirectTo, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-red-500">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Higher-order component for role-based access
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: string
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <AuthGuard requiredRole={requiredRole}>
        <Component {...props} />
      </AuthGuard>
    )
  }
}

// Admin-only guard
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="ADMIN">
      {children}
    </AuthGuard>
  )
}

// Moderator and above guard
export function ModeratorGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requiredRole="MODERATOR">
      {children}
    </AuthGuard>
  )
}
