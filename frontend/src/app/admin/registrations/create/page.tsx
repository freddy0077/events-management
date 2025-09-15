'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  UserPlus, 
  ArrowLeft, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Users,
  Calendar,
  DollarSign,
  Shield,
  Building,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Receipt
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { useEvents, useCreateStaffRegistration } from '@/lib/graphql/hooks'
import { toast } from 'sonner'

interface RegistrationFormData {
  eventId: string
  categoryId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  organization?: string
  dietaryRequirements?: string
  emergencyContact?: string
  emergencyPhone?: string
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_MONEY'
  receiptNumber?: string
  notes?: string
}

export default function CreateRegistrationPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  
  // Form data state
  const [formData, setFormData] = useState<RegistrationFormData>({
    eventId: '',
    categoryId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    organization: '',
    dietaryRequirements: '',
    emergencyContact: '',
    emergencyPhone: '',
    paymentMethod: 'CASH',
    receiptNumber: '',
    notes: ''
  })

  // Use real GraphQL data with debugging
  const { data: eventsData, loading: eventsLoading, error: eventsError, refetch: refetchEvents } = useEvents()
  const events = (eventsData as any)?.events || []
  const [createStaffRegistration, { loading: submissionLoading }] = useCreateStaffRegistration()

  // Debug events loading
  useEffect(() => {
    console.log('🔍 Events Query State:', {
      events: events,
      eventsCount: events?.length || 0,
      loading: eventsLoading,
      error: eventsError,
      errorDetails: eventsError?.message,
      graphQLErrors: (eventsError as any)?.graphQLErrors,
      networkError: (eventsError as any)?.networkError
    })

    if (eventsLoading) {
      console.log('⏳ Loading events...')
    } else if (eventsError) {
      console.error('❌ Error loading events:', eventsError)
      toast.error('Failed to load events. Please refresh the page.')
    } else if (events) {
      console.log('✅ Events loaded successfully:', events.length, events)
    } else {
      console.log('⚠️ No events data received')
    }
  }, [events, eventsLoading, eventsError])

  // Add manual refetch function for debugging
  const handleRefetchEvents = () => {
    console.log('🔄 Manually refetching events...')
    refetchEvents().then(result => {
      console.log('🔄 Refetch result:', result)
    }).catch(error => {
      console.error('🔄 Refetch error:', error)
    })
  }

  // Check authentication and environment on component mount
  useEffect(() => {
    console.log('🔍 Environment Check:', {
      graphqlUrl: process.env.NEXT_PUBLIC_GRAPHQL_URL,
      hasToken: !!localStorage.getItem('token'),
      user: user,
      nodeEnv: process.env.NODE_ENV
    })
  }, [])

  const handleInputChange = (field: keyof RegistrationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleEventChange = (eventId: string) => {
    const event = events?.find((e: any) => e.id === eventId)
    setSelectedEvent(event)
    setSelectedCategory(null)
    setFormData(prev => ({ ...prev, eventId, categoryId: '' }))
  }

  const handleCategoryChange = (categoryId: string) => {
    const category = selectedEvent?.categories.find((c: any) => c.id === categoryId)
    setSelectedCategory(category)
    setFormData(prev => ({ ...prev, categoryId }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.eventId || !formData.categoryId || !formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!selectedCategory) {
      toast.error('Please select a valid category')
      return
    }

    // Check capacity
    if (selectedCategory.currentCount >= selectedCategory.maxCapacity) {
      toast.error('Selected category is at full capacity')
      return
    }

    setIsSubmitting(true)

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        toast.error('Please enter a valid email address')
        return
      }

      // Validate phone format (basic validation)
      if (formData.phone && formData.phone.length < 10) {
        toast.error('Please enter a valid phone number')
        return
      }

      const registrationInput = {
        eventId: formData.eventId,
        categoryId: formData.categoryId,
        participantData: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          address: formData.address.trim(),
          organization: formData.organization?.trim() || undefined,
          dietaryRequirements: formData.dietaryRequirements?.trim() || undefined,
          emergencyContact: formData.emergencyContact?.trim() || undefined,
          emergencyPhone: formData.emergencyPhone?.trim() || undefined,
        },
        paymentData: formData.receiptNumber?.trim() ? {
          amount: selectedCategory.price,
          paymentMethod: formData.paymentMethod,
          receiptNumber: formData.receiptNumber.trim(),
        } : undefined,
        staffNotes: formData.notes?.trim() || undefined,
      }

      console.log('Submitting registration:', registrationInput)

      const result = await createStaffRegistration({
        variables: { input: registrationInput }
      })
      
      if ((result.data as any)?.createStaffRegistration) {
        const registration = (result.data as any).createStaffRegistration.registration
        toast.success(`Registration created successfully for ${registration.firstName} ${registration.lastName}!`)
        
        // Reset form
        setFormData({
          eventId: '',
          categoryId: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          organization: '',
          dietaryRequirements: '',
          emergencyContact: '',
          emergencyPhone: '',
          paymentMethod: 'CASH',
          receiptNumber: '',
          notes: ''
        })
        setSelectedEvent(null)
        setSelectedCategory(null)
        
        // Navigate to registrations list
        router.push('/admin/registrations')
      }
    } catch (error: any) {
      console.error('Registration creation error:', error)
      
      // Handle specific GraphQL errors
      if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        const graphQLError = error.graphQLErrors[0]
        toast.error(graphQLError.message || 'Registration failed. Please check your input.')
      } else if (error.networkError) {
        toast.error('Network error. Please check your connection and try again.')
      } else {
        toast.error(error.message || 'Failed to create registration. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" asChild className="border-orange-200 hover:border-orange-300 hover:bg-orange-50">
            <Link href="/admin/registrations">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Registrations
            </Link>
          </Button>
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-2 mb-2">
              <Building className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">Staff Registration Portal</span>
            </div>
            <h1 className="text-3xl font-bold text-neutral-900">
              Register New Participant
            </h1>
            <p className="text-neutral-600 mt-2">
              Create a new event registration on behalf of a participant
            </p>
          </div>
        </div>

        {/* Staff Info Banner */}
        <Card className="mb-8 border-orange-200 bg-orange-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Shield className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-900">Staff Registration</h3>
                <p className="text-sm text-orange-700">
                  Registering as: <span className="font-medium">{user?.firstName} {user?.lastName}</span> 
                  ({user?.role === 'ADMIN' ? 'Administrator' : user?.role === 'MODERATOR' ? 'Moderator' : 'Staff Member'})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State for Events */}
        {eventsLoading && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                  <span className="text-lg font-medium text-neutral-700">Loading events...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State for Events */}
        {eventsError && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <div>
                    <h3 className="font-semibold text-red-900">Failed to Load Events</h3>
                    <p className="text-sm text-red-700 mt-1">
                      Unable to load events. Error: {eventsError.message}
                    </p>
                    {(eventsError as any)?.networkError && (
                      <p className="text-xs text-red-600 mt-1">
                        Network Error: {(eventsError as any).networkError.message}
                      </p>
                    )}
                    {(eventsError as any)?.graphQLErrors && (eventsError as any).graphQLErrors.length > 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        GraphQL Error: {(eventsError as any).graphQLErrors[0].message}
                      </p>
                    )}
                  </div>
                </div>
                <Button 
                  onClick={handleRefetchEvents}
                  variant="outline" 
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">Debug Information</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Events Loading: {eventsLoading ? 'Yes' : 'No'} | 
                    Events Count: {events?.length || 0} | 
                    Has Error: {eventsError ? 'Yes' : 'No'}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    GraphQL URL: {process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql'} | 
                    Has Token: {typeof window !== 'undefined' ? (localStorage.getItem('token') ? 'Yes' : 'No') : 'SSR'}
                  </p>
                  {eventsError && (
                    <p className="text-xs text-red-600 mt-1">
                      Error: {eventsError.message}
                    </p>
                  )}
                </div>
                <Button 
                  onClick={handleRefetchEvents}
                  variant="outline" 
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Refetch Events
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Event Selection */}
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    Event Selection
                    {eventsLoading && <Loader2 className="h-4 w-4 animate-spin text-orange-600" />}
                  </CardTitle>
                  <CardDescription>
                    Choose the event and category for this registration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="event">Event *</Label>
                    <Select value={formData.eventId} onValueChange={handleEventChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an event" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventsLoading ? (
                          <SelectItem value="loading" disabled>
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Loading events...</span>
                            </div>
                          </SelectItem>
                        ) : eventsError ? (
                          <SelectItem value="error" disabled>
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-red-500" />
                              <span>Error loading events</span>
                            </div>
                          </SelectItem>
                        ) : events && events.length > 0 ? (
                          events.map((event: any) => (
                            <SelectItem key={event.id} value={event.id}>
                              <div className="flex items-center gap-2">
                                <span>{event.name}</span>
                                <Badge variant={event.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                                  {event.status}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-events" disabled>
                            <span>No events available</span>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedEvent && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">{selectedEvent.name}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(selectedEvent.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {selectedEvent.venue}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedEvent && (
                    <div className="space-y-2">
                      <Label htmlFor="category">Registration Category *</Label>
                      <Select value={formData.categoryId} onValueChange={handleCategoryChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedEvent.categories.map((category: any) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{category.name}</span>
                                <div className="flex items-center gap-2 ml-4">
                                  <span className="text-green-600 font-medium">GHS{category.price}</span>
                                  <span className="text-xs text-neutral-500">
                                    ({category.currentCount}/{category.maxCapacity})
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedCategory && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-green-900">{selectedCategory.name}</h4>
                        <Badge className="bg-green-100 text-green-800">
                          GHS{selectedCategory.price}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-green-700">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{selectedCategory.currentCount}/{selectedCategory.maxCapacity} registered</span>
                        </div>
                        {selectedCategory.currentCount >= selectedCategory.maxCapacity && (
                          <Badge variant="destructive" className="text-xs">
                            FULL
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Participant Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Participant Information
                  </CardTitle>
                  <CardDescription>
                    Enter the participant's personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="Enter first name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Enter last name"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="participant@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter full address"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization (Optional)</Label>
                    <Input
                      id="organization"
                      value={formData.organization}
                      onChange={(e) => handleInputChange('organization', e.target.value)}
                      placeholder="Company or organization name"
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact">Emergency Contact</Label>
                      <Input
                        id="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                        placeholder="Emergency contact name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                      <Input
                        id="emergencyPhone"
                        type="tel"
                        value={formData.emergencyPhone}
                        onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                        placeholder="Emergency contact phone"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dietaryRequirements">Dietary Requirements</Label>
                    <Textarea
                      id="dietaryRequirements"
                      value={formData.dietaryRequirements}
                      onChange={(e) => handleInputChange('dietaryRequirements', e.target.value)}
                      placeholder="Any dietary restrictions or requirements"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    Payment Information
                  </CardTitle>
                  <CardDescription>
                    Record payment details for this registration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Payment Method *</Label>
                      <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH">Cash</SelectItem>
                          <SelectItem value="CARD">Credit/Debit Card</SelectItem>
                          <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                          <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="receiptNumber">Receipt Number</Label>
                      <Input
                        id="receiptNumber"
                        value={formData.receiptNumber}
                        onChange={(e) => handleInputChange('receiptNumber', e.target.value)}
                        placeholder="Enter receipt/transaction number"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Staff Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Any additional notes about this registration"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-purple-600" />
                    Registration Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedEvent && selectedCategory ? (
                    <>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-neutral-700">Event</p>
                          <p className="text-neutral-900">{selectedEvent.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-700">Category</p>
                          <p className="text-neutral-900">{selectedCategory.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-700">Price</p>
                          <p className="text-2xl font-bold text-green-600">GHS{selectedCategory.price}</p>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Registration Fee</span>
                          <span>GHS{selectedCategory.price}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span>GHS{selectedCategory.price}</span>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600"
                        disabled={
                          isSubmitting || 
                          submissionLoading || 
                          eventsLoading || 
                          !formData.firstName || 
                          !formData.lastName || 
                          !formData.email || 
                          !formData.eventId || 
                          !formData.categoryId
                        }
                      >
                        {(isSubmitting || submissionLoading) ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating Registration...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Create Registration
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-neutral-400 mx-auto mb-3" />
                      <p className="text-neutral-500">Select an event and category to see pricing</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
