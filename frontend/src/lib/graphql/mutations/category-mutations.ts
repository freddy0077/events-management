import { gql } from '@apollo/client'

// Category management mutations

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) {
      id
      name
      description
      price
      maxCapacity
      isActive
      eventId
      createdAt
    }
  }
`

export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: ID!, $input: UpdateCategoryInput!) {
    updateCategory(id: $id, input: $input) {
      id
      name
      description
      price
      maxCapacity
      isActive
      eventId
      updatedAt
    }
  }
`

export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id) {
      success
      message
    }
  }
`

export const TOGGLE_CATEGORY_STATUS = gql`
  mutation ToggleCategoryStatus($id: ID!) {
    toggleCategoryStatus(id: $id) {
      id
      name
      isActive
      updatedAt
    }
  }
`
