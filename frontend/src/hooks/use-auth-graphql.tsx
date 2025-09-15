'use client'

import { useMutation } from '@apollo/client/react'
import { LOGIN, REGISTER_USER } from '@/lib/graphql/mutations'
import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

interface User {
  id: string
  email: string
  role: string
  firstName?: string
  lastName?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: RegisterInput) => Promise<void>
  logout: () => void
  loading: boolean
}

interface RegisterInput {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  const [loginMutation] = useMutation(LOGIN)
  const [registerMutation] = useMutation(REGISTER_USER)

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
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // Load user from localStorage on mount
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
  }, [])

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    loading
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
