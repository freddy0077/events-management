'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useQuery, useLazyQuery, useMutation } from '@apollo/client/react'
import { GET_MY_ASSIGNED_EVENTS, GET_CATERING_REGISTRATIONS, GET_MEAL_SESSIONS } from '@/lib/graphql/queries'
import { CHECK_IN_PARTICIPANT } from '@/lib/graphql/mutations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  Calendar,
  MapPin,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface Participant {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  paymentStatus: string
  qrCode: string
  mealAttendances?: Array<{
    id: string
    scannedAt: string
    meal: {
      id: string
      sessionName: string
    }
  }>
  event: {
    id: string
    name: string
    date: string
  }
  category: {
    id: string
    name: string
  }
}

export default function CateringCheckinPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEvent, setSelectedEvent] = useState('')
  const [selectedMealSession, setSelectedMealSession] = useState('')
  const [message, setMessage] = useState('')
  const [isCheckingIn, setIsCheckingIn] = useState(false)

  // GraphQL queries and mutations
  const { data: eventsData, loading: eventsLoading, error: eventsError } = useQuery(GET_MY_ASSIGNED_EVENTS)
  const { data: mealSessionsData, loading: mealSessionsLoading } = useQuery(GET_MEAL_SESSIONS, {
    variables: { eventId: selectedEvent || undefined },
    skip: !selectedEvent
  })
  const [searchParticipants, { data: searchData, loading: isSearching, error: searchError }] = useLazyQuery(GET_CATERING_REGISTRATIONS)
  const [checkInParticipant] = useMutation(CHECK_IN_PARTICIPANT)

  const events = (eventsData as any)?.myAssignedEvents || []
  const mealSessions = (mealSessionsData as any)?.getMealSessions || []
  const searchResults = (searchData as any)?.getCateringRegistrations || []

  const handleSearch = async () => {
    if (!selectedEvent || selectedEvent === 'all') {
      setMessage('Please select an event first')
      return
    }

    setMessage('')

    try {
      await searchParticipants({
        variables: {
          eventId: selectedEvent
        }
      })
    } catch (error) {
      console.error('Search error:', error)
      setMessage('Search failed. Please try again.')
    }
  }

  // Client-side filtering for search functionality
  const filteredResults = searchResults.filter((participant: any) => {
    if (!searchTerm.trim()) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      participant.firstName?.toLowerCase().includes(searchLower) ||
      participant.lastName?.toLowerCase().includes(searchLower) ||
      participant.email?.toLowerCase().includes(searchLower) ||
      participant.qrCode?.toLowerCase().includes(searchLower)
    )
  })

  const handleCheckIn = async (participantId: string, firstName: string, lastName: string, isLate: boolean = false) => {
    try {
      setIsCheckingIn(true)
      
      if (!selectedMealSession) {
        toast.error('Please select a meal session first')
        return
      }
      
      const result = await checkInParticipant({
        variables: {
          registrationId: participantId,
          mealId: selectedMealSession,
          isLate
        }
      })

      if ((result.data as any)?.checkInParticipant?.success) {
        const status = isLate ? 'marked as late' : 'checked in'
        const selectedSession = mealSessions.find((session: any) => session.id === selectedMealSession)
        toast.success(`${firstName} ${lastName} ${status} successfully for ${selectedSession?.sessionName || 'meal session'}!`)
        // Refresh search results
        if (searchTerm.trim()) {
          handleSearch()
        }
      } else {
        toast.error((result.data as any)?.checkInParticipant?.message || 'Check-in failed')
      }
    } catch (error) {
      console.error('Check-in error:', error)
      toast.error('Failed to check in participant')
    } finally {
      setIsCheckingIn(false)
    }
  }

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Handle loading states
  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading events...</span>
        </div>
      </div>
    )
  }

  // Handle errors
  if (eventsError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Participant Check-in</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load events. Please try refreshing the page.
            <div>Error: {eventsError.message}</div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Participant Check-in</h1>
        <p className="text-gray-600 mt-1">
          Manually check-in participants for meal sessions
        </p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Participants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Name, Email, or QR Code
              </label>
              <Input
                type="text"
                placeholder="Enter participant details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Event (Optional)
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
              >
                <option value="">All Events</option>
                {events.map((event: any) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Meal Session <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={selectedMealSession}
                onChange={(e) => setSelectedMealSession(e.target.value)}
                disabled={!selectedEvent || mealSessionsLoading}
              >
                <option value="">Select meal session...</option>
                {mealSessions.map((session: any) => (
                  <option key={session.id} value={session.id}>
                    {session.sessionName} - {session.startTime ? new Date(session.startTime).toLocaleTimeString() : 'No time set'}
                    {session.isActive && ' (Active)'}
                  </option>
                ))}
              </select>
              {!selectedEvent && (
                <p className="text-sm text-gray-500 mt-1">Select an event first to see meal sessions</p>
              )}
              {selectedEvent && mealSessions.length === 0 && !mealSessionsLoading && (
                <p className="text-sm text-orange-600 mt-1">No meal sessions found for this event</p>
              )}
            </div>
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSearching ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Search Participants
          </Button>

          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Search Results ({searchResults.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((participant: any) => (
                <div key={participant.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {participant.firstName} {participant.lastName}
                        </h3>
                        <Badge className={getPaymentStatusColor(participant.paymentStatus)}>
                          {participant.paymentStatus}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          {participant.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {participant.event.name} - {formatDate(participant.event.date)}
                        </div>
                        <div>
                          Category: {participant.category.name}
                        </div>
                        <div>
                          QR Code: {participant.qrCode}
                        </div>
                      </div>

                      {/* Meal Attendance History */}
                      {participant.mealAttendances && participant.mealAttendances.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Meal Attendance History</h4>
                          <div className="space-y-1">
                            {participant.mealAttendances.map((attendance: any) => (
                              <div key={attendance.id} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span>{attendance.meal.sessionName}</span>
                                <span className="text-gray-500">
                                  ({new Date(attendance.scannedAt).toLocaleTimeString()})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleCheckIn(participant.id, participant.firstName, participant.lastName)}
                        disabled={isCheckingIn}
                      >
                        {isCheckingIn ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        )}
                        Check In
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        onClick={() => handleCheckIn(participant.id, participant.firstName, participant.lastName, true)}
                        disabled={isCheckingIn}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Mark Late
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Check-in Instructions</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• <strong>Select an event and meal session first</strong> (required for check-in)</li>
            <li>• Search participants by name, email, or QR code</li>
            <li>• Verify payment status before check-in (only PAID participants can be checked in)</li>
            <li>• Use "Check In" for normal meal service</li>
            <li>• Use "Mark Late" for participants arriving after meal start time</li>
            <li>• Check attendance history to avoid duplicate check-ins</li>
            <li>• Active meal sessions are marked with "(Active)" in the dropdown</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
