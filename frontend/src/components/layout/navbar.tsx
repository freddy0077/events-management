'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth-simple'
import { Calendar, LogIn, LogOut, User, Menu } from 'lucide-react'
import { getAppShortName } from '@/lib/app-config'

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-orange-600 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">{getAppShortName()}</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/events" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">
              Events
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/my-registrations" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">
                  My Registrations
                </Link>
                {user?.role === 'ADMIN' && (
                  <>
                    <Link href="/admin" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">
                      Admin
                    </Link>
                    <Link href="/admin/scanner" className="text-gray-700 hover:text-orange-600 font-medium transition-colors">
                      QR Scanner
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <User className="h-4 w-4 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user?.firstName || user?.email}</span>
                </div>
                <Button variant="outline" size="sm" onClick={logout} className="border-gray-300 hover:border-red-500 hover:text-red-500">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button variant="ghost" size="sm" asChild className="text-gray-700 hover:text-orange-600">
                  <Link href="/login">
                    Login
                  </Link>
                </Button>
                <Button size="sm" asChild className="bg-orange-600 hover:bg-orange-700 text-white px-6 rounded-lg">
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
