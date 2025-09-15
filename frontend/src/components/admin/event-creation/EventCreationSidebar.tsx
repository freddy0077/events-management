'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Users, Clock, DollarSign, UserPlus, CheckCircle } from 'lucide-react'
import { Step } from './types'

interface EventCreationSidebarProps {
  currentStep: number
  totalSteps: number
  steps: Step[]
  goToStep: (step: number) => void
}

export function EventCreationSidebar({ currentStep, totalSteps, steps, goToStep }: EventCreationSidebarProps) {
  return (
    <div className="w-80 min-h-screen bg-white/90 backdrop-blur-sm border-r border-white/20 shadow-xl">
      <div className="p-6">
        <Button variant="outline" asChild className="mb-6 w-full hover:bg-white/80 transition-colors">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            Create New Event
          </h1>
          <p className="text-gray-600 text-sm">
            Build your event step by step with our comprehensive creation wizard
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">{currentStep}/{totalSteps}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Steps Navigation */}
        <div className="space-y-2">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            const isAccessible = step.id <= currentStep || isCompleted
            
            return (
              <div key={step.id} className="relative">
                {index < steps.length - 1 && (
                  <div className={`absolute left-6 top-12 w-0.5 h-8 ${
                    isCompleted ? 'bg-green-400' : 'bg-gray-200'
                  } transition-colors duration-200`} />
                )}
                
                <button
                  onClick={() => isAccessible && goToStep(step.id)}
                  disabled={!isAccessible}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? `bg-${step.color}-50 border-2 border-${step.color}-200 shadow-md` 
                      : isCompleted
                        ? 'bg-green-50 border border-green-200 hover:bg-green-100'
                        : isAccessible
                          ? 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                          : 'bg-gray-50 border border-gray-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isActive 
                        ? `bg-${step.color}-100` 
                        : isCompleted
                          ? 'bg-green-100'
                          : 'bg-gray-100'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <step.icon className={`h-5 w-5 ${
                          isActive 
                            ? `text-${step.color}-600` 
                            : 'text-gray-600'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold text-sm ${
                        isActive 
                          ? `text-${step.color}-800` 
                          : isCompleted
                            ? 'text-green-800'
                            : 'text-gray-700'
                      }`}>
                        {step.title}
                      </h3>
                      <p className={`text-xs ${
                        isActive 
                          ? `text-${step.color}-600` 
                          : isCompleted
                            ? 'text-green-600'
                            : 'text-gray-500'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
