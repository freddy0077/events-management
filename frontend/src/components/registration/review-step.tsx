'use client'

import { CheckCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface RegistrationForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  organization: string
  receiptNumber: string
}

interface Event {
  name: string
}

interface Category {
  name: string
  price: number
}

interface ReviewStepProps {
  formData: RegistrationForm
  event: Event
  selectedCategory: Category
  onPrevious: () => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function ReviewStep({ 
  formData, 
  event, 
  selectedCategory, 
  onPrevious, 
  onSubmit, 
  isSubmitting 
}: ReviewStepProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <h3 className="text-lg font-semibold flex items-center text-gray-900 mb-2">
          <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
          Review & Confirm
        </h3>
        <p className="text-sm text-gray-600">Please review your information before submitting your registration.</p>
      </div>
      
      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Personal Information</h4>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600">Name:</span> <span className="font-medium">{formData.firstName} {formData.lastName}</span></div>
              <div><span className="text-gray-600">Email:</span> <span className="font-medium">{formData.email}</span></div>
              <div><span className="text-gray-600">Phone:</span> <span className="font-medium">{formData.phone}</span></div>
              {formData.organization && <div><span className="text-gray-600">Organization:</span> <span className="font-medium">{formData.organization}</span></div>}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Event Details</h4>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600">Event:</span> <span className="font-medium">{event.name}</span></div>
              <div><span className="text-gray-600">Category:</span> <span className="font-medium">{selectedCategory.name}</span></div>
              <div><span className="text-gray-600">Price:</span> <span className="font-medium">{formatCurrency(selectedCategory.price)}</span></div>
              <div><span className="text-gray-600">Receipt:</span> <span className="font-medium">{formData.receiptNumber}</span></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between pt-4">
        <Button 
          onClick={onPrevious}
          variant="outline"
          className="border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Complete Registration
              <CheckCircle className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
