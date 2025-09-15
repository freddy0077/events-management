'use client'

import { useQuery, useMutation } from '@apollo/client/react'
import { 
  GET_EVENTS, 
  GET_EVENT_BY_ID, 
  GET_EVENT_BY_SLUG,
  GET_DASHBOARD_STATS 
} from '@/lib/graphql/queries'
import { 
  CREATE_EVENT, 
  UPDATE_EVENT, 
  DELETE_EVENT 
} from '@/lib/graphql/mutations'

// Hook for fetching all events
export function useEvents(limit?: number, offset?: number) {
  return useQuery(GET_EVENTS, {
    variables: { limit, offset },
    errorPolicy: 'all'
  })
}

// Hook for fetching a single event by ID
export function useEventById(id: string) {
  return useQuery(GET_EVENT_BY_ID, {
    variables: { id },
    skip: !id,
    errorPolicy: 'all'
  })
}

// Hook for fetching a single event by slug
export function useEventBySlug(slug: string) {
  return useQuery(GET_EVENT_BY_SLUG, {
    variables: { slug },
    skip: !slug,
    errorPolicy: 'all'
  })
}

// Hook for dashboard statistics
export function useDashboardStats() {
  return useQuery(GET_DASHBOARD_STATS, {
    errorPolicy: 'all'
  })
}

// Hook for creating an event
export function useCreateEvent() {
  return useMutation(CREATE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
    errorPolicy: 'all'
  })
}

// Hook for updating an event
export function useUpdateEvent() {
  return useMutation(UPDATE_EVENT, {
    errorPolicy: 'all'
  })
}

// Hook for deleting an event
export function useDeleteEvent() {
  return useMutation(DELETE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }],
    errorPolicy: 'all'
  })
}
