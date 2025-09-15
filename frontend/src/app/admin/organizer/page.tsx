'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate, formatCurrency } from '@/lib/utils'
import { getRegistrationAmount } from '@/lib/utils/currency'
import { 
  Calendar, 
  Users, 
  DollarSign,
  TrendingUp,
  Eye,
  Settings,
  BarChart3,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin,
  UserPlus,
  UserCheck,
  Crown,
  Building,
  Search,
  Filter,
  Plus,
  Edit,
  Activity,
  Target,
  Zap
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { useEvents, useRegistrations, useDashboardStats } from '@/lib/graphql/hooks'

export default function EventOrganizerDashboard() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // GraphQL queries for assigned events data
  const { data: eventsData, loading: eventsLoading, error: eventsError } = useEvents({ 
    limit: 10,
    // TODO: Add filter for events assigned to this organizer
  })
  const { data: registrationsData, loading: registrationsLoading } = useRegistrations({ limit: 5 })
  const { data: dashboardStats, loading: statsLoading } = useDashboardStats()

  // Filter events assigned to this organizer
  const assignedEvents = useMemo(() => {
    if (!eventsData?.events) return []
    // TODO: Filter based on actual event assignments
    return eventsData.events
  }, [eventsData])

  // Filter events based on search and status
  const filteredEvents = useMemo(() => {
    return assignedEvents.filter(event => {
      const matchesSearch = event?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || event.status?.toLowerCase() === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [assignedEvents, searchTerm, statusFilter])

  if (eventsLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-orange-700">Loading your event dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Event Manager Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.firstName}! Manage your assigned events and coordinate staff activities.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild className="bg-orange-600 hover:bg-orange-700">
              <Link href="/admin/events/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/staff/assignments">
                <UserPlus className="h-4 w-4 mr-2" />
                Manage Staff
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">My Events</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{assignedEvents.length}</div>
              <p className="text-xs text-gray-500 mt-1">Events assigned to you</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Registrations</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {(dashboardStats as any)?.totalRegistrations || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Across all your events</p>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency((dashboardStats as any)?.totalRevenue || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Total payments received</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Staff Members</CardTitle>
              <UserCheck className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {(dashboardStats as any)?.totalStaff || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Active event staff</p>
            </CardContent>
          </Card>
        </div>

        {/* Events Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  My Assigned Events
                </CardTitle>
                <CardDescription>
                  Manage events assigned to you and coordinate staff activities
                </CardDescription>
              </div>
              <div className="flex gap-2 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'No events have been assigned to you yet'
                  }
                </p>
                {(!searchTerm && statusFilter === 'all') && (
                  <Button asChild className="bg-orange-600 hover:bg-orange-700">
                    <Link href="/admin/events/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Event
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{event.title || event.name}</h3>
                          <Badge 
                            variant={event.status === 'ACTIVE' ? 'default' : 'secondary'}
                            className={event.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {event.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {event?.date ? formatDate(event?.date): null}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.venue}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {event.registrations?.length || 0} registered
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {formatCurrency(event.registrations?.reduce((sum, reg) => sum + getRegistrationAmount(reg), 0) || 0)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/events/${event.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/events/${event.id}/edit`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/staff/assignments?eventId=${event.id}`}>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Staff
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-600" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks for event management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col border-orange-200 hover:border-orange-300 hover:bg-orange-50" asChild>
                <Link href="/admin/registration">
                  <UserPlus className="h-6 w-6 mb-2 text-orange-600" />
                  <span className="text-orange-700">Register Participant</span>
                </Link>
              </Button>

              <Button variant="outline" className="h-20 flex-col border-blue-200 hover:border-blue-300 hover:bg-blue-50" asChild>
                <Link href="/admin/finance">
                  <DollarSign className="h-6 w-6 mb-2 text-blue-600" />
                  <span className="text-blue-700">View Payments</span>
                </Link>
              </Button>

              <Button variant="outline" className="h-20 flex-col border-green-200 hover:border-green-300 hover:bg-green-50" asChild>
                <Link href="/admin/catering">
                  <Target className="h-6 w-6 mb-2 text-green-600" />
                  <span className="text-green-700">Catering Portal</span>
                </Link>
              </Button>

              <Button variant="outline" className="h-20 flex-col border-purple-200 hover:border-purple-300 hover:bg-purple-50" asChild>
                <Link href="/admin/reports">
                  <BarChart3 className="h-6 w-6 mb-2 text-purple-600" />
                  <span className="text-purple-700">View Reports</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
