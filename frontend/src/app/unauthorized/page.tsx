'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, ArrowLeft, Home } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'

export default function UnauthorizedPage() {
  const router = useRouter()
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-red-600">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700">
                <strong>Current Role:</strong> {user.role}<br />
                <strong>Email:</strong> {user.email}
              </p>
            </div>
          )}
          
          <p className="text-sm text-gray-600 text-center">
            This page requires higher privileges than your current account has. 
            Contact an administrator if you believe this is an error.
          </p>

          <div className="space-y-2">
            <Button 
              onClick={() => router.back()} 
              variant="outline" 
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            
            <Button 
              onClick={() => router.push('/')} 
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>

            {user && (
              <Button 
                onClick={() => {
                  logout()
                  router.push('/login')
                }} 
                variant="destructive" 
                className="w-full"
              >
                Sign Out
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
