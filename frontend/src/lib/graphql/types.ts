// GraphQL Types for Event Registration System

export interface User {
  id: string
  email: string
  role: 'USER' | 'MODERATOR' | 'ADMIN'
  firstName?: string
  lastName?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface EventStaff {
  id: string
  userId: string
  role: string
  isActive: boolean
  assignedAt: string
  assignedBy: string
  permissions?: any
  user: {
    id: string
    firstName?: string
    lastName?: string
    email: string
    role: string
  }
}

export interface Event {
  id: string
  name: string
  title?: string // Add title property for admin pages
  slug: string
  description?: string
  date: string
  endDate?: string
  venue: string
  address?: string
  maxCapacity?: number
  paymentRequired?: boolean
  registrationDeadline?: string
  paymentDeadline?: string
  depositAllowed?: boolean
  depositPercentage?: number
  fullPaymentDeadline?: string
  latePaymentFee?: number
  refundPolicy?: string
  badgeTemplateId?: string
  isActive: boolean
  status?: string
  totalRegistrations?: number
  approvedRegistrations?: number
  paidRegistrations?: number
  pendingRegistrations?: number
  failedRegistrations?: number
  createdAt: string
  updatedAt: string
  categories?: Category[]
  meals?: Meal[]
  registrations?: Registration[]
  staff?: EventStaff[]
  recentRegistrations?: Registration[]
  totalRevenue?: number // Add totalRevenue property for events pages
}

export interface Category {
  id: string
  name: string
  price: number
  maxCapacity: number
  description: string
  eventId?: string
  event?: Event
  registrations?: Registration[]
  createdAt?: string
  updatedAt?: string
}

export interface Registration {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  receiptNumber?: string
  paymentStatus: 'PENDING' | 'APPROVED' | 'DECLINED' | 'REFUNDED' | 'PAID' | 'FAILED'
  paymentMethod?: 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'ONLINE'
  qrCode: string
  checkedIn: boolean
  checkedInAt?: string
  checkInStatus?: 'CHECKED_IN' | 'NOT_CHECKED_IN' // Add checkInStatus property for admin pages
  checkInTime?: string // Add checkInTime property for admin pages
  notes?: string
  eventId: string
  categoryId: string
  event?: Event
  category?: Category
  mealAttendances?: MealAttendance[]
  createdAt: string
  updatedAt: string
  // Additional properties for admin pages
  participant?: {
    firstName: string
    lastName: string
    email: string
    title?: string
    company?: string
    mealPreferences?: string[]
  }
  status?: 'CONFIRMED' | 'PENDING' | 'CANCELLED'
  organization?: string
  jobTitle?: string
  dietaryRestrictions?: string
  specialRequests?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  registrationStatus?: string
  totalAmount?: number
  registrationNumber?: string
  user?: {
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  paymentReference?: string
  fullName?: string // Add fullName property for finance pages
  amount?: number // Add amount property for finance pages
  transactions?: any[] // Add transactions property for badges page
}

export interface Meal {
  id: string
  sessionName: string
  name: string // Add name property for meal display
  sessionTime?: string // Add sessionTime property
  startTime: string
  endTime: string
  maxCapacity?: number
  description?: string
  isActive?: boolean
  eventId?: string
  event?: Event
  attendances?: MealAttendance[]
  createdAt?: string
  updatedAt?: string
  date?: string // Add date property for admin registrations detail page
  venue?: string // Add venue property for admin registrations detail page
}

export interface MealAttendance {
  id: string
  scannedAt: string
  scannedBy: string
  notes?: string
  mealId: string
  registrationId: string
  meal?: Meal
  registration?: Registration // Add registration property for populated data
  createdAt?: string
  attended?: boolean // Add attended property for admin registrations detail page
  attendedAt?: string // Add attendedAt property for admin registrations detail page
}

// Input Types for Mutations
export interface CreateUserInput {
  email: string
  password: string
  role?: 'ADMIN' | 'STAFF' | 'PARTICIPANT'
  firstName?: string
  lastName?: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface CreateEventInput {
  name: string
  slug: string
  description: string
  date: string
  endDate?: string
  venue: string
  address: string
  maxCapacity: number
  paymentRequired: boolean
  registrationDeadline?: string
  paymentDeadline?: string
  depositAllowed: boolean
  depositPercentage?: number
  fullPaymentDeadline?: string
  latePaymentFee?: number
  refundPolicy: 'full' | 'partial' | 'deposit' | 'none'
  badgeTemplateId?: string
  categories?: CreateCategoryInput[]
  meals?: CreateMealInput[]
}

export interface UpdateEventInput {
  name?: string
  slug?: string
  description?: string
  date?: string
  endDate?: string | null
  venue?: string
  address?: string
  maxCapacity?: number
  status?: 'DRAFT' | 'ACTIVE' | 'CANCELLED' | 'COMPLETED'
  paymentRequired?: boolean
  registrationDeadline?: string | null
  paymentDeadline?: string | null
  depositAllowed?: boolean
  depositPercentage?: number
  fullPaymentDeadline?: string
  latePaymentFee?: number
  refundPolicy?: 'full' | 'partial' | 'deposit' | 'none'
  categories?: UpdateCategoryInput[] // Add categories property for admin events edit page
  meals?: UpdateMealInput[] // Add meals property for admin events edit page
}

export interface CreateRegistrationInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  receiptNumber?: string
  paymentStatus?: 'PENDING' | 'APPROVED' | 'DECLINED' | 'REFUNDED'
  paymentMethod?: 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'ONLINE'
  eventId: string
  categoryId: string
}

export interface UpdateRegistrationInput {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  paymentStatus?: 'PENDING' | 'APPROVED' | 'DECLINED'
  receiptNumber?: string
  organization?: string // Add organization property for admin registrations edit page
  jobTitle?: string // Add jobTitle property for admin registrations edit page
  dietaryRestrictions?: string // Add dietaryRestrictions property for admin registrations edit page
  specialRequests?: string // Add specialRequests property for admin registrations edit page
  emergencyContactName?: string // Add emergencyContactName property for admin registrations edit page
  emergencyContactPhone?: string // Add emergencyContactPhone property for admin registrations edit page
  registrationStatus?: string // Add registrationStatus property for admin registrations edit page
}

export interface CreateCategoryInput {
  name: string
  price: number
  maxCapacity: number
  description: string
}

export interface UpdateCategoryInput {
  name?: string
  price?: number
  maxCapacity?: number
  description?: string
}

export interface CreateMealInput {
  name: string
  sessionTime: string
  description?: string
}

export interface UpdateMealInput {
  name?: string
  sessionTime?: string
  description?: string
}

export interface CreateMealAttendanceInput {
  mealId: string
  registrationId: string
  notes?: string
  scannedBy: string
}

// Response Types
export interface LoginResponse {
  access_token: string
  user: User
}

export interface QrCodeValidationResponse {
  isValid: boolean
  registration?: Registration
  alreadyScanned: boolean
  error?: string
  message?: string
}

export interface QRCodeValidationResult {
  isValid: boolean
  registrationId?: string
  participantName?: string
  participantEmail?: string // Add missing participantEmail property
  eventName?: string
  eventId?: string // Add missing eventId property
  category?: string
  errors: string[]
  message?: string
}

export interface ScanQrCodeResponse {
  success: boolean
  attendance?: MealAttendance
  error?: string
  alreadyScanned: boolean
}

export interface DashboardStats {
  totalEvents: number
  totalRegistrations: number
  totalRevenue: number
  activeEvents: number
  recentRegistrations: Registration[]
  recentEvents: Event[]
  registrationGrowth?: number
  eventCompletionRate?: number
  upcomingEvents?: number
  completedEvents?: number
  averageEventCapacity?: number
  totalStaff?: number
  activeStaff?: number
  totalQRScans?: number
  averageRegistrationValue?: number
  pendingPayments?: number
  pendingPaymentAmount?: number
  totalBadgesPrinted?: number
  todayScans?: number
  todayRegistrations?: number
  todayRevenue?: number
  revenueGrowth?: number
}

// Query Variables
export interface GetEventsVariables {
  limit?: number
  offset?: number
}

export interface GetEventByIdVariables {
  id: string
}

export interface GetEventByIdResponse {
  event: Event
  eventManagers: EventStaff[]
}

export interface GetEventBySlugVariables {
  slug: string
}

export interface GetRegistrationsVariables {
  eventId?: string
  limit?: number
  offset?: number
}

export interface GetRegistrationByIdVariables {
  id: string
}

export interface SearchRegistrationByReceiptVariables {
  receiptNumber: string
}

export interface GetAvailableEventManagersVariables {
  searchQuery?: string
}

export interface GetMealAttendancesVariables {
  mealId?: string
  limit?: number
  offset?: number
}

export interface ValidateQrCodeVariables {
  qrCode: string
  mealId: string
}

export interface ScanQrCodeVariables {
  qrCode: string
  mealId: string
}

// Mutation Variables
export interface LoginVariables {
  email: string
  password: string
}

export interface CreateEventVariables {
  input: CreateEventInput
}

export interface UpdateEventVariables {
  id: string
  input: UpdateEventInput
}

export interface DeleteEventVariables {
  id: string
}

export interface CreateRegistrationVariables {
  input: CreateRegistrationInput
}

export interface UpdateRegistrationVariables {
  id: string
  input: UpdateRegistrationInput
}

export interface ApproveRegistrationVariables {
  id: string
}

export interface RejectRegistrationVariables {
  id: string
  reason?: string
}

export interface GenerateQrCodeVariables {
  registrationId: string
}

export interface CreateMealAttendanceVariables {
  input: CreateMealAttendanceInput
}

export interface ManualOverrideInput {
  registrationId: string
  mealId: string
  scannedBy: string
  notes?: string
  overrideReason?: string
}

export interface ManualOverrideAttendanceVariables {
  input: ManualOverrideInput
}

// Badge Generation Types
export interface GenerateBadgeVariables {
  registrationId: string
  format?: string
}

export interface RegenerateBadgeVariables {
  registrationId: string
  format?: string
}

export interface GenerateBadgeSheetVariables {
  registrationIds: string[]
}

export interface GenerateBadgeResponse {
  generateBadge: string
}

export interface RegenerateBadgeResponse {
  regenerateBadge: string
}

export interface GenerateBadgeSheetResponse {
  generateBadgeSheet: string
}

// Event Draft Types
export interface EventDraft {
  id: string
  userId: string
  draftData: any
  currentStep: number
  lastSavedAt: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface SaveEventDraftInput {
  draftData: any
  currentStep: number
}

export interface UpdateEventDraftInput {
  id: string
  draftData?: any
  currentStep?: number
}

export interface GetEventDraftResponse {
  getEventDraft: EventDraft | null
}

export interface SaveEventDraftResponse {
  saveEventDraft: EventDraft
}

export interface UpdateEventDraftResponse {
  updateEventDraft: EventDraft
}

export interface DeleteEventDraftResponse {
  deleteEventDraft: boolean
}
