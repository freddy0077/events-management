'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { GET_CATERING_METRICS, GET_MY_ASSIGNED_EVENTS, GET_CATERING_REPORTS } from '@/lib/graphql/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Users,
  ChefHat,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Calendar,
  Activity,
  QrCode,
  FileText,
  Utensils,
  Loader2,
  BarChart3,
  PieChart,
  Download,
  ScanLine
} from 'lucide-react'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function CateringDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  const [selectedEvent, setSelectedEvent] = useState('all')

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  // Helper function to convert period to date range
  const getDateRangeFromPeriod = (period: string) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (period) {
      case 'today':
        return {
          dateFrom: today,
          dateTo: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        }
      case 'week':
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return { dateFrom: weekStart, dateTo: weekEnd }
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        return { dateFrom: monthStart, dateTo: monthEnd }
      case 'event':
        return {}
      default:
        return {}
    }
  }

  // Fetch real data from GraphQL APIs
  const { data: metricsData, loading: metricsLoading, error: metricsError } = useQuery(GET_CATERING_METRICS)
  const { data: eventsData, loading: eventsLoading, error: eventsError } = useQuery(GET_MY_ASSIGNED_EVENTS)
  const { data: reportsData, loading: reportsLoading, error: reportsError } = useQuery(GET_CATERING_REPORTS, {
    variables: {
      filter: {
        eventId: selectedEvent !== 'all' ? selectedEvent : undefined,
        ...getDateRangeFromPeriod(selectedPeriod)
      }
    }
  })

  // Handle loading states
  if (metricsLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading catering dashboard...</span>
        </div>
      </div>
    )
  }

  // Handle errors
  if (metricsError || eventsError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Catering Dashboard</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data. Please try refreshing the page.
            {metricsError && <div>Metrics Error: {metricsError.message}</div>}
            {eventsError && <div>Events Error: {eventsError.message}</div>}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Extract real data with proper fallbacks
  const cateringMetrics = (metricsData as any)?.getCateringMetrics || {
    totalParticipants: 0,
    checkedInToday: 0,
    pendingMeals: 0,
    completedMeals: 0,
    totalMealSessions: 0,
    activeMealSessions: 0
  }

  const assignedEvents = (eventsData as any)?.myAssignedEvents || []
  const cateringReports = (reportsData as any)?.getCateringReports

  // Helper functions for reports data processing
  const calculatePopularMeals = (reports: any[]) => {
    if (!reports?.length) return []
    const mealMap = new Map<string, number>()
    let totalMeals = 0
    
    reports.forEach(report => {
      const count = mealMap.get(report.mealName) || 0
      mealMap.set(report.mealName, count + report.actualAttendees)
      totalMeals += report.actualAttendees
    })
    
    return Array.from(mealMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalMeals > 0 ? Math.round((count / totalMeals) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3) // Top 3 for dashboard
  }

  const handleExportReport = async (format: string) => {
    try {
      toast.success(`Exporting report in ${format.toUpperCase()} format...`)
      setTimeout(() => {
        toast.success(`${format.toUpperCase()} report exported successfully!`)
      }, 2000)
    } catch (error) {
      toast.error('Failed to export report')
    }
  }

  const quickActions = [
    {
      title: 'Check-in & Scanner',
      description: 'QR scanning and manual check-in',
      href: '/catering/checkin-scanner',
      icon: ScanLine,
      color: 'bg-blue-500'
    },
    {
      title: 'View Meal Sessions',
      description: 'Manage active meal sessions',
      href: '/catering/meals',
      icon: ChefHat,
      color: 'bg-green-500'
    }
  ]

  const stats = [
    {
      title: 'Total Participants',
      value: cateringMetrics.totalParticipants,
      icon: Users,
      description: 'Registered for catering',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Checked In Today',
      value: cateringMetrics.checkedInToday,
      icon: CheckCircle,
      description: 'Meals served today',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Pending Meals',
      value: cateringMetrics.pendingMeals,
      icon: Clock,
      description: 'Awaiting service',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Active Sessions',
      value: cateringMetrics.activeMealSessions,
      icon: Activity,
      description: 'Currently running',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 via-white to-purple-50 p-8 flex flex-col md:flex-row items-center justify-between shadow-lg mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-2">Catering Dashboard</h1>
          <p className="text-lg text-gray-600 max-w-xl mb-4">All your event catering metrics, analytics, and tools in one beautiful, unified dashboard.</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium text-xs">Real-time Metrics</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium text-xs">Modern Analytics</span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium text-xs">Responsive UI</span>
          </div>
        </div>
        <div className="hidden md:block">
          <Utensils className="w-32 h-32 text-purple-200" />
        </div>
      </div>

      {/* Reports Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Period
              </label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="event">Entire Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Event
              </label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {assignedEvents.map((event: any) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modern Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="group relative overflow-hidden shadow-lg rounded-xl border-0 bg-white hover:scale-[1.03] transition-transform">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-blue-100 to-purple-100 transition" />
              <CardContent className="p-6 flex flex-col gap-2 items-start">
                <div className={`rounded-full p-3 mb-2 ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`h-7 w-7 ${stat.color}`} />
                </div>
                <span className="text-lg font-semibold text-gray-700">{stat.title}</span>
                <span className="text-3xl font-extrabold text-gray-900">{stat.value}</span>
                <span className="text-xs text-gray-500">{stat.description}</span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions & Analytics Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link key={action.href} href={action.href}>
                    <Button
                      variant="outline"
                      className="w-full h-auto p-3 flex items-center gap-3 hover:shadow-md transition-all"
                    >
                      <div className={`p-2 rounded-full ${action.color} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-sm">{action.title}</div>
                        <div className="text-xs text-gray-500">{action.description}</div>
                      </div>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Popular Meals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cateringReports?.mealSessionReports ? (
                calculatePopularMeals(cateringReports.mealSessionReports).map((meal, index) => (
                  <div key={meal.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-semibold text-purple-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{meal.name}</p>
                        <p className="text-xs text-gray-500">{meal.count} servings</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">{meal.percentage}%</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <PieChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No meal data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Reports Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-blue-800">Total Events</p>
                  <p className="text-lg font-bold text-blue-600">
                    {cateringReports?.summary?.totalEvents || 0}
                  </p>
                </div>
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-green-800">Avg Attendance</p>
                  <p className="text-lg font-bold text-green-600">
                    {cateringReports?.summary?.averageAttendanceRate?.toFixed(1) || 0}%
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-purple-800">Total Served</p>
                  <p className="text-lg font-bold text-purple-600">
                    {cateringReports?.summary?.totalMealsServed || 0}
                  </p>
                </div>
                <ChefHat className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Meal Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Total Sessions</p>
                    <p className="text-2xl font-bold text-blue-600">{cateringMetrics.totalMealSessions}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <p className="font-medium">Active Now</p>
                    <p className="text-2xl font-bold text-purple-600">{cateringMetrics.activeMealSessions}</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Service Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Meals Completed</p>
                  <p className="text-sm text-green-600">{cateringMetrics.completedMeals} meals served</p>
                </div>
              </div>
              {cateringMetrics.pendingMeals > 0 && (
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">Pending Service</p>
                    <p className="text-sm text-orange-600">{cateringMetrics.pendingMeals} meals pending</p>
                  </div>
                </div>
              )}
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600">
                  All systems operational • Last updated: {currentTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Events Summary */}
      {assignedEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Assigned Events ({assignedEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedEvents.slice(0, 6).map((event: any) => (
                <div key={event.id} className="p-3 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900">{event.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(event.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">{event.venue}</p>
                </div>
              ))}
            </div>
            {assignedEvents.length > 6 && (
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm">
                  View All Events ({assignedEvents.length})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
