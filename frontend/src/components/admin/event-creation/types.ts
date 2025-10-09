export interface EventCategory {
  id: string
  name: string
  price: number
  maxCapacity: number
  description: string
}

export interface MealSession {
  id: string
  name: string
  beginTime: string
  endTime: string
  description: string
  // Recurring functionality (frontend-only, for UI purposes)
  isRecurring?: boolean
  recurringPattern?: 'daily' | 'custom'
  recurringDays?: string[] // ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  generatedFromRecurring?: boolean // True if this session was generated from recurring pattern
}

export interface EventFormData {
  name: string
  description: string
  date: string
  endDate: string
  venue: string
  address: string
  maxCapacity: number
  registrationDeadline: string
  logoUrl?: string
  // Categories
  categories: EventCategory[]
  // Meal Sessions
  mealSessions: MealSession[]
  // Payment Settings
  paymentRequired: boolean
  paymentDeadline: string
  depositAllowed: boolean
  depositPercentage: number
  fullPaymentDeadline: string
  latePaymentFee: number
  refundPolicy: string
  // Badge Template Selection
  badgeTemplateId: string
  // Event Organizer Assignment
  assignedOrganizers: string[]
}

export interface StepProps {
  formData: EventFormData
  setFormData: React.Dispatch<React.SetStateAction<EventFormData>>
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
}

export interface Step {
  id: number
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}
