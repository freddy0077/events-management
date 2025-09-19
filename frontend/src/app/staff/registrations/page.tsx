'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useMyAssignedEvents, useMyEventRegistrations } from '@/lib/graphql/hooks'
import { formatGHS, getRegistrationAmount } from '@/lib/utils/currency'
import { toast } from 'sonner'
import { 
  Users, 
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  CreditCard,
  QrCode,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Download,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

export default function StaffRegistrationsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterEvent, setFilterEvent] = useState('all')
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Fetch assigned events
  const { data: eventsData, loading: eventsLoading, error: eventsError } = useMyAssignedEvents()
  const assignedEvents = (eventsData as any)?.myAssignedEvents || []
  
  // Get event IDs for fetching registrations
  const eventIds = assignedEvents.map((event: any) => event.id)
  
  // Fetch registrations for assigned events
  const { data: registrationsData, loading: registrationsLoading, error: registrationsError } = useMyEventRegistrations(eventIds)
  const allRegistrations = (registrationsData as any)?.registrations || []

  // Transform registrations data for display
  const registrations = allRegistrations.map((reg: any) => ({
    id: reg.id,
    participantName: reg.fullName || `${reg.firstName} ${reg.lastName}`,
    email: reg.email,
    phone: reg.phone || 'Not provided',
    eventName: reg.event?.name || 'Unknown Event',
    eventDate: reg.event?.date || '',
    category: reg.category?.name || 'General',
    categoryPrice: reg.category?.price || 0,
    paymentStatus: reg.paymentStatus || 'PENDING',
    paymentMethod: reg.transactions?.[0]?.paymentMethod || 'CASH',
    registeredAt: reg.createdAt,
    checkedIn: reg.checkedIn || false,
    qrCode: reg.qrCode || '',
    receiptNumber: reg.transactions?.[0]?.receiptNumber || '',
    specialRequests: null // This field is not in the GraphQL query
  }))
  
  const events = assignedEvents.map((event: any) => event.name)

  const filteredRegistrations = registrations.filter((registration: any) => {
    const matchesSearch = registration.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         registration.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         registration.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || registration.paymentStatus === filterStatus
    const matchesEvent = filterEvent === 'all' || registration.eventName === filterEvent
    return matchesSearch && matchesStatus && matchesEvent
  })
  
  // Loading state
  if (eventsLoading || registrationsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Participant Registrations</h1>
            <p className="text-gray-600 mt-2">Loading registration data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i: number) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  
  // Error state
  if (eventsError || registrationsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Participant Registrations</h1>
          <p className="text-red-600 mt-2">
            Error loading data: {eventsError?.message || registrationsError?.message}
          </p>
          <p className="text-gray-600 mt-2">
            Please try refreshing the page or contact support if the problem persists.
          </p>
        </div>
      </div>
    )
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'PARTIAL':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="h-4 w-4" />
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'FAILED':
        return <XCircle className="h-4 w-4" />
      case 'PARTIAL':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const stats = {
    total: registrations.length,
    paid: registrations.filter((r: any) => r.paymentStatus === 'PAID').length,
    pending: registrations.filter((r: any) => r.paymentStatus === 'PENDING' || r.paymentStatus === 'PARTIAL').length,
    failed: registrations.filter((r: any) => r.paymentStatus === 'FAILED').length,
    checkedIn: registrations.filter((r: any) => r.checkedIn).length
  }

  // Button functionality implementations
  const handleViewDetails = (registration: any) => {
    setSelectedRegistration(registration)
    setShowDetailsDialog(true)
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      // Create CSV data
      const csvHeaders = [
        'Registration ID',
        'Participant Name',
        'Email',
        'Phone',
        'Event Name',
        'Event Date',
        'Category',
        'Category Price',
        'Payment Status',
        'Payment Method',
        'Receipt Number',
        'Checked In',
        'Registered At'
      ]

      const csvData = filteredRegistrations.map((reg: any) => [
        reg.id,
        reg.participantName,
        reg.email,
        reg.phone,
        reg.eventName,
        new Date(reg.eventDate).toLocaleDateString(),
        reg.category,
        formatGHS(reg.categoryPrice),
        reg.paymentStatus,
        reg.paymentMethod,
        reg.receiptNumber,
        reg.checkedIn ? 'Yes' : 'No',
        formatDate(reg.registeredAt)
      ])

      // Convert to CSV string
      const csvContent = [
        csvHeaders.join(','),
        ...csvData.map((row: any) => row.map((cell: any) => `"${cell}"`).join(','))
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `staff-registrations-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`Exported ${filteredRegistrations.length} registrations to CSV`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const handleGenerateBadge = (registration: any) => {
    // Navigate to badge generation with registration context
    window.open(`/staff/badges?registrationId=${registration.id}`, '_blank')
    toast.info('Opening badge generation page...')
  }

  const handleProcessPayment = (registration: any) => {
    // Navigate to payment processing with registration context
    window.open(`/staff/payments?registrationId=${registration.id}`, '_blank')
    toast.info('Opening payment processing page...')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Participant Registrations</h1>
          <p className="text-gray-600 mt-2">
            Manage participant registrations and payments
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link href="/staff/registrations/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Registration
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-gray-900">{stats.paid}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Checked In</p>
                <p className="text-2xl font-bold text-gray-900">{stats.checkedIn}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name, email, or receipt number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Events</option>
            {events.map((event: any) => (
              <option key={event} value={event}>{event}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="PARTIAL">Partial</option>
          </select>

          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportData}
            disabled={isExporting || filteredRegistrations.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registrations ({filteredRegistrations.length})</CardTitle>
          <CardDescription>
            Participant registration details and payment status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRegistrations.map((registration: any) => (
              <div key={registration.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Participant Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 rounded-full p-2">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{registration.participantName}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {registration.email}
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {registration.phone}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{registration.eventName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{new Date(registration.eventDate).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-2">
                      <Badge variant="outline">{registration.category}</Badge>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getPaymentStatusIcon(registration.paymentStatus)}
                      <Badge className={getPaymentStatusColor(registration.paymentStatus)}>
                        {registration.paymentStatus}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <div>{formatGHS(getRegistrationAmount(registration))} • {registration.paymentMethod}</div>
                      <div>Receipt: {registration.receiptNumber}</div>
                    </div>
                    {registration.checkedIn && (
                      <Badge className="bg-purple-100 text-purple-800 mt-2">
                        Checked In
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(registration)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Link href={`/staff/registrations/new?edit=${registration.id}`}>
                      <Button variant="outline" size="sm" title="Edit Registration">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    {registration.paymentStatus === 'PENDING' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        title="Process Payment"
                        onClick={() => handleProcessPayment(registration)}
                      >
                        <CreditCard className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      title="Generate Badge/QR Code"
                      onClick={() => handleGenerateBadge(registration)}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Special Requests */}
                {registration.specialRequests && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Special Requests: </span>
                      <span className="text-gray-600">{registration.specialRequests}</span>
                    </div>
                  </div>
                )}

                {/* Registration Date */}
                <div className="mt-2 text-xs text-gray-500">
                  Registered: {formatDate(registration.registeredAt)}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredRegistrations.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No registrations found</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all' || filterEvent !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : registrations.length === 0
                    ? 'No participant registrations yet for your assigned events'
                    : 'No registrations match your current filters'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registration Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
            <DialogDescription>
              Complete information for this registration
            </DialogDescription>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-6">
              {/* Participant Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Participant Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-sm text-gray-900">{selectedRegistration.participantName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-sm text-gray-900">{selectedRegistration.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-sm text-gray-900">{selectedRegistration.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Registration ID</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedRegistration.id}</p>
                  </div>
                </div>
              </div>

              {/* Event Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Event Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Event Name</label>
                    <p className="text-sm text-gray-900">{selectedRegistration.eventName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Event Date</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedRegistration.eventDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Category</label>
                    <p className="text-sm text-gray-900">{selectedRegistration.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Category Price</label>
                    <p className="text-sm text-gray-900">{formatGHS(selectedRegistration.categoryPrice)}</p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      {getPaymentStatusIcon(selectedRegistration.paymentStatus)}
                      <Badge className={getPaymentStatusColor(selectedRegistration.paymentStatus)}>
                        {selectedRegistration.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment Method</label>
                    <p className="text-sm text-gray-900">{selectedRegistration.paymentMethod}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Receipt Number</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedRegistration.receiptNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Check-in Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedRegistration.checkedIn ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <Badge className="bg-green-100 text-green-800">Checked In</Badge>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-gray-400" />
                          <Badge variant="outline">Not Checked In</Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration Timeline */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Timeline</h3>
                <div>
                  <label className="text-sm font-medium text-gray-600">Registration Date</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedRegistration.registeredAt)}</p>
                </div>
              </div>

              {/* Special Requests */}
              {selectedRegistration.specialRequests && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Special Requests</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedRegistration.specialRequests}
                  </p>
                </div>
              )}

              {/* QR Code Status */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Badge & QR Code</h3>
                <div className="flex items-center gap-2">
                  {selectedRegistration.qrCode ? (
                    <>
                      <QrCode className="h-4 w-4 text-green-600" />
                      <Badge className="bg-green-100 text-green-800">QR Code Generated</Badge>
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 text-gray-400" />
                      <Badge variant="outline">No QR Code</Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Link href={`/staff/registrations/new?edit=${selectedRegistration.id}`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Registration
                  </Button>
                </Link>
                {selectedRegistration.paymentStatus === 'PENDING' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      handleProcessPayment(selectedRegistration)
                      setShowDetailsDialog(false)
                    }}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Process Payment
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    handleGenerateBadge(selectedRegistration)
                    setShowDetailsDialog(false)
                  }}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate Badge
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
