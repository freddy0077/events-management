'use client'

import { User, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface RegistrationForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  organization: string
}

interface PersonalInfoStepProps {
  formData: RegistrationForm
  onInputChange: (field: keyof RegistrationForm, value: string) => void
  onNext: () => void
  isValid: boolean
}

export function PersonalInfoStep({ formData, onInputChange, onNext, isValid }: PersonalInfoStepProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <h3 className="text-lg font-semibold flex items-center text-gray-900 mb-2">
          <User className="h-5 w-5 mr-2 text-blue-600" />
          Personal Information
        </h3>
        <p className="text-sm text-gray-600">Please provide your basic information for registration.</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => onInputChange('firstName', e.target.value)}
            className="border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-200"
            placeholder="Enter your first name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => onInputChange('lastName', e.target.value)}
            className="border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-200"
            placeholder="Enter your last name"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-700 font-medium">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => onInputChange('email', e.target.value)}
          className="border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-200"
          placeholder="your.email@example.com"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number *</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => onInputChange('phone', e.target.value)}
          className="border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-200"
          placeholder="+1 (555) 123-4567"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="organization" className="text-gray-700 font-medium">Organization</Label>
        <Input
          id="organization"
          value={formData.organization}
          onChange={(e) => onInputChange('organization', e.target.value)}
          className="border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-200"
          placeholder="Your company or organization"
        />
      </div>
      
      <div className="flex justify-end pt-4">
        <Button 
          onClick={onNext}
          disabled={!isValid}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Continue to Payment
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
