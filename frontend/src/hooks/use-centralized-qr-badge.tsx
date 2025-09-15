'use client'

import { useMutation, useQuery } from '@apollo/client/react'
import { toast } from 'sonner'
import { 
  GENERATE_QR_CODE, 
  REGENERATE_QR_CODE, 
  VALIDATE_QR_CODE, 
  BULK_GENERATE_QR_CODES,
  GENERATE_BADGE,
  GENERATE_BADGE_SHEET,
  REGENERATE_BADGE
} from '@/lib/graphql/mutations'
import { GET_QR_CODE_IMAGE } from '@/lib/graphql/queries'
import { QRBadgeUtils, QRCodeUtils, BadgeUtils } from '@/lib/utils/qr-badge-utils'
import type { 
  QRCodeResult, 
  QRCodeValidationResult, 
  BadgePrintOptions 
} from '@/lib/utils/qr-badge-utils'

// Centralized QR Code Hook
export function useCentralizedQRCode() {
  const [generateQRCode, { loading: generateLoading }] = useMutation(GENERATE_QR_CODE)
  const [regenerateQRCode, { loading: regenerateLoading }] = useMutation(REGENERATE_QR_CODE)
  const [validateQRCode, { loading: validateLoading }] = useMutation(VALIDATE_QR_CODE)
  const [bulkGenerateQRCodes, { loading: bulkLoading }] = useMutation(BULK_GENERATE_QR_CODES)

  const generate = async (registrationId: string): Promise<QRCodeResult | null> => {
    try {
      const result = await generateQRCode({
        variables: { registrationId }
      })
      return (result.data as any)?.generateQRCode || null
    } catch (error) {
      console.error('Generate QR code error:', error)
      toast.error(`Failed to generate QR code: ${(error as any)?.message || 'Unknown error'}`)
      return null
    }
  }

  const regenerate = async (registrationId: string): Promise<QRCodeResult | null> => {
    try {
      const result = await regenerateQRCode({
        variables: { registrationId }
      })
      return (result.data as any)?.regenerateQRCode || null
    } catch (error) {
      console.error('Regenerate QR code error:', error)
      toast.error(`Failed to regenerate QR code: ${(error as any)?.message || 'Unknown error'}`)
      return null
    }
  }

  const validate = async (qrCode: string): Promise<QRCodeValidationResult | null> => {
    try {
      const result = await validateQRCode({
        variables: { qrCode }
      })
      return (result.data as any)?.validateQRCode || null
    } catch (error) {
      console.error('Validate QR code error:', error)
      toast.error(`Failed to validate QR code: ${(error as any)?.message || 'Unknown error'}`)
      return null
    }
  }

  const bulkGenerate = async (registrationIds: string[]): Promise<QRCodeResult[] | null> => {
    try {
      const result = await bulkGenerateQRCodes({
        variables: { registrationIds }
      })
      return (result.data as any)?.bulkGenerateQRCodes || null
    } catch (error) {
      console.error('Bulk generate QR codes error:', error)
      toast.error(`Failed to generate QR codes: ${(error as any)?.message || 'Unknown error'}`)
      return null
    }
  }

  // Utility functions with built-in error handling
  const downloadQRCode = (base64Image: string, participantName: string) => {
    const filename = `qr_code_${participantName.replace(/[^a-zA-Z0-9]/g, '_')}.png`
    QRCodeUtils.downloadQRCode(base64Image, filename)
  }

  const printQRCode = (base64Image: string, participantName: string) => {
    QRCodeUtils.printQRCode(base64Image, participantName)
  }

  const copyQRCodeToClipboard = async (base64Image: string) => {
    await QRCodeUtils.copyQRCodeToClipboard(base64Image)
  }

  return {
    generate,
    regenerate,
    validate,
    bulkGenerate,
    downloadQRCode,
    printQRCode,
    copyQRCodeToClipboard,
    loading: generateLoading || regenerateLoading || validateLoading || bulkLoading,
    utils: QRCodeUtils
  }
}

// Centralized Badge Hook
export function useCentralizedBadge() {
  const [generateBadge, { loading: generateLoading }] = useMutation(GENERATE_BADGE)
  const [generateBadgeSheet, { loading: sheetLoading }] = useMutation(GENERATE_BADGE_SHEET)
  const [regenerateBadge, { loading: regenerateLoading }] = useMutation(REGENERATE_BADGE)

  const generate = async (registrationId: string, format: string = 'pdf', badgeTemplateId?: string): Promise<string | null> => {
    try {
      const result = await generateBadge({
        variables: { registrationId, format, badgeTemplateId }
      })
      return (result.data as any)?.generateBadge || null
    } catch (error) {
      console.error('Generate badge error:', error)
      toast.error(`Failed to generate badge: ${(error as any)?.message || 'Unknown error'}`)
      return null
    }
  }

  const generateSheet = async (registrationIds: string[]): Promise<string | null> => {
    try {
      const result = await generateBadgeSheet({
        variables: { registrationIds }
      })
      return (result.data as any)?.generateBadgeSheet || null
    } catch (error) {
      console.error('Generate badge sheet error:', error)
      toast.error(`Failed to generate badge sheet: ${(error as any)?.message || 'Unknown error'}`)
      return null
    }
  }

  const regenerate = async (registrationId: string, format: string = 'pdf', badgeTemplateId?: string): Promise<string | null> => {
    try {
      const result = await regenerateBadge({
        variables: { registrationId, format, badgeTemplateId }
      })
      return (result.data as any)?.regenerateBadge || null
    } catch (error) {
      console.error('Regenerate badge error:', error)
      toast.error(`Failed to regenerate badge: ${(error as any)?.message || 'Unknown error'}`)
      return null
    }
  }

  // Utility functions with built-in error handling
  const downloadBadge = (base64PDF: string, participantName: string, eventName: string) => {
    const filename = BadgeUtils.generateBadgeFilename(participantName, eventName)
    BadgeUtils.downloadBadge(base64PDF, filename)
  }

  const printBadge = (base64PDF: string, participantName: string) => {
    BadgeUtils.printBadge(base64PDF, participantName)
  }

  const previewBadge = (base64PDF: string, participantName: string) => {
    BadgeUtils.previewBadge(base64PDF, participantName)
  }

  const downloadBadgeSheet = (base64PDF: string, eventName: string, count: number) => {
    const filename = BadgeUtils.generateBadgeSheetFilename(eventName, count)
    BadgeUtils.downloadBadge(base64PDF, filename)
  }

  return {
    generate,
    generateSheet,
    regenerate,
    downloadBadge,
    printBadge,
    previewBadge,
    downloadBadgeSheet,
    loading: generateLoading || sheetLoading || regenerateLoading,
    utils: BadgeUtils
  }
}

// Combined QR Code and Badge Hook
export function useCentralizedQRBadge() {
  const qrCode = useCentralizedQRCode()
  const badge = useCentralizedBadge()

  // High-level utility functions that combine QR and badge operations
  const generateAndDownloadBadge = async (
    registrationId: string,
    participantName: string,
    eventName: string
  ) => {
    await QRBadgeUtils.generateAndDownloadBadge(
      registrationId,
      participantName,
      eventName,
      badge.generate
    )
  }

  const generateAndPrintBadge = async (
    registrationId: string,
    participantName: string
  ) => {
    await QRBadgeUtils.generateAndPrintBadge(
      registrationId,
      participantName,
      badge.generate
    )
  }

  const generateAndConvertToPDF = async (
    registrationId: string,
    participantName: string,
    eventName: string,
    badgeTemplateId?: string
  ) => {
    await QRBadgeUtils.generateAndConvertToPDF(
      registrationId,
      participantName,
      eventName,
      (regId: string, format?: string) => badge.generate(regId, format, badgeTemplateId)
    )
  }

  const bulkGenerateAndDownloadBadges = async (
    registrationIds: string[],
    eventName: string
  ) => {
    await QRBadgeUtils.bulkGenerateAndDownloadBadges(
      registrationIds,
      eventName,
      badge.generateSheet
    )
  }

  const validateRegistrationForBadge = (registration: any) => {
    return QRBadgeUtils.validateRegistrationForBadge(registration)
  }

  return {
    qrCode,
    badge,
    generateAndDownloadBadge,
    generateAndPrintBadge,
    generateAndConvertToPDF,
    bulkGenerateAndDownloadBadges,
    validateRegistrationForBadge,
    loading: qrCode.loading || badge.loading,
    utils: QRBadgeUtils
  }
}

// QR Code Image Hook with centralized utilities
export function useCentralizedQRCodeImage(registrationId: string) {
  const { data, loading, error, refetch } = useQuery(GET_QR_CODE_IMAGE, {
    variables: { registrationId },
    skip: !registrationId,
    errorPolicy: 'all'
  })

  const qrCodeImage = (data as any)?.getQRCodeImage || null
  const { generate, regenerate } = useCentralizedQRCode()

  const handleGenerate = async () => {
    const result = await generate(registrationId)
    if (result) {
      await refetch()
    }
    return result
  }

  const handleRegenerate = async () => {
    const result = await regenerate(registrationId)
    if (result) {
      await refetch()
    }
    return result
  }

  const downloadQRCode = (participantName: string) => {
    if (qrCodeImage) {
      const filename = `qr_code_${participantName.replace(/[^a-zA-Z0-9]/g, '_')}.png`
      QRCodeUtils.downloadQRCode(qrCodeImage, filename)
    }
  }

  const printQRCode = (participantName: string) => {
    if (qrCodeImage) {
      QRCodeUtils.printQRCode(qrCodeImage, participantName)
    }
  }

  const copyToClipboard = async () => {
    if (qrCodeImage) {
      await QRCodeUtils.copyQRCodeToClipboard(qrCodeImage)
    }
  }

  return {
    qrCodeImage,
    loading,
    error,
    generate: handleGenerate,
    regenerate: handleRegenerate,
    downloadQRCode,
    printQRCode,
    copyToClipboard,
    refetch
  }
}

// Registration-specific hook that combines QR and badge functionality
export function useRegistrationQRBadge(registrationId: string) {
  const qrImage = useCentralizedQRCodeImage(registrationId)
  const qrBadge = useCentralizedQRBadge()

  const generateCompleteSet = async (participantName: string, eventName: string) => {
    // Generate QR code if it doesn't exist
    if (!qrImage.qrCodeImage) {
      await qrImage.generate()
    }

    // Generate and download badge with QR code
    await qrBadge.generateAndDownloadBadge(registrationId, participantName, eventName)
  }

  const printCompleteSet = async (participantName: string) => {
    // Generate QR code if it doesn't exist
    if (!qrImage.qrCodeImage) {
      await qrImage.generate()
    }

    // Print badge with QR code
    await qrBadge.generateAndPrintBadge(registrationId, participantName)
  }

  return {
    ...qrImage,
    ...qrBadge,
    generateCompleteSet,
    printCompleteSet,
    hasQRCode: !!qrImage.qrCodeImage
  }
}
