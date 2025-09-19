'use client'

import { useState, useEffect } from 'react'
import { useQuery, useLazyQuery, useMutation } from '@apollo/client/react'
import { GET_MY_ASSIGNED_EVENTS, GET_CATERING_REGISTRATIONS, GET_MEAL_SESSIONS } from '@/lib/graphql/queries'
import { CHECK_IN_PARTICIPANT } from '@/lib/graphql/mutations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  AlertCircle,
  QrCode,
  ScanLine,
  UserPlus
} from 'lucide-react'
import { toast } from 'sonner'
import QRCodeScanner from '@/components/scanner/QRCodeScanner'
import { useFailedScanRecording, createFailedScanRecord } from '@/hooks/use-failed-scan-recording'

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

export default function CateringCheckinScannerPage() {
  // Shared state
  const [selectedEvent, setSelectedEvent] = useState('')
  const [selectedMeal, setSelectedMeal] = useState('')
  const [activeTab, setActiveTab] = useState('scanner')
  
  // Manual search state
  const [searchTerm, setSearchTerm] = useState('')
  const [message, setMessage] = useState('')
  const [isCheckingIn, setIsCheckingIn] = useState(false)

  // Failed scan recording hook
  const { recordFailedScan } = useFailedScanRecording()

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
  const activeMealSessions = mealSessions.filter((session: any) => session.status === 'active')
  const searchResults = (searchData as any)?.getCateringRegistrations || []

  // Get current selected meal session details
  const selectedMealSession = mealSessions.find((session: any) => session.id === selectedMeal)
  const isMealSessionActive = selectedMealSession?.status === 'active'
  const isMealSessionEnded = selectedMealSession?.status === 'completed'

  // Auto-select the first active meal session when available
  useEffect(() => {
    if (activeMealSessions.length > 0 && !selectedMeal) {
      setSelectedMeal(activeMealSessions[0].id)
    }
  }, [activeMealSessions, selectedMeal])

  // Transform data for QRCodeScanner component
  const transformedEvents = events.map((event: any) => ({
    id: event.id,
    name: event.name,
    date: event.date
  }))

  const transformedMealSessions = mealSessions.map((session: any) => ({
    id: session.id,
    name: session.sessionName,
    description: session.description || `${session.startTime} - ${session.endTime}`,
    sessionTime: session.startTime
  }))

  const handleSearch = async () => {
    if (!selectedEvent) {
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
      
      if (!selectedMeal) {
        toast.error('Please select a meal session first')
        return
      }

      // Check if meal session is active
      if (!isMealSessionActive) {
        if (isMealSessionEnded) {
          toast.error('Cannot serve food - this meal session has ended')
        } else {
          toast.error('Cannot serve food - this meal session is not active. Please start the meal session first.')
        }
        return
      }
      
      const result = await checkInParticipant({
        variables: {
          registrationId: participantId,
          mealId: selectedMeal,
          isLate
        }
      })

      if ((result.data as any)?.checkInParticipant?.success) {
        const status = isLate ? 'marked as late' : 'checked in'
        const selectedSession = mealSessions.find((session: any) => session.id === selectedMeal)
        toast.success(`${firstName} ${lastName} ${status} successfully for ${selectedSession?.sessionName || 'meal session'}!`)
        // Refresh search results if in manual mode
        if (activeTab === 'manual' && searchTerm.trim()) {
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

  // Handle failed scan recording
  const handleRecordFailedScan = async (failedScanData: any) => {
    try {
      // Extract error message from notes field (format: "Failed scan: <error message>")
      const errorMessage = failedScanData.notes?.replace('Failed scan: ', '') || 'Unknown error'
      
      // Extract scan method from scannedBy field
      const scanMethod = failedScanData.scannedBy || 'Unknown'
      
      const failedScanRecord = createFailedScanRecord(
        failedScanData.qrCode,
        errorMessage,
        scanMethod,
        {
          eventId: selectedEvent,
          mealId: selectedMeal,
          notes: failedScanData.notes
        }
      )
      
      await recordFailedScan(failedScanRecord)
      console.log('Failed scan recorded successfully for audit trail')
    } catch (error) {
      console.error('Error recording failed scan:', error)
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Catering Check-in</h1>
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
      {/* HERO HEADER */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-50 via-white to-purple-50 p-8 flex flex-col md:flex-row items-center justify-between shadow-lg mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-2">Catering Check-in</h1>
          <p className="text-lg text-gray-600 max-w-xl mb-4">Scan QR codes or manually search participants for meal check-in. Fast, unified, and mobile-friendly for all catering staff.</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium text-xs">QR & Manual Modes</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium text-xs">Modern UI</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium text-xs">Responsive</span>
          </div>
        </div>
        <div className="hidden md:block">
          <QrCode className="w-32 h-32 text-purple-200" />
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Catering Check-in</h1>
        <p className="text-gray-600 mt-1">
          Scan QR codes or manually search participants for meal check-in
        </p>
      </div>

      {/* Event and Meal Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event & Meal Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Event <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={selectedEvent}
                onChange={(e) => {
                  setSelectedEvent(e.target.value)
                  setSelectedMeal('') // Reset meal selection when event changes
                }}
              >
                <option value="">Select an event...</option>
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
                value={selectedMeal}
                onChange={(e) => setSelectedMeal(e.target.value)}
                disabled={!selectedEvent || mealSessionsLoading}
              >
                <option value="">Select meal session...</option>
                {mealSessions.map((session: any) => (
                  <option key={session.id} value={session.id}>
                    {session.sessionName} - {session.startTime ? new Date(session.startTime).toLocaleTimeString() : 'No time set'}
                    {session.status === 'active' && ' (🟢 ACTIVE)'}
                    {session.status === 'scheduled' && ' (🟡 SCHEDULED)'}
                    {session.status === 'completed' && ' (🔴 ENDED)'}
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
        </CardContent>
      </Card>

      {/* Meal Session Status Alert */}
      {selectedEvent && selectedMeal && selectedMealSession && (
        <Card className={`border-2 ${
          isMealSessionActive 
            ? 'border-green-200 bg-green-50' 
            : isMealSessionEnded 
            ? 'border-red-200 bg-red-50'
            : 'border-yellow-200 bg-yellow-50'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  isMealSessionActive 
                    ? 'bg-green-500' 
                    : isMealSessionEnded 
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
                }`}></div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {selectedMealSession.sessionName} - Status: {selectedMealSession.status?.toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedMealSession.startTime && selectedMealSession.endTime && (
                      <>
                        {new Date(selectedMealSession.startTime).toLocaleTimeString()} - {new Date(selectedMealSession.endTime).toLocaleTimeString()}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {isMealSessionActive && (
                  <Badge className="bg-green-100 text-green-800">
                    ✅ Ready for Check-ins
                  </Badge>
                )}
                {isMealSessionEnded && (
                  <Badge className="bg-red-100 text-red-800">
                    ❌ Session Ended - No Check-ins
                  </Badge>
                )}
                {!isMealSessionActive && !isMealSessionEnded && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    ⏳ Session Not Started
                  </Badge>
                )}
              </div>
            </div>
            {!isMealSessionActive && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {isMealSessionEnded 
                    ? "This meal session has ended. Food cannot be served. Please select an active meal session."
                    : "This meal session is not active yet. Please start the meal session from the Meal Management page before serving food."
                  }
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Check-in Methods */}
      {selectedEvent && selectedMeal && (
        <Card>
          <CardHeader>
            <CardTitle>Check-in Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scanner" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR Scanner
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Manual Search
                </TabsTrigger>
              </TabsList>

              {/* QR Scanner Tab */}
              <TabsContent value="scanner" className="mt-6">
                <QRCodeScanner
                  events={transformedEvents}
                  mealSessions={transformedMealSessions}
                  scanHistory={[]} // Focus on real-time scanning
                  title="QR Code Scanner"
                  description="Scan participant QR codes for instant check-in"
                  showStats={false}
                  showInstructions={true}
                  allowEventSelection={false} // Controlled by parent
                  allowMealSelection={false} // Controlled by parent
                  selectedEvent={selectedEvent}
                  selectedMeal={selectedMeal}
                  loading={false}
                  eventsLoading={false}
                  mealSessionsLoading={false}
                  attendancesLoading={false}
                  onEventChange={() => {}} // Disabled
                  onMealChange={() => {}} // Disabled
                  onScanSuccess={(result) => {
                    console.log('Catering scan success:', result)
                    toast.success('Participant checked in successfully!')
                  }}
                  onScanError={(error) => {
                    console.error('Catering scan error:', error)
                    toast.error('Scan failed. Try manual search if needed.')
                  }}
                  onRecordFailedScan={handleRecordFailedScan}
                />
              </TabsContent>

              {/* Manual Search Tab */}
              <TabsContent value="manual" className="mt-6">
                <div className="space-y-6">
                  {/* Search Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Search Participants
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <Input
                            type="text"
                            placeholder="Search by name, email, or QR code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                          />
                        </div>
                        <Button
                          onClick={handleSearch}
                          disabled={isSearching}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {isSearching ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Search className="h-4 w-4 mr-2" />
                          )}
                          Search
                        </Button>
                      </div>

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
                          Search Results ({filteredResults.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {filteredResults.map((participant: any) => (
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
                                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
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
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Check-in Instructions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-900 mb-2">QR Scanner Mode:</h4>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>• Use Scanner Device for high-volume check-ins</li>
                <li>• Use Camera mode for mobile devices</li>
                <li>• Use Manual Entry as backup option</li>
                <li>• Instant check-in upon successful scan</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Manual Search Mode:</h4>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>• Search participants by name, email, or QR code</li>
                <li>• Verify payment status before check-in</li>
                <li>• Review attendance history to avoid duplicates</li>
                <li>• Use "Mark Late" for participants arriving after start time</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
