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
import { Checkbox } from '@/components/ui/checkbox'
import { formatDate, formatCurrency } from '@/lib/utils'
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  QrCode,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Loader2,
  ArrowUpDown,
  MoreHorizontal,
  FileText,
  Printer,
  RefreshCw,
  AlertCircle,
  CheckSquare,
  Square,
  UserPlus
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { useRegistrations } from '@/lib/graphql/hooks'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { BadgePreview } from '@/components/badge/badge-preview'
import { useRegistrationQRCode } from '@/hooks/use-qr-code'
import { useRegistration } from '@/lib/graphql/hooks'

interface Registration {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  paymentStatus: 'PENDING' | 'APPROVED' | 'DECLINED'
  receiptNumber?: string
  qrCode?: string
  createdAt: string
  updatedAt: string
  event: {
    id: string
    name: string
    date: string
    venue: string
  }
  category: {
    id: string
    name: string
    price: number
  }
  mealAttendances?: Array<{
    id: string
    scannedAt: string
    meal: {
      id: string
      name: string
      sessionTime: string
    }
  }>
}

export default function AdminRegistrationsPage() {
  const { isAuthenticated, user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [printingBadgeId, setPrintingBadgeId] = useState<string | null>(null)

  // GraphQL query for registrations
  const { data: registrationsData, loading, error, refetch } = useRegistrations({
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage
  })

  // Handle badge printing
  const handlePrintBadge = (registration: Registration) => {
    setPrintingBadgeId(registration.id)
    // The BadgePreview component will handle the actual printing
    toast.success('Opening badge preview for printing...')
  }

  const registrations = registrationsData?.registrations || []

  // Filter and sort registrations
  const filteredAndSortedRegistrations = useMemo(() => {
    let filtered = registrations.filter(registration => {
      const matchesSearch = searchTerm === '' || 
        registration.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.event?.name?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || registration.paymentStatus === statusFilter
      const matchesEvent = eventFilter === 'all' || registration.event?.id === eventFilter

      return matchesSearch && matchesStatus && matchesEvent
    })

    // Sort registrations
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`
          bValue = `${b.firstName} ${b.lastName}`
          break
        case 'email':
          aValue = a.email
          bValue = b.email
          break
        case 'event':
          aValue = a.event?.name || ''
          bValue = b.event?.name || ''
          break
        case 'paymentStatus':
          aValue = a.paymentStatus
          bValue = b.paymentStatus
          break
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [registrations, searchTerm, statusFilter, eventFilter, sortBy, sortOrder])

  // Get unique events for filter
  const uniqueEvents = useMemo(() => {
    const events = registrations.map((r: any) => r.event)
    return events.filter((event: any, index: number, self: any) => 
      index === self.findIndex((e: any) => e?.id === event?.id)
    )
  }, [registrations])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedRegistrations.length / itemsPerPage)
  const paginatedRegistrations = filteredAndSortedRegistrations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedRegistrations.length === paginatedRegistrations.length) {
      setSelectedRegistrations([])
    } else {
      setSelectedRegistrations(paginatedRegistrations.map((r: any) => r.id))
    }
  }

  const handleSelectRegistration = (registrationId: string) => {
    setSelectedRegistrations(prev => 
      prev.includes(registrationId)
        ? prev.filter(id => id !== registrationId)
        : [...prev, registrationId]
    )
  }

  // Export functions
  const handleExportCSV = () => {
    const csvData = filteredAndSortedRegistrations.map((reg: any) => ({
      'Registration ID': reg.id,
      'First Name': reg.firstName,
      'Last Name': reg.lastName,
      'Email': reg.email,
      'Phone': reg.phone || '',
      'Address': reg.address || '',
      'Event': reg.event?.name || 'N/A',
      'Category': reg.category?.name || 'N/A',
      'Price': reg.category?.price || 0,
      'Payment Status': reg.paymentStatus,
      'Receipt Number': reg.receiptNumber || '',
      'QR Code': reg.qrCode || '',
      'Registration Date': formatDate(reg.createdAt),
      'Meal Attendances': reg.mealAttendances?.length || 0
    }))

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map((row: any) => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Registrations exported to CSV')
  }

  const handleBulkApprove = async () => {
    if (selectedRegistrations.length === 0) {
      toast.error('Please select registrations to approve')
      return
    }
    
    // TODO: Implement bulk approve with GraphQL mutation
    toast.success(`${selectedRegistrations.length} registrations approved`)
    setSelectedRegistrations([])
  }

  const handleBulkDecline = async () => {
    if (selectedRegistrations.length === 0) {
      toast.error('Please select registrations to decline')
      return
    }
    
    // TODO: Implement bulk decline with GraphQL mutation
    toast.success(`${selectedRegistrations.length} registrations declined`)
    setSelectedRegistrations([])
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-success-600" />
      case 'DECLINED':
        return <XCircle className="h-4 w-4 text-danger-600" />
      case 'PENDING':
      default:
        return <Clock className="h-4 w-4 text-warning-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-success-50 text-success-700 border-success-200">Approved</Badge>
      case 'DECLINED':
        return <Badge className="bg-danger-50 text-danger-700 border-danger-200">Declined</Badge>
      case 'PENDING':
      default:
        return <Badge className="bg-warning-50 text-warning-700 border-warning-200">Pending</Badge>
    }
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin registrations
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/">
                Back to Home
              </Link>
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
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full px-4 py-2 mb-4 animate-fade-in">
              <Users className="h-4 w-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-700">Registration Management</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4 animate-slide-in">
              <span className="bg-gradient-to-r from-primary-600 to-brand-600 bg-clip-text text-transparent">
                Registrations
              </span>
            </h1>
            <p className="text-xl text-neutral-600 animate-slide-in">
              Manage participant registrations, payments, and QR codes
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-glow hover:shadow-medium transition-all duration-300 group">
              <Link href="/admin/registrations/create">
                <UserPlus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Register Participant
              </Link>
            </Button>
            <Button 
              onClick={handleExportCSV}
              className="bg-gradient-to-r from-success-600 to-success-700 hover:from-success-700 hover:to-success-800 text-white shadow-glow hover:shadow-medium transition-all duration-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              onClick={() => refetch()}
              variant="outline" 
              className="border-2 border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-all duration-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary-600" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search registrations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-2 border-neutral-200 focus:border-primary-300 transition-colors"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-2 border-neutral-200 focus:border-primary-300">
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="DECLINED">Declined</SelectItem>
                </SelectContent>
              </Select>

              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="border-2 border-neutral-200 focus:border-primary-300">
                  <SelectValue placeholder="Event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {uniqueEvents.map((event: any) => (
                    <SelectItem key={event?.id || ''} value={event?.id || ''}>
                      {event?.name || 'Unknown Event'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="border-2 border-neutral-200 focus:border-primary-300">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Registration Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="paymentStatus">Payment Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedRegistrations.length > 0 && (
              <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <span className="text-sm font-medium text-primary-700">
                  {selectedRegistrations.length} registration(s) selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleBulkApprove} className="bg-success-600 hover:bg-success-700">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleBulkDecline}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registrations Table */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-neutral-900">
                  Registrations ({filteredAndSortedRegistrations.length})
                </CardTitle>
                <CardDescription className="text-neutral-600">
                  Manage participant registrations and payment status
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="border-2 border-neutral-200 hover:border-primary-300"
              >
                <ArrowUpDown className="h-4 w-4 mr-1" />
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-3" />
                  <span className="text-sm text-neutral-500">Loading registrations...</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-danger-600 mx-auto mb-3" />
                  <span className="text-sm text-danger-600">Error loading registrations</span>
                </div>
              </div>
            ) : paginatedRegistrations.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Users className="h-8 w-8 text-neutral-400 mx-auto mb-3" />
                  <span className="text-sm text-neutral-500">No registrations found</span>
                </div>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200 mb-4 text-sm font-semibold text-neutral-700">
                  <div className="col-span-1 flex items-center">
                    <Checkbox
                      checked={selectedRegistrations.length === paginatedRegistrations.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </div>
                  <div className="col-span-2">Participant</div>
                  <div className="col-span-2">Event</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-2">Payment</div>
                  <div className="col-span-2">Registration Date</div>
                  <div className="col-span-1">Actions</div>
                </div>

                {/* Table Rows */}
                <div className="space-y-2">
                  {paginatedRegistrations.map((registration: any, index: number) => (
                    <div
                      key={registration.id}
                      className={`grid grid-cols-12 gap-4 p-4 rounded-lg border-2 border-neutral-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-300 animate-fade-in`}
                      style={{animationDelay: `${index * 50}ms`}}
                    >
                      <div className="col-span-1 flex items-center">
                        <Checkbox
                          checked={selectedRegistrations.includes(registration.id)}
                          onCheckedChange={() => handleSelectRegistration(registration.id)}
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-brand-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {registration.firstName.charAt(0)}{registration.lastName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-900">
                              {registration.firstName} {registration.lastName}
                            </div>
                            <div className="text-sm text-neutral-600 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {registration.email}
                            </div>
                            {registration.phone && (
                              <div className="text-sm text-neutral-600 flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {registration.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="font-semibold text-neutral-900">{registration.event.name}</div>
                        <div className="text-sm text-neutral-600 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(registration.event.date)}
                        </div>
                        <div className="text-sm text-neutral-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {registration.event.venue}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="font-semibold text-neutral-900">{registration.category.name}</div>
                        <div className="text-sm text-success-700 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(registration.category.price)}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(registration.paymentStatus)}
                          {getStatusBadge(registration.paymentStatus)}
                        </div>
                        {registration.receiptNumber && (
                          <div className="text-sm text-neutral-600">
                            Receipt: {registration.receiptNumber}
                          </div>
                        )}
                        {registration.qrCode && (
                          <div className="text-sm text-success-600 flex items-center gap-1">
                            <QrCode className="h-3 w-3" />
                            QR Generated
                          </div>
                        )}
                      </div>

                      <div className="col-span-2">
                        <div className="text-sm text-neutral-900">{formatDate(registration.createdAt)}</div>
                        {registration.mealAttendances && registration.mealAttendances.length > 0 && (
                          <div className="text-sm text-primary-600">
                            {registration.mealAttendances.length} meal(s) attended
                          </div>
                        )}
                      </div>

                      <div className="col-span-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/registrations/${registration.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/registrations/${registration.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            {registration.qrCode && (
                              <DropdownMenuItem onClick={() => handlePrintBadge(registration)}>
                                <Printer className="h-4 w-4 mr-2" />
                                Print Badge
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <FileText className="h-4 w-4 mr-2" />
                              Export Data
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-8">
                    <div className="text-sm text-neutral-600">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedRegistrations.length)} of {filteredAndSortedRegistrations.length} registrations
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="border-2 border-neutral-200 hover:border-primary-300"
                      >
                        Previous
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page: number) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={currentPage === page ? "bg-primary-600 hover:bg-primary-700" : "border-2 border-neutral-200 hover:border-primary-300"}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="border-2 border-neutral-200 hover:border-primary-300"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Badge Preview for Printing */}
      {printingBadgeId && (
        <BadgePrintModal
          registrationId={printingBadgeId}
          onClose={() => setPrintingBadgeId(null)}
        />
      )}
    </div>
  )
}

// Badge Print Modal Component
interface BadgePrintModalProps {
  registrationId: string
  onClose: () => void
}

function BadgePrintModal({ registrationId, onClose }: BadgePrintModalProps) {
  const { data: registrationData, loading: registrationLoading } = useRegistration({ id: registrationId })
  const { qrCodeData, loading: qrLoading, error: qrError } = useRegistrationQRCode(registrationId)
  
  const registration = registrationData?.registration

  if (registrationLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading registration...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!registration) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p>Registration not found</p>
            <Button onClick={onClose} className="mt-2">Close</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Print Badge</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
        
        {qrLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading QR code...</span>
            </div>
          </div>
        ) : qrError ? (
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 mb-4">Failed to load QR code</p>
            <BadgePreview
              participantName={`${registration.firstName} ${registration.lastName}`}
              eventName={registration.event?.name || 'Event'}
              eventDate={registration.event?.date || ''}
              venue={registration.event?.venue || ''}
              category={registration.category?.name || 'General'}
              categoryColor="#3B82F6"
              qrCodeImage={undefined} // Will show placeholder
              registrationNumber={registration.receiptNumber}
              onPrint={onClose}
            />
          </div>
        ) : (
          <BadgePreview
            participantName={`${registration.firstName} ${registration.lastName}`}
            eventName={registration.event?.name || 'Event'}
            eventDate={registration.event?.date || ''}
            venue={registration.event?.venue || ''}
            category={registration.category?.name || 'General'}
            categoryColor="#3B82F6"
            qrCodeImage={(qrCodeData as any)?.qrCodeImage}
            registrationNumber={registration.receiptNumber}
            onPrint={onClose}
          />
        )}
      </div>
    </div>
  )
}
