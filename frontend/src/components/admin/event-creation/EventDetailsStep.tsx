'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, MapPin, Users, AlertCircle } from 'lucide-react'
import { StepProps } from './types'

export function EventDetailsStep({ formData, setFormData, errors, setErrors }: StepProps) {
  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Validate date relationship when either date changes
    if (field === 'date' || field === 'endDate') {
      const newFormData = { ...formData, [field]: value }
      
      // Clear any existing date validation errors
      setErrors(prev => ({ 
        ...prev, 
        endDate: prev.endDate?.includes('End date must be equal to or after the start date') ? '' : prev.endDate 
      }))
      
      // Validate end date is not before start date
      if (newFormData.date && newFormData.endDate) {
        const startDate = new Date(newFormData.date)
        const endDate = new Date(newFormData.endDate)
        
        if (endDate < startDate) {
          setErrors(prev => ({ 
            ...prev, 
            endDate: 'End date must be equal to or after the start date' 
          }))
        }
      }
      
      // Validate registration deadline when event start date changes
      if (field === 'date' && newFormData.registrationDeadline) {
        const regDeadline = new Date(newFormData.registrationDeadline)
        const eventStart = new Date(newFormData.date)
        
        if (regDeadline >= eventStart) {
          setErrors(prev => ({ 
            ...prev, 
            registrationDeadline: 'Registration deadline must be before event start date' 
          }))
        } else {
          // Clear registration deadline error if it's now valid
          setErrors(prev => ({ 
            ...prev, 
            registrationDeadline: prev.registrationDeadline?.includes('Registration deadline must be before event start date') ? '' : prev.registrationDeadline 
          }))
        }
      }
    }
    
    // Validate registration deadline when it changes
    if (field === 'registrationDeadline') {
      const newFormData = { ...formData, [field]: value }
      
      // Clear any existing registration deadline validation errors
      setErrors(prev => ({ 
        ...prev, 
        registrationDeadline: prev.registrationDeadline?.includes('Registration deadline must be before event start date') ? '' : prev.registrationDeadline 
      }))
      
      // Validate registration deadline is before event start date
      if (newFormData.registrationDeadline && newFormData.date) {
        const regDeadline = new Date(newFormData.registrationDeadline)
        const eventStart = new Date(newFormData.date)
        
        if (regDeadline >= eventStart) {
          setErrors(prev => ({ 
            ...prev, 
            registrationDeadline: 'Registration deadline must be before event start date' 
          }))
        }
      }
    }
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-xl text-blue-800">Event Details</CardTitle>
            <CardDescription className="text-blue-600">
              Basic information about your event
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Event Name *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter event name"
            className={`${errors.name ? 'border-red-300 focus:border-red-500' : 'border-blue-200 focus:border-blue-500'} bg-white/80`}
          />
          {errors.name && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              {errors.name}
            </div>
          )}
        </div>

        {/* Event Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe your event"
            rows={4}
            className="border-blue-200 focus:border-blue-500 bg-white/80"
          />
        </div>

        {/* Date Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium text-gray-700">
              Start Date *
            </Label>
            <Input
              id="date"
              type="datetime-local"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className={`${errors.date ? 'border-red-300 focus:border-red-500' : 'border-blue-200 focus:border-blue-500'} bg-white/80`}
            />
            {errors.date && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {errors.date}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">
              End Date
            </Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className={`${errors.endDate ? 'border-red-300 focus:border-red-500' : 'border-blue-200 focus:border-blue-500'} bg-white/80`}
            />
            {errors.endDate && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {errors.endDate}
              </div>
            )}
          </div>
        </div>

        {/* Venue Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-800">Venue Information</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="venue" className="text-sm font-medium text-gray-700">
              Venue Name *
            </Label>
            <Input
              id="venue"
              value={formData.venue}
              onChange={(e) => handleInputChange('venue', e.target.value)}
              placeholder="Enter venue name"
              className={`${errors.venue ? 'border-red-300 focus:border-red-500' : 'border-blue-200 focus:border-blue-500'} bg-white/80`}
            />
            {errors.venue && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {errors.venue}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium text-gray-700">
              Address
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter venue address"
              rows={2}
              className="border-blue-200 focus:border-blue-500 bg-white/80"
            />
          </div>
        </div>

        {/* Capacity and Registration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maxCapacity" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Maximum Capacity
            </Label>
            <Input
              id="maxCapacity"
              type="number"
              min="1"
              value={formData.maxCapacity}
              onChange={(e) => handleInputChange('maxCapacity', parseInt(e.target.value) || 0)}
              placeholder="Enter max capacity"
              className="border-blue-200 focus:border-blue-500 bg-white/80"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registrationDeadline" className="text-sm font-medium text-gray-700">
              Registration Deadline
            </Label>
            <Input
              id="registrationDeadline"
              type="datetime-local"
              value={formData.registrationDeadline}
              onChange={(e) => handleInputChange('registrationDeadline', e.target.value)}
              className={`${errors.registrationDeadline ? 'border-red-300 focus:border-red-500' : 'border-blue-200 focus:border-blue-500'} bg-white/80`}
            />
            {errors.registrationDeadline && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {errors.registrationDeadline}
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-1">Event Planning Tips</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Choose a memorable and descriptive event name</li>
                <li>• Set registration deadline at least 1 week before event</li>
                <li>• Consider venue capacity when setting max capacity</li>
                <li>• Include detailed address for better accessibility</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
