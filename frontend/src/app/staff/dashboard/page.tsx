'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useAuth } from '@/hooks/use-auth-simple'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMyAssignedEvents, useMyEventRegistrations } from '@/lib/graphql/hooks'
import { formatGHS, getRegistrationAmount } from '@/lib/utils/currency'
import { 
  Users, 
  Calendar, 
  CreditCard, 
  QrCode, 
  Badge as BadgeIcon,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  Printer,
  Scan
} from 'lucide-react'
import Link from 'next/link'

export default function StaffDashboard() {
  const { user } = useAuth()
  
  // Fetch assigned events
  const { data: eventsData, loading: eventsLoading, error: eventsError } = useMyAssignedEvents()
  const assignedEvents = (eventsData as any)?.myAssignedEvents || []
  
  // Get event IDs for fetching registrations
  const eventIds = assignedEvents.map((event: any) => event.id)
  
  // Fetch registrations for assigned events
  const { data: registrationsData, loading: registrationsLoading } = useMyEventRegistrations(eventIds)
  const registrations = (registrationsData as any)?.registrations || []
  
  // Calculate stats from real data
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  
  const todayRegistrations = registrations.filter((reg: any) => 
    new Date(reg.createdAt) >= todayStart
  )
  
  const pendingPayments = registrations.filter((reg: any) => 
    reg.paymentStatus === 'PENDING' || reg.paymentStatus === 'PARTIAL'
  )
  
  const completedPayments = registrations.filter((reg: any) => 
    reg.paymentStatus === 'PAID'
  )
  
  const revenueToday = todayRegistrations.reduce((sum: any, reg: any) => 
    sum + getRegistrationAmount(reg), 0
  )
  
  const stats = {
    todayRegistrations: todayRegistrations.length,
    pendingPayments: pendingPayments.length,
    completedPayments: completedPayments.length,
    activeEvents: assignedEvents.length,
    totalParticipants: registrations.length,
    badgesPrinted: registrations.filter((reg: any) => reg.paymentStatus === 'PAID').length, // Assuming paid = badge ready
    qrCodesScanned: registrations.filter((reg: any) => reg.qrCode).length,
    revenueToday: revenueToday
  }
  
  // Get recent registrations (last 3)
  const recentRegistrations = [...registrations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)
    .map(reg => ({
      id: reg.id,
      participantName: reg.fullName || `${reg.firstName} ${reg.lastName}`,
      eventName: reg.event?.name || 'Unknown Event',
      category: reg.category?.name || 'General',
      paymentStatus: reg.paymentStatus,
      registeredAt: formatTimeAgo(reg.createdAt)
    }))
  
  // Format assigned events for display
  const upcomingEvents = assignedEvents
    .slice(0, 3)
    .map((event: any) => ({
      id: event.id,
      name: event.name,
      date: event.date,
      registrations: registrations.filter((reg: any) => reg.event?.id === event.id).length,
      capacity: event.maxCapacity || 100, // Default capacity if not specified
      status: 'active'
    }))
  
  // Helper function to format time ago
  function formatTimeAgo(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return `${diffInMinutes} minutes ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays} days ago`
    }
  }
  
  // Loading state
  if (eventsLoading || registrationsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registration Staff Dashboard</h1>
          <p className="text-gray-600 mt-2">Loading your dashboard data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i: number) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  
  // Error state
  if (eventsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registration Staff Dashboard</h1>
          <p className="text-red-600 mt-2">Error loading dashboard data: {eventsError.message}</p>
        </div>
      </div>
    )
  }

  const quickActions = [
    {
      title: 'New Registration',
      description: 'Register a new participant',
      icon: Plus,
      href: '/staff/registrations/new',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Process Payment',
      description: 'Process pending payments',
      icon: CreditCard,
      href: '/staff/payments',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Print Badges',
      description: 'Print participant badges',
      icon: Printer,
      href: '/staff/badges',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'QR Scanner',
      description: 'Scan participant QR codes',
      icon: Scan,
      href: '/staff/scanner',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ]

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Registration Staff Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {user?.firstName}! Here's what's happening with your registrations today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayRegistrations}</div>
            <p className="text-xs text-muted-foreground">
              New registrations today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Payments</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedPayments}</div>
            <p className="text-xs text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatGHS(stats.revenueToday)}</div>
            <p className="text-xs text-muted-foreground">
              Revenue collected today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for registration staff
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action: any) => (
              <Link key={action.title} href={action.href}>
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-md transition-shadow"
                >
                  <div className={`p-3 rounded-full text-white ${action.color}`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs text-gray-500">{action.description}</div>
                  </div>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Registrations</CardTitle>
            <CardDescription>
              Latest participant registrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRegistrations.map((registration: any) => (
                <div key={registration.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{registration.participantName}</div>
                    <div className="text-sm text-gray-600">{registration.eventName}</div>
                    <div className="text-xs text-gray-500">{registration.registeredAt}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{registration.category}</Badge>
                    <Badge className={getPaymentStatusColor(registration.paymentStatus)}>
                      {registration.paymentStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/staff/registrations">
                <Button variant="outline" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Registrations
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>My Assigned Events</CardTitle>
            <CardDescription>
              Events you're assigned to manage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event: any) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{event.name}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(event.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {event.registrations} / {event.capacity} registered
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {Math.round((event.registrations / event.capacity) * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">capacity</div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {event.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/staff/events">
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  View All Events
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Printed</CardTitle>
            <BadgeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.badgesPrinted}</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QR Codes Scanned</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.qrCodesScanned}</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEvents}</div>
            <p className="text-xs text-muted-foreground">
              Currently assigned
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
