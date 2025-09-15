'use client'

import { useMutation, useQuery } from '@apollo/client/react'
import { toast } from 'sonner'
import { 
  GENERATE_QR_CODE, 
  REGENERATE_QR_CODE, 
  VALIDATE_QR_CODE, 
  BULK_GENERATE_QR_CODES 
} from '@/lib/graphql/mutations'
import { GET_QR_CODE_IMAGE } from '@/lib/graphql/queries'

// Types
interface QRCodeData {
  registrationId: string
  eventId: string
  participantName: string
  category: string
  timestamp: string
  checksum: string
}

interface QRCodeResult {
  qrCode: string
  qrCodeData: QRCodeData
  base64Image: string
}

interface QRCodeValidationResult {
  isValid: boolean
  registrationId?: string
  participantName?: string
  eventName?: string
  category?: string
  errors?: string[]
}

// Generate QR Code Hook
export function useGenerateQRCode() {
  const [generateQRCode, { loading, error, data }] = useMutation(GENERATE_QR_CODE, {
    onCompleted: (data) => {
      if ((data as any)?.generateQRCode) {
        toast.success('QR code generated successfully!')
      }
    },
    onError: (error) => {
      console.error('QR code generation error:', error)
      toast.error(`Failed to generate QR code: ${error.message}`)
    }
  })

  const generate = async (registrationId: string): Promise<QRCodeResult | null> => {
    try {
      const result = await generateQRCode({
        variables: { registrationId }
      })
      return (result.data as any)?.generateQRCode || null
    } catch (err) {
      console.error('Generate QR code error:', err)
      return null
    }
  }

  return {
    generate,
    loading,
    error,
    data: (data as any)?.generateQRCode
  }
}

// Regenerate QR Code Hook
export function useRegenerateQRCode() {
  const [regenerateQRCode, { loading, error, data }] = useMutation(REGENERATE_QR_CODE, {
    onCompleted: (data) => {
      if ((data as any)?.regenerateQRCode) {
        toast.success('QR code regenerated successfully!')
      }
    },
    onError: (error) => {
      console.error('QR code regeneration error:', error)
      toast.error(`Failed to regenerate QR code: ${error.message}`)
    }
  })

  const regenerate = async (registrationId: string): Promise<QRCodeResult | null> => {
    try {
      const result = await regenerateQRCode({
        variables: { registrationId }
      })
      return (result.data as any)?.regenerateQRCode || null
    } catch (err) {
      console.error('Regenerate QR code error:', err)
      return null
    }
  }

  return {
    regenerate,
    loading,
    error,
    data: (data as any)?.regenerateQRCode
  }
}

// Validate QR Code Hook
export function useValidateQRCode() {
  const [validateQRCode, { loading, error, data }] = useMutation(VALIDATE_QR_CODE, {
    onCompleted: (data) => {
      if ((data as any)?.validateQRCode?.isValid) {
        toast.success('QR code is valid!')
      } else {
        toast.error('QR code is invalid or expired')
      }
    },
    onError: (error) => {
      console.error('QR code validation error:', error)
      toast.error(`Failed to validate QR code: ${error.message}`)
    }
  })

  const validate = async (qrCode: string): Promise<QRCodeValidationResult | null> => {
    try {
      const result = await validateQRCode({
        variables: { 
          input: { qrCode } 
        }
      })

      if ((result.data as any)?.validateQRCode) {
        const validation = (result.data as any).validateQRCode
        return {
          isValid: validation.isValid,
          registrationId: validation.qrCodeData?.registrationId,
          participantName: validation.qrCodeData?.participantName,
          eventName: validation.qrCodeData?.eventId, // We only have eventId, not event name
          category: validation.qrCodeData?.category,
          errors: validation.isValid ? [] : [validation.message || 'Invalid QR code']
        }
      }

      return null
    } catch (err) {
      console.error('Validate QR code error:', err)
      return {
        isValid: false,
        errors: ['Failed to validate QR code']
      }
    }
  }

  return {
    validate,
    loading,
    error,
    data: (data as any)?.validateQRCode
  }
}

// Get QR Code Image Hook
export function useQRCodeImage(registrationId: string) {
  const { data, loading, error, refetch } = useQuery(GET_QR_CODE_IMAGE, {
    variables: { registrationId },
    skip: !registrationId,
    errorPolicy: 'all'
  })

  // Handle errors manually
  if (error) {
    console.error('QR code image fetch error:', error)
  }

  // Transform the string response into the expected object format
  const qrCodeData = (data as any)?.getQRCodeImage ? {
    base64Image: (data as any).getQRCodeImage,
    qrCode: null, // We don't have the raw QR code from this query
    qrCodeData: null // We don't have the decoded data from this query
  } : null

  return {
    qrCodeData,
    loading,
    error,
    refetch
  }
}

// Bulk Generate QR Codes Hook
export function useBulkGenerateQRCodes() {
  const [bulkGenerateQRCodes, { loading, error, data }] = useMutation(BULK_GENERATE_QR_CODES, {
    onCompleted: (data: any) => {
      if (data?.bulkGenerateQRCodes) {
        const count = data.bulkGenerateQRCodes.length
        toast.success(`Successfully generated ${count} QR codes!`)
      }
    },
    onError: (error: any) => {
      console.error('Bulk QR code generation error:', error)
      toast.error(`Failed to generate QR codes: ${error.message}`)
    }
  })

  const bulkGenerate = async (registrationIds: string[]): Promise<QRCodeResult[] | null> => {
    try {
      const result = await bulkGenerateQRCodes({
        variables: { registrationIds }
      })
      return (result.data as any)?.bulkGenerateQRCodes || null
    } catch (err) {
      console.error('Bulk generate QR codes error:', err)
      return null
    }
  }

  return {
    bulkGenerate,
    loading,
    error,
    data: (data as any)?.bulkGenerateQRCodes
  }
}

// Combined QR Code Hook for Registration Details
export function useRegistrationQRCode(registrationId: string) {
  const { qrCodeData, loading: fetchLoading, error: fetchError, refetch } = useQRCodeImage(registrationId)
  const { generate, loading: generateLoading, error: generateError } = useGenerateQRCode()
  const { regenerate, loading: regenerateLoading, error: regenerateError } = useRegenerateQRCode()

  const handleGenerate = async () => {
    const result = await generate(registrationId)
    if (result) {
      // Refetch to get updated data
      await refetch()
    }
    return result
  }

  const handleRegenerate = async () => {
    const result = await regenerate(registrationId)
    if (result) {
      // Refetch to get updated data
      await refetch()
    }
    return result
  }

  return {
    qrCodeData,
    loading: fetchLoading || generateLoading || regenerateLoading,
    error: fetchError || generateError || regenerateError,
    generate: handleGenerate,
    regenerate: handleRegenerate,
    refetch
  }
}
