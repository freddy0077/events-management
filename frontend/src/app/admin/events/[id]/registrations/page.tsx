'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatDate, formatCurrency } from '@/lib/utils'
import { 
  ArrowLeft,
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
  Square
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { useEvent, useRegistrations } from '@/lib/graphql/hooks'
import { toast } from 'sonner'

export default function EventRegistrationsPage() {
  const { isAuthenticated, user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // GraphQL queries
  const { data: eventData, loading: eventLoading } = useEvent({ id: eventId })
  const { data: registrationsData, loading: registrationsLoading, refetch } = useRegistrations({ 
    eventId,
    limit: itemsPerPage,
    offset: (currentPage - 1) * itemsPerPage
  })

  // Registrations data - loaded from GraphQL API
  const event = eventData?.event
  const registrations = registrationsData?.registrations || []
  const isLoading = eventLoading || registrationsLoading

  // Filter and sort registrations
  const filteredAndSortedRegistrations = useMemo(() => {
    let filtered = registrations.filter(registration => {
      const matchesSearch = searchTerm === '' || 
        registration.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || registration.paymentStatus === statusFilter
      const matchesCategory = categoryFilter === 'all' || registration.category?.id === categoryFilter

      return matchesSearch && matchesStatus && matchesCategory
    })

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
  }, [registrations, searchTerm, statusFilter, categoryFilter, sortBy, sortOrder])

  // Get unique categories for filter
  const uniqueCategories = useMemo(() => {
    const categories = registrations.map((r: any) => r.category).filter(Boolean)
    return categories.filter((category: any, index: number, self: any) => 
      index === self.findIndex((c: any) => c?.id === category?.id)
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

  const handleExportCSV = () => {
    const csvData = filteredAndSortedRegistrations.map((reg: any) => ({
      'Name': `${reg.firstName} ${reg.lastName}`,
      'Email': reg.email,
      'Phone': reg.phone || '',
      'Category': reg.category?.name || '',
      'Price': reg.category?.price || 0,
      'Payment Status': reg.paymentStatus,
      'Receipt Number': reg.receiptNumber || '',
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
    a.download = `${event?.name || 'Event'}-registrations-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Registrations exported to CSV')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="h-4 w-4 text-success-600" />
      case 'DECLINED': return <XCircle className="h-4 w-4 text-danger-600" />
      case 'PENDING':
      default: return <Clock className="h-4 w-4 text-warning-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Badge className="bg-success-50 text-success-700 border-success-200">Approved</Badge>
      case 'DECLINED': return <Badge className="bg-danger-50 text-danger-700 border-danger-200">Declined</Badge>
      case 'PENDING':
      default: return <Badge className="bg-warning-50 text-warning-700 border-warning-200">Pending</Badge>
    }
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to view event registrations</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild><Link href="/admin">Back to Dashboard</Link></Button>
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
              Back to Event
            </Button>
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-full px-4 py-2 mb-2">
                <Users className="h-4 w-4 text-primary-600" />
                <span className="text-sm font-medium text-primary-700">Event Registrations</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">
                {event?.name || 'Event'}
              </h1>
              <p className="text-neutral-600 mt-1">
                {formatDate(event?.date || new Date())} • {event?.venue || 'Venue'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleExportCSV} className="bg-gradient-to-r from-success-600 to-success-700 hover:from-success-700 hover:to-success-800 text-white">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total</p>
                  <p className="text-3xl font-bold text-neutral-900">{registrations.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Approved</p>
                  <p className="text-3xl font-bold text-success-700">
                    {registrations.filter(r => r.paymentStatus === 'APPROVED').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-success-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Pending</p>
                  <p className="text-3xl font-bold text-warning-700">
                    {registrations.filter(r => r.paymentStatus === 'PENDING').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-warning-600" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Revenue</p>
                  <p className="text-3xl font-bold text-success-700">
                    {formatCurrency(
                      registrations
                        .filter(r => r.paymentStatus === 'APPROVED')
                        .reduce((sum, r) => sum + (r.category?.price || 0), 0)
                    )}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-success-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary-600" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search registrations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="DECLINED">Declined</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map((category: any) => (
                    <SelectItem key={category?.id} value={category?.id || ''}>
                      {category?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Registration Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="paymentStatus">Payment Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedRegistrations.length > 0 && (
              <div className="flex items-center gap-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
                <span className="text-sm font-medium text-primary-700">
                  {selectedRegistrations.length} registration(s) selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-success-600 hover:bg-success-700">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive">
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
                <CardTitle>Registrations ({filteredAndSortedRegistrations.length})</CardTitle>
                <CardDescription>Manage participant registrations for this event</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <ArrowUpDown className="h-4 w-4 mr-1" />
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-3" />
                <span className="text-sm text-neutral-500">Loading registrations...</span>
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
                <div className="grid grid-cols-12 gap-4 p-4 bg-neutral-50 rounded-lg border mb-4 text-sm font-semibold text-neutral-700">
                  <div className="col-span-1">
                    <Checkbox
                      checked={selectedRegistrations.length === paginatedRegistrations.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </div>
                  <div className="col-span-3">Participant</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-2">Payment</div>
                  <div className="col-span-2">Registration Date</div>
                  <div className="col-span-2">Actions</div>
                </div>

                {/* Table Rows */}
                <div className="space-y-2">
                  {paginatedRegistrations.map((registration: any, index: number) => (
                    <div
                      key={registration.id}
                      className="grid grid-cols-12 gap-4 p-4 rounded-lg border-2 border-neutral-100 hover:border-primary-200 hover:bg-primary-50/50 transition-all duration-300"
                    >
                      <div className="col-span-1 flex items-center">
                        <Checkbox
                          checked={selectedRegistrations.includes(registration.id)}
                          onCheckedChange={() => handleSelectRegistration(registration.id)}
                        />
                      </div>
                      
                      <div className="col-span-3">
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
                        <div className="font-semibold text-neutral-900">{registration.category?.name}</div>
                        <div className="text-sm text-success-700 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(registration.category?.price || 0)}
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

                      <div className="col-span-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {registration.qrCode && (
                              <DropdownMenuItem>
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
                      >
                        Previous
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page: number) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
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
    </div>
  )
}
