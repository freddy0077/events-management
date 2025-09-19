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
import { formatDate, formatTime } from '@/lib/utils'
import { 
  QrCode, 
  Users, 
  UtensilsCrossed,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  Calendar,
  MapPin,
  Scan,
  UserCheck,
  Coffee,
  Utensils,
  Cookie,
  Loader2,
  Activity,
  Target,
  Zap,
  FileText,
  Download,
  Eye
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { useCateringMetrics, useCateringRegistrations, useMealSessions, useServeMeal, useEvents } from '@/lib/graphql/hooks'
import { toast } from 'sonner'

export default function CateringTeamDashboard() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [eventFilter, setEventFilter] = useState('all')
  const [mealFilter, setMealFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // GraphQL queries for catering data
  const { data: metricsData, loading: metricsLoading, error: metricsError } = useCateringMetrics(eventFilter !== 'all' ? eventFilter : undefined)
  const { data: registrationsData, loading: registrationsLoading, error: registrationsError } = useCateringRegistrations(
    eventFilter !== 'all' ? eventFilter : undefined,
    mealFilter !== 'all' ? mealFilter : undefined,
    statusFilter !== 'all' ? statusFilter : undefined
  )
  const { data: mealSessionsData, loading: mealSessionsLoading } = useMealSessions(eventFilter !== 'all' ? eventFilter : undefined)
  const { data: eventsData, loading: eventsLoading } = useEvents({ limit: 20 })
  const [serveMeal] = useServeMeal()

  // Get catering metrics from API with proper fallback
  const cateringMetrics = (metricsData as any)?.getCateringMetrics || {
    totalParticipants: 0,
    checkedInToday: 0,
    pendingMeals: 0,
    completedMeals: 0,
    totalMealSessions: 0,
    activeMealSessions: 0
  }

  // Get meal sessions from API
  const mealSessions = (mealSessionsData as any)?.getMealSessions || []

  // Filter participants for meal service
  const filteredParticipants = useMemo(() => {
    const registrations = (registrationsData as any)?.getCateringRegistrations || []
    if (!registrations.length) return []
    
    return registrations.filter((registration: any) => {
      const matchesSearch = 
        registration.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.email?.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSearch
    })
  }, [registrationsData, searchTerm])

  // Handle serve meal action
  const handleServeMeal = async (registrationId: string, mealId: string) => {
    try {
      const result = await serveMeal({
        variables: {
          input: {
            registrationId,
            mealId,
            notes: 'Manual meal service'
          }
        }
      })

      if ((result.data as any)?.serveMeal?.success) {
        toast.success((result.data as any).serveMeal.message)
      } else {
        toast.error((result.data as any)?.serveMeal?.message || 'Failed to serve meal')
      }
    } catch (error) {
      console.error('Error serving meal:', error)
      toast.error('Failed to serve meal')
    }
  }

  if (metricsLoading || registrationsLoading || eventsLoading || mealSessionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-purple-700">Loading catering dashboard...</p>
        </div>
      </div>
    )
  }

  if (metricsError || registrationsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <p className="text-red-700">Error loading catering data. Please try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Catering Team Portal</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.firstName}! Verify meal eligibility and manage food service operations.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link href="/admin/catering/scanner">
                <QrCode className="h-4 w-4 mr-2" />
                QR Scanner
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/catering/reports">
                <Download className="h-4 w-4 mr-2" />
                Meal Reports
              </Link>
            </Button>
          </div>
        </div>

        {/* Catering Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Participants</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{cateringMetrics.totalParticipants}</div>
              <p className="text-xs text-gray-500 mt-1">Registered for meals</p>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Checked In Today</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{cateringMetrics.checkedInToday}</div>
              <p className="text-xs text-gray-500 mt-1">Present for meals</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Meals</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{cateringMetrics.pendingMeals}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting service</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Meals Served</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{cateringMetrics.completedMeals}</div>
              <p className="text-xs text-gray-500 mt-1">Successfully served</p>
            </CardContent>
          </Card>
        </div>

        {/* Meal Service Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {mealSessions.map((meal: any, index: number) => {
            const icons = [Coffee, Utensils, Cookie]
            const colors = ['green', 'blue', 'orange']
            const Icon = icons[index % icons.length]
            const color = colors[index % colors.length]
            
            const attendanceRate = meal.maxCapacity ? (meal.totalAttendees / meal.maxCapacity) * 100 : 0
            
            return (
              <Card key={meal.id} className={`border-${color}-200`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 text-${color}-700`}>
                    <Icon className="h-5 w-5" />
                    {meal.sessionName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Served:</span>
                      <span className="font-semibold">
                        {meal.totalAttendees || 0}{meal.maxCapacity ? `/${meal.maxCapacity}` : ''}
                      </span>
                    </div>
                    {meal.maxCapacity && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`bg-${color}-600 h-2 rounded-full`} 
                          style={{width: `${Math.min(attendanceRate, 100)}%`}}
                        ></div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">{meal.sessionTime}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          
          {mealSessions.length === 0 && (
            <Card className="border-gray-200 col-span-3">
              <CardContent className="text-center py-8">
                <UtensilsCrossed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No meal sessions configured for this event</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Participant Meal Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5 text-purple-600" />
                  Participant Meal Service
                </CardTitle>
                <CardDescription>
                  Verify eligibility and track meal service for participants
                </CardDescription>
              </div>
              <div className="flex gap-2 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search participants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger className="w-32">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {eventsData?.events?.map(event => event && event.id ? (
                      <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                    ) : null)}
                  </SelectContent>
                </Select>
                <Select value={mealFilter} onValueChange={setMealFilter}>
                  <SelectTrigger className="w-32">
                    <UtensilsCrossed className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Meals</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="served">Served</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredParticipants.length === 0 ? (
              <div className="text-center py-12">
                <UtensilsCrossed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No participants found</h3>
                <p className="text-gray-500">
                  {searchTerm || eventFilter !== 'all' || mealFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'No participants registered for meal service'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredParticipants.map((registration: any) => (
                  <div key={registration.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {registration.fullName}
                          </h3>
                          <Badge 
                            variant="secondary"
                            className={registration.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                          >
                            {registration.paymentStatus || 'PENDING'}
                          </Badge>
                          <Badge 
                            variant="secondary"
                            className={
                              registration.mealAttendances?.length > 0 ? 'bg-blue-100 text-blue-800' : 
                              registration.paymentStatus === 'PAID' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {registration.mealAttendances?.length > 0 ? 'Meal Served' : 'Pending Meal'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {registration.event.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(registration.event.date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <QrCode className="h-4 w-4" />
                            QR: {registration.qrCode?.slice(-8) || 'N/A'}
                          </div>
                          {registration.mealAttendances?.length > 0 && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              Meals: {registration.mealAttendances.length}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/registrations/${registration.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </Button>
                        {registration.mealAttendances?.length === 0 && registration.paymentStatus === 'PAID' && mealSessions.length > 0 && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleServeMeal(registration.id, mealSessions[0].id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Serve Meal
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="text-purple-600 border-purple-200 hover:bg-purple-50">
                          <QrCode className="h-4 w-4 mr-1" />
                          Scan QR
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
              <Zap className="h-5 w-5 text-purple-600" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common catering and meal service tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col border-purple-200 hover:border-purple-300 hover:bg-purple-50" asChild>
                <Link href="/admin/catering/scanner">
                  <QrCode className="h-6 w-6 mb-2 text-purple-600" />
                  <span className="text-purple-700">QR Scanner</span>
                </Link>
              </Button>

              <Button variant="outline" className="h-20 flex-col border-green-200 hover:border-green-300 hover:bg-green-50" asChild>
                <Link href="/admin/catering/pending">
                  <Clock className="h-6 w-6 mb-2 text-green-600" />
                  <span className="text-green-700">Pending Meals</span>
                </Link>
              </Button>

              <Button variant="outline" className="h-20 flex-col border-blue-200 hover:border-blue-300 hover:bg-blue-50" asChild>
                <Link href="/admin/catering/served">
                  <CheckCircle className="h-6 w-6 mb-2 text-blue-600" />
                  <span className="text-blue-700">Served Meals</span>
                </Link>
              </Button>

              <Button variant="outline" className="h-20 flex-col border-orange-200 hover:border-orange-300 hover:bg-orange-50" asChild>
                <Link href="/admin/catering/reports">
                  <Download className="h-6 w-6 mb-2 text-orange-600" />
                  <span className="text-orange-700">Meal Reports</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
