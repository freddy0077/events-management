import { useQuery, useMutation, useSubscription, useLazyQuery } from '@apollo/client/react'
import {
  GET_EVENTS,
  GET_EVENT_BY_ID,
  GET_EVENT_BY_SLUG,
  GET_REGISTRATIONS,
  GET_REGISTRATION_BY_ID,
  SEARCH_REGISTRATION_BY_RECEIPT,
  GET_MEAL_ATTENDANCES,
  GET_RECENT_MEAL_ATTENDANCES,
  VALIDATE_QR_CODE,
  GET_ME,
  GET_DASHBOARD_STATS,
  GET_MY_ASSIGNED_EVENTS,
  GET_MY_EVENT_REGISTRATIONS,
  GET_EVENT_REGISTRATIONS,
  GET_AVAILABLE_EVENT_MANAGERS,
  GET_EVENT_MANAGERS,
  GET_EVENT_STAFF,
  GET_CATERING_METRICS,
  GET_CATERING_REGISTRATIONS,
  GET_MEAL_SESSIONS,
  GET_CATERING_REPORTS,
  GET_CATEGORIES,
  GET_CATEGORIES_BY_EVENT,
  GET_ACTIVE_CATEGORIES_BY_EVENT,
  GET_CATEGORY,
  GET_QR_CODE_IMAGE
} from './queries'
import {
  LOGIN,
  REGISTER_USER,
  CREATE_EVENT,
  UPDATE_EVENT,
  DELETE_EVENT,
  CREATE_REGISTRATION,
  CREATE_STAFF_REGISTRATION,
  UPDATE_REGISTRATION,
  APPROVE_REGISTRATION,
  REJECT_REGISTRATION,
  GENERATE_QR_CODE,
  REGENERATE_QR_CODE,
  BULK_GENERATE_QR_CODES,
  CREATE_MEAL_ATTENDANCE,
  SCAN_QR_CODE,
  MANUAL_OVERRIDE_ATTENDANCE,
  CREATE_MEAL,
  UPDATE_MEAL,
  DELETE_MEAL,
  ASSIGN_EVENT_MANAGER,
  REMOVE_EVENT_MANAGER,
  ASSIGN_STAFF_TO_EVENT,
  REMOVE_STAFF_FROM_EVENT,
  UPDATE_STAFF_ROLE,
  CHANGE_PASSWORD,
  FORCE_PASSWORD_CHANGE,
  SERVE_MEAL,
  SCAN_MEAL_QR_CODE,
  CREATE_CATEGORY,
  UPDATE_CATEGORY,
  DELETE_CATEGORY,
  TOGGLE_CATEGORY_STATUS,
  CHECK_IN_PARTICIPANT,
  START_MEAL_SESSION,
  END_MEAL_SESSION,
  CREATE_MEAL_SESSION,
  UPDATE_MEAL_SESSION,
  GENERATE_BADGE,
  REGENERATE_BADGE,
  GENERATE_BADGE_SHEET
} from './mutations'
import {
  Event,
  Registration,
  MealAttendance,
  User,
  DashboardStats,
  LoginResponse,
  QrCodeValidationResponse,
  ScanQrCodeResponse,
  GetEventsVariables,
  GetEventByIdVariables,
  GetEventByIdResponse,
  GetEventBySlugVariables,
  GetRegistrationsVariables,
  GetRegistrationByIdVariables,
  SearchRegistrationByReceiptVariables,
  GetMealAttendancesVariables,
  ValidateQrCodeVariables,
  LoginVariables,
  CreateEventVariables,
  UpdateEventVariables,
  DeleteEventVariables,
  CreateRegistrationVariables,
  UpdateRegistrationVariables,
  ApproveRegistrationVariables,
  RejectRegistrationVariables,
  GenerateQrCodeVariables,
  ScanQrCodeVariables,
  CreateMealAttendanceVariables,
  ManualOverrideAttendanceVariables,
  GenerateBadgeVariables,
  GenerateBadgeResponse,
  RegenerateBadgeVariables,
  RegenerateBadgeResponse,
  GenerateBadgeSheetVariables,
  GenerateBadgeSheetResponse
} from './types'

// Event Hooks
export const useEvents = (variables?: GetEventsVariables) => {
  const result = useQuery<{ events: Event[] }, GetEventsVariables>(GET_EVENTS, {
    variables,
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true
  })

  // Handle errors and completion in useEffect or component logic instead
  if (result.error) {
    console.error('🚨 GET_EVENTS Query Error:', {
      message: result.error.message,
      graphQLErrors: (result.error as any).graphQLErrors,
      networkError: (result.error as any).networkError
    })
  }

  if (result.data && !result.loading) {
    console.log('✅ GET_EVENTS Query Completed:', result.data)
  }

  return result
}

export const useEvent = (variables: GetEventByIdVariables) => {
  return useQuery<GetEventByIdResponse, GetEventByIdVariables>(GET_EVENT_BY_ID, {
    variables,
    errorPolicy: 'all'
  })
}

export const useEventBySlug = (variables: GetEventBySlugVariables) => {
  return useQuery<{ eventBySlug: Event }, GetEventBySlugVariables>(GET_EVENT_BY_SLUG, {
    variables,
    errorPolicy: 'all'
  })
}

export const useCreateEvent = () => {
  return useMutation<{ createEvent: Event }, CreateEventVariables>(CREATE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
    errorPolicy: 'all'
  })
}

export const useUpdateEvent = () => {
  return useMutation<{ updateEvent: Event }, UpdateEventVariables>(UPDATE_EVENT, {
    errorPolicy: 'all'
  })
}

export const useDeleteEvent = () => {
  return useMutation<{ removeEvent: Event }, DeleteEventVariables>(DELETE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
    errorPolicy: 'all'
  })
}

// Registration Hooks
export const useRegistrations = (variables?: GetRegistrationsVariables) => {
  return useQuery<{ registrations: Registration[] }, GetRegistrationsVariables>(GET_REGISTRATIONS, {
    variables,
    errorPolicy: 'all'
  })
}

export const useEventRegistrations = (variables?: { eventIds: string[] }) => {
  return useQuery<{ eventRegistrations: Registration[] }, { eventIds: string[] }>(GET_REGISTRATIONS, {
    variables: variables || { eventIds: [] },
    errorPolicy: 'all',
    skip: !variables || variables.eventIds.length === 0
  })
}

export const useRegistration = (variables: GetRegistrationByIdVariables) => {
  return useQuery<{ registration: Registration }, GetRegistrationByIdVariables>(GET_REGISTRATION_BY_ID, {
    variables,
    errorPolicy: 'all'
  })
}

export const useSearchRegistrationByReceipt = () => {
  return useLazyQuery<{ searchRegistrationByReceipt: Registration }, SearchRegistrationByReceiptVariables>(
    SEARCH_REGISTRATION_BY_RECEIPT,
    {
      errorPolicy: 'all'
    }
  )
}

export const useCreateRegistration = () => {
  return useMutation<{ createRegistration: Registration }, CreateRegistrationVariables>(CREATE_REGISTRATION, {
    refetchQueries: [{ query: GET_REGISTRATIONS }],
    errorPolicy: 'all'
  })
}

export const useCreateStaffRegistration = () => {
  return useMutation(CREATE_STAFF_REGISTRATION, {
    errorPolicy: 'all',
    // Prevent caching issues by not updating cache automatically
    fetchPolicy: 'no-cache',
    // Reset the mutation state after completion
    onCompleted: () => {
      console.log('✅ Staff registration mutation completed successfully')
    },
    onError: (error) => {
      console.error('❌ Staff registration mutation error:', error)
    }
  })
}

export const useUpdateRegistration = () => {
  return useMutation<{ updateRegistration: Registration }, UpdateRegistrationVariables>(UPDATE_REGISTRATION, {
    errorPolicy: 'all'
  })
}

export const useApproveRegistration = () => {
  return useMutation<{ approveRegistration: Registration }, ApproveRegistrationVariables>(APPROVE_REGISTRATION, {
    errorPolicy: 'all'
  })
}

export const useRejectRegistration = () => {
  return useMutation<{ rejectRegistration: Registration }, RejectRegistrationVariables>(REJECT_REGISTRATION, {
    errorPolicy: 'all'
  })
}

export const useGenerateQrCode = () => {
  return useMutation<{ generateQrCode: Registration }, GenerateQrCodeVariables>(GENERATE_QR_CODE, {
    errorPolicy: 'all'
  })
}

// Meal Attendance Hooks
export const useMealAttendances = (mealId?: string) => {
  return useQuery<{ mealAttendance: MealAttendance[] }>(GET_MEAL_ATTENDANCES, {
    variables: { mealId },
    errorPolicy: 'all',
    skip: !mealId // Skip query if no mealId provided
  })
}

export const useRecentMealAttendances = (eventId?: string, limit: number = 50) => {
  console.log('useRecentMealAttendances called with:', { eventId, limit })
  
  const result = useQuery<{ recentMealAttendances: MealAttendance[] }>(GET_RECENT_MEAL_ATTENDANCES, {
    variables: { eventId, limit },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network' // Always fetch fresh data for recent scans
  })

  // Handle errors and completion manually
  if (result.error) {
    console.error('Recent meal attendances query error:', result.error)
  }

  if (result.data && !result.loading) {
    console.log('Recent meal attendances query completed:', result.data)
  }
  
  console.log('useRecentMealAttendances result:', result)
  return result
}

export const useValidateQrCode = (variables: ValidateQrCodeVariables) => {
  return useQuery<{ validateQrCode: QrCodeValidationResponse }, ValidateQrCodeVariables>(VALIDATE_QR_CODE, {
    variables,
    errorPolicy: 'all',
    skip: !variables.qrCode || !variables.mealId
  })
}

export const useScanQrCode = () => {
  return useMutation<{ scanQrCode: ScanQrCodeResponse }, ScanQrCodeVariables>(SCAN_QR_CODE, {
    refetchQueries: [{ query: GET_MEAL_ATTENDANCES }, { query: GET_RECENT_MEAL_ATTENDANCES }],
    errorPolicy: 'all'
  })
}

export const useCreateMealAttendance = () => {
  return useMutation<{ createMealAttendance: MealAttendance }, CreateMealAttendanceVariables>(CREATE_MEAL_ATTENDANCE, {
    refetchQueries: [{ query: GET_MEAL_ATTENDANCES }],
    errorPolicy: 'all'
  })
}

export const useManualOverrideAttendance = () => {
  return useMutation<{ manualOverrideAttendance: MealAttendance }, ManualOverrideAttendanceVariables>(
    MANUAL_OVERRIDE_ATTENDANCE,
    {
      refetchQueries: [{ query: GET_MEAL_ATTENDANCES }],
      errorPolicy: 'all'
    }
  )
}

// Authentication Hooks
export const useLogin = () => {
  return useMutation<{ login: LoginResponse }, LoginVariables>(LOGIN, {
    errorPolicy: 'all'
  })
}

export const useMe = () => {
  return useQuery<{ me: User }>(GET_ME, {
    errorPolicy: 'all'
  })
}

// Dashboard Hooks
export const useDashboardStats = () => {
  return useQuery<{ dashboardStats: DashboardStats }>(GET_DASHBOARD_STATS, {
    errorPolicy: 'all'
  })
}



// Meal Hooks
export const useCreateMeal = () => {
  return useMutation(CREATE_MEAL, {
    errorPolicy: 'all'
  })
}

export const useUpdateMeal = () => {
  return useMutation(UPDATE_MEAL, {
    errorPolicy: 'all'
  })
}

export const useDeleteMeal = () => {
  return useMutation(DELETE_MEAL, {
    errorPolicy: 'all'
  })
}

// Event-Scoped Access Hooks
export const useMyAssignedEvents = () => {
  console.log('useMyAssignedEvents hook called')
  const result = useQuery(GET_MY_ASSIGNED_EVENTS, {
    errorPolicy: 'all',
    fetchPolicy: 'network-only', // Force fresh fetch to bypass cache
    notifyOnNetworkStatusChange: true
  })

  // Handle errors and completion manually
  if (result.error) {
    console.error('MyAssignedEvents Query Error:', result.error)
    console.error('Error details:', (result.error as any).graphQLErrors, (result.error as any).networkError)
  }

  if (result.data && !result.loading) {
    console.log('MyAssignedEvents Query Completed:', result.data)
  }

  return result
}

export const useMyEventRegistrations = (eventIds: string[]) => {
  // Use GET_MY_EVENT_REGISTRATIONS to fetch registrations for ALL assigned events
  return useQuery(GET_MY_EVENT_REGISTRATIONS, {
    variables: eventIds && eventIds.length > 0 ? { eventIds } : undefined,
    skip: !eventIds || eventIds.length === 0,
    errorPolicy: 'all'
  })
}

// Event Manager Assignment Hooks
export const useAvailableEventManagers = (variables?: GetAvailableEventManagersVariables) => {
  return useQuery(GET_AVAILABLE_EVENT_MANAGERS, {
    variables,
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network'
  })
}

export const useSearchEventManagers = () => {
  return useLazyQuery<{ availableEventManagers: User[] }, GetAvailableEventManagersVariables>(
    GET_AVAILABLE_EVENT_MANAGERS,
    {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network'
    }
  )
}

export const useEventManagers = (eventId: string) => {
  return useQuery(GET_EVENT_MANAGERS, {
    variables: { eventId },
    skip: !eventId,
    errorPolicy: 'all'
  })
}

export const useAssignEventManager = () => {
  return useMutation(ASSIGN_EVENT_MANAGER, {
    refetchQueries: ['GetEventManagers', 'GetEvents', 'GetEventById', 'GetAvailableEventManagers'],
    errorPolicy: 'all'
  })
}

export const useRemoveEventManager = () => {
  return useMutation(REMOVE_EVENT_MANAGER, {
    refetchQueries: ['GetEventManagers', 'GetEvents', 'GetEventById', 'GetAvailableEventManagers'],
    errorPolicy: 'all'
  })
}

// Event Staff Hooks
export const useEventStaff = (eventId: string) => {
  return useQuery(GET_EVENT_STAFF, {
    variables: { eventId },
    skip: !eventId,
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  })
}

export const useAssignStaffToEvent = () => {
  return useMutation(ASSIGN_STAFF_TO_EVENT, {
    refetchQueries: ['GetEventStaff', 'GetAvailableEventManagers'],
    errorPolicy: 'all'
  })
}

export const useRemoveStaffFromEvent = () => {
  return useMutation(REMOVE_STAFF_FROM_EVENT, {
    refetchQueries: ['GetEventStaff', 'GetAvailableEventManagers'],
    errorPolicy: 'all'
  })
}

export const useUpdateStaffRole = () => {
  return useMutation(UPDATE_STAFF_ROLE, {
    refetchQueries: ['GetEventStaff'],
    errorPolicy: 'all'
  })
}

// Password Change Hooks
export const useChangePassword = () => {
  return useMutation(CHANGE_PASSWORD, {
    errorPolicy: 'all'
  })
}

export const useForcePasswordChange = () => {
  return useMutation(FORCE_PASSWORD_CHANGE, {
    errorPolicy: 'all'
  })
}

// User Registration Hook
export const useRegisterUser = () => {
  return useMutation(REGISTER_USER, {
    errorPolicy: 'all'
  })
}

// Catering Hooks
export const useCateringMetrics = (eventId?: string) => {
  return useQuery(GET_CATERING_METRICS, {
    variables: { eventId },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network'
  })
}

export const useCateringRegistrations = (eventId?: string, mealFilter?: string, statusFilter?: string) => {
  return useQuery(GET_CATERING_REGISTRATIONS, {
    variables: { eventId, mealFilter, statusFilter },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network'
  })
}

export const useMealSessions = (eventId?: string) => {
  return useQuery(GET_MEAL_SESSIONS, {
    variables: { eventId },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network'
  })
}

export const useServeMeal = () => {
  return useMutation(SERVE_MEAL, {
    refetchQueries: ['GetCateringMetrics', 'GetCateringRegistrations'],
    errorPolicy: 'all'
  })
}

export const useScanMealQRCode = () => {
  return useMutation(SCAN_MEAL_QR_CODE, {
    refetchQueries: ['GetCateringMetrics', 'GetCateringRegistrations'],
    errorPolicy: 'all'
  })
}

export const useCateringReports = (filter?: any) => {
  return useQuery(GET_CATERING_REPORTS, {
    variables: { filter },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network'
  })
}

// Category Hooks
export const useCategories = () => {
  return useQuery(GET_CATEGORIES, {
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network'
  })
}

export const useCategoriesByEvent = (eventId: string) => {
  return useQuery(GET_CATEGORIES_BY_EVENT, {
    variables: { eventId },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    skip: !eventId
  })
}

export const useActiveCategoriesByEvent = (eventId: string) => {
  return useQuery(GET_ACTIVE_CATEGORIES_BY_EVENT, {
    variables: { eventId },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    skip: !eventId
  })
}

export const useCategory = (id: string) => {
  return useQuery(GET_CATEGORY, {
    variables: { id },
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    skip: !id
  })
}

export const useCreateCategory = () => {
  return useMutation(CREATE_CATEGORY, {
    refetchQueries: ['GetCategories'],
    errorPolicy: 'all'
  })
}

export const useUpdateCategory = () => {
  return useMutation(UPDATE_CATEGORY, {
    refetchQueries: ['GetCategories'],
    errorPolicy: 'all'
  })
}

export const useDeleteCategory = () => {
  return useMutation(DELETE_CATEGORY, {
    refetchQueries: ['GetCategories'],
    errorPolicy: 'all'
  })
}

export const useToggleCategoryStatus = () => {
  return useMutation(TOGGLE_CATEGORY_STATUS, {
    refetchQueries: ['GetCategories'],
    errorPolicy: 'all'
  })
}

// QR Code Hooks
export const useGetQRCodeImage = (registrationId: string) => {
  return useQuery(GET_QR_CODE_IMAGE, {
    variables: { registrationId },
    skip: !registrationId,
    errorPolicy: 'all'
  })
}

export const useGenerateQRCode = () => {
  return useMutation(GENERATE_QR_CODE, {
    errorPolicy: 'all'
  })
}

export const useRegenerateQRCode = () => {
  return useMutation(REGENERATE_QR_CODE, {
    errorPolicy: 'all'
  })
}

export const useBulkGenerateQRCodes = () => {
  return useMutation(BULK_GENERATE_QR_CODES, {
    errorPolicy: 'all'
  })
}

// Badge Generation Hooks
export const useGenerateBadge = () => {
  return useMutation<GenerateBadgeResponse, GenerateBadgeVariables>(GENERATE_BADGE, {
    errorPolicy: 'all'
  })
}

export const useRegenerateBadge = () => {
  return useMutation<RegenerateBadgeResponse, RegenerateBadgeVariables>(REGENERATE_BADGE, {
    errorPolicy: 'all'
  })
}

export const useGenerateBadgeSheet = () => {
  return useMutation<GenerateBadgeSheetResponse, GenerateBadgeSheetVariables>(GENERATE_BADGE_SHEET, {
    errorPolicy: 'all'
  })
}

// Export audit logs hooks
export { useAuditLogs, useAuditStats } from './hooks/useAuditLogs'
export type { AuditLog, AuditLogFilters, AuditLogConnection, AuditStats } from './hooks/useAuditLogs'
