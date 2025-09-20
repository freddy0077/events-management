'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useMyAssignedEvents, useCreateStaffRegistration } from '@/lib/graphql/hooks'
import { formatGHS } from '@/lib/utils/currency'
import { toast } from 'sonner'
import { useCentralizedQRBadge } from '@/hooks/use-centralized-qr-badge'
import { badgeTemplates } from '@/components/badges/BadgeTemplates'
import { 
  ArrowLeft,
  UserPlus,
  CreditCard,
  Receipt,
  Loader2,
  AlertCircle,
  CheckCircle,
  Search,
  Printer,
  Mail,
  Smartphone,
  Building,
  Banknote,
  Zap,
  RefreshCw,
  User,
  ShoppingCart,
  Eye
} from 'lucide-react'

interface RegistrationFormData {
  eventId: string
  categoryId: string
  fullName: string
  email: string
  phone: string
  address: string
  receiptNumber: string
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_MONEY'
  notes?: string
}

export default function POSRegistrationPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<RegistrationFormData>({
    eventId: '',
    categoryId: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    receiptNumber: '',
    paymentMethod: 'CASH',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPrintingBadge, setIsPrintingBadge] = useState(false)
  const [receiptSearching, setReceiptSearching] = useState(false)
  const [step, setStep] = useState<'details' | 'payment' | 'confirmation'>('details')
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Fetch assigned events
  const { data: eventsData, loading: eventsLoading } = useMyAssignedEvents()
  const assignedEvents = (eventsData as any)?.myAssignedEvents || []

  // Get selected event details
  const selectedEvent = assignedEvents.find((event: any) => event.id === formData.eventId)
  const categories = selectedEvent?.categories || []

  // Get selected category details
  const selectedCategory = categories.find((cat: any) => cat.id === formData.categoryId)

  // Get badge template information
  const getBadgeTemplate = (templateId: string | null | undefined) => {
    if (!templateId) return null
    return badgeTemplates.find(template => template.id === templateId)
  }

  const selectedBadgeTemplate = getBadgeTemplate(selectedEvent?.badgeTemplateId)


  // Create registration mutation
  const [createStaffRegistration] = useCreateStaffRegistration()
  
  // Centralized QR and Badge functionality
  const { generateAndPrintBadge, generateAndConvertToPDF, loading: badgeLoading } = useCentralizedQRBadge()

  // Auto-focus on name input when component mounts
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return
      
      switch (e.key) {
        case 'F1':
          e.preventDefault()
          if (categories[0]) selectCategory(categories[0])
          break
        case 'F2':
          e.preventDefault()
          if (categories[1]) selectCategory(categories[1])
          break
        case 'F3':
          e.preventDefault()
          if (categories[2]) selectCategory(categories[2])
          break
        case 'F4':
          e.preventDefault()
          if (categories[3]) selectCategory(categories[3])
          break
        case 'Enter':
          if (e.target instanceof HTMLInputElement && e.target.type !== 'submit') {
            e.preventDefault()
            const form = e.target.form
            if (form) {
              const inputs = Array.from(form.querySelectorAll('input'))
              const currentIndex = inputs.indexOf(e.target)
              const nextInput = inputs[currentIndex + 1]
              if (nextInput) {
                nextInput.focus()
              }
            }
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [categories])

  const handleInputChange = (field: keyof RegistrationFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Reset category when event changes
    if (field === 'eventId') {
      setFormData(prev => ({
        ...prev,
        categoryId: ''
      }))
    }
  }

  const selectCategory = (category: any) => {
    setFormData(prev => ({
      ...prev,
      categoryId: category.id
    }))
  }

  const selectPaymentMethod = (method: RegistrationFormData['paymentMethod']) => {
    setFormData(prev => ({
      ...prev,
      paymentMethod: method
    }))
  }

  const handleReceiptSearch = async () => {
    if (!formData.receiptNumber.trim()) {
      toast.error('Please enter a receipt number')
      return
    }
    
    setReceiptSearching(true)
    // Simulate receipt search - replace with actual API call
    setTimeout(() => {
      setReceiptSearching(false)
      toast.success('Receipt validated successfully!')
    }, 1500)
  }

  const canProceedToPayment = () => {
    return formData.fullName && formData.email && formData.phone && formData.address && formData.categoryId
  }

  const canCompleteRegistration = () => {
    return canProceedToPayment() && formData.paymentMethod && formData.receiptNumber && !isRegistrationDeadlinePassed()
  }

  const isRegistrationDeadlinePassed = () => {
    if (!selectedEvent?.registrationDeadline) return false
    
    const now = new Date()
    const deadline = new Date(selectedEvent.registrationDeadline)
    return now > deadline
  }

  const getDeadlineWarning = () => {
    if (!selectedEvent?.registrationDeadline) return null
    
    const now = new Date()
    const deadline = new Date(selectedEvent.registrationDeadline)
    
    if (now > deadline) {
      return {
        type: 'error' as const,
        message: `Registration deadline has passed (${deadline.toLocaleDateString()})`
      }
    }
    
    // Show warning if deadline is within 24 hours
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
    if (hoursUntilDeadline <= 24 && hoursUntilDeadline > 0) {
      return {
        type: 'warning' as const,
        message: `Registration deadline is soon: ${deadline.toLocaleDateString()} at ${deadline.toLocaleTimeString()}`
      }
    }
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.eventId || !formData.categoryId || !formData.fullName || 
        !formData.email || !formData.phone || !formData.address || !formData.receiptNumber) {
      toast.error('Please fill in all required fields')
      return
    }

    // Check registration deadline
    if (isRegistrationDeadlinePassed()) {
      toast.error('Cannot register participant - registration deadline has passed')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createStaffRegistration({
        variables: {
          input: {
            eventId: formData.eventId,
            categoryId: formData.categoryId,
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            receiptNumber: formData.receiptNumber,
            specialRequests: formData.notes,
            paymentMethod: formData.paymentMethod
          }
        }
      })

      if ((result.data as any)?.createStaffRegistration?.registration) {
        const registration = (result.data as any).createStaffRegistration.registration
        toast.success('Registration created successfully!')
        
        // Automatically convert badge to PDF after successful registration
        try {
          console.log('=== Badge Generation Debug ===')
          console.log('Registration ID:', registration.id)
          console.log('Event Name:', selectedEvent?.name)
          console.log('Badge Template ID:', selectedEvent?.badgeTemplateId)
          console.log('Selected Event Object:', selectedEvent)
          
          await generateAndConvertToPDF(
            registration.id, 
            formData.fullName, 
            selectedEvent?.name || 'Event',
            selectedEvent?.badgeTemplateId // Pass the event's badge template ID
          )
          toast.success('Badge converted to PDF successfully!')
        } catch (badgeError: any) {
          console.error('Badge PDF conversion error:', badgeError)
          toast.warning('Registration created but badge PDF conversion failed. You can generate it manually from the registrations page.')
        }
        
        router.push('/staff/registrations')
      }
    } catch (error: any) {
      console.error('Registration creation error:', error)
      toast.error(error.message || 'Failed to create registration')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center gap-3 bg-white p-6 rounded-lg shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <span className="text-lg font-medium">Loading events...</span>
        </div>
      </div>
    )
  }

  if (assignedEvents.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Card className="text-center">
            <CardContent className="py-12">
              <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Events Assigned</h3>
              <p className="text-gray-600 mb-6">
                You need to be assigned to at least one event to create registrations.
              </p>
              <Button onClick={() => router.back()} className="bg-orange-500 hover:bg-orange-600">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Auto-select first event if only one available
  if (assignedEvents.length === 1 && !formData.eventId) {
    setFormData(prev => ({ ...prev, eventId: assignedEvents[0].id }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Modern POS Header Bar - High Contrast for Sunlight */}
      <div className="bg-white shadow-lg border-b-4 border-orange-500 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              onClick={() => router.back()} 
              className="text-slate-800 hover:bg-slate-100 h-12 px-4 font-semibold border-2 border-transparent hover:border-slate-300"
            >
              <ArrowLeft className="h-6 w-6 mr-3" />
              Back
            </Button>
            <div className="h-10 w-px bg-slate-400" />
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">POS Registration</h1>
          </div>
          <div className="flex items-center gap-4">
            {selectedEvent && (
              <div className="flex items-center gap-3">
                <Badge className="text-base px-4 py-2 bg-orange-600 text-white font-bold shadow-md">
                  {selectedEvent.name}
                </Badge>
                {getDeadlineWarning() && (
                  <Badge className={`text-sm px-3 py-2 font-semibold shadow-md flex items-center gap-2 ${
                    getDeadlineWarning()?.type === 'error' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-yellow-600 text-white'
                  }`}>
                    <AlertCircle className="h-4 w-4" />
                    {getDeadlineWarning()?.message}
                  </Badge>
                )}
                {selectedBadgeTemplate && (
                  <Badge className="text-sm px-3 py-2 bg-purple-600 text-white font-semibold shadow-md flex items-center gap-2">
                    <span className="text-lg">{selectedBadgeTemplate.preview}</span>
                    {selectedBadgeTemplate.name}
                  </Badge>
                )}
                {selectedEvent.badgeTemplateId && !selectedBadgeTemplate && (
                  <Badge className="text-sm px-3 py-2 bg-gray-600 text-white font-semibold shadow-md">
                    Badge Template: {selectedEvent.badgeTemplateId}
                  </Badge>
                )}
              </div>
            )}
            <Button className="bg-slate-800 hover:bg-slate-700 text-white h-12 px-6 font-semibold shadow-lg">
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Participant Details */}
          <div className="space-y-8">
            {/* Event Selection */}
            {assignedEvents.length > 1 && (
              <Card className="shadow-xl border-2 border-slate-200 bg-white">
                <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                  <CardTitle className="text-xl font-bold text-slate-900">Select Event</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-4">
                    {assignedEvents.map((event: any) => (
                      <Button
                        key={event.id}
                        type="button"
                        variant={formData.eventId === event.id ? "default" : "outline"}
                        className={`justify-start h-16 text-left font-semibold shadow-md border-2 ${
                          formData.eventId === event.id 
                            ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600 shadow-orange-200' 
                            : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300 hover:border-slate-400'
                        }`}
                        onClick={() => handleInputChange('eventId', event.id)}
                      >
                        <div className="text-left">
                          <div className="font-bold text-lg">{event.name}</div>
                          <div className="text-sm opacity-80">{event.venue}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Participant Details */}
            <Card className="shadow-xl border-2 border-slate-200 bg-white">
              <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-200">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                  <User className="h-6 w-6 text-blue-600" />
                  Participant Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="fullName" className="text-base font-bold text-slate-900">Full Name *</Label>
                  <Input
                    ref={nameInputRef}
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter participant's full name"
                    className="h-16 text-xl font-semibold border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-md bg-white"
                    autoComplete="name"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-base font-bold text-slate-900">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="participant@email.com"
                      className="h-16 text-lg border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-md bg-white"
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-base font-bold text-slate-900">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+233 XX XXX XXXX"
                      className="h-16 text-lg border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-md bg-white"
                      autoComplete="tel"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="address" className="text-base font-bold text-slate-900">Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter address"
                      className="h-16 text-lg border-2 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-md bg-white"
                      autoComplete="address-line1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Receipt Search */}
            <Card className="shadow-xl border-2 border-slate-200 bg-white">
              <CardHeader className="pb-4 bg-gradient-to-r from-purple-50 to-purple-100 border-b-2 border-purple-200">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                  <Search className="h-6 w-6 text-purple-600" />
                  Receipt Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-4">
                  <Input
                    value={formData.receiptNumber}
                    onChange={(e) => handleInputChange('receiptNumber', e.target.value)}
                    placeholder="Enter receipt number"
                    className="h-16 text-xl font-mono font-bold border-2 border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 shadow-md bg-white"
                  />
                  <Button
                    type="button"
                    onClick={handleReceiptSearch}
                    disabled={receiptSearching || !formData.receiptNumber.trim()}
                    className="h-16 px-8 bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg border-2 border-purple-600 disabled:bg-slate-400 disabled:border-slate-400"
                  >
                    {receiptSearching ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Search className="h-6 w-6" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Categories & Payment */}
          <div className="space-y-8">
            {/* Category Selection */}
            {formData.eventId && (
              <Card className="shadow-xl border-2 border-slate-200 bg-white">
                <CardHeader className="pb-4 bg-gradient-to-r from-orange-50 to-orange-100 border-b-2 border-orange-200">
                  <CardTitle className="text-xl font-bold text-slate-900">Registration Categories</CardTitle>
                  <CardDescription className="text-base font-semibold text-slate-700">Select category (F1-F4 shortcuts)</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-4">
                    {categories.map((category: any, index: any) => (
                      <Button
                        key={category.id}
                        type="button"
                        variant={formData.categoryId === category.id ? "default" : "outline"}
                        className={`h-20 justify-between text-left font-bold shadow-lg border-3 transition-all duration-200 ${
                          formData.categoryId === category.id 
                            ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600 shadow-orange-300 scale-105' 
                            : 'bg-white hover:bg-orange-50 text-slate-900 border-slate-400 hover:border-orange-400 hover:shadow-orange-200'
                        }`}
                        onClick={() => selectCategory(category)}
                      >
                        <div>
                          <div className="font-black text-xl">{category.name}</div>
                          <div className="text-base font-bold opacity-80 bg-black/10 px-2 py-1 rounded mt-1 inline-block">F{index + 1}</div>
                        </div>
                        <div className="text-2xl font-black">
                          {formatGHS(category.price)}
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Methods */}
            <Card className="shadow-xl border-2 border-slate-200 bg-white">
              <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-green-100 border-b-2 border-green-200">
                <CardTitle className="text-xl font-bold text-slate-900">Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={formData.paymentMethod === 'CASH' ? "default" : "outline"}
                    className={`h-20 flex-col font-bold shadow-lg border-3 transition-all duration-200 ${
                      formData.paymentMethod === 'CASH' 
                        ? 'bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-green-300 scale-105' 
                        : 'bg-white hover:bg-green-50 text-slate-900 border-slate-400 hover:border-green-400 hover:shadow-green-200'
                    }`}
                    onClick={() => selectPaymentMethod('CASH')}
                  >
                    <Banknote className="h-8 w-8 mb-2" />
                    <span className="font-black text-lg">Cash</span>
                  </Button>

                  <Button
                    type="button"
                    variant={formData.paymentMethod === 'CARD' ? "default" : "outline"}
                    className={`h-20 flex-col font-bold shadow-lg border-3 transition-all duration-200 ${
                      formData.paymentMethod === 'CARD' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-blue-300 scale-105' 
                        : 'bg-white hover:bg-blue-50 text-slate-900 border-slate-400 hover:border-blue-400 hover:shadow-blue-200'
                    }`}
                    onClick={() => selectPaymentMethod('CARD')}
                  >
                    <CreditCard className="h-8 w-8 mb-2" />
                    <span className="font-black text-lg">Card</span>
                  </Button>

                  <Button
                    type="button"
                    variant={formData.paymentMethod === 'BANK_TRANSFER' ? "default" : "outline"}
                    className={`h-20 flex-col font-bold shadow-lg border-3 transition-all duration-200 ${
                      formData.paymentMethod === 'BANK_TRANSFER' 
                        ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-purple-300 scale-105' 
                        : 'bg-white hover:bg-purple-50 text-slate-900 border-slate-400 hover:border-purple-400 hover:shadow-purple-200'
                    }`}
                    onClick={() => selectPaymentMethod('BANK_TRANSFER')}
                  >
                    <Building className="h-8 w-8 mb-2" />
                    <span className="font-black text-lg">Transfer</span>
                  </Button>

                  <Button
                    type="button"
                    variant={formData.paymentMethod === 'MOBILE_MONEY' ? "default" : "outline"}
                    className={`h-20 flex-col font-bold shadow-lg border-3 transition-all duration-200 ${
                      formData.paymentMethod === 'MOBILE_MONEY' 
                        ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600 shadow-orange-300 scale-105' 
                        : 'bg-white hover:bg-orange-50 text-slate-900 border-slate-400 hover:border-orange-400 hover:shadow-orange-200'
                    }`}
                    onClick={() => selectPaymentMethod('MOBILE_MONEY')}
                  >
                    <Smartphone className="h-8 w-8 mb-2" />
                    <span className="font-black text-lg">Mobile Money</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Registration Cart */}
          <div className="space-y-8">
            <Card className="sticky top-6 shadow-2xl border-4 border-slate-300 bg-white">
              <CardHeader className="pb-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white border-b-4 border-slate-700">
                <CardTitle className="flex items-center gap-3 text-2xl font-black">
                  <ShoppingCart className="h-7 w-7" />
                  Registration Cart
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Registration Summary */}
                <div className="space-y-4">
                  {selectedEvent && (
                    <div className="p-4 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl border-2 border-slate-300 shadow-md">
                      <div className="text-base font-black text-slate-700 uppercase tracking-wide">Event</div>
                      <div className="font-black text-lg text-slate-900">{selectedEvent.name}</div>
                      <div className="text-base font-bold text-slate-700">{selectedEvent.venue}</div>
                      {selectedBadgeTemplate && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-purple-100 rounded-lg border border-purple-200">
                          <span className="text-lg">{selectedBadgeTemplate.preview}</span>
                          <div className="text-sm">
                            <div className="font-bold text-purple-800">Badge: {selectedBadgeTemplate.name}</div>
                            <div className="text-purple-600">{selectedBadgeTemplate.description}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedCategory && (
                    <div className="p-4 bg-gradient-to-r from-orange-100 to-orange-200 rounded-xl border-2 border-orange-300 shadow-md">
                      <div className="text-base font-black text-orange-700 uppercase tracking-wide">Category</div>
                      <div className="flex items-center justify-between">
                        <div className="font-black text-lg text-slate-900">{selectedCategory.name}</div>
                        <div className="text-2xl font-black text-orange-700">
                          {formatGHS(selectedCategory.price)}
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.fullName && (
                    <div className="p-4 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl border-2 border-blue-300 shadow-md">
                      <div className="text-base font-black text-blue-700 uppercase tracking-wide">Participant</div>
                      <div className="font-black text-lg text-slate-900">{formData.fullName}</div>
                      {formData.email && (
                        <div className="text-base font-bold text-slate-700">{formData.email}</div>
                      )}
                    </div>
                  )}

                  {formData.paymentMethod && (
                    <div className="p-4 bg-gradient-to-r from-green-100 to-green-200 rounded-xl border-2 border-green-300 shadow-md">
                      <div className="text-base font-black text-green-700 uppercase tracking-wide">Payment Method</div>
                      <div className="font-black text-lg text-slate-900 capitalize">
                        {formData.paymentMethod.replace('_', ' ').toLowerCase()}
                      </div>
                    </div>
                  )}

                  {formData.receiptNumber && (
                    <div className="p-4 bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl border-2 border-purple-300 shadow-md">
                      <div className="text-base font-black text-purple-700 uppercase tracking-wide">Receipt Number</div>
                      <div className="font-mono font-black text-lg text-slate-900">{formData.receiptNumber}</div>
                    </div>
                  )}

                  {/* Registration Deadline Warning */}
                  {getDeadlineWarning() && (
                    <div className={`p-4 rounded-xl border-2 shadow-md ${
                      getDeadlineWarning()?.type === 'error' 
                        ? 'bg-gradient-to-r from-red-100 to-red-200 border-red-300' 
                        : 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-300'
                    }`}>
                      <div className={`text-base font-black uppercase tracking-wide flex items-center gap-2 ${
                        getDeadlineWarning()?.type === 'error' ? 'text-red-700' : 'text-yellow-700'
                      }`}>
                        <AlertCircle className="h-5 w-5" />
                        {getDeadlineWarning()?.type === 'error' ? 'DEADLINE PASSED' : 'DEADLINE WARNING'}
                      </div>
                      <div className="font-bold text-lg text-slate-900 mt-1">
                        {getDeadlineWarning()?.message}
                      </div>
                      {getDeadlineWarning()?.type === 'error' && (
                        <div className="text-sm text-red-600 mt-2 font-semibold">
                          Registration is not allowed after the deadline has passed.
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Total */}
                {selectedCategory && (
                  <div className="border-t-4 border-slate-300 pt-6">
                    <div className="flex items-center justify-between text-3xl font-black bg-gradient-to-r from-orange-600 to-orange-700 text-white p-4 rounded-xl shadow-lg">
                      <span>TOTAL:</span>
                      <span>{formatGHS(selectedCategory.price)}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-4 pt-6">
                  <Button
                    type="submit"
                    disabled={!canCompleteRegistration() || isSubmitting || badgeLoading}
                    className="w-full h-18 text-xl font-black bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-xl border-4 border-orange-600 disabled:from-slate-400 disabled:to-slate-500 disabled:border-slate-400"
                  >
                    {isSubmitting || badgeLoading ? (
                      <>
                        <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                        {isSubmitting ? 'PROCESSING...' : 'CONVERTING TO PDF...'}
                      </>
                    ) : (
                      <>
                        <Zap className="h-6 w-6 mr-3" />
                        REGISTER
                      </>
                    )}
                  </Button>

                  {canCompleteRegistration() && (
                    <div className="text-center p-4 bg-gradient-to-r from-green-100 to-green-200 rounded-xl border-2 border-green-300 shadow-md">
                      <div className="flex items-center justify-center gap-2 text-green-700 font-bold text-lg">
                        <CheckCircle className="h-6 w-6" />
                        Badge will be converted to PDF automatically
                      </div>
                      <div className="text-sm text-green-600 mt-1">
                        After completing registration, the participant's badge will be generated using the event's selected design and downloaded as PDF
                      </div>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-14 text-lg font-bold border-2 border-slate-400 hover:bg-slate-100 text-slate-800"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
