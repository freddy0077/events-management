'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { 
  ArrowLeft, 
  Save, 
  Calendar, 
  Loader2, 
  Users, 
  MapPin, 
  Clock, 
  DollarSign,
  Plus,
  X,
  Crown,
  UserCheck,
  Mail,
  Phone,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { useEvent, useUpdateEvent, useAvailableEventManagers, useAssignEventManager, useEventManagers, useRemoveEventManager } from '@/lib/graphql/hooks'
import { toast } from 'sonner'

interface EventCategory {
  id: string
  name: string
  price: number
  maxCapacity: number
  description?: string
}

interface MealSession {
  id: string
  name: string
  sessionTime: string
  description?: string
}

interface EventOrganizer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  isActive: boolean
  assignedAt?: string
}

export default function AdminEventEditPage() {
  const { isAuthenticated, user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    endDate: '',
    venue: '',
    address: '',
    maxCapacity: 100,
    isActive: true,
    paymentRequired: false,
    depositAllowed: false,
    depositPercentage: 50,
    registrationDeadline: '',
    paymentDeadline: ''
  })

  const [categories, setCategories] = useState<EventCategory[]>([])
  const [mealSessions, setMealSessions] = useState<MealSession[]>([])
  const [assignedOrganizers, setAssignedOrganizers] = useState<EventOrganizer[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // GraphQL hooks
  const { data: eventData, loading: eventLoading, error: eventError } = useEvent({ id: eventId })
  const { data: availableManagersData, loading: managersLoading } = useAvailableEventManagers()
  const { data: eventManagersData, loading: eventManagersLoading } = useEventManagers(eventId)
  const [updateEvent] = useUpdateEvent()
  const [assignEventManager] = useAssignEventManager()
  const [removeEventManager] = useRemoveEventManager()

  const event = eventData?.event
  const availableManagers = (availableManagersData as any)?.availableEventManagers || []

  // Load event data into form
  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        description: event.description || '',
        date: event.date ? new Date(event.date).toISOString().slice(0, 16) : '',
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
        venue: event.venue || '',
        address: event.address || '',
        maxCapacity: event.maxCapacity || 100,
        isActive: event.isActive || false,
        paymentRequired: event.paymentRequired || false,
        depositAllowed: event.depositAllowed || false,
        depositPercentage: event.depositPercentage || 50,
        registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().slice(0, 16) : '',
        paymentDeadline: event.paymentDeadline ? new Date(event.paymentDeadline).toISOString().slice(0, 16) : ''
      })

      setCategories(event.categories || [])
      setMealSessions((event.meals || []).map((meal: any) => ({ ...meal, sessionTime: meal.sessionTime || meal.startTime })))
    }
  }, [event])

  // Load assigned organizers from event managers data
  useEffect(() => {
    if ((eventManagersData as any)?.eventManagers) {
      const organizers = (eventManagersData as any).eventManagers.map((manager: any) => {
        // Backend now returns full user object with available details
        if (manager.user) {
          return {
            id: manager.user.id,
            email: manager.user.email,
            firstName: manager.user.firstName,
            lastName: manager.user.lastName,
            role: manager.user.role,
            isActive: manager.isActive,
            assignedAt: manager.assignedAt,
            createdAt: manager.user.createdAt,
            lastLoginAt: null, // Not available in current schema
            phone: null, // Not available in current schema
            permissions: []
          }
        }
        
        // Return null if user is null - will be filtered out
        return null
      }).filter(Boolean)
      
      setAssignedOrganizers(organizers)
    }
  }, [eventManagersData])

  // Calculate available organizers using useMemo to prevent infinite loops
  const availableOrganizers = useMemo(() => {
    if (!availableManagers) return []
    // Filter out already assigned organizers
    const assignedIds = assignedOrganizers.map(org => org.id)
    return availableManagers.filter((manager: any) => !assignedIds.includes(manager.id))
  }, [availableManagers, assignedOrganizers])

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Add new category
  const addCategory = () => {
    const newCategory: EventCategory = {
      id: `temp-${Date.now()}`,
      name: '',
      price: 0,
      maxCapacity: 50,
      description: ''
    }
    setCategories(prev => [...prev, newCategory])
  }

  // Remove category
  const removeCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id))
  }

  // Update category
  const updateCategory = (id: string, field: string, value: any) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, [field]: value } : cat
    ))
  }

  // Add new meal session
  const addMealSession = () => {
    const newMeal: MealSession = {
      id: `temp-${Date.now()}`,
      name: '',
      sessionTime: '',
      description: ''
    }
    setMealSessions(prev => [...prev, newMeal])
  }

  // Remove meal session
  const removeMealSession = (id: string) => {
    setMealSessions(prev => prev.filter(meal => meal.id !== id))
  }

  // Update meal session
  const updateMealSession = (id: string, field: string, value: any) => {
    setMealSessions(prev => prev.map(meal => 
      meal.id === id ? { ...meal, [field]: value } : meal
    ))
  }

  // Assign organizer to event
  const handleAssignOrganizer = async (organizerId: string) => {
    try {
      await assignEventManager({
        variables: {
          eventId,
          userId: organizerId
        }
      })

      // Move organizer from available to assigned
      const organizer = availableOrganizers.find((org: any) => org.id === organizerId)
      if (organizer) {
        setAssignedOrganizers(prev => [...prev, { ...organizer, assignedAt: new Date().toISOString() }])
        toast.success(`${organizer.firstName} ${organizer.lastName} assigned to event`)
      }
    } catch (error: any) {
      console.error('Error assigning organizer:', error)
      toast.error('Failed to assign organizer. Please try again.')
    }
  }

  // Remove organizer from event
  const handleRemoveOrganizer = async (organizerId: string) => {
    const organizer = assignedOrganizers.find(org => org.id === organizerId)
    if (!organizer) return

    try {
      await removeEventManager({
        variables: {
          eventId,
          userId: organizerId
        }
      })

      setAssignedOrganizers(prev => prev.filter(org => org.id !== organizerId))
      toast.success(`${organizer.firstName} ${organizer.lastName} removed from event`)
    } catch (error: any) {
      console.error('Error removing organizer:', error)
      toast.error('Failed to remove organizer. Please try again.')
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Event name is required')
      return
    }

    if (!formData.date) {
      toast.error('Event date is required')
      return
    }

    setIsSubmitting(true)
    try {
      await updateEvent({
        variables: {
          id: eventId,
          input: {
            ...formData,
            date: new Date(formData.date).toISOString(),
            endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
            registrationDeadline: formData.registrationDeadline ? new Date(formData.registrationDeadline).toISOString() : undefined,
            paymentDeadline: formData.paymentDeadline ? new Date(formData.paymentDeadline).toISOString() : undefined,
            categories: categories.map(cat => ({
              ...cat,
              id: cat.id.startsWith('temp-') ? undefined : cat.id
            })),
            meals: mealSessions.map(meal => ({
              ...meal,
              id: meal.id.startsWith('temp-') ? undefined : meal.id
            }))
          }
        }
      })

      toast.success('Event updated successfully!')
      router.push(`/admin/events/${eventId}`)
    } catch (error: any) {
      console.error('Error updating event:', error)
      toast.error('Failed to update event. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to edit events</CardDescription>
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

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-primary-50 to-neutral-50 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-soft">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto mb-3" />
              <span className="text-sm text-neutral-500">Loading event details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-primary-50 to-neutral-50 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-soft">
          <CardHeader className="text-center">
            <CardTitle>Event Not Found</CardTitle>
            <CardDescription>The event you're trying to edit doesn't exist or has been removed.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/admin/events">Back to Events</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-primary-50 to-neutral-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="hover:bg-brand-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-2 mb-2">
                <Calendar className="h-4 w-4 text-brand-600" />
                <span className="text-sm font-medium text-brand-700">Edit Event</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">
                {event.name}
              </h1>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-brand-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Event Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter event name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue *</Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => handleInputChange('venue', e.target.value)}
                    placeholder="Enter venue name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter event description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter full address"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Start Date & Time *</Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date & Time</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxCapacity">Max Capacity</Label>
                  <Input
                    id="maxCapacity"
                    type="number"
                    min="1"
                    value={formData.maxCapacity}
                    onChange={(e) => handleInputChange('maxCapacity', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Settings */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-success-600" />
                Event Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Event Status</Label>
                  <p className="text-sm text-neutral-600">Enable registration for this event</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Payment Required</Label>
                  <p className="text-sm text-neutral-600">Require payment for registration</p>
                </div>
                <Switch
                  checked={formData.paymentRequired}
                  onCheckedChange={(checked) => handleInputChange('paymentRequired', checked)}
                />
              </div>

              {formData.paymentRequired && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Deposits</Label>
                      <p className="text-sm text-neutral-600">Allow partial payments</p>
                    </div>
                    <Switch
                      checked={formData.depositAllowed}
                      onCheckedChange={(checked) => handleInputChange('depositAllowed', checked)}
                    />
                  </div>

                  {formData.depositAllowed && (
                    <div className="space-y-2">
                      <Label htmlFor="depositPercentage">Deposit Percentage</Label>
                      <Input
                        id="depositPercentage"
                        type="number"
                        min="1"
                        max="99"
                        value={formData.depositPercentage}
                        onChange={(e) => handleInputChange('depositPercentage', parseInt(e.target.value))}
                      />
                    </div>
                  )}
                </>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                  <Input
                    id="registrationDeadline"
                    type="datetime-local"
                    value={formData.registrationDeadline}
                    onChange={(e) => handleInputChange('registrationDeadline', e.target.value)}
                  />
                </div>
                {formData.paymentRequired && (
                  <div className="space-y-2">
                    <Label htmlFor="paymentDeadline">Payment Deadline</Label>
                    <Input
                      id="paymentDeadline"
                      type="datetime-local"
                      value={formData.paymentDeadline}
                      onChange={(e) => handleInputChange('paymentDeadline', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assigned Organizers */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-orange-600" />
                Assigned Event Organizers
              </CardTitle>
              <CardDescription>
                Assign EVENT_ORGANIZER users to manage this event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Currently Assigned */}
              {assignedOrganizers.length > 0 && (
                <div>
                  <h4 className="font-medium text-neutral-900 mb-3">Currently Assigned</h4>
                  <div className="space-y-3">
                    {assignedOrganizers.map((organizer: any) => (
                      <div key={organizer.id} className="flex items-center justify-between p-3 border border-orange-200 bg-orange-50/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <UserCheck className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <div className="font-medium text-neutral-900">
                              {organizer.firstName} {organizer.lastName}
                            </div>
                            <div className="text-sm text-neutral-600 flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {organizer.email}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveOrganizer(organizer.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available to Assign */}
              {availableOrganizers.length > 0 && (
                <div>
                  <h4 className="font-medium text-neutral-900 mb-3">Available Event Organizers</h4>
                  <div className="space-y-3">
                    {availableOrganizers.map((organizer: any) => (
                      <div key={organizer.id} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-neutral-600" />
                          </div>
                          <div>
                            <div className="font-medium text-neutral-900">
                              {organizer.firstName} {organizer.lastName}
                            </div>
                            <div className="text-sm text-neutral-600 flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {organizer.email}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignOrganizer(organizer.id)}
                          className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Assign
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {availableOrganizers.length === 0 && assignedOrganizers.length === 0 && (
                <div className="text-center py-8 text-neutral-500">
                  <Crown className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                  <p className="font-medium">No Event Organizers Available</p>
                  <p className="text-sm mt-1">There are no EVENT_ORGANIZER users available to assign to this event.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-brand-600 to-primary-600 hover:from-brand-700 hover:to-primary-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Event
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
