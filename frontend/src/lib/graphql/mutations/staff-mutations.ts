import { gql } from '@apollo/client'

// Staff management mutations

export const CREATE_STAFF = gql`
  mutation CreateStaff($input: CreateStaffInput!) {
    createStaff(input: $input) {
      id
      firstName
      lastName
      email
      role
      mustChangePassword
    }
  }
`

export const UPDATE_STAFF = gql`
  mutation UpdateStaff($id: ID!, $input: UpdateStaffInput!) {
    updateStaff(id: $id, input: $input) {
      id
      firstName
      lastName
      email
      role
      mustChangePassword
    }
  }
`

export const DELETE_STAFF = gql`
  mutation DeleteStaff($id: ID!) {
    deleteStaff(id: $id) {
      success
      message
    }
  }
`

export const ASSIGN_STAFF_TO_EVENT = gql`
  mutation AssignStaffToEvent($input: AssignStaffInput!) {
    assignStaffToEvent(input: $input) {
      success
      message
      staff {
        id
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
        role
        assignedBy
        assignedByUser {
          id
          firstName
          lastName
        }
        assignedAt
      }
    }
  }
`

export const REMOVE_STAFF_FROM_EVENT = gql`
  mutation RemoveStaffFromEvent($eventId: ID!, $staffId: ID!) {
    removeStaffFromEvent(eventId: $eventId, staffId: $staffId) {
      success
      message
    }
  }
`

export const SCAN_QR_CODE = gql`
  mutation ScanQRCode($qrCode: String!) {
    scanQRCode(qrCode: $qrCode) {
      success
      message
      registration {
        id
        firstName
        lastName
        fullName
        email
        phone
        paymentStatus
        qrCode
        event {
          id
          name
        }
        category {
          id
          name
        }
      }
      mealAttendance {
        id
        registrationId
        mealId
        scannedAt
        meal {
          id
          sessionName
        }
      }
    }
  }
`

export const SCAN_MEAL_QR_CODE = gql`
  mutation ScanMealQRCode($input: ScanQRCodeInput!) {
    scanMealQRCode(input: $input) {
      success
      message
      participantName
      alreadyScanned
      attendance {
        id
        registrationId
        mealId
        scannedAt
        scannedBy
        notes
        meal {
          id
          name
          sessionTime
          eventId
        }
      }
    }
  }
`

export const UPDATE_STAFF_ROLE = gql`
  mutation UpdateStaffRole($input: UpdateStaffRoleInput!) {
    updateStaffRole(input: $input) {
      success
      message
      staff {
        id
        role
        user {
          id
          firstName
          lastName
          email
        }
        assignedAt
      }
    }
  }
`
