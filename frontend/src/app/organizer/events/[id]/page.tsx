'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth-simple'
import { useEvent } from '@/lib/graphql/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, MapPin, Users, Loader2, ArrowLeft, Settings, QrCode, FileText, UserPlus } from 'lucide-react'
import { format } from 'date-fns'

export default function OrganizerEventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const { isAuthenticated, user } = useAuth()

  const { data, loading, error } = useEvent({ id: eventId })
  const event = data?.event

  if (!isAuthenticated || user?.role !== 'EVENT_ORGANIZER') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to view this page</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/organizer/dashboard">Back to Organizer Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          <span className="text-gray-600">Loading event...</span>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle>Event Not Found</CardTitle>
            <CardDescription>The event you're looking for doesn't exist or has been removed.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button asChild>
              <Link href="/organizer/events">My Events</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusColor = (() => {
    switch (event.status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800'
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  })()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="hover:bg-orange-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-2 mb-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Manage Event</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
          </div>
        </div>
        <Badge className={statusColor}>{event.status}</Badge>
      </div>

      {/* Event Overview */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-700">
                <Calendar className="h-4 w-4 mr-2" />
                {event.date && (
                  <span>
                    {format(new Date(event.date), 'PPP')}
                    {event.endDate && event.endDate !== event.date && (
                      <span> - {format(new Date(event.endDate), 'PPP')}</span>
                    )}
                  </span>
                )}
              </div>
              {event.venue && (
                <div className="flex items-center text-sm text-gray-700">
                  <MapPin className="h-4 w-4 mr-2" />
                  {event.venue}
                </div>
              )}
              <div className="flex items-center text-sm text-gray-700">
                <Users className="h-4 w-4 mr-2" />
                {event.totalRegistrations || 0} total registrations
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Description</div>
              <div className="text-gray-900">{event.description || 'No description provided'}</div>
            </div>
          </div>

          <Separator />

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button asChild variant="outline" className="justify-start">
              <Link href={`/organizer/registrations?eventId=${event.id}`}>
                <Users className="h-4 w-4 mr-2" />
                Registrations
              </Link>
            </Button>

            <Button asChild variant="outline" className="justify-start">
              <Link href={`/organizer/scanner?eventId=${event.id}`}>
                <QrCode className="h-4 w-4 mr-2" />
                QR Scanner
              </Link>
            </Button>

            <Button asChild variant="outline" className="justify-start">
              <Link href={`/organizer/staff?eventId=${event.id}`}>
                <UserPlus className="h-4 w-4 mr-2" />
                Staff
              </Link>
            </Button>

            <Button asChild variant="outline" className="justify-start">
              <Link href={`/organizer/reports?eventId=${event.id}`}>
                <FileText className="h-4 w-4 mr-2" />
                Reports
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manage Sections (placeholders for now) */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-600" />
              Event Settings
            </CardTitle>
            <CardDescription>Basic information about this event</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <div><span className="font-medium">Venue:</span> {event.venue || '—'}</div>
            <div><span className="font-medium">Address:</span> {event.address || '—'}</div>
            <div><span className="font-medium">Capacity:</span> {event.maxCapacity ?? '—'}</div>
            <div><span className="font-medium">Payment Required:</span> {event.paymentRequired ? 'Yes' : 'No'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              Participation
            </CardTitle>
            <CardDescription>Registration and attendance overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <div><span className="font-medium">Total Registrations:</span> {event.totalRegistrations || 0}</div>
            <div><span className="font-medium">Approved Registrations:</span> {event.approvedRegistrations || 0}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
