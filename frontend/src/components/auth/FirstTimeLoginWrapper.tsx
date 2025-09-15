'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth-simple'
import ChangePasswordModal from './ChangePasswordModal'

interface FirstTimeLoginWrapperProps {
  children: React.ReactNode
}

export default function FirstTimeLoginWrapper({ children }: FirstTimeLoginWrapperProps) {
  const { user, refreshToken } = useAuth()
  const [showPasswordChange, setShowPasswordChange] = useState(false)

  useEffect(() => {
    // Check if user needs to change password on login
    if (user && user.mustChangePassword) {
      setShowPasswordChange(true)
    }
  }, [user])

  const handlePasswordChanged = async () => {
    // Refresh user data to get updated mustChangePassword status
    await refreshToken()
    setShowPasswordChange(false)
  }

  const handleCloseModal = () => {
    // Don't allow closing the modal if password change is required
    // User must change password to continue
  }

  // If user needs to change password, show the modal
  if (user && user.mustChangePassword && showPasswordChange) {
    return (
      <>
        {children}
        <ChangePasswordModal
          isOpen={showPasswordChange}
          onClose={handleCloseModal}
          onPasswordChanged={handlePasswordChanged}
          userEmail={user.email}
        />
      </>
    )
  }

  // Normal flow - just render children
  return <>{children}</>
}
