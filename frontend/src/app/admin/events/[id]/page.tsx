'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  Loader2, 
  Users, 
  MapPin, 
  Clock, 
  DollarSign,
  Download,
  QrCode,
  BarChart3,
  Settings,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  UserCheck,
  Utensils,
  FileText,
  Printer,
  RefreshCw,
  Crown,
  Mail,
  Phone
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { useEvent } from '@/lib/graphql/hooks'
import { toast } from 'sonner'

export default function AdminEventDetailPage() {
  const { isAuthenticated, user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [activeTab, setActiveTab] = useState('overview')
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [isPrintingBadges, setIsPrintingBadges] = useState(false)
  
  const { data: eventData, loading: eventLoading, error: eventError } = useEvent({ id: eventId })
  
  const event = eventData?.event
  const eventManagers = eventData?.eventManagers || []
  const isLoading = eventLoading

  // Handler for generating comprehensive event report
  const handleGenerateReport = async () => {
    if (!event) return

    setIsGeneratingReport(true)
    try {
      // Generate comprehensive report with all event data
      const reportData = {
        event: {
          name: event.name,
          date: event.date,
          venue: event.venue,
          address: event.address,
          totalRegistrations: event.totalRegistrations || 0,
          approvedRegistrations: event.approvedRegistrations || 0,
          paidRegistrations: event.paidRegistrations || 0,
          pendingRegistrations: event.pendingRegistrations || 0,
          failedRegistrations: event.failedRegistrations || 0,
        },
        categories: event.categories || [],
        meals: event.meals || [],
        staff: event.staff || [],
        eventManagers: eventManagers || [],
        generatedAt: new Date().toISOString(),
      }

      // Create CSV content
      const csvContent = generateEventReportCSV(reportData)
      
      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${event.name.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Event report generated successfully!')
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Failed to generate report. Please try again.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  // Handler for bulk badge printing
  const handlePrintBadges = async () => {
    if (!event || !event.totalRegistrations) {
      toast.error('No registrations found for this event')
      return
    }

    setIsPrintingBadges(true)
    try {
      // Navigate to bulk badge printing page
      router.push(`/admin/events/${event.id}/badges`)
      toast.success('Redirecting to badge printing interface...')
    } catch (error) {
      console.error('Error accessing badge printing:', error)
      toast.error('Failed to access badge printing. Please try again.')
    } finally {
      setIsPrintingBadges(false)
    }
  }

  // Helper function to generate CSV report
  const generateEventReportCSV = (data: any) => {
    const { event, categories, meals, staff, eventManagers } = data
    
    let csv = 'Event Report\n\n'
    csv += 'Event Information\n'
    csv += `Name,${event.name}\n`
    csv += `Date,${formatDate(event.date)}\n`
    csv += `Venue,${event.venue}\n`
    csv += `Address,${event.address || 'N/A'}\n`
    csv += `Total Registrations,${event.totalRegistrations}\n`
    csv += `Approved Registrations,${event.approvedRegistrations}\n`
    csv += `Paid Registrations,${event.paidRegistrations}\n`
    csv += `Pending Registrations,${event.pendingRegistrations}\n`
    csv += `Failed Registrations,${event.failedRegistrations}\n\n`

    if (categories.length > 0) {
      csv += 'Registration Categories\n'
      csv += 'Category Name,Price,Max Capacity,Description\n'
      categories.forEach((cat: any) => {
        csv += `${cat.name},${formatCurrency(cat.price)},${cat.maxCapacity || 'Unlimited'},${cat.description || 'N/A'}\n`
      })
      csv += '\n'
    }

    if (meals.length > 0) {
      csv += 'Meal Sessions\n'
      csv += 'Session Name,Start Time,End Time,Max Capacity,Description\n'
      meals.forEach((meal: any) => {
        const startTime = meal.startTime ? new Date(meal.startTime).toLocaleTimeString() : 'N/A'
        const endTime = meal.endTime ? new Date(meal.endTime).toLocaleTimeString() : 'N/A'
        csv += `${meal.sessionName},${startTime},${endTime},${meal.maxCapacity || 'Unlimited'},${meal.description || 'N/A'}\n`
      })
      csv += '\n'
    }

    if (eventManagers.length > 0) {
      csv += 'Assigned Event Organizers\n'
      csv += 'Name,Email,System Role,Event Role,Status,Assigned Date,User ID\n'
      eventManagers.forEach((organizer: any) => {
        const assignedDate = organizer.assignedAt ? formatDate(organizer.assignedAt) : 'N/A'
        csv += `${organizer.user.firstName} ${organizer.user.lastName},${organizer.user.email},${organizer.user.role},${organizer.role},${organizer.isActive ? 'Active' : 'Inactive'},${assignedDate},${organizer.user.id}\n`
      })
      csv += '\n'
    }

    if (staff.length > 0) {
      csv += 'Other Event Staff\n'
      csv += 'Name,Email,System Role,Event Role,Status,Assigned Date\n'
      staff.forEach((staffMember: any) => {
        const assignedDate = staffMember.assignedAt ? formatDate(staffMember.assignedAt) : 'N/A'
        csv += `${staffMember.user.firstName} ${staffMember.user.lastName},${staffMember.user.email},${staffMember.user.role},${staffMember.role},${staffMember.isActive ? 'Active' : 'Inactive'},${assignedDate}\n`
      })
      csv += '\n'
    }

    csv += `Report Generated,${new Date().toLocaleString()}\n`
    return csv
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to view event details</CardDescription>
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-primary-50 to-neutral-50 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-soft">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto mb-3" />
              <span className="text-sm text-neutral-500">Loading event details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (eventError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-primary-50 to-neutral-50 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-soft">
          <CardHeader className="text-center">
            <CardTitle>Error Loading Event</CardTitle>
            <CardDescription>There was an error loading the event details. Please try again.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/admin/events">Back to Events</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-primary-50 to-neutral-50 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-soft">
          <CardHeader className="text-center">
            <CardTitle>Event Not Found</CardTitle>
            <CardDescription>The event you're looking for doesn't exist or has been removed.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/admin/events">Back to Events</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-primary-50 to-neutral-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="hover:bg-brand-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-2 mb-2">
                <Calendar className="h-4 w-4 text-brand-600" />
                <span className="text-sm font-medium text-brand-700">Event Details</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">
                {event.name}
              </h1>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              className="border-2 border-neutral-200 hover:border-brand-300 hover:bg-brand-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button asChild className="bg-gradient-to-r from-brand-600 to-primary-600 hover:from-brand-700 hover:to-primary-700 text-white">
              <Link href={`/admin/events/${event.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Event
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft hover:shadow-medium transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-neutral-700">Total Registrations</CardTitle>
              <Users className="h-5 w-5 text-primary-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-neutral-900 mb-2">{event.totalRegistrations || 0}</div>
              <div className="text-sm text-neutral-600">
                of {event.maxCapacity || 0} capacity ({event.maxCapacity ? Math.round(((event.totalRegistrations || 0) / event.maxCapacity) * 100) : 0}%)
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft hover:shadow-medium transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-neutral-700">Approved</CardTitle>
              <CheckCircle className="h-5 w-5 text-success-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success-700 mb-2">{event.approvedRegistrations || 0}</div>
              <div className="text-sm text-neutral-600">
                {event.totalRegistrations ? Math.round(((event.approvedRegistrations || 0) / event.totalRegistrations) * 100) : 0}% approval rate
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft hover:shadow-medium transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-neutral-700">Payment Status</CardTitle>
              <DollarSign className="h-5 w-5 text-success-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success-700 mb-2">{event.paidRegistrations || 0}</div>
              <div className="text-sm text-neutral-600">
                Paid registrations
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft hover:shadow-medium transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-neutral-700">Status</CardTitle>
              <Settings className="h-5 w-5 text-brand-600" />
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <Badge className={event.isActive ? 'bg-success-50 text-success-700 border-success-200' : 'bg-neutral-50 text-neutral-700 border-neutral-200'}>
                  {event.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="text-sm text-neutral-600">
                {event.paymentRequired ? 'Payment Required' : 'Free Event'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Event Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Details */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-brand-600" />
                  Event Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-neutral-500" />
                      <div>
                        <div className="font-medium text-neutral-900">Date & Time</div>
                        <div className="text-sm text-neutral-600">{formatDate(event.date)}</div>
                        {event.endDate && (
                          <div className="text-sm text-neutral-600">Ends: {formatDate(event.endDate)}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-neutral-500" />
                      <div>
                        <div className="font-medium text-neutral-900">Venue</div>
                        <div className="text-sm text-neutral-600">{event.venue}</div>
                        {event.address && (
                          <div className="text-sm text-neutral-600">{event.address}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-neutral-500" />
                      <div>
                        <div className="font-medium text-neutral-900">Capacity</div>
                        <div className="text-sm text-neutral-600">{event.maxCapacity} attendees</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-neutral-500" />
                      <div>
                        <div className="font-medium text-neutral-900">Payment</div>
                        <div className="text-sm text-neutral-600">
                          {event.paymentRequired ? 'Required' : 'Free Event'}
                        </div>
                        {event.depositAllowed && (
                          <div className="text-sm text-neutral-600">
                            {event.depositPercentage}% deposit allowed
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {event.description && (
                  <div className="pt-4 border-t border-neutral-200">
                    <div className="font-medium text-neutral-900 mb-2">Description</div>
                    <p className="text-sm text-neutral-600">{event.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Categories */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary-600" />
                  Registration Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {event.categories && event.categories.length > 0 ? (
                    event.categories.map((category, index) => (
                      <div key={category.id} className={`p-4 rounded-lg border-2 border-neutral-100 hover:border-primary-200 transition-colors animate-fade-in`} style={{animationDelay: `${index * 100}ms`}}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-neutral-900">{category.name}</h4>
                          <div className="text-lg font-bold text-success-700">{formatCurrency(category.price)}</div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-neutral-600">
                          <span>Max capacity: {category.maxCapacity || 'Unlimited'}</span>
                          <span>Price: {formatCurrency(category.price)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      <p>No registration categories configured for this event.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Assigned Event Organizers */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-orange-600" />
                  Assigned Event Organizers
                </CardTitle>
                <CardDescription>
                  EVENT_ORGANIZER users assigned to manage this event
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {eventManagers && eventManagers.length > 0 ? (
                    eventManagers.map((organizer, index) => (
                      <div key={organizer.id} className={`p-4 rounded-lg border-2 border-orange-100 bg-orange-50/50 hover:border-orange-200 transition-colors animate-fade-in`} style={{animationDelay: `${index * 100}ms`}}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <UserCheck className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-neutral-900">
                                {organizer.user.firstName} {organizer.user.lastName}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                                  EVENT_ORGANIZER
                                </Badge>
                                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                                  {organizer.role}
                                </Badge>
                                <Badge className={organizer.isActive ? 'bg-green-100 text-green-700 border-green-200 text-xs' : 'bg-gray-100 text-gray-700 border-gray-200 text-xs'}>
                                  {organizer.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm text-neutral-600">
                            Assigned: {formatDate(organizer.assignedAt)}
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-neutral-600">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{organizer.user.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-600">
                            <UserCheck className="h-4 w-4" />
                            <span>User ID: {organizer.user.id}</span>
                          </div>
                        </div>

                        {organizer.permissions && (
                          <div className="mt-3 pt-3 border-t border-orange-200">
                            <div className="text-sm font-medium text-neutral-700 mb-2">Permissions:</div>
                            <div className="text-xs text-neutral-600">
                              {JSON.stringify(organizer.permissions)}
                            </div>
                          </div>
                        )}

                        <div className="mt-2 text-xs text-neutral-500">
                          Member since: {formatDate((organizer.user as any).createdAt || organizer.user.email)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-neutral-500">
                      <Crown className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                      <p className="font-medium">No Event Organizers Assigned</p>
                      <p className="text-sm mt-1">This event doesn't have any EVENT_ORGANIZER users assigned to manage it.</p>
                      <Button asChild variant="outline" className="mt-4 border-orange-200 text-orange-700 hover:bg-orange-50">
                        <Link href={`/admin/events/${event.id}/edit`}>
                          Assign Organizers
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Other Event Staff */}
            {event.staff && event.staff.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Other Event Staff
                  </CardTitle>
                  <CardDescription>
                    Additional staff members assigned to this event
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {event.staff.map((staffMember, index) => (
                      <div key={staffMember.id} className={`p-3 rounded-lg border border-blue-100 bg-blue-50/30 hover:border-blue-200 transition-colors animate-fade-in`} style={{animationDelay: `${index * 100}ms`}}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <h5 className="font-medium text-neutral-900 text-sm">
                                {staffMember.user.firstName} {staffMember.user.lastName}
                              </h5>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                                  {staffMember.role}
                                </Badge>
                                <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
                                  {staffMember.user.role}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-neutral-500">
                            {formatDate(staffMember.assignedAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Meals */}
            {event.meals && event.meals.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-warning-600" />
                    Meal Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {event.meals.map((meal, index) => (
                      <div key={meal.id} className={`flex items-center justify-between p-3 rounded-lg bg-neutral-50 animate-fade-in`} style={{animationDelay: `${index * 100}ms`}}>
                        <div>
                          <div className="font-medium text-neutral-900">{meal.sessionName}</div>
                          <div className="text-sm text-neutral-600">
                            {meal.startTime ? new Date(meal.startTime).toLocaleTimeString() : 'Time TBD'}
                            {meal.endTime && ` - ${new Date(meal.endTime).toLocaleTimeString()}`}
                          </div>
                          {meal.description && (
                            <div className="text-sm text-neutral-500 mt-1">{meal.description}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-neutral-600">
                            {meal.maxCapacity ? `Max: ${meal.maxCapacity}` : 'No limit'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href={`/admin/events/${event.id}/registrations`}>
                    <Users className="h-4 w-4 mr-2" />
                    View Registrations
                  </Link>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <Link href={`/admin/scanner?eventId=${event.id}`}>
                    <QrCode className="h-4 w-4 mr-2" />
                    QR Scanner
                  </Link>
                </Button>
                <Button 
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                  className="w-full justify-start" 
                  variant="outline"
                >
                  {isGeneratingReport ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  {isGeneratingReport ? 'Generating...' : 'Generate Report'}
                </Button>
                <Button 
                  onClick={handlePrintBadges}
                  disabled={isPrintingBadges || !event.totalRegistrations}
                  className="w-full justify-start" 
                  variant="outline"
                >
                  {isPrintingBadges ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Printer className="h-4 w-4 mr-2" />
                  )}
                  {isPrintingBadges ? 'Preparing...' : 'Print Badges'}
                </Button>
              </CardContent>
            </Card>

            {/* Recent Registrations */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Recent Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {event.registrations && event.registrations.length > 0 ? (
                    event.registrations.slice(0, 5).map((registration: any, index: number) => (
                      <div key={registration.id} className={`p-3 rounded-lg border border-neutral-200 animate-fade-in`} style={{animationDelay: `${index * 100}ms`}}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-neutral-900">
                            {registration.firstName} {registration.lastName}
                          </div>
                          <Badge className={registration.paymentStatus === 'APPROVED' ? 'bg-success-50 text-success-700 border-success-200' : 'bg-warning-50 text-warning-700 border-warning-200'}>
                            {registration.paymentStatus}
                          </Badge>
                        </div>
                        <div className="text-sm text-neutral-600">{registration.email}</div>
                        <div className="text-sm text-neutral-600">{registration.category?.name || registration.category}</div>
                        <div className="text-xs text-neutral-500 mt-1">{formatDate(registration.createdAt)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-neutral-500">
                      <p>No recent registrations</p>
                    </div>
                  )}
                </div>
                <Button asChild variant="outline" className="w-full mt-4">
                  <Link href={`/admin/registrations?eventId=${event.id}`}>
                    View All Registrations
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Event Status */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Event Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Registration Status</span>
                  <Badge className={event.isActive ? 'bg-success-50 text-success-700 border-success-200' : 'bg-neutral-50 text-neutral-700 border-neutral-200'}>
                    {event.isActive ? 'Open' : 'Closed'}
                  </Badge>
                </div>
                {event.registrationDeadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Registration Deadline</span>
                    <span className="text-sm font-medium text-neutral-900">{formatDate(event.registrationDeadline)}</span>
                  </div>
                )}
                {event.paymentDeadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Payment Deadline</span>
                    <span className="text-sm font-medium text-neutral-900">{formatDate(event.paymentDeadline)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Created</span>
                  <span className="text-sm font-medium text-neutral-900">{formatDate(event.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Last Updated</span>
                  <span className="text-sm font-medium text-neutral-900">{formatDate(event.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
