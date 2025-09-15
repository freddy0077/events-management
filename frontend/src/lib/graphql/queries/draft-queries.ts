import { gql } from '@apollo/client'

// Get current user's event draft
export const GET_EVENT_DRAFT = gql`
  query GetEventDraft {
    getEventDraft {
      id
      userId
      draftData
      currentStep
      lastSavedAt
      expiresAt
      createdAt
      updatedAt
    }
  }
`
