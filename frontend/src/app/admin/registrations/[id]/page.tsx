'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth-simple'
import { useRegistration } from '@/lib/graphql/hooks'
import { useRegistrationQRCode } from '@/hooks/use-qr-code'
import { QRCodeDisplay } from '@/components/qr/qr-code-display'
import { BadgePreview } from '@/components/badge/badge-preview'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  CreditCard, 
  QrCode,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Download,
  MessageSquare,
  Loader2
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { getRegistrationAmount } from '@/lib/utils/currency'

export default function RegistrationDetailsPage() {
  const { isAuthenticated, user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const registrationId = params.id as string
  
  // Fetch registration data using GraphQL
  const { data, loading, error } = useRegistration({ id: registrationId })
  const registration = data?.registration

  // QR Code functionality
  const {
    qrCodeData,
    loading: qrLoading,
    error: qrError,
    generate: generateQR,
    regenerate: regenerateQR
  } = useRegistrationQRCode(registrationId)

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading registration details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Error Loading Registration</CardTitle>
            <CardDescription>Failed to load registration details</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">{error.message}</p>
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Not found state
  if (!registration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Registration Not Found</CardTitle>
            <CardDescription>The requested registration could not be found</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/admin/registrations')} className="bg-orange-600 hover:bg-orange-700">
              Back to Registrations
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to view registration details</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/admin">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-50 text-green-700 border-green-200">Approved</Badge>
      case 'DECLINED':
        return <Badge className="bg-red-50 text-red-700 border-red-200">Declined</Badge>
      case 'PENDING':
      default:
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-50 text-green-700 border-green-200">Paid</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
      case 'FAILED':
        return <Badge className="bg-red-50 text-red-700 border-red-200">Failed</Badge>
      default:
        return <Badge className="bg-gray-50 text-gray-700 border-gray-200">Unknown</Badge>
    }
  }

  const getCheckInStatusBadge = (status: string) => {
    switch (status) {
      case 'CHECKED_IN':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Checked In</Badge>
      case 'NOT_CHECKED_IN':
      default:
        return <Badge className="bg-gray-50 text-gray-700 border-gray-200">Not Checked In</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/registrations">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Registrations
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Registration Details</h1>
              <p className="text-gray-600">#{registration?.registrationNumber || 'Loading...'}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Registration Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-orange-600" />
                    Registration Overview
                  </CardTitle>
                  {registration?.status && getStatusBadge(registration.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registration Number</label>
                    <p className="text-lg font-semibold text-gray-900">{registration?.registrationNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registration Date</label>
                    <p className="text-lg text-gray-900">{registration?.createdAt && formatDate(registration.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="text-lg text-gray-900">{registration?.updatedAt && formatDate(registration.updatedAt)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">QR Code Status</label>
                    <p className="text-lg text-gray-900">
                      {registration?.qrCode ? (
                        <Badge className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Generated
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Not Generated
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendee Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Attendee Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-lg text-gray-900">{registration?.user?.firstName} {registration?.user?.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-lg text-gray-900 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {registration?.user?.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-lg text-gray-900 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {registration?.user?.phone}
                    </p>
                  </div>
                </div>
                
                {registration?.specialRequests && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Special Requests</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{registration.specialRequests}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Event Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{registration?.event?.name}</h3>
                  <p className="text-gray-600 mb-4">{registration?.event?.description}</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Event Date</label>
                    <p className="text-lg text-gray-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {registration?.event?.date && formatDate(registration.event.date)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Venue</label>
                    <p className="text-lg text-gray-900 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {registration?.event?.venue}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <p className="text-lg text-gray-900">{registration?.category?.name}</p>
                    <p className="text-sm text-gray-500">{registration?.category?.description}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category Price</label>
                    <p className="text-lg font-semibold text-orange-600">{registration?.category?.price && formatCurrency(registration.category.price)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badge Preview */}
            <BadgePreview
              participantName={`${registration?.user?.firstName || ''} ${registration?.user?.lastName || ''}`.trim()}
              eventName={registration?.event?.name || 'Event Name'}
              eventDate={registration?.event?.date ? new Date(registration.event.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Event Date'}
              venue={registration?.event?.venue || 'Event Venue'}
              category={registration?.category?.name || 'Category'}
              categoryColor="#ea580c"
              qrCodeImage={qrCodeData?.base64Image || undefined}
              registrationNumber={registration?.registrationNumber}
              loading={qrLoading}
              error={qrError?.message}
            />

            {/* Meal Attendance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-purple-600" />
                  Meal Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {registration?.mealAttendances?.length && registration.mealAttendances.length > 0 ? registration.mealAttendances.map((attendance: any) => (
                    <div key={attendance.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{attendance?.meal?.name}</h4>
                        <p className="text-sm text-gray-500">
                          {attendance?.meal?.date && formatDate(attendance.meal.date)} • {attendance?.meal?.venue || 'TBD'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {attendance.attended ? (
                          <>
                            <Badge className="bg-green-50 text-green-700 border-green-200">Attended</Badge>
                            <p className="text-sm text-gray-500">
                              {attendance.attendedAt && formatDate(attendance.attendedAt)}
                            </p>
                          </>
                        ) : (
                          <Badge className="bg-gray-50 text-gray-700 border-gray-200">Not Attended</Badge>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No meal attendance records found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code Section */}
            <QRCodeDisplay
              registrationId={registrationId}
              qrCode={qrCodeData?.qrCode || registration?.qrCode}
              qrCodeData={qrCodeData?.qrCodeData || undefined}
              base64Image={qrCodeData?.base64Image}
              onGenerate={generateQR}
              onRegenerate={regenerateQR}
              loading={qrLoading}
              error={qrError?.message}
            />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Attendee
                </Button>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
              </CardContent>
            </Card>

            {/* Status Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Status Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Registration Status</span>
                  {registration?.status && getStatusBadge(registration.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Payment Status</span>
                  {registration?.paymentStatus && getPaymentStatusBadge(registration.paymentStatus)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Check-in Status</span>
                  {registration?.checkInStatus && getCheckInStatusBadge(registration.checkInStatus)}
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-green-600" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Amount Paid</span>
                  <span className="text-lg font-semibold text-green-600">
                    {formatCurrency(getRegistrationAmount(registration))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Payment Method</span>
                  <span className="text-sm text-gray-900">{registration?.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Reference</span>
                  <span className="text-sm font-mono text-gray-900">{registration?.paymentReference}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Receipt Number</span>
                  <span className="text-sm font-mono text-gray-900">{registration?.receiptNumber}</span>
                </div>
              </CardContent>
            </Card>

            {/* Check-in Details */}
            {(registration?.checkInStatus === 'CHECKED_IN' || registration?.checkedIn) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    Check-in Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Check-in Time</span>
                    <span className="text-sm text-gray-900">
                      {(registration?.checkInTime || registration?.checkedInAt) && formatDate(registration?.checkInTime || registration?.checkedInAt || '')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
