'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  Search,
  Filter,
  Eye,
  Download,
  QrCode,
  Calendar,
  MapPin,
  User,
  Mail,
  Phone,
  CreditCard,
  Loader2,
  AlertCircle,
  Users,
  FileText
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { useMyAssignedEvents } from '@/lib/graphql/hooks'
import { format } from 'date-fns'

export default function OrganizerRegistrationsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const preselectedEventId = searchParams.get('eventId')
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<string>(preselectedEventId || 'all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Fetch assigned events (which contain registrations)
  const { data, loading, error } = useMyAssignedEvents()
  const events = (data as any)?.myAssignedEvents || []

  // Flatten all registrations from assigned events
  const allRegistrations = events.flatMap((event: any) => 
    (event.registrations || []).map((registration: any) => ({
      ...registration,
      eventName: event.name,
      eventId: event.id,
      eventDate: event.date,
      eventVenue: event.venue
    }))
  )

  // Filter registrations
  const filteredRegistrations = allRegistrations.filter((registration: any) => {
    const matchesSearch = 
      registration.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registration.eventName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesEvent = selectedEvent === 'all' || registration.eventId === selectedEvent
    const matchesStatus = statusFilter === 'all' || registration.status === statusFilter
    
    return matchesSearch && matchesEvent && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          <span className="text-gray-600">Loading registrations...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Registrations</h3>
          <p className="text-gray-600 mb-4">Unable to load registrations. Please try again.</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['Name', 'Email', 'Phone', 'Event', 'Status', 'Registration Date', 'Category']
    const csvContent = [
      headers.join(','),
      ...filteredRegistrations.map((reg: any) => [
        `"${reg.firstName} ${reg.lastName}"`,
        reg.email,
        reg.phone || '',
        `"${reg.eventName}"`,
        reg.status,
        format(new Date(reg.createdAt), 'yyyy-MM-dd'),
        reg.category?.name || ''
      ].join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `registrations-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Registrations</h1>
          <p className="text-gray-600 mt-1">
            All registrations from events you manage as an Event Organizer
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            {filteredRegistrations.length} Registration{filteredRegistrations.length !== 1 ? 's' : ''}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, email, or event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Event Filter */}
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map((event: any) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Registration Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{allRegistrations.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {allRegistrations.filter((r: any) => r.status === 'APPROVED').length}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <Users className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {allRegistrations.filter((r: any) => r.status === 'PENDING').length}
                </p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <Users className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Events</p>
                <p className="text-2xl font-bold text-purple-600">{events.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Registrations List */}
      {filteredRegistrations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || selectedEvent !== 'all' || statusFilter !== 'all' 
                ? 'No registrations found' 
                : 'No registrations yet'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedEvent !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters to find registrations.'
                : 'No participants have registered for your events yet.'
              }
            </p>
            {(searchTerm || selectedEvent !== 'all' || statusFilter !== 'all') && (
              <Button 
                onClick={() => {
                  setSearchTerm('')
                  setSelectedEvent('all')
                  setStatusFilter('all')
                }} 
                variant="outline"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRegistrations.map((registration: any) => (
            <Card key={registration.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {registration.firstName} {registration.lastName}
                      </h3>
                      <Badge className={getStatusColor(registration.status)}>
                        {registration.status}
                      </Badge>
                    </div>
                    
                    <div className="grid gap-2 md:grid-cols-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        {registration.email}
                      </div>
                      {registration.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          {registration.phone}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {registration.eventName}
                      </div>
                      {registration.eventVenue && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {registration.eventVenue}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/registrations/${registration.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    
                    {registration.status === 'APPROVED' && registration.qrCode && (
                      <Button variant="outline" size="sm">
                        <QrCode className="h-4 w-4 mr-1" />
                        QR Code
                      </Button>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Registration Details */}
                <div className="grid gap-4 md:grid-cols-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">Registration Date:</span>
                    <p className="text-gray-600">
                      {format(new Date(registration.createdAt), 'PPp')}
                    </p>
                  </div>
                  
                  {registration.category && (
                    <div>
                      <span className="font-medium text-gray-900">Category:</span>
                      <p className="text-gray-600">{registration.category.name}</p>
                    </div>
                  )}
                  
                  <div>
                    <span className="font-medium text-gray-900">Event Date:</span>
                    <p className="text-gray-600">
                      {format(new Date(registration.eventDate), 'PPP')}
                    </p>
                  </div>
                </div>

                {/* Payment Information */}
                {registration.transactions && registration.transactions.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CreditCard className="h-4 w-4 mr-2 text-gray-600" />
                      <span className="font-medium text-gray-900">Payment Information</span>
                    </div>
                    {registration.transactions.map((transaction: any, index: any) => (
                      <div key={index} className="text-sm text-gray-600">
                        <span className="font-medium">Amount:</span> ${transaction.amount} 
                        <span className="ml-4 font-medium">Status:</span> {transaction.status}
                        {transaction.receiptNumber && (
                          <span className="ml-4 font-medium">Receipt: {transaction.receiptNumber}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
