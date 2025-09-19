'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, Loader2 } from 'lucide-react'

interface NavigationControlsProps {
  currentStep: number
  totalSteps: number
  isLoading: boolean
  isNextDisabled?: boolean
  onPrevious: () => void
  onNext: () => void
  onSubmit: () => void
}

export function NavigationControls({ 
  currentStep, 
  totalSteps, 
  isLoading, 
  isNextDisabled = false,
  onPrevious, 
  onNext, 
  onSubmit 
}: NavigationControlsProps) {
  return (
    <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
      <div className="flex items-center gap-4">
        {currentStep > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            className="px-6 py-3 hover:bg-gray-50"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button type="button" variant="outline" asChild className="px-6 py-3">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Link>
        </Button>

        {currentStep < totalSteps ? (
          <Button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled}
            className={`px-8 py-3 font-semibold shadow-lg transition-all duration-200 ${
              isNextDisabled 
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-xl'
            }`}
          >
            Next Step
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button 
            type="button"
            onClick={onSubmit}
            disabled={isLoading}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Creating Event...
              </>
            ) : (
              <>
                <Calendar className="h-5 w-5 mr-2" />
                Create Event
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
