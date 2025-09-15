'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth-simple'
import { useEvents, useRegistrations } from '@/lib/graphql/hooks'
import { useApproveRegistration } from '@/lib/graphql/hooks'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle, Clock, XCircle, ArrowLeft, Calculator } from 'lucide-react'

export default function ReconcilePaymentsPage() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('all')
  const { data: eventsData } = useEvents()
  const { data: registrationsData } = useRegistrations()
  const events = eventsData?.events || []
  const registrations = registrationsData?.registrations || []

  // Example filter by payment status
  const filtered = filter === 'all' ? registrations : registrations.filter(r => r.paymentStatus === filter)

  const approveRegistration = useApproveRegistration()

  const handleMarkAsPaid = async (regId: string) => {
    try {
      await approveRegistration[0]({ variables: { id: regId } })
    } catch (err) {
      alert('Failed to mark as paid')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-lime-100">
      {/* HERO HEADER */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-green-600 via-emerald-500 to-lime-500 text-white py-14 md:py-20 mb-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Reconcile Payments</h1>
            <p className="text-lg md:text-xl opacity-90 max-w-xl mb-4">Review, verify, and reconcile all event payments. Filter by payment status and take action.</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="bg-white/20 border-white/30 backdrop-blur-sm text-white">Finance</Badge>
              <Badge variant="secondary" className="bg-white/20 border-white/30 backdrop-blur-sm text-white">Admin Tools</Badge>
              <Badge variant="secondary" className="bg-white/20 border-white/30 backdrop-blur-sm text-white">Secure</Badge>
            </div>
          </div>
          <Calculator className="h-24 w-24 md:h-32 md:w-32 opacity-70" />
        </div>
        {/* Decorative blobs */}
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
        </div>
        <Card className="rounded-xl shadow-lg border-green-200">
          <CardHeader className="bg-green-50 rounded-t-xl border-b border-green-100">
            <CardTitle className="text-2xl font-bold text-green-900">Payment Overview</CardTitle>
            <CardDescription className="text-green-700">Filter by payment status and review participant payments below.</CardDescription>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>All</Button>
              <Button size="sm" variant={filter === 'PAID' ? 'default' : 'outline'} onClick={() => setFilter('PAID')}>Paid</Button>
              <Button size="sm" variant={filter === 'PENDING' ? 'default' : 'outline'} onClick={() => setFilter('PENDING')}>Pending</Button>
              <Button size="sm" variant={filter === 'REFUNDED' ? 'default' : 'outline'} onClick={() => setFilter('REFUNDED')}>Refunded</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-green-100">
                    <th className="px-4 py-2 text-left">Participant</th>
                    <th className="px-4 py-2 text-left">Event</th>
                    <th className="px-4 py-2 text-left">Amount</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-500 py-8">No registrations found.</td>
                    </tr>
                  ) : (
                    filtered.map(reg => (
                      <tr key={reg.id} className="border-b">
                        <td className="px-4 py-2">{reg.fullName || `${reg.firstName} ${reg.lastName}`}</td>
                        <td className="px-4 py-2">{reg.event?.name || '-'}</td>
                        <td className="px-4 py-2">{formatCurrency(reg.amount || 0)}</td>
                        <td className="px-4 py-2">
                          {reg.paymentStatus === 'PAID' && <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-4 w-4 mr-1" /> Paid</Badge>}
                          {reg.paymentStatus === 'PENDING' && <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-4 w-4 mr-1" /> Pending</Badge>}
                          {reg.paymentStatus === 'REFUNDED' && <Badge className="bg-blue-100 text-blue-700">Refunded</Badge>}
                          {reg.paymentStatus === 'FAILED' && <Badge className="bg-red-100 text-red-700"><XCircle className="h-4 w-4 mr-1" /> Failed</Badge>}
                        </td>
                        <td className="px-4 py-2">
                          {reg.paymentStatus === 'PENDING' ? (
                            <Button size="sm" variant="default" onClick={() => handleMarkAsPaid(reg.id)} className="bg-green-600 hover:bg-green-700 text-white">
                              Mark as Paid
                            </Button>
                          ) : reg.paymentStatus === 'PAID' ? (
                            <Button size="sm" variant="outline" disabled>Paid</Button>
                          ) : reg.paymentStatus === 'REFUNDED' ? (
                            <Button size="sm" variant="outline" disabled>Refunded</Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled>Action</Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
