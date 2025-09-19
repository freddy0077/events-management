'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth-simple'
import { useRegistration } from '@/lib/graphql/hooks'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CheckCircle, Clock, XCircle, ArrowLeft, Receipt, DollarSign, User, Calendar, CreditCard } from 'lucide-react'

export default function TransactionDetailsPage() {
  const { id } = useParams()
  const { isAuthenticated, user } = useAuth()
  const { data: regData, loading, error } = useRegistration({ id: id as string })
  const registration = regData?.registration

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to view transaction details</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/admin/finance">Back to Finance</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading transaction details...</p>
        </div>
      </div>
    )
  }

  if (error || !registration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-900">Error</CardTitle>
            <CardDescription>{error?.message || 'Transaction not found'}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild variant="outline">
              <Link href="/admin/finance">Back to Finance</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-100">
      {/* Hero Header */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-green-600 via-emerald-500 to-lime-500 text-white py-14 md:py-20 mb-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Transaction Details</h1>
            <p className="text-lg md:text-xl opacity-90 max-w-xl mb-4">Review complete details for transaction ID: {registration.id}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="bg-white/20 border-white/30 backdrop-blur-sm text-white">Finance</Badge>
              <Badge variant="secondary" className="bg-white/20 border-white/30 backdrop-blur-sm text-white">Admin</Badge>
            </div>
          </div>
          <Receipt className="h-24 w-24 md:h-32 md:w-32 opacity-70" />
        </div>
        <div className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-overlay">
          <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        </div>
      </section>

      <div className="container mx-auto px-4 pb-10">
        <div className="flex items-center gap-4 mb-8">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/finance">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Finance
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/finance/reconcile">
              Back to Reconcile
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Participant Info */}
          <Card className="rounded-xl shadow-lg border-green-200">
            <CardHeader className="bg-green-50 rounded-t-xl border-b border-green-100">
              <CardTitle className="flex items-center gap-2 text-green-900">
                <User className="h-5 w-5" />
                Participant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Full Name</label>
                <p className="text-gray-900">{registration.fullName || `${registration.firstName} ${registration.lastName}`}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{registration.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Phone</label>
                <p className="text-gray-900">{registration.phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Details */}
          <Card className="rounded-xl shadow-lg border-green-200">
            <CardHeader className="bg-green-50 rounded-t-xl border-b border-green-100">
              <CardTitle className="flex items-center gap-2 text-green-900">
                <DollarSign className="h-5 w-5" />
                Transaction Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Amount</label>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(registration.amount || 0)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className="mt-1">
                  {registration.paymentStatus === 'PAID' && <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-4 w-4 mr-1" /> Paid</Badge>}
                  {registration.paymentStatus === 'PENDING' && <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-4 w-4 mr-1" /> Pending</Badge>}
                  {registration.paymentStatus === 'REFUNDED' && <Badge className="bg-blue-100 text-blue-700">Refunded</Badge>}
                  {registration.paymentStatus === 'FAILED' && <Badge className="bg-red-100 text-red-700"><XCircle className="h-4 w-4 mr-1" /> Failed</Badge>}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Payment Method</label>
                <p className="text-gray-900">{registration.paymentMethod || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card className="rounded-xl shadow-lg border-green-200">
            <CardHeader className="bg-green-50 rounded-t-xl border-b border-green-100">
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Calendar className="h-5 w-5" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Event Name</label>
                <p className="text-gray-900">{registration.event?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Category</label>
                <p className="text-gray-900">{registration.category?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Event Date</label>
                <p className="text-gray-900">{registration.event?.date ? formatDate(registration.event.date) : 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card className="rounded-xl shadow-lg border-green-200">
            <CardHeader className="bg-green-50 rounded-t-xl border-b border-green-100">
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CreditCard className="h-5 w-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Receipt Number</label>
                <p className="text-gray-900">{registration.receiptNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Created</label>
                <p className="text-gray-900">{formatDate(registration.createdAt)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Last Updated</label>
                <p className="text-gray-900">{formatDate(registration.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
