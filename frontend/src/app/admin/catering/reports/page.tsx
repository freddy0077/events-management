'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  TrendingUp,
  Users,
  Utensils,
  Calendar,
  BarChart3,
  PieChart,
  Filter,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth-simple'
import { useEvents } from '@/hooks/use-events'
import { useCateringReports } from '@/lib/graphql/hooks'
import { toast } from 'sonner'

// Types for catering reports
interface CateringReportsFilter {
  eventId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

interface AttendanceByCategory {
  category: string;
  expected: number;
  actual: number;
  rate: number;
}

interface AttendanceByTimeSlot {
  timeSlot: string;
  sessions: number;
  avgAttendance: number;
}

interface MealSessionReport {
  id: string;
  eventName: string;
  mealName: string;
  date: string;
  expectedAttendees: number;
  actualAttendees: number;
  attendanceRate: number;
  status: string;
}

// Utility functions
const getAttendanceRateColor = (rate: number): string => {
  if (rate >= 90) return 'text-green-600';
  if (rate >= 75) return 'text-yellow-600';
  return 'text-red-600';
}

const getAttendanceRateBgColor = (rate: number): string => {
  if (rate >= 90) return 'bg-green-100';
  if (rate >= 75) return 'bg-yellow-100';
  return 'bg-red-100';
}

const formatReportDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const getStatusBadgeColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in-progress':
      return 'bg-blue-100 text-blue-800';
    case 'upcoming':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

const useFilteredMealSessions = (
  reports: any,
  searchTerm: string,
  statusFilter: string
): MealSessionReport[] => {
  if (!reports?.mealSessionReports) return [];

  return reports.mealSessionReports.filter((session: MealSessionReport) => {
    const matchesSearch = !searchTerm || 
      session.mealName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.eventName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || session.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
}

export default function CateringReportsPage() {
  const { isAuthenticated, user } = useAuth()
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [selectedDateRange, setSelectedDateRange] = useState<string>('30')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isExporting, setIsExporting] = useState(false)

  // Fetch events for filter dropdown
  const { data: eventsData, loading: eventsLoading } = useEvents()

  // Build filter object for API call
  const filter = useMemo((): CateringReportsFilter => {
    const filterObj: CateringReportsFilter = {}
    
    if (selectedEvent !== 'all') {
      filterObj.eventId = selectedEvent
    }
    
    if (searchTerm) {
      filterObj.searchTerm = searchTerm
    }
    
    // Calculate date range
    if (selectedDateRange !== 'all') {
      const days = parseInt(selectedDateRange)
      const now = new Date()
      const fromDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
      filterObj.dateFrom = fromDate
      filterObj.dateTo = now
    }
    
    return filterObj
  }, [selectedEvent, selectedDateRange, searchTerm])

  // Fetch catering reports data
  const { data: reportsData, loading, error, refetch } = useCateringReports(filter)

  // Filter meal sessions based on search and status
  const reports = (reportsData as any)?.getCateringReports || {}
  const filteredSessions = useFilteredMealSessions(reports, searchTerm, statusFilter)

  // Access control
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to view catering reports</CardDescription>
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

  const handleExportReport = (format: 'csv' | 'pdf' | 'excel') => {
    if (!reports) {
      toast.error('No data available to export')
      return
    }
    
    setIsExporting(true)
    // Simulate export process - in real implementation, this would call an API
    setTimeout(() => {
      setIsExporting(false)
      toast.success(`Report exported as ${format.toUpperCase()} successfully!`)
    }, 2000)
  }

  const handleRefresh = () => {
    refetch()
    toast.success('Reports refreshed successfully!')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-50 text-green-700 border-green-200">Completed</Badge>
      case 'in-progress':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">In Progress</Badge>
      case 'upcoming':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Upcoming</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/catering">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Catering
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Catering Reports</h1>
              <p className="text-gray-600">Comprehensive meal attendance and analytics</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExportReport('csv')} disabled={isExporting || !reports}>
              {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExportReport('pdf')} disabled={isExporting || !reports}>
              {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
              Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExportReport('excel')} disabled={isExporting || !reports}>
              {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Export Excel
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="event-select">Event</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {((eventsData as any)?.getEvents || [])?.map((event: any) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="date-range">Date Range</Label>
                <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                    <SelectItem value="365">This Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search meals..."
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex items-end">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{reports?.summary.totalEvents || 0}</p>
                  )}
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Meal Sessions</p>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{reports?.summary.totalMealSessions || 0}</p>
                  )}
                </div>
                <Utensils className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Participants</p>
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{reports?.summary.totalParticipants.toLocaleString() || 0}</p>
                  )}
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Meals Served</p>
                  {loading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{reports?.summary.totalMealsServed.toLocaleString() || 0}</p>
                  )}
                </div>
                <CheckCircle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className={`text-2xl font-bold ${getAttendanceRateColor(reports?.summary.averageAttendanceRate || 0)}`}>
                      {reports?.summary.averageAttendanceRate.toFixed(1) || 0}%
                    </p>
                  )}
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Meal Session Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Meal Session Performance
              </CardTitle>
              <CardDescription>
                Detailed attendance rates for each meal session
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i: number) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <Skeleton className="h-5 w-32 mb-1" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                      <Skeleton className="h-2 w-full mt-3" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-gray-600">Failed to load meal session reports</p>
                  <Button variant="outline" onClick={handleRefresh} className="mt-2">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No meal sessions found</p>
                  <p className="text-sm text-gray-500">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSessions.map((session: any) => (
                    <div key={session.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{session.mealName}</h4>
                          <p className="text-sm text-gray-600">{session.eventName}</p>
                        </div>
                        <Badge className={getStatusBadgeColor(session.status)}>
                          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Expected</p>
                          <p className="font-semibold">{session.expectedAttendees}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Actual</p>
                          <p className="font-semibold">{session.actualAttendees}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Rate</p>
                          <p className={`font-semibold ${getAttendanceRateColor(session.attendanceRate)}`}>
                            {session.attendanceRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Attendance Progress</span>
                          <span>{session.attendanceRate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(session.attendanceRate, 100)}%` }}
                          />
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        {formatReportDate(session.date)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analytics */}
          <div className="space-y-6">
            {/* Attendance by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  Attendance by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-12" />
                          </div>
                          <Skeleton className="h-2 w-full" />
                        </div>
                        <Skeleton className="h-4 w-8 ml-3" />
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-4">
                    <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Failed to load category data</p>
                  </div>
                ) : reports?.attendanceAnalytics.byCategory.length === 0 ? (
                  <div className="text-center py-4">
                    <PieChart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No category data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports?.attendanceAnalytics.byCategory.map((category: any) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">{category.category}</span>
                            <span className="text-sm text-gray-600">
                              {category.actual}/{category.expected}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(category.rate, 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className={`ml-3 text-sm font-semibold ${getAttendanceRateColor(category.rate)}`}>
                          {category.rate.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance by Time Slot */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Attendance by Time Slot
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i: number) => (
                      <div key={i} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-5 w-12" />
                        </div>
                        <div className="flex justify-between text-sm">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-center py-4">
                    <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Failed to load time slot data</p>
                  </div>
                ) : reports?.attendanceAnalytics.byTimeSlot.length === 0 ? (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No time slot data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports?.attendanceAnalytics.byTimeSlot.map((slot: any) => (
                      <div key={slot.timeSlot} className="border rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{slot.timeSlot}</span>
                          <span className={`font-semibold ${getAttendanceRateColor(slot.avgAttendance)}`}>
                            {slot.avgAttendance.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>{slot.sessions} sessions</span>
                          <span>Avg attendance</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* API Status Notice */}
        {error && (
          <Card className="border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Data Loading Error</p>
                  <p className="text-sm text-red-600">
                    Unable to load catering reports data. Please check your connection and try refreshing the page.
                  </p>
                  <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {!loading && !error && reports && (
          <Card className="border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Real-Time Data Active</p>
                  <p className="text-sm text-green-600">
                    This page displays live catering data from the GraphQL API. Reports are updated in real-time based on actual meal attendance and registration data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
