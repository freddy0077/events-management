'use client'

import { useState } from 'react'

// Prevent static generation for this page since it uses authentication
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Calendar, MapPin, QrCode, Download, Eye, Ticket, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { useUserRegistrations } from '@/hooks/use-registrations'
import { AuthGuard } from '@/components/auth/auth-guard'

const statusColors = {
  APPROVED: 'default',
  PENDING: 'secondary',
  REJECTED: 'destructive'
} as const

const paymentStatusColors = {
  PAID: 'default',
  PENDING: 'secondary',
  FAILED: 'destructive'
} as const

export default function MyRegistrationsPage() {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')
  
  // Only call useAuth on client side to prevent SSR issues
  const auth = typeof window !== 'undefined' ? useAuth() : { isAuthenticated: false, user: null }
  const { isAuthenticated, user } = auth
  
  // Fetch user registrations using GraphQL
  const { data, loading, error } = useUserRegistrations()


  // Use GraphQL data from API
  const registrations = (data as any)?.myRegistrations || []
  
  const filteredRegistrations = registrations.filter((registration: any) => {
    const eventDate = new Date(registration.event.date)
    const now = new Date()
    
    switch (filter) {
      case 'upcoming':
        return eventDate > now
      case 'past':
        return eventDate <= now
      default:
        return true
    }
  })

  // Show loading state
  if (loading && isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Registrations</h1>
            <p className="text-gray-600">
              Manage your event registrations and access your tickets
            </p>
          </div>
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading your registrations...</span>
          </div>
        </div>
      </div>
    )
  }

  // Log GraphQL errors but continue with fallback data
  if (error) {
    console.error('Error loading user registrations:', error)
  }

  const handleDownloadQR = (qrCode: string, eventName: string) => {
    // TODO: Implement actual QR code download functionality
    alert(`Downloading QR code for ${eventName}: ${qrCode}`)
  }

  return (
    <AuthGuard>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Registrations</h1>
          <p className="text-gray-600">
            Manage your event registrations and access your tickets
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white rounded-lg p-1 w-fit">
            {[
              { key: 'all', label: 'All Events' },
              { key: 'upcoming', label: 'Upcoming' },
              { key: 'past', label: 'Past Events' }
            ].map((tab: any) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Registrations List */}
        {filteredRegistrations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No registrations found</h3>
              <p className="text-gray-600 mb-4">
                {filter === 'all' 
                  ? "You haven't registered for any events yet."
                  : `No ${filter} events found.`
                }
              </p>
              <Button asChild>
                <Link href="/">Browse Events</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredRegistrations.map((registration: any) => (
              <Card key={registration.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                    {/* Event Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {registration.event.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Registration ID: {registration.id}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge variant={statusColors[registration.status as keyof typeof statusColors]}>
                            {registration.status}
                          </Badge>
                          <Badge variant={paymentStatusColors[registration.paymentStatus as keyof typeof paymentStatusColors]}>
                            {registration.paymentStatus}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(registration.event.date)}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          {registration.event.venue}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Ticket className="h-4 w-4 mr-2" />
                          {registration.category.name} - {formatCurrency(registration.category.price)}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <QrCode className="h-4 w-4 mr-2" />
                          QR Code: {registration.qrCode}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        Registered on {formatDate(registration.registrationDate)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 lg:ml-6">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/events/${registration.event.slug}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Event
                        </Link>
                      </Button>
                      
                      {registration.status === 'APPROVED' && registration.paymentStatus === 'PAID' && (
                        <Button 
                          size="sm"
                          onClick={() => handleDownloadQR(registration.qrCode, registration.event.name)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download QR
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Registration Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{registrations.length}</div>
                <div className="text-sm text-gray-600">Total Registrations</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {registrations.filter((r: any) => r.paymentStatus === 'APPROVED' || r.status === 'APPROVED').length}
                </div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {registrations.filter((r: any) => r.paymentStatus === 'PENDING' || r.status === 'PENDING').length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(
                    registrations
                      .filter((r: any) => r.paymentStatus === 'PAID' || r.paymentStatus === 'APPROVED')
                      .reduce((sum: number, r: any) => sum + (r.category?.price || 0), 0)
                  )}
                </div>
                <div className="text-sm text-gray-600">Total Spent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </AuthGuard>
  )
}
