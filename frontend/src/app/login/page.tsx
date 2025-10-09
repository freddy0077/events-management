'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth-simple'
import { toast } from 'sonner'
import Link from 'next/link'
import { Calendar, Shield, Eye, EyeOff, Lock, Mail, Users } from 'lucide-react'
import { getRoleDashboardPath, getRoleWelcomeMessage, getRoleDisplayName, UserRole } from '@/lib/role-routing'
import { getAppShortName } from '@/lib/app-config'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(email, password)
      
      // Get user data from auth context after successful login
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      const backendRole = userData.role as 'ADMIN' | 'EVENT_ORGANIZER' | 'REGISTRATION_STAFF' | 'FINANCE_TEAM' | 'CATERING_TEAM'
      
      // Check if user has badge printer event role
      // This is stored in localStorage after checking event staff assignments
      const eventRole = userData.eventRole || null
      
      // Map backend role to frontend UserRole
      const mapBackendRoleToUserRole = (role: string, eventRole: string | null): UserRole => {
        switch (role) {
          case 'ADMIN':
            return 'ADMIN'
          case 'EVENT_ORGANIZER':
            return 'EVENT_ORGANIZER'
          case 'REGISTRATION_STAFF':
            // Check if they're specifically a badge printer
            if (eventRole === 'BADGE_PRINTER') {
              return 'BADGE_PRINTER'
            }
            return 'REGISTRATION_STAFF'
          case 'FINANCE_TEAM':
            return 'FINANCE_TEAM'
          case 'CATERING_TEAM':
            return 'CATERING_TEAM'
          default:
            return 'REGISTRATION_STAFF'
        }
      }
      
      const userRole = mapBackendRoleToUserRole(backendRole, eventRole)
      
      // Get role-based dashboard path and welcome message
      const dashboardPath = getRoleDashboardPath(userRole)
      const welcomeMessage = getRoleWelcomeMessage(userRole, userData.firstName)
      const roleDisplay = getRoleDisplayName(userRole)
      
      // Update user data with mapped role for consistent role checking
      const updatedUserData = { ...userData, role: userRole }
      localStorage.setItem('user', JSON.stringify(updatedUserData))
      
      console.log('Login Debug:', {
        backendRole,
        userRole,
        dashboardPath,
        userData: updatedUserData
      })
      
      toast.success(`${welcomeMessage}`)
      
      // Force a page reload to ensure auth context picks up the updated role
      // This ensures the role mapping is properly applied throughout the app
      window.location.href = dashboardPath
    } catch (error: any) {
      console.error('Login failed:', error)
      
      // Show specific error message from the backend
      const errorMessage = error?.message || 'Login failed. Please check your credentials.'
      toast.error(errorMessage)
      
      // Don't redirect on error - stay on login page
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.02)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      
      {/* Header */}
      <div className="relative z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-600 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{getAppShortName()}</h1>
                <p className="text-xs text-gray-500">Enterprise Event Management Platform</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Shield className="h-4 w-4 text-green-600" />
                <span>Secure</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span>Enterprise</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
        <div className="w-full max-w-md">
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="text-center pb-6 pt-8">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-orange-600 p-2 rounded-lg">
                  <Lock className="h-5 w-5 text-white" />
                </div>
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">Welcome Back</CardTitle>
              <CardDescription className="text-gray-600">
                Sign in to your dashboard to manage events and operations
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@company.com"
                      required
                      className="h-11 pl-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="h-11 pl-10 pr-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-6 space-y-4">
                <div className="text-center">
                  <Link 
                    href="/forgot-password" 
                    className="text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors duration-200"
                  >
                    Forgot your password?
                  </Link>
                </div>
                
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">New to our platform?</p>
                  <Link 
                    href="/" 
                    className="text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors duration-200"
                  >
                    Learn about our event management system →
                  </Link>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
