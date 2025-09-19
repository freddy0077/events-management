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
  DollarSign, 
  CreditCard,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  FileText,
  Download,
  Upload,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
  Activity,
  Target,
  Zap,
  Calculator,
  Receipt,
  Banknote
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { useMyAssignedEvents, useMyEventRegistrations, useEvents, useRegistrations } from '@/lib/graphql/hooks'

export default function FinanceTeamDashboard() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  // Admin users get all events, staff users get assigned events
  const isAdmin = user?.role === 'ADMIN'
  
  // Get events based on user role
  const { data: allEventsData, loading: allEventsLoading } = useEvents()
  const { data: assignedEventsData, loading: assignedEventsLoading } = useMyAssignedEvents()
  
  // Determine which events to use
  const eventsData = isAdmin ? allEventsData : assignedEventsData
  const eventsLoading = isAdmin ? allEventsLoading : assignedEventsLoading
  const events = isAdmin ? (eventsData as any)?.events : (eventsData as any)?.myAssignedEvents
  const eventIds = events?.map((event: any) => event.id) || []
  
  // Get registrations based on user role
  const { data: allRegistrationsData, loading: allRegistrationsLoading } = useRegistrations()
  const { data: assignedRegistrationsData, loading: assignedRegistrationsLoading } = useMyEventRegistrations(eventIds)
  
  // Determine which registrations to use
  const registrationsData = isAdmin ? allRegistrationsData : assignedRegistrationsData
  const registrationsLoading = isAdmin ? allRegistrationsLoading : assignedRegistrationsLoading

  // Calculate financial metrics
  const financialMetrics = useMemo(() => {
    if (!(registrationsData as any)?.registrations) return {
      totalRevenue: 0,
      paidAmount: 0,
      pendingAmount: 0,
      refundedAmount: 0,
      transactionCount: 0,
      averageTransaction: 0
    }

    const registrations = (registrationsData as any).registrations
    const totalRevenue = registrations.reduce((sum: number, reg: any) => sum + getRegistrationAmount(reg), 0)
    const paidTransactions = registrations.filter((reg: any) => reg.paymentStatus === 'PAID')
    const pendingTransactions = registrations.filter((reg: any) => reg.paymentStatus === 'PENDING')
    const refundedTransactions = registrations.filter((reg: any) => reg.paymentStatus === 'REFUNDED')

    return {
      totalRevenue,
      paidAmount: paidTransactions.reduce((sum: number, reg: any) => sum + getRegistrationAmount(reg), 0),
      pendingAmount: pendingTransactions.reduce((sum: number, reg: any) => sum + getRegistrationAmount(reg), 0),
      refundedAmount: refundedTransactions.reduce((sum: number, reg: any) => sum + getRegistrationAmount(reg), 0),
      transactionCount: registrations.length,
      averageTransaction: registrations.length > 0 ? totalRevenue / registrations.length : 0
    }
  }, [registrationsData])

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!(registrationsData as any)?.registrations) return []
    
    return (registrationsData as any).registrations.filter((registration: any) => {
      // Use fullName if available, otherwise combine firstName and lastName
      const displayName = registration.fullName || `${registration.firstName || ''} ${registration.lastName || ''}`.trim()
      
      const matchesSearch = 
        displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.event.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesPayment = paymentFilter === 'all' || 
        registration.paymentStatus.toLowerCase() === paymentFilter.toLowerCase()
      
      const matchesDate = dateFilter === 'all' || 
        (dateFilter === 'today' && new Date(registration.createdAt).toDateString() === new Date().toDateString()) ||
        (dateFilter === 'week' && new Date(registration.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
        (dateFilter === 'month' && new Date(registration.createdAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      
      return matchesSearch && matchesPayment && matchesDate
    })
  }, [registrationsData, searchTerm, paymentFilter, dateFilter])

  if (eventsLoading || registrationsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-green-700">Loading finance dashboard...</p>
        </div>
      </div>
    )
  }

  // Check if user has access to events (ADMIN always has access, staff needs assignments)
  const hasEventAccess = isAdmin || eventIds.length > 0

  if (!hasEventAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-orange-900 mb-2">No Events Assigned</h2>
          <p className="text-orange-700 mb-4">
            You are not assigned to any events as finance staff. Contact your event organizer to get assigned to events.
          </p>
          <div className="text-sm text-orange-600">
            Role: {user?.role} | User: {user?.email}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-100">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-green-600 via-emerald-500 to-lime-500 text-white py-14 md:py-20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Finance Dashboard</h1>
            <p className="mt-3 text-lg md:text-xl opacity-90 max-w-xl">Real-time revenue insights &amp; payment reconciliation</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-white/20 border-white/30 backdrop-blur-sm text-white">Secure Payments</Badge>
              <Badge variant="secondary" className="bg-white/20 border-white/30 backdrop-blur-sm text-white">Real-time Data</Badge>
              {isAdmin && (
                <Badge variant="secondary" className="bg-white/20 border-white/30 backdrop-blur-sm text-white">Admin</Badge>
              )}
            </div>
          </div>
          <Banknote className="h-24 w-24 md:h-32 md:w-32 opacity-70" />
        </div>
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-overlay">
          <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        </div>
      </section>

      {/* Main content */}
      <div className="container mx-auto px-4 -mt-10 pb-10 space-y-8">
        {/* Context info under hero */}
        <div className="flex flex-wrap gap-2 text-sm text-gray-600 justify-center md:justify-start">
          <span>{isAdmin ? `Managing ${eventIds.length} event(s)` : `Assigned to ${eventIds.length} event(s)`}</span>
          {events?.map((event: any) => (
            <span key={event.id} className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800">
              {event.name}
            </span>
          ))}
        </div>

        {/* Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(financialMetrics.totalRevenue)}
              </div>
              <p className="text-xs text-gray-500 mt-1">All time revenue</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Paid Amount</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(financialMetrics.paidAmount)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Successfully collected</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Payments</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(financialMetrics.pendingAmount)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Awaiting collection</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Transaction</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(financialMetrics.averageTransaction)}
              </div>
              <p className="text-xs text-gray-500 mt-1">Per registration</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Paid Transactions</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(registrationsData as any)?.registrations?.filter((r: any) => r.paymentStatus === 'PAID').length || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Successfully processed</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Transactions</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {(registrationsData as any)?.registrations?.filter((r: any) => r.paymentStatus === 'PENDING').length || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Require attention</p>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Failed/Refunded</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {(registrationsData as any)?.registrations?.filter((r: any) => r.paymentStatus === 'FAILED' || r.paymentStatus === 'REFUNDED').length || 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Need reconciliation</p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Payment Transactions
                </CardTitle>
                <CardDescription>
                  Monitor and reconcile all payment transactions
                </CardDescription>
              </div>
              <div className="flex gap-2 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-32">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-32">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-500">
                  {searchTerm || paymentFilter !== 'all' || dateFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'No payment transactions yet'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((registration: any) => (
                  <div key={registration.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {registration.fullName || `${registration.firstName || ''} ${registration.lastName || ''}`.trim() || registration.email}
                          </h3>
                          <Badge 
                            variant="secondary"
                            className={
                              registration.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                              registration.paymentStatus === 'PENDING' ? 'bg-orange-100 text-orange-800' :
                              registration.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {registration.paymentStatus}
                          </Badge>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(getRegistrationAmount(registration))}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {registration.event.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(registration.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Receipt className="h-4 w-4" />
                            ID: {registration.id.slice(-8)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/finance/transactions/${registration.id}`}>
                            <FileText className="h-4 w-4 mr-1" />
                            Details
                          </Link>
                        </Button>
                        {registration.paymentStatus === 'PENDING' && (
                          <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                        )}
                        {registration.paymentStatus === 'PAID' && (
                          <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50">
                            <Receipt className="h-4 w-4 mr-1" />
                            Receipt
                          </Button>
                        )}
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
              <Zap className="h-5 w-5 text-green-600" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common financial management tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col border-green-200 hover:border-green-300 hover:bg-green-50" asChild>
                <Link href="/admin/finance/reconcile">
                  <Calculator className="h-6 w-6 mb-2 text-green-600" />
                  <span className="text-green-700">Reconcile Payments</span>
                </Link>
              </Button>

              <Button variant="outline" className="h-20 flex-col border-blue-200 hover:border-blue-300 hover:bg-blue-50" asChild>
                <Link href="/admin/finance/reports">
                  <BarChart3 className="h-6 w-6 mb-2 text-blue-600" />
                  <span className="text-blue-700">Financial Reports</span>
                </Link>
              </Button>

              <Button variant="outline" className="h-20 flex-col border-orange-200 hover:border-orange-300 hover:bg-orange-50" asChild>
                <Link href="/admin/finance/pending">
                  <Clock className="h-6 w-6 mb-2 text-orange-600" />
                  <span className="text-orange-700">Pending Payments</span>
                </Link>
              </Button>

              <Button variant="outline" className="h-20 flex-col border-purple-200 hover:border-purple-300 hover:bg-purple-50" asChild>
                <Link href="/admin/finance/export">
                  <Download className="h-6 w-6 mb-2 text-purple-600" />
                  <span className="text-purple-700">Export Data</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
