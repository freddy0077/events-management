'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { useMutation, useQuery } from '@apollo/client/react'
import { LOGIN, REFRESH_TOKEN, LOGOUT } from '@/lib/graphql/mutations'
import { GET_ME } from '@/lib/graphql/queries'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  mustChangePassword?: boolean
  createdAt?: string
}

interface StaffPermission {
  eventId?: string
  permissions: string[]
  staffRole?: 'ORGANIZER' | 'COORDINATOR' | 'STAFF'
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
  refreshToken: () => Promise<boolean>
  hasRole: (role: string) => boolean
  isAdmin: () => boolean
  isModerator: () => boolean
  staffPermissions: StaffPermission[]
  hasPermission: (permission: string, eventId?: string) => boolean
  isStaffForEvent: (eventId: string) => boolean
  canCreateRegistration: (eventId?: string) => boolean
  canApprovePayment: (eventId?: string) => boolean
  canManageStaff: (eventId?: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  const [loginMutation] = useMutation(LOGIN)
  const [refreshTokenMutation] = useMutation(REFRESH_TOKEN)
  const [logoutMutation] = useMutation(LOGOUT)
  
  // Query to get current user info
  const { data: meData, refetch: refetchMe } = useQuery(GET_ME, {
    skip: !user,
    errorPolicy: 'ignore'
  })

  // Initialize user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
        logout()
      }
    }
    
    // Mark initialization as complete
    setInitializing(false)
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { data } = await loginMutation({
        variables: { 
          input: { 
            email, 
            password 
          } 
        }
      })

      // Check if login was successful
      if ((data as any)?.login) {
        const { accessToken, user: userData } = (data as any).login
        
        // Validate that we received valid data
        if (!accessToken || !userData) {
          throw new Error('Invalid login response')
        }
        
        // Store token and user data
        localStorage.setItem('token', accessToken)
        localStorage.setItem('user', JSON.stringify(userData))
        
        setUser(userData)
      } else {
        // No data returned means login failed
        throw new Error('Invalid credentials')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Clear any existing auth data on login failure
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
      
      // Re-throw the error to be handled by the calling component
      if (error.message) {
        throw new Error(error.message)
      } else if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        throw new Error(error.graphQLErrors[0].message)
      } else if (error.networkError) {
        throw new Error('Network error: Unable to connect to server')
      } else {
        throw new Error('Login failed. Please check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Call backend logout mutation to invalidate token on server
      await logoutMutation()
    } catch (error) {
      // Log error but continue with client-side cleanup
      console.error('Backend logout error:', error)
    } finally {
      // Always perform client-side cleanup regardless of backend response
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      const { data } = await refreshTokenMutation()
      
      if ((data as any)?.refreshToken) {
        const { accessToken, user: userData } = (data as any).refreshToken
        
        localStorage.setItem('token', accessToken)
        localStorage.setItem('user', JSON.stringify(userData))
        
        setUser(userData)
        return true
      }
      return false
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
      return false
    }
  }

  const hasRole = (role: string): boolean => {
    if (!user) return false
    
    const roleHierarchy = ['USER', 'REGISTRATION_STAFF', 'EVENT_ORGANIZER', 'MODERATOR', 'ADMIN']
    const userRoleIndex = roleHierarchy.indexOf(user.role)
    const requiredRoleIndex = roleHierarchy.indexOf(role)
    
    return userRoleIndex >= requiredRoleIndex
  }

  const isAdmin = (): boolean => hasRole('ADMIN')
  const isModerator = (): boolean => hasRole('MODERATOR')

  // Mock staff permissions - replace with actual GraphQL query
  const staffPermissions: StaffPermission[] = []

  const hasPermission = (permission: string, eventId?: string): boolean => {
    if (!user) return false
    
    // Admins have all permissions
    if (user.role === 'ADMIN') return true
    
    // Check event-specific permissions
    if (eventId) {
      const eventPermission = staffPermissions.find(p => p.eventId === eventId)
      if (eventPermission?.permissions.includes(permission)) return true
    }
    
    // Check global role permissions
    const globalPermissions = getGlobalRolePermissions(user.role)
    return globalPermissions.includes(permission)
  }

  const isStaffForEvent = (eventId: string): boolean => {
    if (!user) return false
    if (user.role === 'ADMIN') return true
    return staffPermissions.some(p => p.eventId === eventId)
  }

  const canCreateRegistration = (eventId?: string): boolean => 
    hasPermission('CREATE_REGISTRATION', eventId)

  const canApprovePayment = (eventId?: string): boolean => 
    hasPermission('APPROVE_PAYMENT', eventId)

  const canManageStaff = (eventId?: string): boolean => 
    hasPermission('MANAGE_STAFF', eventId)

  const getGlobalRolePermissions = (role: string): string[] => {
    switch (role) {
      case 'ADMIN':
        return ['CREATE_REGISTRATION', 'APPROVE_PAYMENT', 'MANAGE_STAFF', 'VIEW_REPORTS', 'SCAN_QR_CODES', 'EXPORT_DATA', 'MANAGE_EVENTS']
      case 'EVENT_ORGANIZER':
        return ['CREATE_REGISTRATION', 'MANAGE_STAFF', 'VIEW_REPORTS', 'SCAN_QR_CODES', 'EXPORT_DATA', 'MANAGE_ASSIGNED_EVENTS']
      case 'MODERATOR':
        return ['CREATE_REGISTRATION', 'VIEW_REPORTS', 'SCAN_QR_CODES', 'EXPORT_DATA', 'MANAGE_EVENTS']
      case 'REGISTRATION_STAFF':
        return ['CREATE_REGISTRATION', 'SCAN_QR_CODES']
      case 'USER':
        return ['CREATE_REGISTRATION', 'SCAN_QR_CODES']
      default:
        return []
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading: loading || initializing,
    refreshToken,
    hasRole,
    isAdmin,
    isModerator,
    staffPermissions,
    hasPermission,
    isStaffForEvent,
    canCreateRegistration,
    canApprovePayment,
    canManageStaff
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
