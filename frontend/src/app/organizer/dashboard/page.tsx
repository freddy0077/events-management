'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar,
  Users,
  UserPlus,
  QrCode,
  FileText,
  TrendingUp,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Settings,
  Plus
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { useMyAssignedEvents } from '@/lib/graphql/hooks'
import { format } from 'date-fns'

export default function OrganizerDashboard() {
  const { user, isAuthenticated } = useAuth()
  console.log('Dashboard - User:', user, 'Authenticated:', isAuthenticated)
  const { data, loading, error } = useMyAssignedEvents()
  console.log('Dashboard - Query state:', { data, loading, error })
  const events = (data as any)?.myAssignedEvents || []

  // Calculate dashboard stats
  const totalEvents = events.length
  const activeEvents = events.filter((event: any) => event.status === 'PUBLISHED').length
  const totalRegistrations = events.reduce((sum: any, event: any) => sum + (event.totalRegistrations || 0), 0)
  const upcomingEvents = events.filter((event: any) => new Date(event.date) > new Date())

  const quickActions = [
    {
      title: 'View My Events',
      description: 'Manage your assigned events',
      href: '/organizer/events',
      icon: Calendar,
      color: 'bg-blue-500',
      count: totalEvents
    },
    {
      title: 'Check Registrations',
      description: 'View event registrations',
      href: '/organizer/registrations',
      icon: Users,
      color: 'bg-green-500',
      count: totalRegistrations
    },
    {
      title: 'Assign Staff',
      description: 'Manage event staff',
      href: '/organizer/staff',
      icon: UserPlus,
      color: 'bg-purple-500'
    },
    {
      title: 'Scan QR Codes',
      description: 'Check-in participants',
      href: '/organizer/scanner',
      icon: QrCode,
      color: 'bg-orange-500'
    },
    {
      title: 'Generate Reports',
      description: 'Export event data',
      href: '/organizer/reports',
      icon: FileText,
      color: 'bg-indigo-500'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          <span className="text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here's an overview of your assigned events and activities
          </p>
        </div>
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          Event Organizer
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{totalEvents}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Events</p>
                <p className="text-2xl font-bold text-gray-900">{activeEvents}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                <p className="text-2xl font-bold text-gray-900">{totalRegistrations}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Events</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingEvents.length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common tasks and shortcuts for event management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.href}
                  asChild
                  variant="outline"
                  className="h-auto p-4 justify-start"
                >
                  <Link href={action.href}>
                    <div className="flex items-start space-x-3 w-full">
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">{action.title}</p>
                          {action.count !== undefined && (
                            <Badge variant="secondary">{action.count}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                      </div>
                    </div>
                  </Link>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Events */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Upcoming Events
              </span>
              <Button asChild variant="outline" size="sm">
                <Link href="/organizer/events">
                  <Eye className="h-4 w-4 mr-1" />
                  View All
                </Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.slice(0, 3).map((event: any) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{event.name}</h4>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(event.date), 'PPP')}
                      </div>
                      {event.venue && (
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {event.venue}
                        </div>
                      )}
                    </div>
                    <Badge 
                      variant={event.status === 'PUBLISHED' ? 'default' : 'secondary'}
                      className={event.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {event.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-green-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="p-1 bg-green-100 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    You've been assigned as Event Organizer
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    You can now manage your assigned events and staff
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="p-1 bg-blue-100 rounded-full">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {totalRegistrations} total registrations across your events
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Monitor registration progress in the registrations section
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                <div className="p-1 bg-orange-100 rounded-full">
                  <Settings className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Event management tools available
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Use quick actions above to manage your events efficiently
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
