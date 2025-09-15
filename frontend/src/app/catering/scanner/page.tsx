'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@apollo/client/react'
import { GET_MEAL_SESSIONS, GET_EVENTS } from '@/lib/graphql/queries'
import { useMealAttendances } from '@/lib/graphql/hooks'
import { useFailedScans } from '@/lib/graphql/hooks/useAuditLogs'
import QRCodeScanner from '@/components/scanner/QRCodeScanner'
import { useFailedScanRecording, createFailedScanRecord } from '@/hooks/use-failed-scan-recording'

export default function CateringScannerPage() {
  const [selectedEvent, setSelectedEvent] = useState('all')
  const [selectedMeal, setSelectedMeal] = useState('')
  
  // Failed scan recording hook
  const { recordFailedScan } = useFailedScanRecording()
  
  // Fetch events and meal sessions
  const { data: eventsData, loading: eventsLoading } = useQuery(GET_EVENTS)
  const { data: mealSessionsData, loading: mealSessionsLoading } = useQuery(GET_MEAL_SESSIONS, {
    variables: selectedEvent !== 'all' ? { eventId: selectedEvent } : {}
  })
  
  const events = (eventsData as any)?.events || []
  const mealSessions = (mealSessionsData as any)?.getMealSessions || []
  const activeMealSessions = mealSessions.filter((session: any) => session.isActive)

  // Fetch failed scans using the new staff-accessible endpoint
  const { data: failedScansData, loading: failedScansLoading, refetch: refetchFailedScans } = useFailedScans({
    eventId: selectedEvent !== 'all' ? selectedEvent : undefined,
    limit: 50
  })

  // Fetch meal attendances for selected meal session
  const { data: mealAttendancesData, loading: attendancesLoading, refetch: refetchMealAttendances } = useMealAttendances(
    selectedMeal && selectedMeal !== '' ? selectedMeal : undefined
  )
  const recentMealAttendances = (mealAttendancesData as any)?.mealAttendance || []

  // Auto-select the first active meal session when available
  useEffect(() => {
    if (activeMealSessions.length > 0 && !selectedMeal) {
      setSelectedMeal(activeMealSessions[0].id)
    }
  }, [activeMealSessions, selectedMeal])

  // Refetch failed scans when meal selection changes
  useEffect(() => {
    if (selectedMeal) {
      console.log('Meal selection changed, refetching failed scans for meal:', selectedMeal)
      refetchFailedScans()
    }
  }, [selectedMeal, refetchFailedScans])

  const refetchAttendances = async () => {
    // Refetch both meal attendances and failed scans
    await Promise.all([
      refetchMealAttendances(),
      refetchFailedScans()
    ])
  }

  // Transform events for the scanner component
  const transformedEvents = events.map((event: any) => ({
    id: event.id,
    name: event.name,
    date: event.date
  }))

  // Transform meal sessions for the scanner component
  const transformedMealSessions = mealSessions.map((session: any) => ({
    id: session.id,
    name: session.name,
    description: session.description || session.sessionTime,
    sessionTime: session.sessionTime
  }))

  // Transform recent meal attendances into scan records - data comes directly from backend with all relations
  const successfulScans = recentMealAttendances.map(attendance => {
    const registration = attendance.registration
    
    return {
      id: attendance.id,
      participantName: registration?.firstName && registration?.lastName 
        ? `${registration.firstName} ${registration.lastName}` 
        : `Registration ${attendance.registrationId}`,
      email: registration?.email || 'N/A',
      eventName: registration?.event?.name || 'Unknown Event',
      category: registration?.category?.name || 'General',
      qrCode: registration?.qrCode || 'N/A',
      mealName: attendance.meal?.name || 'Unknown Meal',
      status: 'CHECKED_IN',
      scannedAt: attendance.scannedAt,
      scanResult: 'success',
      isManualOverride: false,
      scannedBy: attendance.scannedBy || 'System',
      notes: attendance.notes || ''
    }
  })

  // Transform failed scan logs into scan records
  const failedScansFromDB = useMemo(() => {
    const failedScans = failedScansData?.getFailedScans?.logs || []
    
    return failedScans
      .map(log => {
        const details = log.details || {}
        const selectedEventData = events.find(e => e.id === log.eventId)
        const selectedMealData = mealSessions.find(m => m.id === details.mealId)
        
        return {
          id: log.id,
          participantName: 'Invalid QR Code',
          email: 'N/A',
          eventName: log.event?.name || selectedEventData?.name || 'Unknown Event',
          category: 'N/A',
          qrCode: details.qrCode || 'N/A',
          mealName: selectedMealData?.name || details.mealName || 'Unknown Meal',
          status: 'SCAN_FAILED',
          scannedAt: log.createdAt,
          scanResult: 'error',
          isManualOverride: false,
          scannedBy: details.scanMethod || 'Unknown',
          notes: details.errorMessage || details.notes || 'Failed scan',
          mealId: details.mealId // Keep mealId for filtering
        }
      })
      .filter(scan => {
        // Filter by selected meal session if one is selected
        if (selectedMeal && selectedMeal !== '') {
          return scan.mealId === selectedMeal
        }
        return true // Show all failed scans if no specific meal is selected
      })
  }, [failedScansData, events, mealSessions, selectedMeal])

  // Combine successful scans and failed scans, sort by most recent first
  const scanHistory = [...successfulScans, ...failedScansFromDB].sort((a, b) => 
    new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
  )

  // Handle failed scan recording
  const handleRecordFailedScan = async (failedScanData: any) => {
    try {
      // Extract error message from notes field (format: "Failed scan: <error message>")
      const errorMessage = failedScanData.notes?.replace('Failed scan: ', '') || 'Unknown error'
      
      // Extract scan method from scannedBy field
      const scanMethod = failedScanData.scannedBy || 'Unknown'
      
      const failedScanRecord = createFailedScanRecord(
        failedScanData.qrCode,
        errorMessage,
        scanMethod,
        {
          eventId: selectedEvent !== 'all' ? selectedEvent : undefined,
          mealId: selectedMeal,
          notes: failedScanData.notes
        }
      )
      
      await recordFailedScan(failedScanRecord)
      console.log('Failed scan recorded successfully for audit trail')
      
      // Refetch failed scans to immediately show the new failed scan from database
      await refetchFailedScans()
    } catch (error) {
      console.error('Error recording failed scan:', error)
    }
  }

  return (
    <QRCodeScanner
      events={transformedEvents}
      mealSessions={transformedMealSessions}
      scanHistory={scanHistory}
      title="Catering QR Code Scanner"
      description="Scan participant QR codes for meal check-in"
      showStats={true} // Show stats including failed scans for catering staff
      showInstructions={true}
      allowEventSelection={true}
      allowMealSelection={true}
      selectedEvent={selectedEvent}
      selectedMeal={selectedMeal}
      loading={false}
      eventsLoading={eventsLoading}
      mealSessionsLoading={mealSessionsLoading}
      attendancesLoading={attendancesLoading}
      onEventChange={(eventId) => {
        setSelectedEvent(eventId)
        setSelectedMeal('') // Reset meal selection when event changes
      }}
      onMealChange={(mealId) => setSelectedMeal(mealId)}
      onRefreshData={() => refetchAttendances()}
      onScanSuccess={(result) => {
        // Catering-specific success handling
        console.log('Catering scan success:', result)
      }}
      onScanError={(error) => {
        // Catering-specific error handling
        console.error('Catering scan error:', error)
      }}
      onRecordFailedScan={handleRecordFailedScan}
    />
  )
}
