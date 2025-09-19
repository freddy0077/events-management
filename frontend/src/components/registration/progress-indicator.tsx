'use client'

import { Check } from 'lucide-react'

interface Step {
  id: number
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

interface ProgressIndicatorProps {
  steps: Step[]
  currentStep: number
}

export function ProgressIndicator({ steps, currentStep }: ProgressIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-soft border-0">
        <div className="flex items-center justify-between">
          {steps.map((step: any, index: number) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`
                    relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                    ${isCompleted ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' : 
                      isActive ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg animate-pulse' : 
                      'bg-gray-100 text-gray-400'}
                  `}>
                    {isCompleted ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                    {isActive && (
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 animate-ping opacity-20"></div>
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <div className={`font-semibold text-sm ${
                      isActive ? 'text-blue-700' : 
                      isCompleted ? 'text-green-700' : 
                      'text-gray-500'
                    }`}>
                      {step.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {step.description}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
                    isCompleted ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
