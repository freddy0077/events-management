'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar,
  MapPin,
  Users,
  Printer,
  CheckCircle,
  Clock,
  Loader2,
  ArrowRight
} from 'lucide-react'
import { useQuery } from '@apollo/client/react'
import { GET_MY_ASSIGNED_EVENTS } from '@/lib/graphql/queries'
import { format } from 'date-fns'
import Link from 'next/link'

export default function PrinterEventsPage() {
  const { data: eventsData, loading: eventsLoading } = useQuery(GET_MY_ASSIGNED_EVENTS)
  const events = (eventsData as any)?.myAssignedEvents || []

  const getEventStatus = (event: any) => {
    const eventDate = new Date(event.date)
    const today = new Date()
    
    if (eventDate < today) {
      return { label: 'Completed', color: 'bg-gray-100 text-gray-800' }
    } else if (eventDate.toDateString() === today.toDateString()) {
      return { label: 'Today', color: 'bg-green-100 text-green-800' }
    } else {
      return { label: 'Upcoming', color: 'bg-blue-100 text-blue-800' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
          <p className="text-gray-600 mt-1">
            Events where you're assigned as badge printer
          </p>
        </div>
        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
          <Calendar className="h-4 w-4 mr-1" />
          {events.length} Event{events.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-gray-600">
              Assigned to you
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Events
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter((e: any) => e.isActive).length}
            </div>
            <p className="text-xs text-gray-600">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {events.filter((e: any) => new Date(e.date) > new Date()).length}
            </div>
            <p className="text-xs text-gray-600">
              Future events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Events</CardTitle>
          <CardDescription>
            Events where you can print badges
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No events assigned</p>
              <p className="text-sm mt-2">You'll see events here once you're assigned as a badge printer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event: any) => {
                const status = getEventStatus(event)
                
                return (
                  <div
                    key={event.id}
                    className="border rounded-lg p-6 hover:border-amber-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        {/* Event Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900">
                                {event.name}
                              </h3>
                              <Badge className={status.color}>
                                {status.label}
                              </Badge>
                              {event.isActive && (
                                <Badge variant="outline" className="border-green-500 text-green-700">
                                  Active
                                </Badge>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-gray-600 mb-3">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Event Details */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                            <span>
                              {event.date && format(new Date(event.date), 'MMM d, yyyy')}
                              {event.endDate && ` - ${format(new Date(event.endDate), 'MMM d, yyyy')}`}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <MapPin className="h-4 w-4 mr-2 text-red-600" />
                            {event.venue}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Users className="h-4 w-4 mr-2 text-purple-600" />
                            {event.totalRegistrations || 0} Registrations
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Printer className="h-4 w-4 mr-2 text-amber-600" />
                            {event.approvedRegistrations || 0} Approved
                          </div>
                        </div>

                        {/* Categories */}
                        {event.categories && event.categories.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Categories:</span>
                            <div className="flex flex-wrap gap-2">
                              {event.categories.map((cat: any) => (
                                <Badge key={cat.id} variant="outline" className="text-xs">
                                  {cat.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="ml-6">
                        <Link href={`/printer/badges/print?eventId=${event.id}`}>
                          <Button className="bg-amber-600 hover:bg-amber-700">
                            <Printer className="h-4 w-4 mr-2" />
                            Print Badges
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
