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
import { formatDate, formatCurrency } from '@/lib/utils'
import { getRegistrationAmount } from '@/lib/utils/currency'
import { 
  UserPlus, 
  Users, 
  DollarSign,
  CreditCard,
  QrCode,
  Printer,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Upload,
  Loader2,
  Activity,
  Target,
  Zap
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { useRegistrations, useDashboardStats } from '@/lib/graphql/hooks'

export default function RegistrationStaffDashboard() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')

  // GraphQL queries for registration data
  const { data: registrationsData, loading: registrationsLoading, error: registrationsError } = useRegistrations({ 
    limit: 20 
  })
  const { data: dashboardStats, loading: statsLoading } = useDashboardStats()

  // Filter registrations based on search and filters
  const filteredRegistrations = useMemo(() => {
    if (!registrationsData?.registrations) return []
    
    return registrationsData.registrations.filter(registration => {
      const matchesSearch = 
        registration.participant?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.participant?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.participant?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (registration.event?.name || registration.event?.title)?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || registration.status?.toLowerCase() === statusFilter
      const matchesPayment = paymentFilter === 'all' || 
        (paymentFilter === 'paid' && registration.paymentStatus === 'PAID') ||
        (paymentFilter === 'pending' && registration.paymentStatus === 'PENDING') ||
        (paymentFilter === 'failed' && registration.paymentStatus === 'FAILED')
      
      return matchesSearch && matchesStatus && matchesPayment
    })
  }, [registrationsData, searchTerm, statusFilter, paymentFilter])

  // Calculate quick stats
  const todayRegistrations = useMemo(() => {
    if (!registrationsData?.registrations) return 0
    const today = new Date().toDateString()
    return registrationsData.registrations.filter(reg => 
      new Date(reg.createdAt).toDateString() === today
    ).length
  }, [registrationsData])

  const pendingPayments = useMemo(() => {
    if (!registrationsData?.registrations) return 0
    return registrationsData.registrations.filter(reg => 
      reg.paymentStatus === 'PENDING'
    ).length
  }, [registrationsData])

  if (registrationsLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-blue-700">Loading registration dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Registration Staff Portal</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.firstName}! Register participants, process payments, and print QR name tags.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/admin/registrations/create">
                <UserPlus className="h-4 w-4 mr-2" />
                Register Participant
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/registrations/bulk">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Today's Registrations</CardTitle>
              <UserPlus className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{todayRegistrations}</div>
              <p className="text-xs text-gray-500 mt-1">New registrations today</p>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Registrations</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {registrationsData?.registrations?.length || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">All time registrations</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Payments</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{pendingPayments}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting payment</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Revenue Processed</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency((dashboardStats as any)?.totalRevenue || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Total payments collected</p>
            </CardContent>
          </Card>
        </div>

        {/* Registration Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Participant Registrations
                </CardTitle>
                <CardDescription>
                  Manage participant registrations, payments, and QR name tags
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-32">
                    <DollarSign className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRegistrations.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No registrations found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'No participant registrations yet'
                  }
                </p>
                {(!searchTerm && statusFilter === 'all' && paymentFilter === 'all') && (
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/admin/registrations/create">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Register First Participant
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRegistrations.map((registration) => (
                  <div key={registration.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {registration.participant?.firstName} {registration.participant?.lastName}
                          </h3>
                          <Badge 
                            variant={registration.status === 'CONFIRMED' ? 'default' : 'secondary'}
                            className={registration.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {registration.status}
                          </Badge>
                          <Badge 
                            variant={registration.paymentStatus === 'PAID' ? 'default' : 'secondary'}
                            className={
                              registration.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                              registration.paymentStatus === 'PENDING' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {registration.paymentStatus}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {registration.event?.name || registration.event?.title}
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            {formatCurrency(getRegistrationAmount(registration))}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatDate(registration.createdAt)}
                          </div>
                          {registration.qrCode && (
                            <div className="flex items-center gap-1">
                              <QrCode className="h-4 w-4" />
                              QR Generated
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
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/registrations/${registration.id}/edit`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                        {registration.paymentStatus === 'PENDING' && (
                          <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirm Payment
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                          <Printer className="h-4 w-4 mr-1" />
                          Print Tag
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
              <Zap className="h-5 w-5 text-blue-600" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common registration and payment tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col border-blue-200 hover:border-blue-300 hover:bg-blue-50" asChild>
                <Link href="/admin/registrations/create">
                  <UserPlus className="h-6 w-6 mb-2 text-blue-600" />
                  <span className="text-blue-700">Register Participant</span>
                </Link>
              </Button>

              <Button variant="outline" className="h-20 flex-col border-green-200 hover:border-green-300 hover:bg-green-50" asChild>
                <Link href="/admin/registrations?filter=pending_payment">
                  <CreditCard className="h-6 w-6 mb-2 text-green-600" />
                  <span className="text-green-700">Process Payments</span>
                </Link>
              </Button>

              <Button variant="outline" className="h-20 flex-col border-purple-200 hover:border-purple-300 hover:bg-purple-50" asChild>
                <Link href="/admin/registrations/print">
                  <QrCode className="h-6 w-6 mb-2 text-purple-600" />
                  <span className="text-purple-700">Print QR Tags</span>
                </Link>
              </Button>

              <Button variant="outline" className="h-20 flex-col border-orange-200 hover:border-orange-300 hover:bg-orange-50" asChild>
                <Link href="/admin/registrations/export">
                  <Download className="h-6 w-6 mb-2 text-orange-600" />
                  <span className="text-orange-700">Export Data</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
