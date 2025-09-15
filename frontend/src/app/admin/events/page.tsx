'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
  Trash2,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Download,
  Copy,
  UserPlus,
  Settings,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  ChevronDown,
  BarChart3,
  Target,
  Activity,
  Zap,
  Crown,
  Building2,
  CalendarDays,
  FileText,
  QrCode
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
import { useEvents, useDeleteEvent } from '@/lib/graphql/hooks'
import { ModernHeader } from '@/components/ui/modern-header'
import { AnimatedStatsGrid } from '@/components/ui/animated-stats-grid'
import { ModernCard, ModernCardHeader } from '@/components/ui/modern-card'

// Types
interface Event {
  id: string
  name: string
  slug: string
  date: string
  endDate?: string
  venue: string
  description?: string
  maxCapacity: number
  isActive: boolean
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  totalRegistrations: number
  approvedRegistrations: number
  paidRegistrations?: number
  pendingRegistrations?: number
  createdAt: string
  updatedAt: string
  categories: Array<{
    id: string
    name: string
    price: number
    maxCapacity: number
    currentCount?: number
    description?: string
    isActive: boolean
  }>
}

interface EventFilters {
  search: string
  status: string
  dateRange: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export default function AdminEventsPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  
  // GraphQL queries and mutations
  const { data: eventsData, loading: eventsLoading, error: eventsError, refetch } = useEvents()
  const [deleteEvent] = useDeleteEvent()
  
  // Local state
  const [filters, setFilters] = useState<EventFilters>({
    search: '',
    status: 'all',
    dateRange: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  })
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  // Data processing
  const events: Event[] = eventsData?.events || []
  
  // Calculate statistics
  const stats = useMemo(() => {
    const totalEvents = events.length
    const activeEvents = events.filter(e => e.status === 'ACTIVE').length
    const completedEvents = events.filter(e => e.status === 'COMPLETED').length
    const totalRegistrations = events.reduce((sum, e) => sum + (e.totalRegistrations || 0), 0)
    const totalRevenue = events.reduce((sum, e) => {
      return sum + e.categories.reduce((catSum, cat) => catSum + (cat.price * (cat.currentCount || 0)), 0)
    }, 0)
    const avgCapacityUtilization = events.length > 0 
      ? events.reduce((sum, e) => sum + ((e.totalRegistrations || 0) / e.maxCapacity * 100), 0) / events.length 
      : 0

    return {
      totalEvents,
      activeEvents,
      completedEvents,
      totalRegistrations,
      totalRevenue,
      avgCapacityUtilization: Math.round(avgCapacityUtilization)
    }
  }, [events])

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let filtered = [...events]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(searchLower) ||
        event.venue.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(event => event.status === filters.status)
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date)
        switch (filters.dateRange) {
          case 'upcoming':
            return eventDate > now
          case 'past':
            return eventDate < now
          case 'this-month':
            return eventDate >= thirtyDaysAgo && eventDate <= thirtyDaysFromNow
          default:
            return true
        }
      })
    }

    // Sort events
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'date':
          aValue = new Date(a.date)
          bValue = new Date(b.date)
          break
        case 'registrations':
          aValue = a.totalRegistrations || 0
          bValue = b.totalRegistrations || 0
          break
        case 'capacity':
          aValue = a.maxCapacity
          bValue = b.maxCapacity
          break
        case 'created':
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        default:
          aValue = new Date(a.date)
          bValue = new Date(b.date)
      }

      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [events, filters])

  // Event handlers
  const handleFilterChange = useCallback((key: keyof EventFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSelectEvent = useCallback((eventId: string, checked: boolean) => {
    setSelectedEvents(prev => 
      checked 
        ? [...prev, eventId]
        : prev.filter(id => id !== eventId)
    )
  }, [])

  const handleSelectAll = useCallback((checked: boolean) => {
    setSelectedEvents(checked ? filteredEvents.map(e => e.id) : [])
  }, [filteredEvents])

  const handleDeleteEvent = useCallback(async (event: Event) => {
    try {
      await deleteEvent({
        variables: { id: event.id }
      })
      toast.success(`Event "${event.name}" deleted successfully`)
      refetch()
      setDeleteDialogOpen(false)
      setEventToDelete(null)
    } catch (error: any) {
      console.error('Delete event error:', error)
      toast.error(error.message || 'Failed to delete event')
    }
  }, [deleteEvent, refetch])

  const handleBulkDelete = useCallback(async () => {
    if (selectedEvents.length === 0) return
    
    setBulkActionLoading(true)
    try {
      for (const eventId of selectedEvents) {
        await deleteEvent({ variables: { id: eventId } })
      }
      toast.success(`${selectedEvents.length} events deleted successfully`)
      setSelectedEvents([])
      refetch()
    } catch (error: any) {
      console.error('Bulk delete error:', error)
      toast.error('Failed to delete some events')
    } finally {
      setBulkActionLoading(false)
    }
  }, [selectedEvents, deleteEvent, refetch])

  const handleDuplicateEvent = useCallback((event: Event) => {
    // Navigate to create page with pre-filled data
    const queryParams = new URLSearchParams({
      duplicate: event.id,
      name: `${event.name} (Copy)`,
      venue: event.venue,
      description: event.description || '',
      maxCapacity: event.maxCapacity.toString()
    })
    router.push(`/admin/events/create?${queryParams.toString()}`)
  }, [router])

  // Get status badge variant and color
  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return { variant: 'secondary' as const, color: 'text-gray-600', icon: XCircle }
    }
    
    switch (status) {
      case 'ACTIVE':
        return { variant: 'default' as const, color: 'text-green-600', icon: CheckCircle2 }
      case 'COMPLETED':
        return { variant: 'secondary' as const, color: 'text-blue-600', icon: CheckCircle2 }
      case 'CANCELLED':
        return { variant: 'destructive' as const, color: 'text-red-600', icon: XCircle }
      case 'DRAFT':
        return { variant: 'outline' as const, color: 'text-yellow-600', icon: AlertCircle }
      default:
        return { variant: 'secondary' as const, color: 'text-gray-600', icon: AlertCircle }
    }
  }

  // Calculate capacity utilization percentage
  const getCapacityUtilization = (event: Event) => {
    return event.maxCapacity > 0 ? Math.round((event.totalRegistrations || 0) / event.maxCapacity * 100) : 0
  }

  // Access control
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to manage events
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/admin">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Stats for animated grid
  const statsData = [
    { label: 'Total Events', value: stats.totalEvents, icon: Calendar, color: 'from-blue-500 to-blue-600', loading: eventsLoading },
    { label: 'Active Events', value: stats.activeEvents, icon: Activity, color: 'from-green-500 to-green-600', loading: eventsLoading },
    { label: 'Completed Events', value: stats.completedEvents, icon: CheckCircle2, color: 'from-indigo-500 to-indigo-600', loading: eventsLoading },
    { label: 'Total Registrations', value: stats.totalRegistrations, icon: Users, color: 'from-purple-500 to-purple-600', loading: eventsLoading },
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'from-emerald-500 to-emerald-600', loading: eventsLoading },
    { label: 'Avg. Capacity', value: `${stats.avgCapacityUtilization}%`, icon: Target, color: 'from-orange-500 to-orange-600', loading: eventsLoading },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Modern Header */}
        <ModernHeader
          title="Events Management"
          subtitle="Create, manage, and monitor all your events with comprehensive analytics and powerful tools."
          icon={CalendarDaysIcon}
          stats={[
            { label: 'Total Events', value: stats.totalEvents, icon: DocumentTextIcon },
            { label: 'Active Now', value: stats.activeEvents, icon: Activity },
          ]}
          actionButton={{
            label: 'Create Event',
            onClick: () => router.push('/admin/events/create'),
            icon: Plus
          }}
          gradient="from-indigo-600 via-purple-600 to-pink-600"
        />

        {/* Animated Stats Grid */}
        <AnimatedStatsGrid stats={statsData} columns={6} />

        {/* Filters and Actions */}
        <ModernCard className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search events..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Select value={filters.dateRange} onValueChange={(value) => handleFilterChange('dateRange', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past Events</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Options */}
              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Event Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="registrations">Registrations</SelectItem>
                  <SelectItem value="capacity">Capacity</SelectItem>
                  <SelectItem value="created">Created Date</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
            </div>

            {/* Bulk Actions */}
            {selectedEvents.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedEvents.length} selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkActionLoading}
                >
                  {bulkActionLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
        </ModernCard>

        {/* Events List */}
        <ModernCard>
          <ModernCardHeader
            title="Events"
            subtitle={`${filteredEvents.length} events found`}
            icon={Calendar}
            iconColor="bg-indigo-100 text-indigo-600"
            rightContent={
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedEvents.length === filteredEvents.length && filteredEvents.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-600">Select All</span>
              </div>
            }
          />

          {eventsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-3" />
                <span className="text-sm text-gray-500">Loading events...</span>
              </div>
            </div>
          ) : eventsError ? (
            <div className="text-center py-12">
              <XCircle className="mx-auto h-12 w-12 text-red-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading events</h3>
              <p className="mt-1 text-sm text-gray-500">{eventsError.message}</p>
              <Button onClick={() => refetch()} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.search || filters.status !== 'all' || filters.dateRange !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Get started by creating your first event.'}
              </p>
              <Button asChild className="mt-4">
                <Link href="/admin/events/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredEvents.map((event, index) => {
                  const statusBadge = getStatusBadge(event.status, event.isActive)
                  const capacityUtilization = getCapacityUtilization(event)
                  const isMultiDay = event.endDate && event.endDate !== event.date
                  
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Selection Checkbox */}
                          <Checkbox
                            checked={selectedEvents.includes(event.id)}
                            onCheckedChange={(checked) => handleSelectEvent(event.id, checked as boolean)}
                            className="mt-1"
                          />

                          {/* Event Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {event.name}
                              </h3>
                              <Badge variant={statusBadge.variant} className="flex items-center gap-1">
                                <statusBadge.icon className="h-3 w-3" />
                                {event.status}
                              </Badge>
                              {!event.isActive && (
                                <Badge variant="secondary" className="text-gray-500">
                                  Inactive
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                              {/* Date */}
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CalendarDays className="h-4 w-4" />
                                <span>
                                  {formatDate(event.date)}
                                  {isMultiDay && ` - ${formatDate(event.endDate!)}`}
                                </span>
                              </div>

                              {/* Venue */}
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="h-4 w-4" />
                                <span className="truncate">{event.venue}</span>
                              </div>

                              {/* Registrations */}
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users className="h-4 w-4" />
                                <span>
                                  {event.totalRegistrations || 0}/{event.maxCapacity}
                                  <span className="ml-1 text-xs">
                                    ({capacityUtilization}%)
                                  </span>
                                </span>
                              </div>

                              {/* Revenue */}
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <DollarSign className="h-4 w-4" />
                                <span>
                                  {formatCurrency(
                                    event.categories.reduce((sum, cat) => 
                                      sum + (cat.price * (cat.currentCount || 0)), 0
                                    )
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Categories */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {event.categories.slice(0, 3).map((category) => (
                                <Badge key={category.id} variant="outline" className="text-xs">
                                  {category.name} - {formatCurrency(category.price)}
                                </Badge>
                              ))}
                              {event.categories.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{event.categories.length - 3} more
                                </Badge>
                              )}
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  capacityUtilization >= 90 ? 'bg-red-500' :
                                  capacityUtilization >= 70 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(capacityUtilization, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/admin/events/${event.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/events/${event.id}/edit`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Event
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateEvent(event)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/events/${event.id}/staff`}>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Manage Staff
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/registrations?eventId=${event.id}`}>
                                  <Users className="h-4 w-4 mr-2" />
                                  View Registrations
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/reports?eventId=${event.id}`}>
                                  <BarChart3 className="h-4 w-4 mr-2" />
                                  View Reports
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => {
                                  setEventToDelete(event)
                                  setDeleteDialogOpen(true)
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Event
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </ModernCard>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Event</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{eventToDelete?.name}"? This action cannot be undone.
                All registrations and related data will also be deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => eventToDelete && handleDeleteEvent(eventToDelete)}
              >
                Delete Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
