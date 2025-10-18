'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Clock, AlertCircle, Info, Calendar, Repeat, Copy } from 'lucide-react'
import { StepProps, MealSession } from './types'

export function MealSessionsStep({ formData, setFormData, errors, setErrors }: StepProps) {
  // Helper function to check if two dates are on the same day
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString()
  }

  // Helper function to get event date range
  const getEventDateRange = () => {
    const startDate = formData.date ? new Date(formData.date) : null
    const endDate = formData.endDate ? new Date(formData.endDate) : startDate
    return { startDate, endDate }
  }

  // Helper function to get all event dates
  const getAllEventDates = () => {
    const { startDate, endDate } = getEventDateRange()
    if (!startDate) return []
    
    const dates: Date[] = []
    const effectiveEndDate = endDate || startDate
    const currentDate = new Date(startDate)
    
    while (currentDate <= effectiveEndDate) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return dates
  }

  // Helper function to get day name from date
  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  }

  // Helper function to format date as DD/MM/YYYY
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  }

  // Generate individual meal sessions from recurring pattern
  const generateRecurringSessions = (baseSession: MealSession): MealSession[] => {
    const { startDate, endDate } = getEventDateRange()
    console.log('Event date range:', { startDate, endDate })
    
    if (!startDate) {
      console.log('No start date found')
      return []
    }
    
    const effectiveEndDate = endDate || startDate
    const generatedSessions: MealSession[] = []
    
    // Start from the event start date to include all days
    const currentDate = new Date(startDate)
    currentDate.setHours(0, 0, 0, 0) // Start of day
    
    // Create date-only versions for proper comparison
    const endDateOnly = new Date(effectiveEndDate)
    endDateOnly.setHours(0, 0, 0, 0) // Start of end date
    
    const currentDateOnly = new Date(currentDate)
    currentDateOnly.setHours(0, 0, 0, 0) // Start of current date
    
    console.log('Base session date:', new Date(baseSession.beginTime))
    console.log('Starting generation from event start date:', currentDate)
    console.log('End date:', effectiveEndDate)
    console.log('End date for comparison:', endDateOnly)
    console.log('Recurring pattern:', baseSession.recurringPattern)
    console.log('Recurring days:', baseSession.recurringDays)
    
    // Generate sessions for each day from current date to end date (using proper date comparison)
    console.log('About to start while loop...')
    console.log('Current date (normalized):', currentDateOnly)
    console.log('End date (normalized):', endDateOnly)
    console.log('Comparison result:', currentDateOnly <= endDateOnly)
    
    while (currentDateOnly <= endDateOnly) {
      const dayName = getDayName(currentDate)
      let shouldIncludeDay = false
      
      if (baseSession.recurringPattern === 'daily') {
        // Include every day
        shouldIncludeDay = true
        console.log('Daily pattern - including day')
      } else if (baseSession.recurringPattern === 'custom' && baseSession.recurringDays) {
        // Include only selected days of the week
        shouldIncludeDay = baseSession.recurringDays.includes(dayName)
        console.log(`Custom pattern - checking if ${dayName} is in`, baseSession.recurringDays)
      }
      
      console.log(`Checking ${currentDate.toDateString()} (${dayName}): shouldInclude = ${shouldIncludeDay}`)
      console.log('Base session times:', { beginTime: baseSession.beginTime, endTime: baseSession.endTime })
      
      if (shouldIncludeDay && baseSession.beginTime && baseSession.endTime) {
        // Calculate the time for this specific date
        const templateBeginTime = new Date(baseSession.beginTime)
        const templateEndTime = new Date(baseSession.endTime)
        
        // Create new times for this event date, preserving the time but updating the date
        const newBeginTime = new Date(currentDate)
        newBeginTime.setHours(templateBeginTime.getHours(), templateBeginTime.getMinutes(), 0, 0)
        
        const newEndTime = new Date(currentDate)
        newEndTime.setHours(templateEndTime.getHours(), templateEndTime.getMinutes(), 0, 0)
        
        const generatedSession: MealSession = {
          id: `${Date.now()}-${Math.random()}-${currentDate.getTime()}`, // Unique ID for each generated session
          name: `${baseSession.name} - ${formatDate(currentDate)}`,
          beginTime: newBeginTime.toISOString().slice(0, 16),
          endTime: newEndTime.toISOString().slice(0, 16),
          description: baseSession.description,
          generatedFromRecurring: true // Mark as generated from recurring
        }
        
        console.log('Generated session:', generatedSession)
        generatedSessions.push(generatedSession)
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1)
      currentDateOnly.setDate(currentDateOnly.getDate() + 1)
    }
    
    console.log(`Total generated sessions: ${generatedSessions.length}`)
    return generatedSessions
  }

  // Validate meal session date range (must be within event dates)
  const validateMealDateRange = (sessions: MealSession[]) => {
    const { startDate, endDate } = getEventDateRange()
    if (!startDate) return []

    const dateRangeErrors: string[] = []
    const effectiveEndDate = endDate || startDate

    sessions.forEach(session => {
      if (session.beginTime && session.endTime) {
        const mealStart = new Date(session.beginTime)
        const mealEnd = new Date(session.endTime)
        
        // Check if meal starts before event starts
        if (mealStart < startDate) {
          dateRangeErrors.push(`"${session.name || 'Unnamed session'}" starts before the event begins`)
        }
        
        // Check if meal ends after event ends
        if (mealEnd > new Date(effectiveEndDate.getTime() + 24 * 60 * 60 * 1000 - 1)) {
          dateRangeErrors.push(`"${session.name || 'Unnamed session'}" ends after the event ends`)
        }
      }
    })

    return dateRangeErrors
  }

  // Check for overlapping meal sessions (only within the same day)
  const checkTimeOverlap = (sessions: MealSession[]) => {
    const validSessions = sessions.filter(s => s.beginTime && s.endTime)
    const overlaps: string[] = []
    
    for (let i = 0; i < validSessions.length; i++) {
      for (let j = i + 1; j < validSessions.length; j++) {
        const session1 = validSessions[i]
        const session2 = validSessions[j]
        
        const start1 = new Date(session1.beginTime)
        const end1 = new Date(session1.endTime)
        const start2 = new Date(session2.beginTime)
        const end2 = new Date(session2.endTime)
        
        // Only check for overlaps if sessions are on the same day
        if (isSameDay(start1, start2) && (start1 < end2 && end1 > start2)) {
          const dayStr = formatDate(start1)
          overlaps.push(`"${session1.name || 'Unnamed session'}" overlaps with "${session2.name || 'Unnamed session'}" on ${dayStr}`)
        }
      }
    }
    
    return overlaps
  }

  // Check if a specific session has overlaps with other sessions
  const hasSessionOverlap = (targetSession: MealSession, allSessions: MealSession[]) => {
    if (!targetSession.beginTime || !targetSession.endTime) return false
    
    const validSessions = allSessions.filter(s => s.beginTime && s.endTime && s !== targetSession)
    const targetStart = new Date(targetSession.beginTime)
    const targetEnd = new Date(targetSession.endTime)
    
    for (const session of validSessions) {
      const sessionStart = new Date(session.beginTime)
      const sessionEnd = new Date(session.endTime)
      
      // Only check for overlaps if sessions are on the same day
      if (isSameDay(targetStart, sessionStart) && (targetStart < sessionEnd && targetEnd > sessionStart)) {
        return true
      }
    }
    
    return false
  }

  // Group meal sessions by day for better organization
  const groupSessionsByDay = (sessions: MealSession[]) => {
    const groups: { [key: string]: MealSession[] } = {}
    
    sessions.forEach(session => {
      if (session.beginTime) {
        const date = new Date(session.beginTime)
        const dayKey = date.toDateString()
        if (!groups[dayKey]) {
          groups[dayKey] = []
        }
        groups[dayKey].push(session)
      } else {
        // Sessions without dates go to "unscheduled"
        if (!groups['unscheduled']) {
          groups['unscheduled'] = []
        }
        groups['unscheduled'].push(session)
      }
    })
    
    // Sort sessions within each day by begin time in descending order (latest first)
    Object.keys(groups).forEach(dayKey => {
      if (dayKey !== 'unscheduled') {
        groups[dayKey].sort((a, b) => {
          if (!a.beginTime || !b.beginTime) return 0
          return new Date(b.beginTime).getTime() - new Date(a.beginTime).getTime()
        })
      }
    })
    
    return groups
  }

  const addMealSession = () => {
    // Default to event start date if available
    const { startDate } = getEventDateRange()
    let defaultBeginTime = ''
    let defaultEndTime = ''
    
    if (startDate) {
      // Find the latest end time among existing sessions on the start date to ensure new sessions appear at the bottom
      const startDateStr = startDate.toDateString()
      const existingSessionsOnStartDate = formData.mealSessions.filter(session => {
        if (!session.beginTime) return false
        const sessionDate = new Date(session.beginTime)
        return sessionDate.toDateString() === startDateStr
      })
      
      let latestEndTime = new Date(startDate)
      latestEndTime.setHours(12, 0, 0, 0) // Default to 12:00 PM if no existing sessions
      
      // Find the latest end time among existing sessions
      existingSessionsOnStartDate.forEach(session => {
        if (session.endTime) {
          const sessionEndTime = new Date(session.endTime)
          if (sessionEndTime > latestEndTime) {
            latestEndTime = sessionEndTime
          }
        }
      })
      
      // Set new session to start 1 hour after the latest end time (or at 12:00 PM if no existing sessions)
      const defaultStart = new Date(latestEndTime)
      if (existingSessionsOnStartDate.length > 0) {
        defaultStart.setTime(latestEndTime.getTime() + 60 * 60 * 1000) // Add 1 hour
      }
      
      const defaultEnd = new Date(defaultStart)
      defaultEnd.setHours(defaultStart.getHours() + 1) // 1 hour duration
      
      defaultBeginTime = defaultStart.toISOString().slice(0, 16)
      defaultEndTime = defaultEnd.toISOString().slice(0, 16)
    }

    const newSession: MealSession = {
      id: Date.now().toString(),
      name: '',
      beginTime: defaultBeginTime,
      endTime: defaultEndTime,
      description: '',
      isRecurring: false,
      recurringPattern: 'daily',
      recurringDays: []
    }
    setFormData(prev => ({
      ...prev,
      mealSessions: [...prev.mealSessions, newSession]
    }))
  }

  const updateMealSession = (id: string, field: keyof MealSession, value: string | boolean | string[]) => {
    setFormData(prev => {
      const session = prev.mealSessions.find(s => s.id === id)
      if (!session) return prev
      
      const updatedSession = { ...session, [field]: value }
      
      // Regular session update
      const updatedSessions = prev.mealSessions.map((s: any) => 
        s.id === id ? updatedSession : s
      )
      
      // Clear meal session errors when updating times
      if (field === 'beginTime' || field === 'endTime') {
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors }
          delete newErrors.mealSessionOverlap
          delete newErrors.mealSessionTimes
          return newErrors
        })
      }
      
      return {
        ...prev,
        mealSessions: updatedSessions
      }
    })
  }

  // Generate recurring sessions - creates individual sessions for each day
  const generateRecurringSessionsForMeal = (sessionId: string) => {
    const session = formData.mealSessions.find(s => s.id === sessionId)
    if (!session || !session.name || !session.beginTime || !session.endTime) {
      console.log('Cannot generate recurring sessions: missing required fields', session)
      return
    }
    
    // Generate individual sessions for each selected day
    const generatedSessions = generateRecurringSessions(session)
    console.log('Generated sessions:', generatedSessions)
    
    // Only proceed if we actually generated sessions
    if (generatedSessions.length === 0) {
      console.log('No sessions generated - keeping original session')
      return
    }
    
    // Remove the original session and add all generated sessions
    setFormData(prev => ({
      ...prev,
      mealSessions: [
        ...prev.mealSessions.filter(s => s.id !== sessionId),
        ...generatedSessions
      ]
    }))
  }
  
  // Toggle recurring functionality for a session
  const toggleRecurring = (sessionId: string, isRecurring: boolean) => {
    const session = formData.mealSessions.find(s => s.id === sessionId)
    if (!session) return
    
    if (isRecurring) {
      // Just update the session to mark it as recurring
      setFormData(prev => ({
        ...prev,
        mealSessions: prev.mealSessions.map((s: any) => 
          s.id === sessionId ? {
            ...s,
            isRecurring: true,
            recurringPattern: 'daily'
          } : s
        )
      }))
    } else {
      // Disable recurring
      setFormData(prev => ({
        ...prev,
        mealSessions: prev.mealSessions.map((s: any) => 
          s.id === sessionId ? {
            ...s,
            isRecurring: false,
            recurringPattern: 'daily',
            recurringDays: []
          } : s
        )
      }))
    }
  }

  // Update recurring pattern
  const updateRecurringPattern = (sessionId: string, pattern: 'daily' | 'custom') => {
    setFormData(prev => ({
      ...prev,
      mealSessions: prev.mealSessions.map((s: any) => 
        s.id === sessionId ? {
          ...s,
          recurringPattern: pattern,
          recurringDays: pattern === 'daily' ? [] : s.recurringDays || []
        } : s
      )
    }))
  }

  // Update recurring days for custom pattern
  const updateRecurringDays = (sessionId: string, days: string[]) => {
    setFormData(prev => ({
      ...prev,
      mealSessions: prev.mealSessions.map((s: any) => 
        s.id === sessionId ? {
          ...s,
          recurringDays: days
        } : s
      )
    }))
  }

  // Get current validation errors for real-time feedback
  const currentOverlaps = checkTimeOverlap(formData.mealSessions)
  const currentDateRangeErrors = validateMealDateRange(formData.mealSessions)
  const sessionGroups = groupSessionsByDay(formData.mealSessions)
  const { startDate, endDate } = getEventDateRange()
  const isMultiDay = startDate && endDate && !isSameDay(startDate, endDate)

  const removeMealSession = (id: string) => {
    setFormData(prev => ({
      ...prev,
      mealSessions: prev.mealSessions.filter(session => session.id !== id)
    }))
  }

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 shadow-xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-100 rounded-xl">
            <Clock className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <CardTitle className="text-xl text-orange-800">Meal Sessions</CardTitle>
            <CardDescription className="text-orange-600">
              Configure meal times and catering options
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Event Date Range Info */}
        {startDate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Event Date Range
              </span>
            </div>
            <div className="text-sm text-blue-700">
              {isMultiDay ? (
                <span>
                  {formatDate(startDate)} - {endDate ? formatDate(endDate) : ''}
                  <span className="ml-2 text-blue-600 font-medium">(Multi-day event)</span>
                </span>
              ) : (
                <span>{formatDate(startDate)} <span className="ml-2 text-blue-600 font-medium">(Single day)</span></span>
              )}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Meal sessions must be scheduled within this date range
            </div>
          </div>
        )}

        {/* Date Range Validation Errors */}
        {currentDateRangeErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Date Range Issues</span>
            </div>
            <div className="space-y-1">
              {currentDateRangeErrors.map((error, index) => (
                <div key={`date-${index}`} className="text-sm text-red-700">• {error}</div>
              ))}
            </div>
          </div>
        )}

        {/* Meal Sessions List - Grouped by Day */}
        <div className="space-y-6">
          {Object.keys(sessionGroups).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No meal sessions added yet</p>
              <p className="text-sm">Click "Add Meal Session" to get started</p>
            </div>
          ) : (
            Object.entries(sessionGroups)
              .sort(([dayA], [dayB]) => {
                if (dayA === 'unscheduled') return 1
                if (dayB === 'unscheduled') return -1
                return new Date(dayB).getTime() - new Date(dayA).getTime() // Descending order (latest first)
              })
              .map(([dayKey, sessions]) => (
                <div key={dayKey} className="space-y-4">
                  {/* Day Header */}
                  <div className="flex items-center gap-3 pb-2 border-b border-orange-200">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-orange-800">
                      {dayKey === 'unscheduled' ? (
                        'Unscheduled Sessions'
                      ) : (
                        <>Day {Math.floor((new Date(dayKey).getTime() - (startDate?.getTime() || 0)) / (24 * 60 * 60 * 1000)) + 1} - {formatDate(new Date(dayKey))}</>
                      )}
                    </h3>
                    <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                      {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {/* Sessions for this day */}
                  <div className="space-y-4 ml-4">
                    {sessions.map((session, sessionIndex) => (
                      <div key={session.id} className="bg-white/80 border border-orange-200 rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-semibold text-orange-800">
                              {session.name || `Session ${sessionIndex + 1}`}
                            </h4>
                            {/* Generated indicator */}
                            {session.generatedFromRecurring && (
                              <div className="flex items-center gap-1 bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
                                <Copy className="h-3 w-3" />
                                Generated
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Session validation status */}
                            {session.beginTime && session.endTime && (
                              <div className="flex items-center gap-1">
                                {new Date(session.beginTime) >= new Date(session.endTime) ? (
                                  <div className="flex items-center gap-1 text-red-600 text-xs">
                                    <AlertCircle className="h-3 w-3" />
                                    Invalid times
                                  </div>
                                ) : currentDateRangeErrors.some(error => error.includes(session.name || 'Unnamed session')) ? (
                                  <div className="flex items-center gap-1 text-red-600 text-xs">
                                    <AlertCircle className="h-3 w-3" />
                                    Outside event dates
                                  </div>
                                ) : hasSessionOverlap(session, formData.mealSessions) ? (
                                  <div className="flex items-center gap-1 text-amber-600 text-xs">
                                    <AlertCircle className="h-3 w-3" />
                                    Time conflict
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-green-600 text-xs">
                                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                                    Valid
                                  </div>
                                )}
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeMealSession(session.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                              Session Name *
                            </Label>
                            <Input
                              value={session.name}
                              onChange={(e) => updateMealSession(session.id, 'name', e.target.value)}
                              placeholder="e.g., Welcome Breakfast, Day 2 Lunch"
                              className="border-orange-200 focus:border-orange-500 bg-white"
                            />
                          </div>

                          {/* Recurring Options - Only show for non-generated sessions */}
                          {!session.generatedFromRecurring && isMultiDay && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <Repeat className="h-4 w-4 text-blue-600" />
                                <Label className="text-sm font-medium text-blue-800">
                                  Recurring Session
                                </Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`recurring-${session.id}`}
                                  checked={session.isRecurring || false}
                                  onCheckedChange={(checked) => toggleRecurring(session.id, checked as boolean)}
                                />
                                <Label htmlFor={`recurring-${session.id}`} className="text-sm text-blue-700">
                                  Repeat this session across multiple days
                                </Label>
                              </div>

                              {session.isRecurring && (
                                <div className="space-y-3 ml-6">
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium text-blue-700">
                                      Recurring Pattern
                                    </Label>
                                    <Select
                                      value={session.recurringPattern || 'daily'}
                                      onValueChange={(value: 'daily' | 'custom') => updateRecurringPattern(session.id, value)}
                                    >
                                      <SelectTrigger className="w-full border-blue-200 focus:border-blue-500 bg-white text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="daily">Every day</SelectItem>
                                        <SelectItem value="custom">Custom days</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {session.recurringPattern === 'custom' && (
                                    <div className="space-y-2">
                                      <Label className="text-xs font-medium text-blue-700">
                                        Select Days
                                      </Label>
                                      <div className="grid grid-cols-2 gap-2">
                                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                                          <div key={day} className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`${session.id}-${day}`}
                                              checked={session.recurringDays?.includes(day) || false}
                                              onCheckedChange={(checked) => {
                                                const currentDays = session.recurringDays || []
                                                const newDays = checked 
                                                  ? [...currentDays, day]
                                                  : currentDays.filter(d => d !== day)
                                                updateRecurringDays(session.id, newDays)
                                              }}
                                            />
                                            <Label htmlFor={`${session.id}-${day}`} className="text-xs text-blue-600 capitalize">
                                              {day}
                                            </Label>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {session.isRecurring && (
                                    <div className="space-y-2">
                                      <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                                        <strong>Ready to generate:</strong> This will create individual meal sessions for {
                                          session.recurringPattern === 'daily' 
                                            ? 'all event days' 
                                            : `selected days (${session.recurringDays?.length || 0} days)`
                                        }.
                                      </div>
                                      
                                      {session.name && session.beginTime && session.endTime && (
                                        <Button
                                          type="button"
                                          onClick={() => generateRecurringSessionsForMeal(session.id)}
                                          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
                                          disabled={session.recurringPattern === 'custom' && (!session.recurringDays || session.recurringDays.length === 0)}
                                        >
                                          <Plus className="h-4 w-4 mr-2" />
                                          Generate Recurring Sessions
                                        </Button>
                                      )}
                                      
                                      {(!session.name || !session.beginTime || !session.endTime) && (
                                        <div className="text-xs text-amber-600 bg-amber-100 p-2 rounded">
                                          Complete all required fields to generate sessions
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Begin Time *
                              </Label>
                              <Input
                                type="datetime-local"
                                value={session.beginTime}
                                onChange={(e) => updateMealSession(session.id, 'beginTime', e.target.value)}
                                min={startDate ? startDate.toISOString().slice(0, 16) : undefined}
                                max={endDate ? new Date(endDate.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString().slice(0, 16) : undefined}
                                className="border-orange-200 focus:border-orange-500 bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                End Time *
                              </Label>
                              <Input
                                type="datetime-local"
                                value={session.endTime}
                                onChange={(e) => updateMealSession(session.id, 'endTime', e.target.value)}
                                min={session.beginTime || (startDate ? startDate.toISOString().slice(0, 16) : undefined)}
                                max={endDate ? new Date(endDate.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString().slice(0, 16) : undefined}
                                className="border-orange-200 focus:border-orange-500 bg-white"
                                />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                              Description
                            </Label>
                            <Textarea
                              value={session.description}
                              onChange={(e) => updateMealSession(session.id, 'description', e.target.value)}
                              placeholder="Optional description of the meal session"
                              className="border-orange-200 focus:border-orange-500 bg-white min-h-[80px]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Overlap Validation Warning */}
        {currentOverlaps.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold text-red-800 mb-1">Overlapping Meal Sessions Detected!</h4>
                <div className="text-sm text-red-700 space-y-1">
                  {currentOverlaps.map((overlap, index) => (
                    <p key={index}>• {overlap}</p>
                  ))}
                  <p className="mt-2 font-medium">
                    Please adjust the times to ensure meal sessions don't overlap.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {(errors.mealSessionOverlap || errors.mealSessionTimes) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold text-red-800 mb-1">Validation Error</h4>
                <div className="text-sm text-red-700 space-y-1">
                  {errors.mealSessionOverlap && <p>• {errors.mealSessionOverlap}</p>}
                  {errors.mealSessionTimes && <p>• {errors.mealSessionTimes}</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Meal Session Button */}
        <Button
          type="button"
          variant="outline"
          onClick={addMealSession}
          className="w-full border-2 border-dashed border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 py-6"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Meal Session
        </Button>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 p-4 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Info className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-orange-800 mb-1">Meal Planning Tips</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Schedule meals at appropriate times during your event</li>
                <li>• Consider dietary restrictions and preferences</li>
                <li>• Allow sufficient time between sessions</li>
                <li>• Include details about menu options in descriptions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Meal Sessions Summary */}
        {formData.mealSessions.length > 0 && (
          <div className="bg-white/80 border border-orange-200 rounded-xl p-4">
            <h4 className="font-semibold text-orange-800 mb-3">Meal Sessions Summary</h4>
            <div className="space-y-2">
              {formData.mealSessions
                .slice() // Create a copy to avoid mutating original array
                .sort((a, b) => {
                  // Sort by begin time in descending order (latest first)
                  if (!a.beginTime && !b.beginTime) return 0
                  if (!a.beginTime) return 1
                  if (!b.beginTime) return -1
                  return new Date(b.beginTime).getTime() - new Date(a.beginTime).getTime()
                })
                .map((session, index) => {
                const isComplete = session.name && session.beginTime && session.endTime
                const hasValidTimes = session.beginTime && session.endTime && new Date(session.beginTime) < new Date(session.endTime)
                const isOverlapping = hasSessionOverlap(session, formData.mealSessions)
                const isOutsideDateRange = currentDateRangeErrors.some(error => error.includes(session.name || 'Unnamed session'))
                
                return (
                  <div key={session.id} className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium text-orange-800">
                        {session.name || `Session ${index + 1}`}
                      </span>
                      {session.beginTime && session.endTime && (
                        <div className="text-sm text-orange-600 mt-1">
                          {new Date(session.beginTime).toLocaleString()} - {new Date(session.endTime).toLocaleString()}
                          {session.beginTime && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({formatDate(new Date(session.beginTime))})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isComplete ? (
                        <div className="flex items-center gap-1 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          Incomplete
                        </div>
                      ) : !hasValidTimes ? (
                        <div className="flex items-center gap-1 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          Invalid Times
                        </div>
                      ) : isOutsideDateRange ? (
                        <div className="flex items-center gap-1 text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          Outside Event Dates
                        </div>
                      ) : isOverlapping ? (
                        <div className="flex items-center gap-1 text-amber-600 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          Time Conflict
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                          <div className="h-2 w-2 bg-green-500 rounded-full" />
                          Valid
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* No Meals Option */}
        {formData.mealSessions.length === 0 && (
          <div className="text-center py-8 bg-white/50 border border-orange-200 rounded-xl">
            <Clock className="h-12 w-12 text-orange-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-orange-800 mb-2">No Meal Sessions</h3>
            <p className="text-orange-600 mb-4">
              Your event doesn't include any meal sessions. You can add them if needed.
            </p>
            <Button
              type="button"
              onClick={addMealSession}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Meal Session
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
