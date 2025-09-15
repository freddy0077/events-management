'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useMyAssignedEvents, useMyEventRegistrations, useCategoriesByEvent } from '@/lib/graphql/hooks'
import { formatGHS, getRegistrationAmount } from '@/lib/utils/currency'
import { 
  Calendar, 
  Users, 
  MapPin, 
  Clock, 
  Search,
  Filter,
  Eye,
  UserPlus,
  CreditCard,
  QrCode,
  MoreHorizontal
} from 'lucide-react'
import Link from 'next/link'

export default function StaffEventsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Fetch assigned events
  const { data: eventsData, loading: eventsLoading, error: eventsError } = useMyAssignedEvents()
  const assignedEvents = (eventsData as any)?.myAssignedEvents || []
  
  // Debug logging
  console.log('🔍 Staff Events Debug:', {
    eventsData,
    assignedEvents,
    loading: eventsLoading,
    error: eventsError
  })
  
  // Get event IDs for fetching registrations
  const eventIds = assignedEvents.map((event: any) => event.id)
  
  // Fetch registrations for assigned events
  const { data: registrationsData, loading: registrationsLoading } = useMyEventRegistrations(eventIds)
  const registrations = (registrationsData as any)?.registrations || []
  
  // Debug logging for registration data and event fields
  console.log('🔍 Staff Events Debug:', {
    eventIds,
    registrationsData,
    registrations,
    registrationCount: registrations.length,
    sampleRegistration: registrations[0],
    sampleEvent: assignedEvents[0], // Check if GraphQL query fix worked
    eventFieldsCheck: assignedEvents[0] ? {
      hasEndDate: 'endDate' in assignedEvents[0],
      hasMaxCapacity: 'maxCapacity' in assignedEvents[0],
      hasIsActive: 'isActive' in assignedEvents[0],
      endDateValue: assignedEvents[0].endDate,
      maxCapacityValue: assignedEvents[0].maxCapacity,
      isActiveValue: assignedEvents[0].isActive
    } : null
  })
  
  // Transform events data for display
  const events = assignedEvents.map((event: any) => {
    const eventRegistrations = registrations.filter((reg: any) => reg.event?.id === event.id)
    
    // Debug logging for each event's registration count
    console.log(`📊 Event "${event.name}" (${event.id}):`, {
      totalRegistrations: eventRegistrations.length,
      maxCapacity: event.maxCapacity,
      isActive: event.isActive,
      endDate: event.endDate,
      registrationIds: eventRegistrations.map(r => r.id)
    })
    
    // Calculate payment stats based on transactions
    const paymentStats = {
      paid: eventRegistrations.filter((reg: any) => {
        // Check if registration has any paid transactions
        return reg.transactions && reg.transactions.some((t: any) => t.paymentStatus === 'PAID')
      }).length,
      pending: eventRegistrations.filter((reg: any) => {
        // Check if registration has pending transactions or no transactions
        const hasPaidTransaction = reg.transactions && reg.transactions.some((t: any) => t.paymentStatus === 'PAID')
        const hasPendingTransaction = reg.transactions && reg.transactions.some((t: any) => 
          t.paymentStatus === 'PENDING' || t.paymentStatus === 'PARTIAL'
        )
        return !hasPaidTransaction && (hasPendingTransaction || !reg.transactions || reg.transactions.length === 0)
      }).length,
      failed: eventRegistrations.filter((reg: any) => {
        // Check if registration has failed transactions
        return reg.transactions && reg.transactions.some((t: any) => t.paymentStatus === 'FAILED')
      }).length
    }
    
    // Group registrations by category
    const categoryStats = eventRegistrations.reduce((acc: any, reg: any) => {
      const categoryName = reg.category?.name || 'General'
      const categoryPrice = reg.category?.price || 0
      
      if (!acc[categoryName]) {
        acc[categoryName] = { name: categoryName, price: categoryPrice, registrations: 0 }
      }
      acc[categoryName].registrations++
      return acc
    }, {} as Record<string, { name: string; price: number; registrations: number }>)
    
    return {
      id: event.id,
      name: event.name,
      description: event.description || 'Event description not available',
      date: event.date,
      endDate: event.endDate || event.date,
      venue: event.venue || 'Venue TBD',
      address: event.address || 'Address TBD',
      status: event.isActive ? 'active' : 'inactive',
      registrations: eventRegistrations.length,
      capacity: event.maxCapacity || 100,
      categories: Object.values(categoryStats),
      paymentStats
    }
  })

  const filteredEvents = events.filter((event: any) => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.venue.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || event.status === filterStatus
    return matchesSearch && matchesFilter
  })
  
  // Loading state
  if (eventsLoading || registrationsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Assigned Events</h1>
          <p className="text-gray-600 mt-2">Loading your assigned events...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">My Assigned Events</h1>
          <p className="text-red-600 mt-2">Error loading events: {eventsError.message}</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateRevenue = (categories: any[]) => {
    return categories.reduce((total, cat) => total + (cat.price * cat.registrations), 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Assigned Events</h1>
        <p className="text-gray-600 mt-2">
          Events you're assigned to manage as registration staff
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search events or venues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
            size="sm"
          >
            All Events
          </Button>
          <Button
            variant={filterStatus === 'active' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('active')}
            size="sm"
          >
            Active
          </Button>
          <Button
            variant={filterStatus === 'upcoming' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('upcoming')}
            size="sm"
          >
            Upcoming
          </Button>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEvents.map((event: any) => (
          <Card key={event.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{event.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {event.description}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(event.status)}>
                  {event.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Event Details */}
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {formatDate(event.date)}
                  {event.endDate !== event.date && ` - ${formatDate(event.endDate)}`}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {event.venue}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  {event.registrations} / {event.capacity} registered
                </div>
              </div>

              {/* Registration Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Registration Progress</span>
                  <span>{Math.round((event.registrations / event.capacity) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(event.registrations / event.capacity) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Payment Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 p-2 rounded">
                  <div className="text-sm font-medium text-green-800">{event.paymentStats.paid}</div>
                  <div className="text-xs text-green-600">Paid</div>
                </div>
                <div className="bg-yellow-50 p-2 rounded">
                  <div className="text-sm font-medium text-yellow-800">{event.paymentStats.pending}</div>
                  <div className="text-xs text-yellow-600">Pending</div>
                </div>
                <div className="bg-red-50 p-2 rounded">
                  <div className="text-sm font-medium text-red-800">{event.paymentStats.failed}</div>
                  <div className="text-xs text-red-600">Failed</div>
                </div>
              </div>

              {/* Revenue */}
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Total Revenue</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatGHS(calculateRevenue(event.categories))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Categories</div>
                <div className="flex flex-wrap gap-1">
                  {event.categories.map((category: any, index: any) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {category.name} ({category.registrations})
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link href={`/staff/registrations?eventId=${event.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Register
                  </Button>
                </Link>
                <Link href={`/staff/payments?eventId=${event.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <CreditCard className="h-4 w-4 mr-1" />
                    Payments
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Link href={`/staff/scanner?eventId=${event.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <QrCode className="h-4 w-4 mr-1" />
                    Scanner
                  </Button>
                </Link>
                <Link href={`/staff/events/${event.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500 text-center">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : assignedEvents.length === 0 
                  ? 'You haven\'t been assigned to any events yet. Contact your administrator to get assigned to events.'
                  : 'No events match your current filters'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {filteredEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary Statistics</CardTitle>
            <CardDescription>
              Overview of your assigned events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredEvents.length}
                </div>
                <div className="text-sm text-gray-600">Total Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredEvents.reduce((sum: any, event: any) => sum + event.registrations, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Registrations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {filteredEvents.reduce((sum: any, event: any) => sum + event.paymentStats.paid, 0)}
                </div>
                <div className="text-sm text-gray-600">Paid Registrations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatGHS(filteredEvents.reduce((sum: any, event: any) => sum + calculateRevenue(event.categories), 0))}
                </div>
                <div className="text-sm text-gray-600">Total Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
