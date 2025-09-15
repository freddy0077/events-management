import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { toast } from 'sonner'
import { GET_EVENT_DRAFT } from '@/lib/graphql/queries'
import { 
  SAVE_EVENT_DRAFT, 
  UPDATE_EVENT_DRAFT, 
  DELETE_EVENT_DRAFT 
} from '@/lib/graphql/mutations'
import { 
  EventDraft, 
  SaveEventDraftInput, 
  UpdateEventDraftInput,
  GetEventDraftResponse,
  SaveEventDraftResponse,
  UpdateEventDraftResponse,
  DeleteEventDraftResponse
} from '@/lib/graphql/types'
import { EventFormData } from '@/components/admin/event-creation/types'

export interface UseEventDraftOptions {
  autoSaveInterval?: number // Auto-save interval in milliseconds (default: 30 seconds)
  onDraftLoaded?: (draft: EventDraft) => void
  onDraftSaved?: (draft: EventDraft) => void
  onDraftError?: (error: Error) => void
}

export function useEventDraft(options: UseEventDraftOptions = {}) {
  const {
    autoSaveInterval = 30000, // 30 seconds default
    onDraftLoaded,
    onDraftSaved,
    onDraftError
  } = options

  const [isDraftLoading, setIsDraftLoading] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // GraphQL operations
  const { data: draftData, loading: loadingDraft, refetch: refetchDraft } = useQuery<GetEventDraftResponse>(
    GET_EVENT_DRAFT,
    {
      errorPolicy: 'all',
      fetchPolicy: 'cache-and-network'
    }
  )

  // Handle draft data loading
  useEffect(() => {
    if (draftData?.getEventDraft) {
      onDraftLoaded?.(draftData.getEventDraft)
      setLastSavedAt(new Date(draftData.getEventDraft.lastSavedAt))
    }
  }, [draftData?.getEventDraft]) // Remove onDraftLoaded from dependencies to prevent infinite loop

  const [saveEventDraftMutation] = useMutation<SaveEventDraftResponse>(SAVE_EVENT_DRAFT, {
    onCompleted: (data) => {
      setLastSavedAt(new Date(data.saveEventDraft.lastSavedAt))
      setHasUnsavedChanges(false)
      onDraftSaved?.(data.saveEventDraft)
    },
    onError: (error) => {
      console.error('Error saving draft:', error)
      onDraftError?.(error)
      toast.error('Failed to save draft')
    }
  })

  const [updateEventDraftMutation] = useMutation<UpdateEventDraftResponse>(UPDATE_EVENT_DRAFT, {
    onCompleted: (data) => {
      setLastSavedAt(new Date(data.updateEventDraft.lastSavedAt))
      setHasUnsavedChanges(false)
      onDraftSaved?.(data.updateEventDraft)
    },
    onError: (error) => {
      console.error('Error updating draft:', error)
      onDraftError?.(error)
      toast.error('Failed to update draft')
    }
  })

  const [deleteEventDraftMutation] = useMutation<DeleteEventDraftResponse>(DELETE_EVENT_DRAFT, {
    onCompleted: () => {
      setLastSavedAt(null)
      setHasUnsavedChanges(false)
      toast.success('Draft deleted')
    },
    onError: (error) => {
      console.error('Error deleting draft:', error)
      onDraftError?.(error)
      toast.error('Failed to delete draft')
    }
  })

  // Save draft function
  const saveDraft = useCallback(async (formData: EventFormData, currentStep: number) => {
    setIsDraftLoading(true)
    try {
      const input: SaveEventDraftInput = {
        draftData: formData,
        currentStep
      }

      if (draftData?.getEventDraft) {
        // Update existing draft
        await updateEventDraftMutation({
          variables: {
            input: {
              id: draftData.getEventDraft.id,
              draftData: formData,
              currentStep
            }
          }
        })
      } else {
        // Create new draft
        await saveEventDraftMutation({
          variables: { input }
        })
      }
    } catch (error) {
      console.error('Error in saveDraft:', error)
    } finally {
      setIsDraftLoading(false)
    }
  }, [draftData?.getEventDraft, saveEventDraftMutation, updateEventDraftMutation])

  // Delete draft function
  const deleteDraft = useCallback(async () => {
    try {
      await deleteEventDraftMutation()
      await refetchDraft()
    } catch (error) {
      console.error('Error in deleteDraft:', error)
    }
  }, [deleteEventDraftMutation, refetchDraft])

  // Auto-save functionality
  const enableAutoSave = useCallback((formData: EventFormData, currentStep: number) => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges) {
        saveDraft(formData, currentStep)
      }
    }, autoSaveInterval)

    return () => clearInterval(interval)
  }, [hasUnsavedChanges, saveDraft, autoSaveInterval])

  // Mark as having unsaved changes
  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true)
  }, [])

  // Get current draft
  const currentDraft = draftData?.getEventDraft || null

  return {
    // State
    currentDraft,
    isDraftLoading: isDraftLoading || loadingDraft,
    lastSavedAt,
    hasUnsavedChanges,
    
    // Actions
    saveDraft,
    deleteDraft,
    enableAutoSave,
    markAsChanged,
    refetchDraft,
    
    // Utilities
    isExpired: currentDraft && currentDraft.expiresAt ? new Date(currentDraft.expiresAt) < new Date() : false,
    timeUntilExpiry: currentDraft && currentDraft.expiresAt ? 
      Math.max(0, new Date(currentDraft.expiresAt).getTime() - new Date().getTime()) : 0
  }
}
