'use client'

import { useMutation } from '@apollo/client/react'
import { 
  LOGIN, 
  REGISTER_USER, 
  REFRESH_TOKEN, 
  UPDATE_PROFILE, 
  CHANGE_PASSWORD 
} from '@/lib/graphql/mutations'
import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { 
  AuthService, 
  TokenManager, 
  useCurrentUser,
  type User,
  type LoginInput,
  type RegisterInput 
} from '@/lib/auth/auth-api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterInput) => Promise<void>
  logout: () => void
  loading: boolean
  refreshToken: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  hasRole: (role: string) => boolean
  isAdmin: () => boolean
  isModerator: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  const [loginMutation] = useMutation(LOGIN)
  const [registerMutation] = useMutation(REGISTER_USER)
  const [refreshTokenMutation] = useMutation(REFRESH_TOKEN)
  const [updateProfileMutation] = useMutation(UPDATE_PROFILE)
  const [changePasswordMutation] = useMutation(CHANGE_PASSWORD)

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { data } = await loginMutation({
        variables: { email, password }
      })

      if ((data as any)?.login) {
        const { access_token, user: userData } = (data as any).login
        
        // Store token and user data
        localStorage.setItem('token', access_token)
        localStorage.setItem('user', JSON.stringify(userData))
        
        setUser(userData)
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: RegisterInput) => {
    setLoading(true)
    try {
      const { data } = await registerMutation({
        variables: {
          input: {
            email: userData.email,
            password: userData.password,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role || 'USER'
          }
        }
      })

      if ((data as any)?.createUser) {
        // Auto-login after registration
        await login(userData.email, userData.password)
      }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    TokenManager.clearAll()
  }

  const refreshToken = async () => {
    setLoading(true)
    try {
      const { data } = await refreshTokenMutation()
      
      if ((data as any)?.refreshToken) {
        const { access_token, user: userData } = (data as any).refreshToken
        TokenManager.setToken(access_token)
        TokenManager.setUser(userData)
        setUser(userData)
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (profileData: Partial<User>) => {
    setLoading(true)
    try {
      const { data } = await updateProfileMutation({
        variables: { input: profileData }
      })

      if ((data as any)?.updateUser) {
        const updatedUser = (data as any).updateUser
        TokenManager.setUser(updatedUser)
        setUser(updatedUser)
      }
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setLoading(true)
    try {
      await changePasswordMutation({
        variables: { currentPassword, newPassword }
      })
    } catch (error) {
      console.error('Password change error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const hasRole = (role: string): boolean => {
    return AuthService.hasRole(role)
  }

  const isAdmin = (): boolean => {
    return AuthService.isAdmin()
  }

  const isModerator = (): boolean => {
    return AuthService.isModerator()
  }

  // Load user from localStorage on mount
  useEffect(() => {
    const token = TokenManager.getToken()
    const userData = TokenManager.getUser()
    
    if (token && userData && !TokenManager.isTokenExpired(token)) {
      setUser(userData)
    } else if (token && TokenManager.isTokenExpired(token)) {
      // Try to refresh token if expired
      refreshToken().catch(() => {
        logout()
      })
    }
  }, [])

  const value = {
    user,
    isAuthenticated: !!user && AuthService.isAuthenticated(),
    login,
    register,
    logout,
    loading,
    refreshToken,
    updateProfile,
    changePassword,
    hasRole,
    isAdmin,
    isModerator
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
