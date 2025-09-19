import { gql } from '@apollo/client'

// Event management mutations

export const CREATE_EVENT = gql`
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      id
      name
      description
      slug
      date
      endDate
      venue
      maxCapacity
      isActive
      createdAt
      categories {
        id
        name
        price
        maxCapacity
        description
      }
    }
  }
`

export const UPDATE_EVENT = gql`
  mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {
    updateEvent(id: $id, input: $input) {
      id
      name
      description
      slug
      date
      endDate
      venue
      maxCapacity
      isActive
      updatedAt
      categories {
        id
        name
        price
        maxCapacity
        description
      }
    }
  }
`

export const DELETE_EVENT = gql`
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id) {
      success
      message
    }
  }
`

export const ASSIGN_EVENT_MANAGER = gql`
  mutation AssignEventManager($eventId: ID!, $userId: ID!) {
    assignEventManager(eventId: $eventId, userId: $userId) {
      id
      eventId
      userId
      role
      permissions
      assignedAt
      assignedBy
      isActive
      event {
        id
        name
      }
      user {
        id
        firstName
        lastName
        email
      }
      assignedByUser {
        id
        firstName
        lastName
      }
    }
  }
`

export const REMOVE_EVENT_MANAGER = gql`
  mutation RemoveEventManager($eventId: ID!, $userId: ID!) {
    removeEventManager(eventId: $eventId, userId: $userId) {
      success
      message
    }
  }
`
