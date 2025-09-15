import { gql } from '@apollo/client'

// QR Code generation and management mutations

export const GENERATE_QR_CODE = gql`
  mutation GenerateQRCode($registrationId: ID!) {
    generateQRCode(registrationId: $registrationId) {
      qrCode
      base64Image
      qrCodeData {
        registrationId
        eventId
        participantName
        category
        timestamp
        checksum
      }
    }
  }
`

export const REGENERATE_QR_CODE = gql`
  mutation RegenerateQRCode($registrationId: ID!) {
    regenerateQRCode(registrationId: $registrationId) {
      qrCode
      base64Image
      qrCodeData {
        registrationId
        eventId
        participantName
        category
        timestamp
        checksum
      }
    }
  }
`

export const BULK_GENERATE_QR_CODES = gql`
  mutation BulkGenerateQRCodes($registrationIds: [ID!]!) {
    bulkGenerateQRCodes(registrationIds: $registrationIds) {
      qrCode
      base64Image
      qrCodeData {
        registrationId
        eventId
        participantName
        category
        timestamp
        checksum
      }
    }
  }
`

export const GENERATE_BADGE = gql`
  mutation GenerateBadge($registrationId: ID!, $format: String = "pdf", $badgeTemplateId: String) {
    generateBadge(registrationId: $registrationId, format: $format, badgeTemplateId: $badgeTemplateId)
  }
`

export const REGENERATE_BADGE = gql`
  mutation RegenerateBadge($registrationId: ID!, $format: String = "pdf", $badgeTemplateId: String) {
    regenerateBadge(registrationId: $registrationId, format: $format, badgeTemplateId: $badgeTemplateId)
  }
`

export const GENERATE_BADGE_SHEET = gql`
  mutation GenerateBadgeSheet($registrationIds: [ID!]!) {
    generateBadgeSheet(registrationIds: $registrationIds)
  }
`

export const VALIDATE_QR_CODE = gql`
  mutation ValidateQRCode($input: ValidateQRCodeInput!) {
    validateQRCode(input: $input) {
      success
      message
      isValid
      qrCodeData {
        registrationId
        eventId
        participantName
        category
        timestamp
        checksum
      }
    }
  }
`
