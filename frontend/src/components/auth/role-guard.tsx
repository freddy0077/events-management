'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth-simple'
import { getRoleDashboardPath, hasAccessToPath, UserRole } from '@/lib/role-routing'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  redirectOnUnauthorized?: boolean
  fallbackPath?: string
}

export function RoleGuard({ 
  children, 
  allowedRoles = ['ADMIN', 'EVENT_ORGANIZER', 'REGISTRATION_STAFF'],
  redirectOnUnauthorized = true,
  fallbackPath 
}: RoleGuardProps) {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (!loading && user && !allowedRoles.includes(user.role as UserRole)) {
      if (redirectOnUnauthorized) {
        const userDashboard = getRoleDashboardPath(user.role as UserRole)
        router.push(fallbackPath || userDashboard)
      }
    }
  }, [user, isAuthenticated, loading, allowedRoles, redirectOnUnauthorized, fallbackPath, router])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Verifying access...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show unauthorized access message if not redirecting
  if (!isAuthenticated || (user && !allowedRoles.includes(user.role as UserRole))) {
    if (!redirectOnUnauthorized) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-red-900">Access Denied</CardTitle>
              <CardDescription className="text-red-700">
                You don't have permission to access this page.
                {user && (
                  <span className="block mt-2">
                    Your role: <strong>{user.role}</strong>
                  </span>
                )}
                {allowedRoles.length > 0 && (
                  <span className="block mt-1">
                    Required roles: <strong>{allowedRoles.join(', ')}</strong>
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              {user && (
                <Button asChild className="bg-orange-600 hover:bg-orange-700">
                  <Link href={getRoleDashboardPath(user.role as UserRole)}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go to Your Dashboard
                  </Link>
                </Button>
              )}
              <Button variant="outline" asChild>
                <Link href="/login">
                  Back to Login
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }
    return null
  }

  return <>{children}</>
}

interface PathGuardProps {
  children: React.ReactNode
  path: string
}

export function PathGuard({ children, path }: PathGuardProps) {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
      return
    }

    if (!loading && user && !hasAccessToPath(user.role as UserRole, path)) {
      const userDashboard = getRoleDashboardPath(user.role as UserRole)
      router.push(userDashboard)
    }
  }, [user, isAuthenticated, loading, path, router])

  if (loading || !isAuthenticated || (user && !hasAccessToPath(user.role as UserRole, path))) {
    return null
  }

  return <>{children}</>
}
