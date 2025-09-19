'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Users, Clock, DollarSign, Palette, UserPlus, Save, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { toast } from 'sonner'
import { useCreateEvent, useAssignEventManager } from '@/lib/graphql/hooks'
import { CreateEventInput } from '@/lib/graphql/types'
import { useEventDraft } from '@/hooks/use-event-draft'

// Import component types and components
import { EventFormData, Step } from '@/components/admin/event-creation/types'
import { EventCreationSidebar } from '@/components/admin/event-creation/EventCreationSidebar'
import { EventDetailsStep } from '@/components/admin/event-creation/EventDetailsStep'
import { CategoriesStep } from '@/components/admin/event-creation/CategoriesStep'
import { MealSessionsStep } from '@/components/admin/event-creation/MealSessionsStep'
import { PaymentSettingsStep } from '@/components/admin/event-creation/PaymentSettingsStep'
import { BadgeTemplateStep } from '@/components/admin/event-creation/BadgeTemplateStep'
import { OrganizersStep } from '@/components/admin/event-creation/OrganizersStep'
import { NavigationControls } from '@/components/admin/event-creation/NavigationControls'

export default function CreateEventPage() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  
  // GraphQL mutation for creating events
  const [createEvent, { loading: createEventLoading }] = useCreateEvent()
  const [assignEventManager] = useAssignEventManager()
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 6
  const [errors, setErrors] = useState<Record<string, string>>({})
  const isRestoringDraftRef = useRef(false)
  const hasRestoredDraftRef = useRef(false)
  
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    description: '',
    date: '',
    endDate: '',
    venue: '',
    address: '',
    maxCapacity: 0,
    registrationDeadline: '',
    // Categories
    categories: [{
      id: '1',
      name: '',
      price: 0,
      maxCapacity: 0,
      description: ''
    }],
    // Meal Sessions
    mealSessions: [],
    // Payment Settings
    paymentRequired: false,
    paymentDeadline: '',
    depositAllowed: false,
    depositPercentage: 50,
    fullPaymentDeadline: '',
    latePaymentFee: 0,
    refundPolicy: 'none',
    // Badge Template Selection
    badgeTemplateId: 'festival-fun', // Default template - more suitable for general events
    // Event Organizer Assignment
    assignedOrganizers: []
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isLoading = createEventLoading || isSubmitting

  // Memoized draft callbacks to prevent infinite loops
  const onDraftLoaded = useCallback((draft: any) => {
    // Restore form data from draft without triggering change tracking
    if (draft.draftData && !hasRestoredDraftRef.current) {
      hasRestoredDraftRef.current = true
      isRestoringDraftRef.current = true
      setFormData(draft.draftData)
      setCurrentStep(draft.currentStep)
      toast.success('Draft restored successfully!')
      // Reset restoration flag after state updates are complete
      setTimeout(() => {
        isRestoringDraftRef.current = false
      }, 1000)
    }
  }, [])

  const onDraftSaved = useCallback(() => {
    // Optional: Show subtle success indicator
  }, [])

  const onDraftError = useCallback((error: Error) => {
    console.error('Draft error:', error)
  }, [])

  // Draft management
  const {
    currentDraft,
    isDraftLoading,
    lastSavedAt,
    hasUnsavedChanges,
    saveDraft,
    deleteDraft,
    enableAutoSave,
    markAsChanged,
    isExpired
  } = useEventDraft({
    onDraftLoaded,
    onDraftSaved,
    onDraftError
  })

  // Step configuration
  const steps: Step[] = [
    {
      id: 1,
      title: 'Event Details',
      description: 'Basic event information',
      icon: FileText,
      color: 'blue'
    },
    {
      id: 2,
      title: 'Categories',
      description: 'Registration categories',
      icon: Users,
      color: 'green'
    },
    {
      id: 3,
      title: 'Meal Sessions',
      description: 'Catering and meals',
      icon: Clock,
      color: 'orange'
    },
    {
      id: 4,
      title: 'Payment Settings',
      description: 'Pricing and policies',
      icon: DollarSign,
      color: 'purple'
    },
    {
      id: 5,
      title: 'Badge Template',
      description: 'Badge design selection',
      icon: Palette,
      color: 'pink'
    },
    {
      id: 6,
      title: 'Organizers',
      description: 'Event management',
      icon: UserPlus,
      color: 'indigo'
    }
  ]

  // Access control
  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to create events
            </CardDescription>
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

  // Auto-save effect
  useEffect(() => {
    if (!isRestoringDraftRef.current && (formData.name || formData.description || formData.venue)) {
      const cleanup = enableAutoSave(formData, currentStep)
      return cleanup
    }
  }, [formData, currentStep, enableAutoSave])

  // Track form changes
  const handleFormDataChange = useCallback((newFormData: EventFormData | ((prev: EventFormData) => EventFormData)) => {
    setFormData(newFormData)
    // Only mark as changed if we're not restoring a draft
    if (!isRestoringDraftRef.current) {
      markAsChanged()
    }
  }, [markAsChanged])

  // Manual save function
  const handleManualSave = useCallback(async () => {
    await saveDraft(formData, currentStep)
    toast.success('Draft saved successfully!')
  }, [saveDraft, formData, currentStep])

  // Helper function to check if two dates are on the same day
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString()
  }

  // Helper function to validate meal session date range (must be within event dates)
  const validateMealDateRange = (sessions: any[]) => {
    const startDate = formData.date ? new Date(formData.date) : null
    const endDate = formData.endDate ? new Date(formData.endDate) : startDate
    if (!startDate) return []

    const dateRangeErrors: string[] = []
    const effectiveEndDate = endDate || startDate

    sessions.forEach(session => {
      if (session.beginTime && session.endTime) {
        const mealStart = new Date(session.beginTime)
        const mealEnd = new Date(session.endTime)
        
        // Check if meal starts before event starts
        if (mealStart < startDate) {
          dateRangeErrors.push(`"${session.name || 'Unnamed session'}" starts before the event begins`)
        }
        
        // Check if meal ends after event ends
        if (mealEnd > new Date(effectiveEndDate.getTime() + 24 * 60 * 60 * 1000 - 1)) {
          dateRangeErrors.push(`"${session.name || 'Unnamed session'}" ends after the event ends`)
        }
      }
    })

    return dateRangeErrors
  }

  // Helper function to check for overlapping meal sessions (only within the same day)
  const checkMealSessionOverlaps = (sessions: any[]) => {
    const validSessions = sessions.filter(s => s.beginTime && s.endTime)
    
    for (let i = 0; i < validSessions.length; i++) {
      for (let j = i + 1; j < validSessions.length; j++) {
        const session1 = validSessions[i]
        const session2 = validSessions[j]
        
        const start1 = new Date(session1.beginTime)
        const end1 = new Date(session1.endTime)
        const start2 = new Date(session2.beginTime)
        const end2 = new Date(session2.endTime)
        
        // Only check for overlaps if sessions are on the same day
        if (isSameDay(start1, start2) && (start1 < end2 && end1 > start2)) {
          return true
        }
      }
    }
    
    return false
  }

  // Check if next button should be disabled for current step
  const isNextDisabled = () => {
    if (currentStep === 1) { // Event Details step
      // Check for end date validation error
      if (formData.date && formData.endDate) {
        const startDate = new Date(formData.date)
        const endDate = new Date(formData.endDate)
        if (endDate < startDate) {
          return true
        }
      }
      
      // Check for registration deadline validation error
      if (formData.registrationDeadline && formData.date) {
        const regDeadline = new Date(formData.registrationDeadline)
        const eventStart = new Date(formData.date)
        if (regDeadline >= eventStart) {
          return true
        }
      }
    }
    
    if (currentStep === 2) { // Categories step
      if (formData.maxCapacity > 0) {
        const totalCategoryCapacity = formData.categories.reduce((sum, cat) => sum + (cat.maxCapacity || 0), 0)
        return totalCategoryCapacity > formData.maxCapacity
      }
    }
    
    if (currentStep === 3) { // Meal Sessions step
      // Check for overlapping meal sessions (same day only)
      if (checkMealSessionOverlaps(formData.mealSessions)) {
        return true
      }
      
      // Check for invalid time ranges (end time before begin time)
      const hasInvalidTimes = formData.mealSessions.some(session => 
        session.beginTime && session.endTime && new Date(session.beginTime) >= new Date(session.endTime)
      )
      if (hasInvalidTimes) {
        return true
      }
      
      // Check for meal sessions outside event date range
      const dateRangeErrors = validateMealDateRange(formData.mealSessions)
      if (dateRangeErrors.length > 0) {
        return true
      }
    }
    
    return false
  }

  // Step navigation functions
  const nextStep = () => {
    if (validateCurrentStep()) {
      const newStep = Math.min(currentStep + 1, totalSteps)
      setCurrentStep(newStep)
      // Save draft when moving to next step
      saveDraft(formData, newStep)
    }
  }

  const prevStep = () => {
    const newStep = Math.max(currentStep - 1, 1)
    setCurrentStep(newStep)
    // Save draft when moving to previous step
    saveDraft(formData, newStep)
  }

  const goToStep = (step: number) => {
    setCurrentStep(step)
    // Save draft when jumping to a step
    saveDraft(formData, step)
  }

  // Validation function for current step
  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {}

    switch (currentStep) {
      case 1: // Event Details
        if (!formData.name) newErrors.name = 'Event name is required'
        if (!formData.date) newErrors.date = 'Event date is required'
        if (!formData.venue) newErrors.venue = 'Venue is required'
        
        // Validate end date is not before start date
        if (formData.date && formData.endDate) {
          const startDate = new Date(formData.date)
          const endDate = new Date(formData.endDate)
          
          if (endDate < startDate) {
            newErrors.endDate = 'End date must be equal to or after the start date'
          }
        }
        
        // Validate registration deadline is before event start date
        if (formData.registrationDeadline && formData.date) {
          const regDeadline = new Date(formData.registrationDeadline)
          const eventStart = new Date(formData.date)
          
          if (regDeadline >= eventStart) {
            newErrors.registrationDeadline = 'Registration deadline must be before event start date'
          }
        }
        break
      case 2: // Categories
        if (formData.categories.length === 0) {
          newErrors.categories = 'At least one category is required'
        } else {
          const invalidCategories = formData.categories.filter(cat => !cat.name || cat.price < 0 || cat.maxCapacity <= 0)
          if (invalidCategories.length > 0) {
            newErrors.categories = 'All categories must have valid name, price, and capacity'
          }
          
          // Validate category capacities against event maximum capacity
          if (formData.maxCapacity > 0) {
            const totalCategoryCapacity = formData.categories.reduce((sum, cat) => sum + (cat.maxCapacity || 0), 0)
            if (totalCategoryCapacity > formData.maxCapacity) {
              newErrors.categoryCapacity = `Total category capacity (${totalCategoryCapacity.toLocaleString()}) exceeds event maximum capacity (${formData.maxCapacity.toLocaleString()})`
            }
          }
        }
        break
      case 3: // Meal Sessions
        // Validate meal sessions if any are provided
        if (formData.mealSessions.length > 0) {
          // Check for incomplete meal sessions
          const incompleteSessions = formData.mealSessions.filter(session => 
            session.name && (!session.beginTime || !session.endTime)
          )
          if (incompleteSessions.length > 0) {
            newErrors.mealSessionTimes = 'All meal sessions must have both begin and end times'
          }
          
          // Check for invalid time ranges (end time before begin time)
          const invalidTimeSessions = formData.mealSessions.filter(session => 
            session.beginTime && session.endTime && new Date(session.beginTime) >= new Date(session.endTime)
          )
          if (invalidTimeSessions.length > 0) {
            newErrors.mealSessionTimes = 'End time must be after begin time for all meal sessions'
          }
          
          // Check for overlapping meal sessions (same day only)
          if (checkMealSessionOverlaps(formData.mealSessions)) {
            newErrors.mealSessionOverlap = 'Meal sessions on the same day cannot overlap. Please adjust the times.'
          }
          
          // Check for meal sessions outside event date range
          const dateRangeErrors = validateMealDateRange(formData.mealSessions)
          if (dateRangeErrors.length > 0) {
            newErrors.mealSessionDateRange = `Meal sessions must be within event dates: ${dateRangeErrors.join(', ')}`
          }
        }
        break
      case 4: // Payment Settings
        if (formData.paymentRequired) {
          const eventStartDate = formData.date ? new Date(formData.date) : null
          
          // Validate deposit percentage if deposits are allowed
          if (formData.depositAllowed) {
            if (formData.depositPercentage <= 0 || formData.depositPercentage >= 100) {
              newErrors.depositPercentage = 'Deposit percentage must be between 1 and 99'
            }
          }
          
          // Validate payment deadline
          if (formData.paymentDeadline && eventStartDate) {
            const paymentDeadline = new Date(formData.paymentDeadline)
            if (paymentDeadline >= eventStartDate) {
              newErrors.paymentDeadline = 'Payment deadline must be before the event start date'
            }
          }
          
          // Validate full payment deadline if deposits are allowed
          if (formData.depositAllowed && formData.fullPaymentDeadline && eventStartDate) {
            const fullPaymentDeadline = new Date(formData.fullPaymentDeadline)
            
            if (fullPaymentDeadline >= eventStartDate) {
              newErrors.fullPaymentDeadline = 'Full payment deadline must be before the event start date'
            }
            
            // Full payment deadline should be after or equal to payment deadline
            if (formData.paymentDeadline) {
              const paymentDeadline = new Date(formData.paymentDeadline)
              if (fullPaymentDeadline < paymentDeadline) {
                newErrors.fullPaymentDeadline = 'Full payment deadline must be after or equal to the initial payment deadline'
              }
            }
          }
          
          // Validate that payment deadline is set if payment is required
          if (!formData.paymentDeadline) {
            newErrors.paymentDeadline = 'Payment deadline is required when payment is enabled'
          }
          
          // Validate that full payment deadline is set if deposits are allowed
          if (formData.depositAllowed && !formData.fullPaymentDeadline) {
            newErrors.fullPaymentDeadline = 'Full payment deadline is required when deposits are allowed'
          }
        }
        break
      case 5: // Badge Template
        if (!formData.badgeTemplateId) {
          newErrors.badgeTemplateId = 'Please select a badge template'
        }
        break
      case 6: // Organizers (optional, so no validation needed)
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Validate form
      if (!formData.name || !formData.date || !formData.venue) {
        toast.error('Please fill in all required fields (Name, Date, Venue)')
        return
      }

      // Validate end date is not before start date
      if (formData.date && formData.endDate) {
        const startDate = new Date(formData.date)
        const endDate = new Date(formData.endDate)
        
        if (endDate < startDate) {
          toast.error('End date must be equal to or after the start date')
          setCurrentStep(1) // Go back to event details step
          return
        }
      }

      // Validate registration deadline is before event start date
      if (formData.registrationDeadline && formData.date) {
        const regDeadline = new Date(formData.registrationDeadline)
        const eventStart = new Date(formData.date)
        
        if (regDeadline >= eventStart) {
          toast.error('Registration deadline must be before event start date')
          setCurrentStep(1) // Go back to event details step
          return
        }
      }

      // Validate category capacities against event maximum capacity
      if (formData.maxCapacity > 0) {
        const totalCategoryCapacity = formData.categories.reduce((sum, cat) => sum + (cat.maxCapacity || 0), 0)
        if (totalCategoryCapacity > formData.maxCapacity) {
          toast.error(`Total category capacity (${totalCategoryCapacity.toLocaleString()}) exceeds event maximum capacity (${formData.maxCapacity.toLocaleString()}). Please adjust category capacities.`)
          setCurrentStep(2) // Go back to categories step
          return
        }
      }

      // Validate meal sessions if any are provided
      if (formData.mealSessions.length > 0) {
        const invalidMealSessions = formData.mealSessions.filter(meal => 
          meal.name && (!meal.beginTime || !meal.endTime)
        )
        
        if (invalidMealSessions.length > 0) {
          toast.error('Please provide both begin and end times for all meal sessions or remove empty ones')
          setCurrentStep(3) // Go back to meal sessions step
          return
        }
        
        // Check for invalid time ranges
        const invalidTimeSessions = formData.mealSessions.filter(session => 
          session.beginTime && session.endTime && new Date(session.beginTime) >= new Date(session.endTime)
        )
        
        if (invalidTimeSessions.length > 0) {
          toast.error('End time must be after begin time for all meal sessions')
          setCurrentStep(3) // Go back to meal sessions step
          return
        }
        
        // Check for overlapping meal sessions
        if (checkMealSessionOverlaps(formData.mealSessions)) {
          toast.error('Meal sessions cannot overlap. Please adjust the times.')
          setCurrentStep(3) // Go back to meal sessions step
          return
        }
      }

      // Generate slug from event name
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

      // Prepare GraphQL input
      const eventInput: CreateEventInput = {
        name: formData.name,
        slug,
        description: formData.description,
        date: formData.date,
        endDate: formData.endDate || undefined,
        venue: formData.venue,
        address: formData.address,
        maxCapacity: formData.maxCapacity,
        paymentRequired: formData.paymentRequired,
        registrationDeadline: formData.registrationDeadline || undefined,
        paymentDeadline: formData.paymentDeadline || undefined,
        depositAllowed: formData.depositAllowed,
        depositPercentage: formData.depositAllowed ? formData.depositPercentage : undefined,
        fullPaymentDeadline: formData.fullPaymentDeadline || undefined,
        latePaymentFee: formData.latePaymentFee || undefined,
        refundPolicy: formData.refundPolicy as 'full' | 'partial' | 'deposit' | 'none',
        badgeTemplateId: formData.badgeTemplateId,
        categories: formData.categories.map(cat => ({
          name: cat.name,
          price: cat.price,
          maxCapacity: cat.maxCapacity,
          description: cat.description
        })),
        meals: formData.mealSessions
          .filter(meal => meal.name && meal.beginTime && meal.endTime) // Only include meals with valid data
          .map(meal => ({
            name: meal.name,
            beginTime: meal.beginTime,
            endTime: meal.endTime,
            description: meal.description
          }))
      }

      // Create event using GraphQL
      const result = await createEvent({
        variables: { input: eventInput }
      })

      if (result.data?.createEvent) {
        const createdEvent = result.data.createEvent
        
        // Clean up draft after successful creation
        await deleteDraft()
        
        // Assign EVENT_ORGANIZER users to the created event
        if (formData.assignedOrganizers.length > 0) {
          try {
            for (const organizerId of formData.assignedOrganizers) {
              await assignEventManager({
                variables: {
                  eventId: createdEvent.id,
                  userId: organizerId
                }
              })
            }
            toast.success(`Event created successfully with ${formData.assignedOrganizers.length} organizer(s) assigned!`)
          } catch (assignError: any) {
            console.error('Event organizer assignment error:', assignError)
            toast.warning('Event created but some organizer assignments failed. You can assign them later.')
          }
        } else {
          toast.success('Event created successfully!')
        }
        
        router.push('/admin')
      } else {
        throw new Error('Failed to create event')
      }
      
    } catch (error: any) {
      console.error('Event creation error:', error)
      toast.error(error.message || 'Failed to create event. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render current step component
  const renderCurrentStep = () => {
    const stepProps = {
      formData,
      setFormData: handleFormDataChange,
      errors,
      setErrors
    }

    switch (currentStep) {
      case 1:
        return <EventDetailsStep {...stepProps} />
      case 2:
        return <CategoriesStep {...stepProps} />
      case 3:
        return <MealSessionsStep {...stepProps} />
      case 4:
        return <PaymentSettingsStep {...stepProps} />
      case 5:
        return <BadgeTemplateStep {...stepProps} />
      case 6:
        return <OrganizersStep {...stepProps} />
      default:
        return <EventDetailsStep {...stepProps} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="flex">
        {/* Sidebar Navigation */}
        <EventCreationSidebar
          currentStep={currentStep}
          totalSteps={totalSteps}
          steps={steps}
          goToStep={goToStep}
        />

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <form className="space-y-8">
              {/* Step Header with Draft Status */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 bg-${steps[currentStep - 1].color}-100 rounded-xl`}>
                      {(() => {
                        const IconComponent = steps[currentStep - 1].icon;
                        return <IconComponent className={`h-6 w-6 text-${steps[currentStep - 1].color}-600`} />;
                      })()}
                    </div>
                    <div>
                      <h2 className={`text-2xl font-bold text-${steps[currentStep - 1].color}-800`}>
                        {steps[currentStep - 1].title}
                      </h2>
                      <p className={`text-${steps[currentStep - 1].color}-600`}>
                        {steps[currentStep - 1].description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Draft Status and Actions */}
                  <div className="flex items-center gap-3">
                    {/* Draft Status Indicator */}
                    {currentDraft && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <RefreshCw className={`h-4 w-4 ${isDraftLoading ? 'animate-spin' : ''}`} />
                        <span>
                          {isDraftLoading ? 'Saving...' : 
                           hasUnsavedChanges ? 'Unsaved changes' : 
                           lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}` : 'Draft available'}
                        </span>
                      </div>
                    )}
                    
                    {/* Manual Save Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleManualSave}
                      disabled={isDraftLoading || !hasUnsavedChanges}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save Draft
                    </Button>
                  </div>
                </div>
              </div>

              {/* Current Step Content */}
              {renderCurrentStep()}

              {/* Navigation Controls */}
              <NavigationControls
                currentStep={currentStep}
                totalSteps={totalSteps}
                isLoading={isLoading}
                isNextDisabled={isNextDisabled()}
                onPrevious={prevStep}
                onNext={nextStep}
                onSubmit={handleSubmit}
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
