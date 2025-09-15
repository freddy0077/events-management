// Auth API module for authentication operations
import { useMutation } from '@apollo/client/react';
import { useQuery } from '@apollo/client/react';
import { LOGIN, REFRESH_TOKEN } from '@/lib/graphql/mutations'
import { GET_CURRENT_USER } from '@/lib/graphql/queries'

export interface User {
  id: string
  email: string
  role: 'USER' | 'MODERATOR' | 'ADMIN'
  firstName?: string
  lastName?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  firstName?: string
  lastName?: string
  role?: 'USER' | 'MODERATOR' | 'ADMIN'
}

export interface LoginResponse {
  access_token: string
  user: User
}

// Login hook
export function useLogin() {
  return useMutation(LOGIN, {
    errorPolicy: 'all'
  })
}

// Refresh token hook
export function useRefreshToken() {
  return useMutation(REFRESH_TOKEN, {
    errorPolicy: 'all'
  })
}

// Current user hook
export function useCurrentUser() {
  return useQuery(GET_CURRENT_USER, {
    errorPolicy: 'all'
  })
}

export const AuthService = { 
  useLogin, 
  useRefreshToken,
  hasRole: (role: string) => {
    const user = TokenManager.getUser()
    return user?.role === role
  },
  isAdmin: () => {
    const user = TokenManager.getUser()
    return user?.role === 'ADMIN'
  },
  isModerator: () => {
    const user = TokenManager.getUser()
    return user?.role === 'MODERATOR' || user?.role === 'EVENT_ORGANIZER'
  },
  isAuthenticated: () => {
    const token = TokenManager.getToken()
    const user = TokenManager.getUser()
    return !!(token && user && !TokenManager.isTokenExpired(token))
  }
}
export const TokenManager = {
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  },
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  },
  getUser: () => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user_data')
      return userData ? JSON.parse(userData) : null
    }
    return null
  },
  setUser: (user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_data', JSON.stringify(user))
    }
  },
  clearAll: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
    }
  },
  isTokenExpired: (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return Date.now() >= payload.exp * 1000
    } catch {
      return true
    }
  }
};
