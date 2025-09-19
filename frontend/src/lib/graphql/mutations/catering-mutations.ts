import { gql } from '@apollo/client'

// Catering-specific mutations for meal session management and participant check-ins

export const CHECK_IN_PARTICIPANT = gql`
  mutation CheckInParticipant($registrationId: ID!, $mealId: String!) {
    checkInParticipant(registrationId: $registrationId, mealId: $mealId) {
      success
      message
      attendance {
        id
        scannedAt
        meal {
          id
          sessionName
        }
        registration {
          id
          firstName
          lastName
          email
        }
      }
    }
  }
`


export const START_MEAL_SESSION = gql`
  mutation StartMealSession($id: ID!) {
    startMealSession(id: $id) {
      success
      message
      meal {
        id
        sessionName
        isActive
        status
        startTime
        endTime
        maxCapacity
        totalAttendees
        event {
          id
          name
          date
        }
      }
    }
  }
`

export const END_MEAL_SESSION = gql`
  mutation EndMealSession($id: ID!) {
    endMealSession(id: $id) {
      success
      message
      meal {
        id
        sessionName
        isActive
        status
        startTime
        endTime
        maxCapacity
        totalAttendees
        event {
          id
          name
          date
        }
      }
    }
  }
`

export const CREATE_MEAL_SESSION = gql`
  mutation CreateMealSession($input: CreateMealSessionInput!) {
    createMealSession(input: $input) {
      id
      sessionName
      name
      startTime
      endTime
      maxCapacity
      description
      isActive
      event {
        id
        name
      }
    }
  }
`

export const UPDATE_MEAL_SESSION = gql`
  mutation UpdateMealSession($id: ID!, $input: UpdateMealSessionInput!) {
    updateMealSession(id: $id, input: $input) {
      id
      sessionName
      name
      startTime
      endTime
      maxCapacity
      description
      isActive
      event {
        id
        name
      }
    }
  }
`

export const SERVE_MEAL = gql`
  mutation ServeMeal($input: ServeMealInput!) {
    serveMeal(input: $input) {
      success
      message
      participantName
      attendance {
        id
        scannedAt
        meal {
          id
          sessionName
        }
        registration {
          id
          firstName
          lastName
          email
        }
      }
    }
  }
`

export const CREATE_MEAL = gql`
  mutation CreateMeal($input: CreateMealInput!) {
    createMeal(input: $input) {
      id
      sessionName
      startTime
      endTime
      capacity
      description
      location
      eventId
      status
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_MEAL = gql`
  mutation UpdateMeal($id: ID!, $input: UpdateMealInput!) {
    updateMeal(id: $id, input: $input) {
      id
      sessionName
      startTime
      endTime
      capacity
      description
      location
      eventId
      status
      updatedAt
    }
  }
`

export const DELETE_MEAL = gql`
  mutation DeleteMeal($id: ID!) {
    deleteMeal(id: $id) {
      success
      message
    }
  }
`

export const CREATE_MEAL_ATTENDANCE = gql`
  mutation CreateMealAttendance($input: CreateMealAttendanceInput!) {
    createMealAttendance(input: $input) {
      id
      registrationId
      mealId
      scannedAt
      meal {
        id
        sessionName
      }
      registration {
        id
        firstName
        lastName
        email
      }
    }
  }
`

export const MANUAL_OVERRIDE_ATTENDANCE = gql`
  mutation ManualOverrideAttendance($input: ManualOverrideAttendanceInput!) {
    manualOverrideAttendance(input: $input) {
      success
      message
      attendance {
        id
        registrationId
        mealId
        scannedAt
        overrideReason
        meal {
          id
          sessionName
        }
        registration {
          id
          firstName
          lastName
          email
        }
      }
    }
  }
`

export const RECORD_FAILED_SCAN = gql`
  mutation RecordFailedScan($input: FailedScanInput!) {
    recordFailedScan(input: $input) {
      success
      message
      auditLogId
    }
  }
`

