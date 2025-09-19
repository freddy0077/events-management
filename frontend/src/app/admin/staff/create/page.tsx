'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  UserPlus, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import { useRegisterUser } from '@/lib/graphql/hooks'

interface CreateStaffForm {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  role: 'ADMIN' | 'EVENT_ORGANIZER' | 'REGISTRATION_STAFF' | 'FINANCE_TEAM' | 'CATERING_TEAM'
}

export default function CreateStaffPage() {
  const router = useRouter()
  const [registerUser, { loading }] = useRegisterUser()
  
  const [formData, setFormData] = useState<CreateStaffForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'REGISTRATION_STAFF'
  })

  const [errors, setErrors] = useState<Partial<CreateStaffForm>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateStaffForm> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.role) {
      (newErrors as any).role = 'Role is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the form errors')
      return
    }

    try {
      await registerUser({
        variables: {
          input: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            password: formData.password,
            role: formData.role
          }
        }
      })

      toast.success(`Staff member ${formData.firstName} ${formData.lastName} created successfully`)
      router.push('/admin/staff')
    } catch (error: any) {
      console.error('Error creating staff member:', error)
      toast.error(error.message || 'Failed to create staff member')
    }
  }

  const handleInputChange = (field: keyof CreateStaffForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { 
          color: 'bg-red-100 text-red-800 border-red-200', 
          description: 'System owner - creates events, manages everything, assigns event managers',
          icon: '👑'
        }
      case 'EVENT_ORGANIZER':
        return { 
          color: 'bg-purple-100 text-purple-800 border-purple-200', 
          description: 'Event manager - manages assigned events, adds event staff, oversees operations',
          icon: '🎯'
        }
      case 'REGISTRATION_STAFF':
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-200', 
          description: 'Registers participants, processes payments, prints QR tags',
          icon: '📝'
        }
      case 'FINANCE_TEAM':
        return { 
          color: 'bg-green-100 text-green-800 border-green-200', 
          description: 'Monitors and reconciles payments received',
          icon: '💰'
        }
      case 'CATERING_TEAM':
        return { 
          color: 'bg-orange-100 text-orange-800 border-orange-200', 
          description: 'Verifies eligibility during meal sessions via QR scans',
          icon: '🍽️'
        }
      default:
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          description: 'Unknown role',
          icon: '❓'
        }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full px-6 py-8">
        <div className="w-full">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-4 hover:bg-white/60"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Staff Management
            </Button>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-soft">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <UserPlus className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Create New Staff Member</h1>
                  <p className="text-gray-600">Add a new team member to your organization</p>
                </div>
              </div>
            </div>
          </div>

          {/* Multi-step Form */}
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Progress Steps */}
            <div className="lg:col-span-1">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft sticky top-8">
                <CardHeader>
                  <CardTitle className="text-lg">Setup Progress</CardTitle>
                  <CardDescription>Complete all steps to create the staff member</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {currentStep > 1 ? <CheckCircle className="h-4 w-4" /> : '1'}
                    </div>
                    <div>
                      <p className="font-medium">Personal Info</p>
                      <p className="text-sm text-gray-500">Basic details</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {currentStep > 2 ? <CheckCircle className="h-4 w-4" /> : '2'}
                    </div>
                    <div>
                      <p className="font-medium">Role & Access</p>
                      <p className="text-sm text-gray-500">Permissions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      3
                    </div>
                    <div>
                      <p className="font-medium">Security</p>
                      <p className="text-sm text-gray-500">Password setup</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Form */}
            <div className="lg:col-span-3">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
                <form onSubmit={handleSubmit}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {currentStep === 1 && <User className="h-5 w-5 text-blue-600" />}
                      {currentStep === 2 && <Shield className="h-5 w-5 text-blue-600" />}
                      {currentStep === 3 && <Lock className="h-5 w-5 text-blue-600" />}
                      {currentStep === 1 && 'Personal Information'}
                      {currentStep === 2 && 'Role & Permissions'}
                      {currentStep === 3 && 'Security Setup'}
                    </CardTitle>
                    <CardDescription>
                      {currentStep === 1 && 'Enter the basic details for the new staff member'}
                      {currentStep === 2 && 'Define access level and permissions'}
                      {currentStep === 3 && 'Set up login credentials and security'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Step 1: Personal Information */}
                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              First Name *
                            </Label>
                            <Input
                              id="firstName"
                              value={formData.firstName}
                              onChange={(e) => handleInputChange('firstName', e.target.value)}
                              placeholder="Enter first name"
                              className={`transition-all ${errors.firstName ? 'border-red-500 bg-red-50' : 'focus:border-blue-500'}`}
                            />
                            {errors.firstName && (
                              <div className="flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                {errors.firstName}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Last Name *
                            </Label>
                            <Input
                              id="lastName"
                              value={formData.lastName}
                              onChange={(e) => handleInputChange('lastName', e.target.value)}
                              placeholder="Enter last name"
                              className={`transition-all ${errors.lastName ? 'border-red-500 bg-red-50' : 'focus:border-blue-500'}`}
                            />
                            {errors.lastName && (
                              <div className="flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                {errors.lastName}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Address *
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder="Enter email address"
                            className={`transition-all ${errors.email ? 'border-red-500 bg-red-50' : 'focus:border-blue-500'}`}
                          />
                          {errors.email && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              {errors.email}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step 2: Role Selection */}
                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <Label className="flex items-center gap-2 text-base font-medium">
                            <Shield className="h-5 w-5" />
                            Select Role & Access Level *
                          </Label>
                          
                          <div className="grid gap-4">
                            {['ADMIN', 'EVENT_ORGANIZER', 'FINANCE_TEAM', 'REGISTRATION_STAFF', 'CATERING_TEAM'].map((role) => {
                              const roleInfo = getRoleInfo(role)
                              return (
                                <div
                                  key={role}
                                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                                    formData.role === role 
                                      ? 'border-blue-500 bg-blue-50' 
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                  onClick={() => handleInputChange('role', role as any)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-4 h-4 rounded-full border-2 ${
                                        formData.role === role 
                                          ? 'border-blue-500 bg-blue-500' 
                                          : 'border-gray-300'
                                      }`}>
                                        {formData.role === role && (
                                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                        )}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-lg">{roleInfo.icon}</span>
                                          <h3 className="font-semibold">{role.replace(/_/g, ' ')}</h3>
                                          <Badge className={roleInfo.color}>{role.toLowerCase().replace(/_/g, ' ')}</Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{roleInfo.description}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          
                          {errors.role && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                              <AlertCircle className="h-4 w-4" />
                              {errors.role}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step 3: Password Setup */}
                    {currentStep === 3 && (
                      <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-blue-800 mb-2">
                            <Info className="h-4 w-4" />
                            <span className="font-medium">Security Requirements</span>
                          </div>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Password must be at least 6 characters long</li>
                            <li>• Staff member will be required to change password on first login</li>
                            <li>• Login credentials will be sent via email</li>
                          </ul>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="password" className="flex items-center gap-2">
                              <Lock className="h-4 w-4" />
                              Password *
                            </Label>
                            <div className="relative">
                              <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                placeholder="Enter password"
                                className={`pr-10 transition-all ${errors.password ? 'border-red-500 bg-red-50' : 'focus:border-blue-500'}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                            {errors.password && (
                              <div className="flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                {errors.password}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                              <Lock className="h-4 w-4" />
                              Confirm Password *
                            </Label>
                            <div className="relative">
                              <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                placeholder="Confirm password"
                                className={`pr-10 transition-all ${errors.confirmPassword ? 'border-red-500 bg-red-50' : 'focus:border-blue-500'}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                            {errors.confirmPassword && (
                              <div className="flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                {errors.confirmPassword}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Navigation */}
                    <div className="flex justify-between">
                      <div>
                        {currentStep > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCurrentStep(currentStep - 1)}
                            disabled={loading}
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Previous
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => router.back()}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                        
                        {currentStep < 3 ? (
                          <Button
                            type="button"
                            onClick={() => setCurrentStep(currentStep + 1)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Next Step
                            <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                          </Button>
                        ) : (
                          <Button 
                            type="submit" 
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Create Staff Member
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
