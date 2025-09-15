'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client/react'
import { GET_MEAL_SESSIONS, GET_MY_ASSIGNED_EVENTS } from '@/lib/graphql/queries'
import { START_MEAL_SESSION, END_MEAL_SESSION, CREATE_MEAL_SESSION, UPDATE_MEAL_SESSION } from '@/lib/graphql/mutations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ChefHat,
  Plus,
  Clock,
  Users,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface MealSession {
  id: string
  sessionName: string
  startTime: string
  endTime: string
  maxCapacity?: number
  totalAttendees?: number
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  description?: string
  location?: string
  eventId?: string
  event?: {
    id: string
    name: string
    date: string
  }
}

export default function CateringMealsPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSession, setEditingSession] = useState<MealSession | null>(null)
  const [selectedEvent, setSelectedEvent] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'time' | 'name' | 'status'>('time')

  // GraphQL queries and mutations
  const { data: eventsData, loading: eventsLoading } = useQuery(GET_MY_ASSIGNED_EVENTS)
  const events = (eventsData as any)?.myAssignedEvents || []
  
  // Backend now automatically filters meal sessions by assigned events
  const { data: mealSessionsData, loading: mealSessionsLoading, error: mealSessionsError, refetch: refetchMealSessions } = useQuery(GET_MEAL_SESSIONS, {
    variables: { eventId: selectedEvent !== 'all' ? selectedEvent : undefined }
  })
  
  const [startMealSession] = useMutation(START_MEAL_SESSION)
  const [endMealSession] = useMutation(END_MEAL_SESSION)
  const [createMealSession] = useMutation(CREATE_MEAL_SESSION)
  const [updateMealSession] = useMutation(UPDATE_MEAL_SESSION)

  // Backend automatically filters by assigned events - apply additional client-side filtering
  const allMealSessions = (mealSessionsData as any)?.getMealSessions || []
  
  // Apply search and status filters
  const filteredSessions = allMealSessions.filter((session: any) => {
    const matchesSearch = searchTerm === '' || 
      session.sessionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.event?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter
    
    return matchesSearch && matchesStatus
  })
  
  // Apply sorting
  const mealSessions = [...filteredSessions].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.sessionName.localeCompare(b.sessionName)
      case 'status':
        return a.status.localeCompare(b.status)
      case 'time':
      default:
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    }
  })

    console.log("Meal Sessions: ", mealSessions)

  // Handle loading states
  if (mealSessionsLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading meal sessions...</span>
        </div>
      </div>
    )
  }

  // Handle errors
  if (mealSessionsError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Meal Management</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load meal sessions. Please try refreshing the page.
            <div>Error: {mealSessionsError.message}</div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4" />
      case 'scheduled':
        return <Clock className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const handleStartSession = async (sessionId: string) => {
    try {
      const result = await startMealSession({
        variables: { id: sessionId }
      })

      if ((result.data as any)?.startMealSession?.success) {
        toast.success('Meal session started successfully!')
        refetchMealSessions()
      } else {
        toast.error((result.data as any)?.startMealSession?.message || 'Failed to start meal session')
      }
    } catch (error) {
      console.error('Error starting meal session:', error)
      toast.error('Failed to start meal session')
    }
  }

  const handleEndSession = async (sessionId: string) => {
    try {
      const result = await endMealSession({
        variables: { id: sessionId }
      })

      if ((result.data as any)?.endMealSession?.success) {
        toast.success('Meal session ended successfully!')
        refetchMealSessions()
      } else {
        toast.error((result.data as any)?.endMealSession?.message || 'Failed to end meal session')
      }
    } catch (error) {
      console.error('Error ending meal session:', error)
      toast.error('Failed to end meal session')
    }
  }

  return (
    <div className="space-y-6">
      {/* HERO HEADER */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-50 via-white to-purple-50 p-8 flex flex-col md:flex-row items-center justify-between shadow-lg mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-2">Meal Sessions Management</h1>
          <p className="text-lg text-gray-600 max-w-xl mb-4">Create, manage, and track all meal sessions for your assigned events in a modern, unified interface.</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium text-xs">Real-time Updates</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium text-xs">Modern UI</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium text-xs">Responsive</span>
          </div>
        </div>
        <div className="hidden md:block">
          <ChefHat className="w-32 h-32 text-purple-200" />
        </div>
      </div>

      {/* Enhanced Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* First Row: Event Filter and Search */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Event:</label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select an event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assigned Events</SelectItem>
                    {events.map((event: any) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2 flex-1">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Search:</label>
                <Input
                  placeholder="Search meal sessions, descriptions, or events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            
            {/* Second Row: Status Filter, Sort, and Results Count */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Status:</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort by:</label>
                <Select value={sortBy} onValueChange={(value: 'time' | 'name' | 'status') => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Time</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-sm text-gray-500 md:ml-auto">
                Showing {mealSessions.length} of {allMealSessions.length} meal session{mealSessions.length !== 1 ? 's' : ''}
                {selectedEvent !== 'all' && events.find((e: any) => e.id === selectedEvent) && 
                  ` for ${events.find((e: any) => e.id === selectedEvent)?.name}`
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MODERN STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <Card className="group relative overflow-hidden shadow-lg rounded-xl border-0 bg-white hover:scale-[1.03] transition-transform">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-green-100 to-purple-100 transition" />
          <CardContent className="p-6 flex flex-col gap-2 items-start">
            <div className="rounded-full p-3 mb-2 bg-blue-50 flex items-center justify-center">
              <Calendar className="h-7 w-7 text-blue-600" />
            </div>
            <span className="text-lg font-semibold text-gray-700">Total Sessions</span>
            <span className="text-3xl font-extrabold text-gray-900">{mealSessions.length}</span>
            <span className="text-xs text-gray-500">All filtered sessions</span>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden shadow-lg rounded-xl border-0 bg-white hover:scale-[1.03] transition-transform">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-green-100 to-blue-100 transition" />
          <CardContent className="p-6 flex flex-col gap-2 items-start">
            <div className="rounded-full p-3 mb-2 bg-green-50 flex items-center justify-center">
              <Users className="h-7 w-7 text-green-600" />
            </div>
            <span className="text-lg font-semibold text-gray-700">Active Sessions</span>
            <span className="text-3xl font-extrabold text-gray-900">{mealSessions.filter(s => s.status === 'active').length}</span>
            <span className="text-xs text-gray-500">Currently running</span>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden shadow-lg rounded-xl border-0 bg-white hover:scale-[1.03] transition-transform">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-blue-100 to-purple-100 transition" />
          <CardContent className="p-6 flex flex-col gap-2 items-start">
            <div className="rounded-full p-3 mb-2 bg-purple-50 flex items-center justify-center">
              <CheckCircle className="h-7 w-7 text-purple-600" />
            </div>
            <span className="text-lg font-semibold text-gray-700">Completed</span>
            <span className="text-3xl font-extrabold text-gray-900">{mealSessions.filter(s => s.status === 'completed').length}</span>
            <span className="text-xs text-gray-500">Sessions completed</span>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden shadow-lg rounded-xl border-0 bg-white hover:scale-[1.03] transition-transform">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-red-100 to-blue-100 transition" />
          <CardContent className="p-6 flex flex-col gap-2 items-start">
            <div className="rounded-full p-3 mb-2 bg-red-50 flex items-center justify-center">
              <Pause className="h-7 w-7 text-red-600" />
            </div>
            <span className="text-lg font-semibold text-gray-700">Cancelled</span>
            <span className="text-3xl font-extrabold text-gray-900">{mealSessions.filter(s => s.status === 'cancelled').length}</span>
            <span className="text-xs text-gray-500">Sessions cancelled</span>
          </CardContent>
        </Card>
      </div>

      {/* Meal Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Meal Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mealSessions.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No meal sessions found</h3>
              <p className="text-gray-500 mb-4">
                {allMealSessions.length === 0 
                  ? "No meal sessions have been created yet. Create your first meal session to get started."
                  : "No meal sessions match your current filters. Try adjusting your search or filter criteria."
                }
              </p>
              {allMealSessions.length === 0 && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Meal Session
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {mealSessions.map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {session.sessionName}
                      </h3>
                      <Badge className={`${getStatusColor(session.status)} flex items-center gap-1`}>
                        {getStatusIcon(session.status)}
                        {session.status?.charAt(0).toUpperCase() + session.status?.slice(1)}
                      </Badge>
                    </div>

                    {/* Event Context */}
                    {session.event && selectedEvent === 'all' && (
                      <div className="mb-2">
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {session.event.name}
                        </Badge>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {session.totalAttendees || 0}/{session.maxCapacity || 'Unlimited'} attendees
                      </div>
                      {session.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {session.location}
                        </div>
                      )}
                      <div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: session.maxCapacity 
                                ? `${Math.min(((session.totalAttendees || 0) / session.maxCapacity) * 100, 100)}%`
                                : '0%'
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {session.maxCapacity 
                            ? `${Math.round(((session.totalAttendees || 0) / session.maxCapacity) * 100)}% capacity`
                            : 'Unlimited capacity'
                          }
                        </p>
                      </div>
                    </div>

                    {session.description && (
                      <p className="text-gray-600 text-sm">{session.description}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {session.status === 'scheduled' && (
                      <Button
                        size="sm"
                        onClick={() => handleStartSession(session.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {session.status === 'active' && (
                      <Button
                        size="sm"
                        onClick={() => handleEndSession(session.id)}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        End
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingSession(session)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
