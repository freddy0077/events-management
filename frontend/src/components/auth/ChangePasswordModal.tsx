'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useForcePasswordChange } from '@/lib/graphql/hooks'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onPasswordChanged: () => void
  userEmail: string
}

export default function ChangePasswordModal({ 
  isOpen, 
  onClose, 
  onPasswordChanged, 
  userEmail 
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  
  const [forcePasswordChangeMutation, { loading: isLoading }] = useForcePasswordChange()

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate inputs
    const validationErrors: string[] = []
    
    if (!currentPassword) {
      validationErrors.push('Current password is required')
    }
    
    if (!newPassword) {
      validationErrors.push('New password is required')
    } else {
      validationErrors.push(...validatePassword(newPassword))
    }
    
    if (newPassword !== confirmPassword) {
      validationErrors.push('New passwords do not match')
    }
    
    if (currentPassword === newPassword) {
      validationErrors.push('New password must be different from current password')
    }
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    
    setErrors([])
    
    try {
      const result = await forcePasswordChangeMutation({
        variables: {
          input: {
            currentPassword,
            newPassword
          }
        }
      })
      
      if ((result.data as any)?.forcePasswordChange?.success) {
        toast.success('Password changed successfully!')
        onPasswordChanged()
        
        // Reset form
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const errorMessage = (result.data as any)?.forcePasswordChange?.message || 'Failed to change password'
        setErrors([errorMessage])
        toast.error(errorMessage)
      }
      
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to change password'
      toast.error(errorMessage)
      setErrors([errorMessage])
    }
  }

  const passwordStrength = newPassword ? validatePassword(newPassword) : []
  const isPasswordStrong = passwordStrength.length === 0 && newPassword.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Lock className="h-5 w-5 mr-2 text-orange-600" />
            Change Your Password
          </DialogTitle>
          <DialogDescription>
            Your account was created by an organizer. Please set a new password to continue.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-orange-200 bg-orange-50">
          <Lock className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Account:</strong> {userEmail}
            <br />
            For security reasons, you must change your password before accessing the system.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password *</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password *</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            
            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  {isPasswordStrong ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ${isPasswordStrong ? 'text-green-600' : 'text-red-600'}`}>
                    {isPasswordStrong ? 'Strong password' : 'Weak password'}
                  </span>
                </div>
                {passwordStrength.length > 0 && (
                  <ul className="text-xs text-red-600 space-y-1">
                    {passwordStrength.map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password *</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-600">Passwords do not match</p>
            )}
          </div>

          {/* Error Display */}
          {errors.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <ul className="space-y-1">
                  {errors.map((error: string, index: number) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-orange-600 hover:bg-orange-700"
            disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Changing Password...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </>
            )}
          </Button>
        </form>

        <div className="text-xs text-gray-500 text-center">
          This is a one-time requirement. After changing your password, you'll have normal access to the system.
        </div>
      </DialogContent>
    </Dialog>
  )
}
