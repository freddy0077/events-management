'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useMyAssignedEvents, useMyEventRegistrations } from '@/lib/graphql/hooks'
import { formatGHS, getRegistrationAmount } from '@/lib/utils/currency'
import { 
  CreditCard, 
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Download,
  Calendar,
  User,
  Receipt,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import Link from 'next/link'

export default function StaffPaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMethod, setFilterMethod] = useState('all')

  // Fetch assigned events
  const { data: eventsData, loading: eventsLoading, error: eventsError } = useMyAssignedEvents()
  const assignedEvents = (eventsData as any)?.myAssignedEvents || []
  
  // Get event IDs for fetching registrations
  const eventIds = assignedEvents.map((event: any) => event.id)
  
  // Fetch registrations for assigned events (which contain payment data)
  const { data: registrationsData, loading: registrationsLoading } = useMyEventRegistrations(eventIds)
  const allRegistrations = (registrationsData as any)?.registrations || []
  
  // Transform registrations into payment records
  const payments = allRegistrations.map((reg: any) => {
    // Calculate processing fees (typically 2.9% + $0.30 for card payments)
    const amount = getRegistrationAmount(reg)
    const fees = amount > 0 ? Math.round((amount * 0.029 + 0.30) * 100) / 100 : 0
    
    return {
      id: reg.id,
      receiptNumber: reg.receiptNumber || `RCP-${reg.id.slice(-6)}`,
      participantName: reg.fullName || `${reg.firstName} ${reg.lastName}`,
      eventName: reg.event?.name || 'Unknown Event',
      amount: amount,
      currency: 'GHS',
      status: reg.paymentStatus === 'PAID' ? 'COMPLETED' : 
              reg.paymentStatus === 'PENDING' ? 'PENDING' :
              reg.paymentStatus === 'PARTIAL' ? 'PARTIAL' :
              reg.paymentStatus === 'FAILED' ? 'FAILED' : 'PENDING',
      method: 'CARD', // Default since payment method not in schema
      transactionId: `TXN-${reg.id.slice(-9)}`,
      processedAt: reg.updatedAt || reg.createdAt,
      category: reg.category?.name || 'General',
      refundAmount: 0, // Not available in current schema
      fees: reg.paymentStatus === 'PAID' ? fees : 0
    }
  })

  const filteredPayments = payments.filter((payment: any) => {
    const matchesSearch = payment.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus
    const matchesMethod = filterMethod === 'all' || payment.method === filterMethod
    return matchesSearch && matchesStatus && matchesMethod
  })
  
  // Loading state
  if (eventsLoading || registrationsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
            <p className="text-gray-600 mt-2">Loading payment data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  
  // Error state
  if (eventsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-red-600 mt-2">Error loading payment data: {eventsError.message}</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'REFUNDED':
        return 'bg-blue-100 text-blue-800'
      case 'PROCESSING':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'FAILED':
        return <XCircle className="h-4 w-4" />
      case 'REFUNDED':
        return <ArrowDownRight className="h-4 w-4" />
      case 'PROCESSING':
        return <RefreshCw className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
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

  const formatCurrency = (amount: number, currency: string = 'GHS') => {
    return formatGHS(amount)
  }

  // Calculate stats
  const stats = {
    total: filteredPayments.reduce((sum: any, p: any) => sum + p.amount, 0),
    completed: filteredPayments.filter((p: any) => p.status === 'COMPLETED').reduce((sum: any, p: any) => sum + p.amount, 0),
    pending: filteredPayments.filter((p: any) => p.status === 'PENDING').reduce((sum: any, p: any) => sum + p.amount, 0),
    failed: filteredPayments.filter((p: any) => p.status === 'FAILED').reduce((sum: any, p: any) => sum + p.amount, 0),
    refunded: filteredPayments.filter((p: any) => p.status === 'REFUNDED').reduce((sum: any, p: any) => sum + p.refundAmount, 0),
    fees: filteredPayments.reduce((sum: any, p: any) => sum + p.fees, 0),
    count: filteredPayments.length
  }

  const completedPercentage = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : '0.0'
  const feesPercentage = stats.total > 0 ? ((stats.fees / stats.total) * 100).toFixed(2) : '0.00'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600 mt-2">
            Process and manage participant payments
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Payments
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total)}</p>
                <p className="text-xs text-gray-500">{stats.count} transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.completed)}</p>
                <p className="text-xs text-green-600 flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {completedPercentage}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pending)}</p>
                <p className="text-xs text-yellow-600">
                  {payments.filter((p: any) => p.status === 'PENDING').length} payments
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Processing Fees</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.fees)}</p>
                <p className="text-xs text-gray-500">
                  {feesPercentage}% of revenue
                </p>
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
            placeholder="Search by participant, receipt, or transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
            <option value="PROCESSING">Processing</option>
          </select>

          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Methods</option>
            <option value="CARD">Card</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="CASH">Cash</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions ({filteredPayments.length})</CardTitle>
          <CardDescription>
            Detailed view of all payment transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPayments.map((payment: any) => (
              <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Payment Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 rounded-full p-2">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{payment.receiptNumber}</h3>
                          <Badge className={getStatusColor(payment.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(payment.status)}
                              {payment.status}
                            </span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {payment.participantName}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {payment.eventName}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amount Info */}
                  <div className="flex-1">
                    <div className="text-right lg:text-left">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {payment.method} • {payment.category}
                      </div>
                      {payment.fees > 0 && (
                        <div className="text-xs text-gray-500">
                          Fees: {formatCurrency(payment.fees)}
                        </div>
                      )}
                      {payment.refundAmount > 0 && (
                        <div className="text-xs text-blue-600">
                          Refunded: {formatCurrency(payment.refundAmount)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="flex-1">
                    <div className="text-sm">
                      <div className="font-medium text-gray-700">
                        {payment.transactionId}
                      </div>
                      <div className="text-gray-600 mt-1">
                        {formatDate(payment.processedAt)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/staff/payments/${payment.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm">
                      <Receipt className="h-4 w-4" />
                    </Button>
                    {payment.status === 'PENDING' && (
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                    {payment.status === 'COMPLETED' && (
                      <Button variant="outline" size="sm">
                        <ArrowDownRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all' || filterMethod !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : payments.length === 0
                    ? 'No payment transactions yet for your assigned events'
                    : 'No payments match your current filters'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Process Pending</h3>
                <p className="text-sm text-gray-600">
                  {payments.filter((p: any) => p.status === 'PENDING').length} payments awaiting processing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Review Failed</h3>
                <p className="text-sm text-gray-600">
                  {payments.filter((p: any) => p.status === 'FAILED').length} failed payments need attention
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Generate Report</h3>
                <p className="text-sm text-gray-600">
                  Export payment data for reconciliation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
