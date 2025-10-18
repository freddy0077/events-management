"use client"

import Link from 'next/link'
import { ReactNode, useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Calendar,
  LayoutDashboard,
  QrCode,
  BarChart3,
  Plus,
  Shield,
  LogOut,
  User,
  DollarSign,
  Users,
  ChefHat,
  FileText,
  Settings,
  Menu,
  X,
  ChevronDown,
  Home,
  UserCheck,
  TrendingUp,
  Activity,
  Bell,
  HelpCircle,
  Tag,
  UserPlus,
  Target
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { RoleGuard } from '@/components/auth/role-guard'
import { Badge } from '@/components/ui/badge'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  // Redirect users to their dedicated portals
  useEffect(() => {
    if (user && user.role === 'EVENT_ORGANIZER') {
      router.push('/organizer/dashboard')
    } else if (user && user.role === 'REGISTRATION_STAFF') {
      router.push('/staff/dashboard')
    } else if (user && user.role === 'CATERING_TEAM') {
      router.push('/catering/dashboard')
    }
  }, [user, router])

  // Define role-based menu sections with better organization
  const getMenuSections = () => {
    const userRole = user?.role || ''
    const sections = []

    // Main Navigation - Role-specific dashboards
    sections.push({
      title: 'Main',
      items: [
        {
          href: '/admin',
          icon: Home,
          label: 'Dashboard',
          description: 'Overview & analytics',
          roles: ['ADMIN', 'FINANCE_TEAM', 'CATERING_TEAM'],
          badge: null
        }
      ]
    })

    // Event Management Section - Only ADMIN gets full event management
    if (userRole && ['ADMIN'].includes(userRole)) {
      sections.push({
        title: 'Event Management',
        items: [
          {
            href: '/admin/events',
            icon: Calendar,
            label: 'Events',
            description: 'Manage all events',
            roles: ['ADMIN'],
            badge: null
          },
          {
            href: '/admin/events/create',
            icon: Plus,
            label: 'Create Event',
            description: 'Add new event',
            roles: ['ADMIN'],
            badge: 'New'
          },
          {
            href: '/admin/categories',
            icon: Tag,
            label: 'Categories',
            description: 'Manage event categories',
            roles: ['ADMIN'],
            badge: null
          }
        ]
      })
    }


    // Operations Section
    const operationsItems = []
    
    if (userRole && ['ADMIN'].includes(userRole)) {
      operationsItems.push({
        href: '/admin/registrations',
        icon: UserCheck,
        label: 'Registrations',
        description: 'Participant management',
        roles: ['ADMIN'],
        badge: null
      })
    }

    if (userRole && ['ADMIN', 'CATERING_TEAM'].includes(userRole)) {
      operationsItems.push({
        href: '/admin/catering',
        icon: ChefHat,
        label: 'Catering',
        description: 'Meal service management',
        roles: ['ADMIN', 'CATERING_TEAM'],
        badge: null
      })
    }

    if (userRole && ['FINANCE_TEAM', 'CATERING_TEAM'].includes(userRole)) {
      operationsItems.push({
        href: '/admin/scanner',
        icon: QrCode,
        label: 'QR Scanner',
        description: 'Scan participant codes',
        roles: ['FINANCE_TEAM', 'CATERING_TEAM'],
        badge: null
      })
    }

    if (operationsItems.length > 0) {
      sections.push({
        title: 'Operations',
        items: operationsItems
      })
    }

    // Management Section - Restricted access
    const managementItems = []
    
    if (userRole && ['ADMIN'].includes(userRole)) {
      managementItems.push({
        href: '/admin/staff',
        icon: Users,
        label: 'Staff',
        description: 'Team management',
        roles: ['ADMIN'],
        badge: null
      })
    }

    if (userRole && ['ADMIN', 'FINANCE_TEAM'].includes(userRole)) {
      managementItems.push({
        href: '/admin/finance',
        icon: DollarSign,
        label: 'Finance',
        description: 'Payment tracking',
        roles: ['ADMIN', 'FINANCE_TEAM'],
        badge: null
      })
    }

    if (managementItems.length > 0) {
      sections.push({
        title: 'Management',
        items: managementItems
      })
    }

    // Analytics Section - Restricted access
    const analyticsItems = []
    
    if (userRole && ['ADMIN', 'FINANCE_TEAM'].includes(userRole)) {
      analyticsItems.push({
        href: '/admin/reports',
        icon: TrendingUp,
        label: 'Reports',
        description: 'Analytics & insights',
        roles: ['ADMIN', 'FINANCE_TEAM'],
        badge: null
      })
    }

    if (userRole && ['ADMIN'].includes(userRole)) {
      analyticsItems.push({
        href: '/admin/audit-logs',
        icon: Activity,
        label: 'Audit Logs',
        description: 'System activity',
        roles: ['ADMIN'],
        badge: null
      })
    }

    if (userRole && ['ADMIN', 'CATERING_TEAM'].includes(userRole)) {
      analyticsItems.push({
        href: '/admin/catering/reports',
        icon: BarChart3,
        label: 'Catering Reports',
        description: 'Meal service analytics',
        roles: ['ADMIN', 'CATERING_TEAM'],
        badge: null
      })
    }

    if (analyticsItems.length > 0) {
      sections.push({
        title: 'Analytics',
        items: analyticsItems
      })
    }

    // Filter sections based on user role
    return sections.map((section: any) => ({
      ...section,
      items: section.items.filter((item: any) => userRole && item.roles.includes(userRole))
    })).filter((section: any) => section.items.length > 0)
  }

  const menuSections = getMenuSections()

  // Get role display info
  const getRoleInfo = () => {
    const roleMap = {
      'ADMIN': { name: 'Administrator', color: 'bg-red-100 text-red-800', icon: Shield },
      'EVENT_ORGANIZER': { name: 'Event Organizer', color: 'bg-blue-100 text-blue-800', icon: Calendar },
      'REGISTRATION_STAFF': { name: 'Registration', color: 'bg-green-100 text-green-800', icon: UserCheck },
      'FINANCE_TEAM': { name: 'Finance Team', color: 'bg-yellow-100 text-yellow-800', icon: DollarSign },
      'CATERING_TEAM': { name: 'Catering Team', color: 'bg-purple-100 text-purple-800', icon: ChefHat }
    }
    return roleMap[user?.role as keyof typeof roleMap] || { name: 'Staff', color: 'bg-gray-100 text-gray-800', icon: User }
  }

  const roleInfo = getRoleInfo()

  return (
    <RoleGuard allowedRoles={['ADMIN', 'FINANCE_TEAM']}>
      <div className="min-h-screen flex bg-gray-50">
        {/* Mobile menu button */}
        <div className="md:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg bg-white shadow-lg border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Redesigned Modern Sidebar */}
        <aside className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 fixed md:static inset-y-0 left-0 z-50 
          w-72 bg-white border-r border-gray-200 
          flex flex-col h-screen transition-transform duration-300 ease-in-out
          shadow-xl md:shadow-sm
        `}>
          {/* Header Section */}
          <div className="px-6 py-6 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">EventHub</h1>
                <p className="text-sm text-gray-500">Management Portal</p>
              </div>
            </div>
            
            {/* Role Badge */}
            <div className="flex items-center gap-2">
              <roleInfo.icon className="h-4 w-4" />
              <Badge variant="secondary" className={`${roleInfo.color} text-xs font-medium`}>
                {roleInfo.name}
              </Badge>
            </div>
          </div>

          {/* Navigation Sections */}
          <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
            {menuSections.map((section: any, sectionIndex: number) => (
              <div key={sectionIndex}>
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item: any) => {
                    const IconComponent = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    
                    return (
                      <Link 
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`
                          group flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200
                          ${isActive 
                            ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-100 shadow-sm' 
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                      >
                        <IconComponent className={`
                          h-5 w-5 mr-3 transition-colors
                          ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}
                        `} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="truncate">{item.label}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <p className={`
                            text-xs mt-0.5 truncate
                            ${isActive ? 'text-blue-600' : 'text-gray-500'}
                          `}>
                            {item.description}
                          </p>
                        </div>
                        {isActive && (
                          <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full ml-2" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User Profile Section */}
          <div className="px-4 py-4 border-t border-gray-100">
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.firstName || user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg py-2">
                  <Link
                    href="/admin/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile Settings
                  </Link>
                  <Link
                    href="/admin/help"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <HelpCircle className="h-4 w-4" />
                    Help & Support
                  </Link>
                  <hr className="my-2 border-gray-100" />
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false)
                      logout()
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen overflow-hidden">
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </RoleGuard>
  )
}
