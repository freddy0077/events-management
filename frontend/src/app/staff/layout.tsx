'use client'

import { useAuth } from '@/hooks/use-auth-simple'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Calendar, 
  Users, 
  CreditCard, 
  QrCode, 
  Badge,
  BarChart3,
  Home,
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StaffLayoutProps {
  children: React.ReactNode
}

export default function StaffLayout({ children }: StaffLayoutProps) {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (user.role !== 'REGISTRATION_STAFF') {
        // Redirect non-registration staff users to their appropriate portals
        if (user.role === 'ADMIN') {
          router.push('/admin')
        } else if (user.role === 'EVENT_ORGANIZER') {
          router.push('/organizer')
        } else if (user.role === 'FINANCE_TEAM') {
          router.push('/admin')
        } else if (user.role === 'CATERING_TEAM') {
          router.push('/admin')
        } else {
          router.push('/unauthorized')
        }
      }
    }
  }, [user, loading, router])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || user.role !== 'REGISTRATION_STAFF') {
    return null
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/staff/dashboard',
      icon: Home,
      description: 'Overview and quick actions'
    },
    {
      name: 'My Events',
      href: '/staff/events',
      icon: Calendar,
      description: 'View assigned events'
    },
    {
      name: 'Registrations',
      href: '/staff/registrations',
      icon: Users,
      description: 'Manage participant registrations'
    },
    {
      name: 'Payments',
      href: '/staff/payments',
      icon: CreditCard,
      description: 'Process payments and transactions'
    },
    {
      name: 'QR Scanner',
      href: '/staff/scanner',
      icon: QrCode,
      description: 'Scan participant QR codes'
    },
    {
      name: 'Badge Printing',
      href: '/staff/badges',
      icon: Badge,
      description: 'Print participant badges'
    },
    {
      name: 'Reports',
      href: '/staff/reports',
      icon: BarChart3,
      description: 'View registration reports'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-300 ease-linear`} onClick={() => setSidebarOpen(false)} />
        
        <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="flex items-center">
                <div className="bg-blue-600 rounded-lg p-2">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-3">
                  <h1 className="text-lg font-semibold text-gray-900">Registration Staff</h1>
                  <p className="text-sm text-gray-500">Portal</p>
                </div>
              </div>
            </div>
            
            <nav className="mt-8 px-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-4 h-5 w-5" />
                  <div>
                    <div>{item.name}</div>
                    <div className="text-xs text-gray-400">{item.description}</div>
                  </div>
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="bg-blue-100 rounded-full p-2">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <div className="flex items-center">
                <div className="bg-blue-600 rounded-lg p-2">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-3">
                  <h1 className="text-lg font-semibold text-gray-900">Registration Staff</h1>
                  <p className="text-sm text-gray-500">Portal</p>
                </div>
              </div>
            </div>
            
            <nav className="mt-8 flex-1 px-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  <div>
                    <div>{item.name}</div>
                    <div className="text-xs text-gray-400">{item.description}</div>
                  </div>
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="bg-blue-100 rounded-full p-2">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="ml-2"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
        
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
