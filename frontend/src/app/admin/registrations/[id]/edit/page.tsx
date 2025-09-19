'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth-simple'
import { useRegistration, useUpdateRegistration, useEvents } from '@/lib/graphql/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  CreditCard,
  Loader2,
  AlertTriangle
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface RegistrationFormData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  organization?: string
  jobTitle?: string
  dietaryRestrictions?: string
  specialRequests?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  paymentStatus: string
  registrationStatus: string
}

export default function EditRegistrationPage() {
  const { isAuthenticated, user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<RegistrationFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organization: '',
    jobTitle: '',
    dietaryRestrictions: '',
    specialRequests: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    paymentStatus: 'PENDING',
    registrationStatus: 'PENDING'
  })

  const registrationId = params.id as string
  
  // Fetch registration data
  const { data, loading, error } = useRegistration({ id: registrationId })
  const registration = data?.registration

  // Update mutation
  const [updateRegistration] = useUpdateRegistration()

  // Populate form when registration data loads
  useEffect(() => {
    if (registration) {
      setFormData({
        firstName: registration.firstName || '',
        lastName: registration.lastName || '',
        email: registration.email || '',
        phone: registration.phone || '',
        organization: registration.organization || '',
        jobTitle: registration.jobTitle || '',
        dietaryRestrictions: registration.dietaryRestrictions || '',
        specialRequests: registration.specialRequests || '',
        emergencyContactName: registration.emergencyContactName || '',
        emergencyContactPhone: registration.emergencyContactPhone || '',
        paymentStatus: registration.paymentStatus || 'PENDING',
        registrationStatus: registration.registrationStatus || 'PENDING'
      })
    }
  }, [registration])

  const handleInputChange = (field: keyof RegistrationFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await updateRegistration({
        variables: {
          id: registrationId,
          input: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            organization: formData.organization,
            jobTitle: formData.jobTitle,
            dietaryRestrictions: formData.dietaryRestrictions,
            specialRequests: formData.specialRequests,
            emergencyContactName: formData.emergencyContactName,
            emergencyContactPhone: formData.emergencyContactPhone,
            paymentStatus: formData.paymentStatus as any,
            registrationStatus: formData.registrationStatus as any
          }
        }
      })

      toast.success('Registration updated successfully!')
      router.push(`/admin/registrations/${registrationId}`)
    } catch (error) {
      console.error('Error updating registration:', error)
      toast.error('Failed to update registration. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return <div>Please log in to access this page.</div>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !registration) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Not Found</h1>
        <p className="text-gray-600 mb-4">The registration you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link href="/admin/registrations">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Registrations
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/admin/registrations/${registrationId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Details
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Registration</h1>
            <p className="text-gray-600">Update registration information for {registration.firstName} {registration.lastName}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  value={formData.organization}
                  onChange={(e) => handleInputChange('organization', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="dietaryRestrictions">Dietary Restrictions</Label>
              <Textarea
                id="dietaryRestrictions"
                value={formData.dietaryRestrictions}
                onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Textarea
                id="specialRequests"
                value={formData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                <Input
                  id="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                <Input
                  id="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Status Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select value={formData.paymentStatus} onValueChange={(value) => handleInputChange('paymentStatus', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="registrationStatus">Registration Status</Label>
                <Select value={formData.registrationStatus} onValueChange={(value) => handleInputChange('registrationStatus', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Information (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Event</Label>
                <p className="text-sm font-medium">{registration.event?.name}</p>
              </div>
              <div>
                <Label>Category</Label>
                <p className="text-sm font-medium">{registration.category?.name} - {formatCurrency(registration.category?.price || 0)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Registration Date</Label>
                <p className="text-sm">{new Date(registration.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <Label>Total Amount</Label>
                <p className="text-sm font-medium">{formatCurrency(registration.totalAmount || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Link href={`/admin/registrations/${registrationId}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
