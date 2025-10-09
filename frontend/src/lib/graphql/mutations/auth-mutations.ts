import { gql } from '@apollo/client'

// Authentication-related mutations

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      user {
        id
        email
        firstName
        lastName
        role
        eventRole
        mustChangePassword
      }
    }
  }
`

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      success
      message
      user {
        id
        email
        firstName
        lastName
        role
        mustChangePassword
      }
    }
  }
`

export const FORCE_PASSWORD_CHANGE = gql`
  mutation ForcePasswordChange($input: ChangePasswordInput!) {
    forcePasswordChange(input: $input) {
      success
      message
      user {
        id
        email
        firstName
        lastName
        role
        mustChangePassword
      }
    }
  }
`

export const REFRESH_TOKEN = gql`
  mutation RefreshToken {
    refreshToken {
      accessToken
      user {
        id
        email
        firstName
        lastName
        role
        eventRole
        mustChangePassword
      }
    }
  }
`

export const LOGOUT = gql`
  mutation Logout {
    logout {
      success
      message
    }
  }
`

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      firstName
      lastName
      email
      role
      mustChangePassword
    }
  }
`
