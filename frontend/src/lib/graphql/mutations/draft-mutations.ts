import { gql } from '@apollo/client'

// Save or create event draft
export const SAVE_EVENT_DRAFT = gql`
  mutation SaveEventDraft($input: SaveEventDraftInput!) {
    saveEventDraft(input: $input) {
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

// Update existing event draft
export const UPDATE_EVENT_DRAFT = gql`
  mutation UpdateEventDraft($input: UpdateEventDraftInput!) {
    updateEventDraft(input: $input) {
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

// Delete event draft
export const DELETE_EVENT_DRAFT = gql`
  mutation DeleteEventDraft {
    deleteEventDraft
  }
`
