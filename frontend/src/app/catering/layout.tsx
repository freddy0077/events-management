'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  ChefHat,
  Users,
  FileText,
  QrCode,
  Settings,
  LogOut,
  Menu,
  X,
  Utensils,
  ChevronRight,
  ScanLine
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'

export default function CateringLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Redirect if not CATERING_TEAM
  if (user && user.role !== 'CATERING_TEAM') {
    router.push('/admin')
    return null
  }

  // Show loading if no user data yet
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/catering/dashboard',
      icon: LayoutDashboard,
      description: 'Overview and quick actions'
    },
    {
      title: 'Meal Management',
      href: '/catering/meals',
      icon: ChefHat,
      description: 'Manage meal sessions and menus'
    },
    {
      title: 'Check-in & Scanner',
      href: '/catering/checkin-scanner',
      icon: ScanLine,
      description: 'QR scanning and manual participant check-in'
    },
    {
      title: 'Reports',
      href: '/catering/reports',
      icon: FileText,
      description: 'Generate catering reports'
    }
  ]

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex">
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:relative lg:flex lg:flex-shrink-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Utensils className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Catering Team</h1>
                <p className="text-sm text-gray-600">Management Portal</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-semibold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-gray-600">{user.email}</p>
                <Badge variant="secondary" className="mt-1 bg-purple-100 text-purple-800">
                  Catering Team
                </Badge>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center justify-between p-3 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-purple-600' : 'text-gray-500'}`} />
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              asChild
            >
              <Link href="/catering/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile menu button */}
        <div className="lg:hidden p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-white shadow-md"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
