'use client'

import { useQuery, useMutation } from '@apollo/client/react'
import { 
  GET_REGISTRATIONS, 
  GET_REGISTRATION_BY_ID,
  GET_USER_REGISTRATIONS,
  SEARCH_REGISTRATION_BY_RECEIPT 
} from '@/lib/graphql/queries'
import { 
  CREATE_REGISTRATION, 
  UPDATE_REGISTRATION,
  APPROVE_REGISTRATION,
  REJECT_REGISTRATION,
  GENERATE_QR_CODE 
} from '@/lib/graphql/mutations'

// Hook for fetching all registrations (admin)
export function useRegistrations(eventId?: string) {
  return useQuery(GET_REGISTRATIONS, {
    variables: { eventId },
    skip: !eventId,
    errorPolicy: 'all'
  })
}

// Hook for fetching a single registration by ID
export function useRegistrationById(id: string) {
  return useQuery(GET_REGISTRATION_BY_ID, {
    variables: { id },
    skip: !id,
    errorPolicy: 'all'
  })
}

// Hook for fetching user's registrations
export function useUserRegistrations() {
  return useQuery(GET_USER_REGISTRATIONS, {
    errorPolicy: 'all'
  })
}

// Hook for searching registration by receipt number
export function useSearchRegistrationByReceipt() {
  return useMutation(SEARCH_REGISTRATION_BY_RECEIPT, {
    errorPolicy: 'all'
  })
}

// Hook for creating a registration
export function useCreateRegistration() {
  return useMutation(CREATE_REGISTRATION, {
    refetchQueries: [{ query: GET_REGISTRATIONS }],
    errorPolicy: 'all'
  })
}

// Hook for updating a registration
export function useUpdateRegistration() {
  return useMutation(UPDATE_REGISTRATION, {
    errorPolicy: 'all'
  })
}

// Hook for approving a registration
export function useApproveRegistration() {
  return useMutation(APPROVE_REGISTRATION, {
    errorPolicy: 'all'
  })
}

// Hook for rejecting a registration
export function useRejectRegistration() {
  return useMutation(REJECT_REGISTRATION, {
    errorPolicy: 'all'
  })
}

// Hook for generating QR code
export function useGenerateQrCode() {
  return useMutation(GENERATE_QR_CODE, {
    errorPolicy: 'all'
  })
}
