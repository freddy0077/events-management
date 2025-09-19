'use client'

import { useState } from 'react'
import { Receipt, Search, Loader2, CheckCircle, ArrowLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface PaymentVerificationStepProps {
  receiptNumber: string
  onReceiptNumberChange: (value: string) => void
  onReceiptSearch: () => void
  receiptFound: boolean | null
  paymentStatus: 'pending' | 'approved' | 'declined'
  receiptSearchLoading: boolean
  onPrevious: () => void
  onNext: () => void
  isValid: boolean
}

export function PaymentVerificationStep({ 
  receiptNumber, 
  onReceiptNumberChange, 
  onReceiptSearch,
  receiptFound, 
  paymentStatus,
  receiptSearchLoading,
  onPrevious, 
  onNext, 
  isValid 
}: PaymentVerificationStepProps) {

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
        <h3 className="text-lg font-semibold flex items-center text-gray-900 mb-2">
          <Receipt className="h-5 w-5 mr-2 text-blue-600" />
          Payment Verification
        </h3>
        <p className="text-sm text-gray-600">Enter your payment receipt number to verify your registration.</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="receiptNumber" className="text-gray-700 font-medium">Payment Receipt Number *</Label>
          <div className="flex gap-2">
            <Input
              id="receiptNumber"
              value={receiptNumber}
              onChange={(e) => onReceiptNumberChange(e.target.value)}
              className="border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-200"
              placeholder="Enter receipt number (e.g., RCP001)"
              required
            />
            <Button 
              type="button"
              variant="outline"
              onClick={onReceiptSearch}
              disabled={receiptSearchLoading || !receiptNumber.trim()}
              className="border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
            >
              {receiptSearchLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Enter your payment receipt number to verify payment status
          </p>
        </div>

        {receiptFound !== null && (
          <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
            receiptFound 
              ? paymentStatus === 'approved' 
                ? 'bg-green-50 border-green-200 text-green-800'
                : paymentStatus === 'pending'
                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                : 'bg-red-50 border-red-200 text-red-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {receiptFound ? (
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-semibold mb-1">
                    Payment Status: {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                  </p>
                  <p className="text-sm">
                    {paymentStatus === 'approved' 
                      ? 'Your payment has been approved. You can complete registration.'
                      : paymentStatus === 'pending'
                      ? 'Your payment is under review. Registration will be processed upon approval.'
                      : 'Your payment has been declined. Please contact support.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="h-5 w-5 mr-3 rounded-full bg-red-500 flex-shrink-0"></div>
                <div>
                  <p className="font-semibold mb-1">Receipt Not Found</p>
                  <p className="text-sm">Please verify your receipt number and try again.</p>
                </div>
              </div>
            )}
          </div>
        )}
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
          onClick={onNext}
          disabled={!isValid}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Continue to Review
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
