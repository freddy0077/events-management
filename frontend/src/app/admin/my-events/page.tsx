'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Search,
  Eye,
  Settings,
  UserPlus,
  FileText,
  QrCode,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { useMyAssignedEvents } from '@/lib/graphql/hooks'
import { format } from 'date-fns'

export default function MyEventsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  
  // Fetch assigned events
  const { data, loading, error } = useMyAssignedEvents()
  const events = (data as any)?.myAssignedEvents || []

  // Filter events based on search term
  const filteredEvents = events.filter((event: any) =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.venue?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          <span className="text-gray-600">Loading your assigned events...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Events</h3>
          <p className="text-gray-600 mb-4">Unable to load your assigned events. Please try again.</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Events</h1>
          <p className="text-gray-600 mt-1">
            Events you are assigned to manage as an Event Organizer
          </p>
        </div>
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          {events.length} Event{events.length !== 1 ? 's' : ''} Assigned
        </Badge>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search events by name or venue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No events found' : 'No events assigned'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms to find events.'
                : 'You haven\'t been assigned to any events yet. Contact your administrator for event assignments.'
              }
            </p>
            {searchTerm && (
              <Button onClick={() => setSearchTerm('')} variant="outline">
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event: any) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                      {event.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      {event.description || 'No description available'}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={event.status === 'PUBLISHED' ? 'default' : 'secondary'}
                    className={event.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : ''}
                  >
                    {event.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Event Details */}
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {format(new Date(event.date), 'PPP')}
                    {event.endDate && event.endDate !== event.date && (
                      <span> - {format(new Date(event.endDate), 'PPP')}</span>
                    )}
                  </div>
                  
                  {event.venue && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.venue}
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {event.totalRegistrations || 0} registrations
                  </div>
                </div>

                <Separator />

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                  >
                    <Link href={`/admin/events/${event.id}`}>
                      <Eye className="h-3 w-3 mr-1" />
                      View Details
                    </Link>
                  </Button>
                  
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                  >
                    <Link href={`/admin/events/${event.id}/registrations`}>
                      <Users className="h-3 w-3 mr-1" />
                      Registrations
                    </Link>
                  </Button>
                  
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                  >
                    <Link href={`/admin/scanner?eventId=${event.id}`}>
                      <QrCode className="h-3 w-3 mr-1" />
                      QR Scanner
                    </Link>
                  </Button>
                  
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                  >
                    <Link href={`/admin/staff/assignments?eventId=${event.id}`}>
                      <UserPlus className="h-3 w-3 mr-1" />
                      Staff
                    </Link>
                  </Button>
                </div>

                {/* Primary Action */}
                <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
                  <Link href={`/admin/events/${event.id}`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Event
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
