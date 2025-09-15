import { gql } from '@apollo/client'

// Registration-related mutations

export const CREATE_REGISTRATION = gql`
  mutation CreateRegistration($input: CreateRegistrationInput!) {
    createRegistration(input: $input) {
      paymentUrl
      qrCodeData
      registration {
        id
        firstName
        lastName
        email
        phone
        paymentStatus
        qrCode
        createdAt
        event {
          id
          name
        }
        category {
          id
          name
          price
        }
        transactions {
          id
          amount
          paymentMethod
          paymentStatus
          receiptNumber
          paymentDate
        }
      }
    }
  }
`

export const CREATE_STAFF_REGISTRATION = gql`
  mutation CreateStaffRegistration($input: CreateStaffRegistrationInput!) {
    createStaffRegistration(input: $input) {
      paymentUrl
      qrCodeData
      registration {
        id
        firstName
        lastName
        email
        phone
        paymentStatus
        qrCode
        createdAt
        event {
          id
          name
        }
        category {
          id
          name
          price
        }
        transactions {
          id
          amount
          paymentMethod
          paymentStatus
          receiptNumber
          paymentDate
        }
      }
    }
  }
`

export const UPDATE_REGISTRATION = gql`
  mutation UpdateRegistration($id: ID!, $input: UpdateRegistrationInput!) {
    updateRegistration(id: $id, input: $input) {
      id
      firstName
      lastName
      email
      phone
      paymentStatus
      qrCode
      updatedAt
      event {
        id
        name
      }
      category {
        id
        name
        price
      }
    }
  }
`

export const DELETE_REGISTRATION = gql`
  mutation DeleteRegistration($id: ID!) {
    deleteRegistration(id: $id) {
      success
      message
    }
  }
`

export const SEARCH_REGISTRATION_BY_RECEIPT = gql`
  mutation SearchRegistrationByReceipt($receiptNumber: String!) {
    searchRegistrationByReceipt(receiptNumber: $receiptNumber) {
      id
      firstName
      lastName
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
        price
      }
      transactions {
        id
        amount
        paymentMethod
        paymentStatus
        receiptNumber
        paymentDate
      }
    }
  }
`

export const APPROVE_REGISTRATION = gql`
  mutation ApproveRegistration($id: ID!) {
    approveRegistration(id: $id) {
      id
      paymentStatus
      updatedAt
    }
  }
`

export const REJECT_REGISTRATION = gql`
  mutation RejectRegistration($id: ID!, $reason: String!) {
    rejectRegistration(id: $id, reason: $reason) {
      id
      paymentStatus
      updatedAt
    }
  }
`

export const REGISTER_USER = gql`
  mutation RegisterUser($input: RegisterUserInput!) {
    registerUser(input: $input) {
      success
      message
      user {
        id
        firstName
        lastName
        email
        role
        mustChangePassword
      }
    }
  }
`
