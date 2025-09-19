'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  Edit, 
  QrCode,
  BarChart3,
  Settings,
  Plus,
  Shield,
  Loader2,
  ArrowUpRight,
  Activity,
  Target,
  Zap,
  UserPlus,
  UserCheck,
  Crown,
  Building
} from 'lucide-react'
import {
  SparklesIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  UserGroupIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/hooks/use-auth-simple'
import { useDashboardStats, useEvents, useRegistrations } from '@/lib/graphql/hooks'
import { ModernHeader } from '@/components/ui/modern-header'
import { AnimatedStatsGrid } from '@/components/ui/animated-stats-grid'
import { ModernTabs } from '@/components/ui/modern-tabs'
import { ModernCard, ModernCardHeader } from '@/components/ui/modern-card'

export default function AdminDashboardPage() {
  const { isAuthenticated, user } = useAuth()
  const [selectedTab, setSelectedTab] = useState('overview')
  
  // GraphQL queries for real data
  const { data: dashboardStats, loading: statsLoading, error: statsError } = useDashboardStats()
  const { data: eventsData, loading: eventsLoading, error: eventsError } = useEvents({ limit: 5 })
  const { data: registrationsData, loading: registrationsLoading, error: registrationsError } = useRegistrations({ limit: 5 })

  // Data from GraphQL API
  const stats = dashboardStats?.dashboardStats || {
    totalEvents: 0,
    totalRegistrations: 0,
    totalRevenue: 0,
    activeEvents: 0
  }

  const recentEvents = eventsData?.events || []
  const recentRegistrations = registrationsData?.registrations || []
  const isLoading = statsLoading || eventsLoading || registrationsLoading

  // Stats for animated grid
  const statsData = [
    { label: 'Total Events', value: stats.totalEvents, icon: Calendar, color: 'from-blue-500 to-blue-600', loading: statsLoading },
    { label: 'Active Events', value: stats.activeEvents, icon: Activity, color: 'from-indigo-500 to-indigo-600', loading: statsLoading },
    { label: 'Registrations', value: stats.totalRegistrations, icon: Users, color: 'from-purple-500 to-purple-600', loading: statsLoading },
    { label: 'Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'from-green-500 to-green-600', loading: statsLoading },
    { label: 'Staff Online', value: (stats as any).activeStaff || 0, icon: UserCheck, color: 'from-orange-500 to-orange-600', loading: statsLoading },
    { label: 'QR Scans Today', value: (stats as any).todayScans || 0, icon: QrCode, color: 'from-pink-500 to-pink-600', loading: statsLoading },
  ]

  // Define tabs
  const tabs = [
    {
      id: 'overview',
      name: 'Dashboard Overview',
      icon: ChartBarIcon,
      count: null,
    },
    {
      id: 'events',
      name: 'Recent Events',
      icon: CalendarDaysIcon,
      count: recentEvents.length,
    },
    {
      id: 'registrations',
      name: 'Recent Registrations',
      icon: UserGroupIcon,
      count: recentRegistrations.length,
    },
    {
      id: 'actions',
      name: 'Quick Actions',
      icon: SparklesIcon,
      count: null,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Modern Glassmorphism Header */}
        <ModernHeader
          title={`Admin Dashboard`}
          subtitle={`Welcome back, ${user?.firstName || 'Admin'}! Manage events, registrations, and staff with powerful insights.`}
          icon={SparklesIcon}
          stats={[
            { label: 'Total Events', value: stats.totalEvents, icon: DocumentTextIcon },
            { label: 'This Year', value: stats.activeEvents, icon: CalendarDaysIcon },
          ]}
          actionButton={{
            label: 'Create Event',
            onClick: () => window.location.href = '/admin/events/create',
            icon: Plus
          }}
          gradient="from-blue-600 via-indigo-600 to-purple-600"
        />

        {/* Modern Animated Stats Grid */}
        <AnimatedStatsGrid stats={statsData} columns={6} />

        {/* Modern Tabbed Interface */}
        <ModernTabs
          tabs={tabs}
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
        >
          <AnimatePresence mode="wait">
            {selectedTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <ModernCard delay={0.1}>
                    <ModernCardHeader
                      title="System Health"
                      subtitle="All systems operational"
                      icon={CheckCircleIcon}
                      iconColor="bg-green-100 text-green-600"
                    />
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Database</span>
                        <span className="text-sm font-medium text-green-600">Online</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">API Status</span>
                        <span className="text-sm font-medium text-green-600">Healthy</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">QR Scanner</span>
                        <span className="text-sm font-medium text-green-600">Active</span>
                      </div>
                    </div>
                  </ModernCard>

                  <ModernCard delay={0.2}>
                    <ModernCardHeader
                      title="Today's Activity"
                      subtitle="Real-time insights"
                      icon={Activity}
                      iconColor="bg-blue-100 text-blue-600"
                    />
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">New Registrations</span>
                        <span className="text-sm font-medium text-blue-600">{statsLoading ? '...' : (stats as any).todayRegistrations || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">QR Scans</span>
                        <span className="text-sm font-medium text-blue-600">{statsLoading ? '...' : (stats as any).todayScans || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Staff Active</span>
                        <span className="text-sm font-medium text-blue-600">{statsLoading ? '...' : (stats as any).activeStaff || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Today's Revenue</span>
                        <span className="text-sm font-medium text-green-600">{statsLoading ? '...' : formatCurrency((stats as any).todayRevenue || 0)}</span>
                      </div>
                    </div>
                  </ModernCard>

                  <ModernCard delay={0.3}>
                    <ModernCardHeader
                      title="Performance"
                      subtitle="This month vs last month"
                      icon={TrendingUp}
                      iconColor="bg-purple-100 text-purple-600"
                    />
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Revenue Growth</span>
                        <span className={`text-sm font-medium ${
                          (stats as any).revenueGrowth && (stats as any).revenueGrowth > 0 ? 'text-green-600' : 
                          (stats as any).revenueGrowth && (stats as any).revenueGrowth < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {statsLoading ? '...' : (stats as any).revenueGrowth ? `${(stats as any).revenueGrowth > 0 ? '+' : ''}${(stats as any).revenueGrowth.toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Registration Growth</span>
                        <span className={`text-sm font-medium ${
                          (stats as any).registrationGrowth && (stats as any).registrationGrowth > 0 ? 'text-green-600' : 
                          (stats as any).registrationGrowth && (stats as any).registrationGrowth < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {statsLoading ? '...' : (stats as any).registrationGrowth ? `${(stats as any).registrationGrowth > 0 ? '+' : ''}${(stats as any).registrationGrowth.toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Event Completion</span>
                        <span className="text-sm font-medium text-blue-600">
                          {statsLoading ? '...' : (stats as any).eventCompletionRate ? `${(stats as any).eventCompletionRate.toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </ModernCard>
                </div>

                {/* Additional Metrics Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                  <ModernCard delay={0.4}>
                    <ModernCardHeader
                      title="Event Statistics"
                      subtitle="Event management overview"
                      icon={Calendar}
                      iconColor="bg-indigo-100 text-indigo-600"
                    />
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Upcoming Events</span>
                        <span className="text-sm font-medium text-indigo-600">{statsLoading ? '...' : (stats as any).upcomingEvents || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Completed Events</span>
                        <span className="text-sm font-medium text-gray-600">{statsLoading ? '...' : (stats as any).completedEvents || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Avg. Capacity</span>
                        <span className="text-sm font-medium text-blue-600">{statsLoading ? '...' : Math.round((stats as any).averageEventCapacity || 0)}</span>
                      </div>
                    </div>
                  </ModernCard>

                  <ModernCard delay={0.5}>
                    <ModernCardHeader
                      title="Staff & Operations"
                      subtitle="Team management metrics"
                      icon={UserCheck}
                      iconColor="bg-orange-100 text-orange-600"
                    />
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Staff</span>
                        <span className="text-sm font-medium text-orange-600">{statsLoading ? '...' : (stats as any).totalStaff || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Active Staff</span>
                        <span className="text-sm font-medium text-green-600">{statsLoading ? '...' : (stats as any).activeStaff || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total QR Scans</span>
                        <span className="text-sm font-medium text-pink-600">{statsLoading ? '...' : (stats as any).totalQRScans || 0}</span>
                      </div>
                    </div>
                  </ModernCard>

                  <ModernCard delay={0.6}>
                    <ModernCardHeader
                      title="Financial Overview"
                      subtitle="Payment and revenue metrics"
                      icon={DollarSign}
                      iconColor="bg-green-100 text-green-600"
                    />
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Avg. Registration</span>
                        <span className="text-sm font-medium text-green-600">{statsLoading ? '...' : formatCurrency((stats as any).averageRegistrationValue || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pending Payments</span>
                        <span className="text-sm font-medium text-yellow-600">{statsLoading ? '...' : (stats as any).pendingPayments || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pending Amount</span>
                        <span className="text-sm font-medium text-red-600">{statsLoading ? '...' : formatCurrency((stats as any).pendingPaymentAmount || 0)}</span>
                      </div>
                    </div>
                  </ModernCard>

                  <ModernCard delay={0.7}>
                    <ModernCardHeader
                      title="Badge System"
                      subtitle="Badge printing statistics"
                      icon={QrCode}
                      iconColor="bg-purple-100 text-purple-600"
                    />
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Badges Printed</span>
                        <span className="text-sm font-medium text-purple-600">{statsLoading ? '...' : (stats as any).totalBadgesPrinted || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">QR Scans Today</span>
                        <span className="text-sm font-medium text-blue-600">{statsLoading ? '...' : (stats as any).todayScans || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Success Rate</span>
                        <span className="text-sm font-medium text-green-600">
                          {statsLoading ? '...' : (stats as any).totalBadgesPrinted > 0 ? `${(((stats as any).totalQRScans / (stats as any).totalBadgesPrinted) * 100).toFixed(1)}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </ModernCard>
                </div>
              </motion.div>
            )}

            {selectedTab === 'events' && (
              <motion.div
                key="events"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                      <span className="text-sm text-gray-500">Loading events...</span>
                    </div>
                  </div>
                ) : recentEvents.length > 0 ? (
                  <div className="space-y-4">
                    {recentEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
                              <h4 className="font-semibold text-gray-900">{event.name}</h4>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{formatDate(event.date)}</p>
                            <div className="flex items-center gap-4">
                              <div className="text-sm">
                                <span className="text-gray-600">Registrations:</span>
                                <span className="font-semibold text-gray-900 ml-1">{event.totalRegistrations || 0}/{event.maxCapacity}</span>
                              </div>
                              <Badge variant={event.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                {event.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/admin/events/${event.id}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Link>
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/admin/events/${event.id}/edit`}>
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    <Button variant="outline" className="w-full mt-6" asChild>
                      <Link href="/admin/events">
                        View All Events
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating your first event.</p>
                  </div>
                )}
              </motion.div>
            )}

            {selectedTab === 'registrations' && (
              <motion.div
                key="registrations"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                      <span className="text-sm text-gray-500">Loading registrations...</span>
                    </div>
                  </div>
                ) : recentRegistrations.length > 0 ? (
                  <div className="space-y-4">
                    {recentRegistrations.map((registration, index) => (
                      <motion.div
                        key={registration.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                {registration.firstName.charAt(0)}{registration.lastName.charAt(0)}
                              </div>
                              <h4 className="font-semibold text-gray-900">
                                {registration.firstName} {registration.lastName}
                              </h4>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{registration.event?.name}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-600">{registration.category?.name}</span>
                              <span className="font-semibold text-green-700">{formatCurrency(registration.category?.price || 0)}</span>
                              <span className="text-gray-500">{formatDate(registration.createdAt)}</span>
                            </div>
                          </div>
                          <Badge variant={registration.paymentStatus === 'APPROVED' ? 'default' : 'secondary'}>
                            {registration.paymentStatus}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                    <Button variant="outline" className="w-full mt-6" asChild>
                      <Link href="/admin/registrations">
                        View All Registrations
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No registrations found</h3>
                    <p className="mt-1 text-sm text-gray-500">Registrations will appear here once participants sign up.</p>
                  </div>
                )}
              </motion.div>
            )}

            {selectedTab === 'actions' && (
              <motion.div
                key="actions"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(user?.role === 'ADMIN' || user?.role === 'MODERATOR') && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="h-20 w-full flex-col border-orange-200 hover:border-orange-300 hover:bg-orange-50" asChild>
                        <Link href="/admin/events/create">
                          <Plus className="h-6 w-6 mb-2 text-orange-600" />
                          <span className="text-orange-700">Create Event</span>
                        </Link>
                      </Button>
                    </motion.div>
                  )}
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" className="h-20 w-full flex-col border-blue-200 hover:border-blue-300 hover:bg-blue-50" asChild>
                      <Link href="/admin/scanner">
                        <QrCode className="h-6 w-6 mb-2 text-blue-600" />
                        <span className="text-blue-700">QR Scanner</span>
                      </Link>
                    </Button>
                  </motion.div>

                  {user?.role === 'ADMIN' && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="h-20 w-full flex-col border-green-200 hover:border-green-300 hover:bg-green-50" asChild>
                        <Link href="/admin/staff">
                          <UserPlus className="h-6 w-6 mb-2 text-green-600" />
                          <span className="text-green-700">Manage Staff</span>
                        </Link>
                      </Button>
                    </motion.div>
                  )}

                  {user?.role === 'ADMIN' && (
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" className="h-20 w-full flex-col border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50" asChild>
                        <Link href="/admin/event-managers">
                          <UserCheck className="h-6 w-6 mb-2 text-indigo-600" />
                          <span className="text-indigo-700">Event Managers</span>
                        </Link>
                      </Button>
                    </motion.div>
                  )}
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" className="h-20 w-full flex-col border-purple-200 hover:border-purple-300 hover:bg-purple-50" asChild>
                      <Link href="/admin/reports">
                        <BarChart3 className="h-6 w-6 mb-2 text-purple-600" />
                        <span className="text-purple-700">View Reports</span>
                      </Link>
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" className="h-20 w-full flex-col border-red-200 hover:border-red-300 hover:bg-red-50" asChild>
                      <Link href="/admin/audit-logs">
                        <Shield className="h-6 w-6 mb-2 text-red-600" />
                        <span className="text-red-700">Audit Logs</span>
                      </Link>
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" className="h-20 w-full flex-col border-gray-200 hover:border-gray-300 hover:bg-gray-50" asChild>
                      <Link href="/admin/settings">
                        <Settings className="h-6 w-6 mb-2 text-gray-600" />
                        <span className="text-gray-700">Settings</span>
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </ModernTabs>

      </div>
    </div>
  )
}
