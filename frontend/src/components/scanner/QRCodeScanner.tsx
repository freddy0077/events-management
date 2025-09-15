'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useValidateQRCode } from '@/hooks/use-qr-code'
import { useMutation } from '@apollo/client/react'
import { gql } from '@apollo/client'
import { toast } from 'sonner'
import { 
  QrCode, 
  Camera,
  CameraOff,
  Search,
  User,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Scan,
  UserCheck,
  Users,
  Eye,
  RefreshCw,
  Download
} from 'lucide-react'

// Define the mutation inline to avoid import issues
const SCAN_MEAL_QR_CODE = gql`
  mutation ScanMealQRCode($input: ScanQRCodeInput!) {
    scanMealQRCode(input: $input) {
      success
      message
      participantName
      alreadyScanned
      attendance {
        id
        registrationId
        mealId
        scannedAt
        scannedBy
        notes
        meal {
          id
          name
          sessionTime
          eventId
        }
      }
    }
  }
`

interface ScanRecord {
  id: string
  participantName: string
  email: string
  eventName: string
  category: string
  qrCode: string
  mealName: string
  status: string
  scannedAt: string
  scanResult: string
  isManualOverride: boolean
  scannedBy: string
  notes: string
}

interface Event {
  id: string
  name: string
  date: string
}

interface MealSession {
  id: string
  name: string
  description: string
  sessionTime: string
}

interface QRCodeScannerProps {
  // Required props
  events: Event[]
  mealSessions: MealSession[]
  scanHistory: ScanRecord[]
  
  // Optional customization props
  title?: string
  description?: string
  showStats?: boolean
  showInstructions?: boolean
  allowEventSelection?: boolean
  allowMealSelection?: boolean
  
  // Callback props
  onScanSuccess?: (result: any) => void
  onScanError?: (error: string) => void
  onEventChange?: (eventId: string) => void
  onMealChange?: (mealId: string) => void
  onRefreshData?: () => void
  onRecordFailedScan?: (failedScan: ScanRecord) => void
  
  // Loading states
  loading?: boolean
  eventsLoading?: boolean
  mealSessionsLoading?: boolean
  attendancesLoading?: boolean
  
  // Preselected values
  selectedEvent?: string
  selectedMeal?: string
}

export default function QRCodeScanner({
  events = [],
  mealSessions = [],
  scanHistory = [],
  title = "QR Code Scanner",
  description = "Scan participant QR codes for event check-in",
  showStats = true,
  showInstructions = true,
  allowEventSelection = true,
  allowMealSelection = true,
  onScanSuccess,
  onScanError,
  onEventChange,
  onMealChange,
  onRefreshData,
  onRecordFailedScan,
  loading = false,
  eventsLoading = false,
  mealSessionsLoading = false,
  attendancesLoading = false,
  selectedEvent = 'all',
  selectedMeal = ''
}: QRCodeScannerProps) {
  const [scanMode, setScanMode] = useState<'scanner' | 'camera' | 'manual'>('scanner')
  const [manualCode, setManualCode] = useState('')
  const [internalSelectedEvent, setInternalSelectedEvent] = useState(selectedEvent)
  const [internalSelectedMeal, setInternalSelectedMeal] = useState(selectedMeal)
  const [searchTerm, setSearchTerm] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [lastScanResult, setLastScanResult] = useState<any>(null)
  
  // Camera state
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // GraphQL hooks for QR validation and meal scanning
  const { validate: validateQRCode, loading: validateLoading } = useValidateQRCode()
  const [scanMealQRCode, { loading: scanLoading }] = useMutation(SCAN_MEAL_QR_CODE, {
    refetchQueries: ['GetMealAttendances'],
    errorPolicy: 'all'
  })

  // Update internal state when props change
  useEffect(() => {
    setInternalSelectedEvent(selectedEvent)
  }, [selectedEvent])

  useEffect(() => {
    setInternalSelectedMeal(selectedMeal)
  }, [selectedMeal])

  // Handle event selection change
  const handleEventChange = (eventId: string) => {
    setInternalSelectedEvent(eventId)
    setInternalSelectedMeal('') // Reset meal selection when event changes
    onEventChange?.(eventId)
  }

  // Handle meal selection change
  const handleMealChange = (mealId: string) => {
    setInternalSelectedMeal(mealId)
    onMealChange?.(mealId)
  }

  // Filter scan history based on search and event selection
  const filteredScans = scanHistory.filter(scan => {
    const matchesSearch = scan.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scan.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scan.qrCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scan.mealName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEvent = internalSelectedEvent === 'all' || scan.eventName === events.find(e => e.id === internalSelectedEvent)?.name
    return matchesSearch && matchesEvent
  })
  
  // Loading state
  if (loading || eventsLoading || mealSessionsLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-2">Loading scanner data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CHECKED_IN':
        return 'bg-green-100 text-green-800'
      case 'ALREADY_CHECKED_IN':
        return 'bg-yellow-100 text-yellow-800'
      case 'PAYMENT_PENDING':
        return 'bg-red-100 text-red-800'
      case 'INVALID_QR':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getStatusIcon = (scanResult: string) => {
    switch (scanResult) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // Helper function to create a failed scan record
  const createFailedScanRecord = (qrCode: string, errorMessage: string, scanMethod: string): ScanRecord => {
    const selectedEventData = events.find(e => e.id === internalSelectedEvent)
    const selectedMealData = mealSessions.find(m => m.id === internalSelectedMeal)
    
    return {
      id: `failed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      participantName: 'Invalid QR Code',
      email: 'N/A',
      eventName: selectedEventData?.name || 'Unknown Event',
      category: 'N/A',
      qrCode: qrCode,
      mealName: selectedMealData?.name || 'Unknown Meal',
      status: 'INVALID_QR',
      scannedAt: new Date().toISOString(),
      scanResult: 'error',
      isManualOverride: false,
      scannedBy: scanMethod,
      notes: `Failed scan: ${errorMessage}`
    }
  }

  const handleManualScan = async () => {
    if (!manualCode.trim()) {
      toast.error('Please enter a QR code')
      return
    }
    
    if (allowMealSelection && !internalSelectedMeal) {
      toast.error('Please select a meal session first')
      return
    }

    setIsValidating(true)
    try {
      // First validate the QR code
      const validationResult = await validateQRCode(manualCode.trim())
      
      if (validationResult?.isValid) {
        // If valid, proceed with meal scanning
        const scanResult = await scanMealQRCode({
          variables: {
            input: {
              qrCode: manualCode.trim(),
              mealId: internalSelectedMeal,
              notes: 'Manual scan by staff'
            }
          }
        })
        
        const mealScanData = (scanResult.data as any)?.scanMealQRCode
        
        if (mealScanData?.success) {
          const successResult = {
            success: true,
            qrCode: manualCode.trim(),
            data: {
              participantName: mealScanData.participantName,
              message: mealScanData.message,
              alreadyScanned: mealScanData.alreadyScanned
            },
            timestamp: new Date().toISOString()
          }
          
          setLastScanResult(successResult)
          
          if (mealScanData.alreadyScanned) {
            toast.warning(mealScanData.message || 'Participant already scanned for this meal')
          } else {
            toast.success(mealScanData.message || 'Meal scan successful!')
          }
          
          // Call success callback
          onScanSuccess?.(successResult)
          
          // Refresh data
          onRefreshData?.()
        } else {
          const errorResult = {
            success: false,
            qrCode: manualCode.trim(),
            error: mealScanData?.message || 'Meal scan failed',
            timestamp: new Date().toISOString()
          }
          
          setLastScanResult(errorResult)
          toast.error(mealScanData?.message || 'Meal scan failed')
          onScanError?.(mealScanData?.message || 'Meal scan failed')
        }
      } else {
        const errorMessage = validationResult?.errors?.[0] || 'Invalid QR code'
        const errorResult = {
          success: false,
          qrCode: manualCode.trim(),
          error: errorMessage,
          timestamp: new Date().toISOString()
        }
        
        // Create and record failed scan
        const failedScan = createFailedScanRecord(manualCode.trim(), errorMessage, 'Manual Entry')
        onRecordFailedScan?.(failedScan)
        
        setLastScanResult(errorResult)
        toast.error(errorMessage)
        onScanError?.(errorMessage)
      }
    } catch (error) {
      console.error('QR scan error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Scan failed'
      
      const errorResult = {
        success: false,
        qrCode: manualCode.trim(),
        error: errorMessage,
        timestamp: new Date().toISOString()
      }
      
      // Create and record failed scan
      const failedScan = createFailedScanRecord(manualCode.trim(), errorMessage, 'Manual Entry')
      onRecordFailedScan?.(failedScan)
      
      setLastScanResult(errorResult)
      toast.error(errorMessage)
      onScanError?.(errorMessage)
    } finally {
      setIsValidating(false)
      setManualCode('')
    }
  }

  // Camera functions
  const startCamera = async () => {
    console.log('Start camera button clicked!')
    
    if (!videoRef.current) {
      console.error('Video ref not available')
      toast.error('Video element not ready')
      return
    }

    try {
      setCameraError('')
      console.log('Requesting camera access...')
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser')
      }
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      console.log('Camera stream obtained:', stream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        console.log('Video started playing')
      }

      setIsScanning(true)
      toast.success('Camera started successfully!')

      // In a real implementation, you would integrate with a QR code scanning library
      // For now, we'll simulate scanning after a delay for demo purposes
      setTimeout(() => {
        console.log('Simulating QR scan...')
        const mockQRData = 'DEMO_QR_CODE_123456'
        handleCameraScan(mockQRData)
      }, 5000)

    } catch (error) {
      console.error('Error starting camera:', error)
      
      let errorMessage = 'Failed to access camera'
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access and try again.'
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please ensure your device has a camera.'
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported in this browser. Try using Chrome, Firefox, or Safari.'
        } else {
          errorMessage = `Camera error: ${error.message}`
        }
      }
      
      setCameraError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
    setCameraError('')
    toast.info('Camera stopped')
  }

  const handleCameraScan = async (qrData: string) => {
    if (allowMealSelection && !internalSelectedMeal) {
      toast.error('Please select a meal session first')
      return
    }

    setIsValidating(true)
    try {
      // First validate the QR code
      const validationResult = await validateQRCode(qrData.trim())
      
      if (validationResult?.isValid) {
        // If valid, proceed with meal scanning
        const scanResult = await scanMealQRCode({
          variables: {
            input: {
              qrCode: qrData.trim(),
              mealId: internalSelectedMeal,
              notes: 'Camera scan by staff'
            }
          }
        })
        
        const mealScanData = (scanResult.data as any)?.scanMealQRCode
        
        if (mealScanData?.success) {
          const successResult = {
            success: true,
            qrCode: qrData.trim(),
            data: {
              participantName: mealScanData.participantName,
              message: mealScanData.message,
              alreadyScanned: mealScanData.alreadyScanned
            },
            timestamp: new Date().toISOString()
          }
          
          setLastScanResult(successResult)
          
          if (mealScanData.alreadyScanned) {
            toast.warning(mealScanData.message || 'Participant already scanned for this meal')
          } else {
            toast.success(mealScanData.message || 'Camera scan successful!')
          }
          
          // Call success callback
          onScanSuccess?.(successResult)
          
          // Refresh data
          onRefreshData?.()
          
          // Stop camera after successful scan
          stopCamera()
        } else {
          const errorResult = {
            success: false,
            qrCode: qrData.trim(),
            error: mealScanData?.message || 'Camera scan failed',
            timestamp: new Date().toISOString()
          }
          
          setLastScanResult(errorResult)
          toast.error(mealScanData?.message || 'Camera scan failed')
          onScanError?.(mealScanData?.message || 'Camera scan failed')
        }
      } else {
        const errorMessage = validationResult?.errors?.[0] || 'Invalid QR code'
        const errorResult = {
          success: false,
          qrCode: qrData.trim(),
          error: errorMessage,
          timestamp: new Date().toISOString()
        }
        
        // Create and record failed scan
        const failedScan = createFailedScanRecord(qrData.trim(), errorMessage, 'Camera Scan')
        onRecordFailedScan?.(failedScan)
        
        setLastScanResult(errorResult)
        toast.error(errorMessage)
        onScanError?.(errorMessage)
      }
    } catch (error) {
      console.error('Camera scan error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Camera scan failed'
      
      const errorResult = {
        success: false,
        qrCode: qrData.trim(),
        error: errorMessage,
        timestamp: new Date().toISOString()
      }
      
      // Create and record failed scan
      const failedScan = createFailedScanRecord(qrData.trim(), errorMessage, 'Camera Scan')
      onRecordFailedScan?.(failedScan)
      
      setLastScanResult(errorResult)
      toast.error(errorMessage)
      onScanError?.(errorMessage)
    } finally {
      setIsValidating(false)
    }
  }

  const stats = {
    totalScans: scanHistory.length,
    successfulCheckins: scanHistory.filter(s => s.status === 'CHECKED_IN').length,
    warnings: scanHistory.filter(s => s.scanResult === 'warning').length,
    errors: scanHistory.filter(s => s.scanResult === 'error').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-2">{description}</p>
      </div>

      {/* Stats Cards */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <QrCode className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Scans</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalScans}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Check-ins</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.successfulCheckins}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Warnings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.warnings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Errors</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.errors}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              QR Code Scanner
            </CardTitle>
            <CardDescription>
              Scan participant QR codes or enter manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Event Selection */}
            {allowEventSelection && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Event
                </label>
                <select
                  value={internalSelectedEvent}
                  onChange={(e) => handleEventChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Events</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.name} - {new Date(event.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Meal Session Selection */}
            {allowMealSelection && internalSelectedEvent !== 'all' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Meal Session
                </label>
                <select
                  value={internalSelectedMeal}
                  onChange={(e) => handleMealChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Select a meal session...</option>
                  {mealSessions.map(meal => (
                    <option key={meal.id} value={meal.id}>
                      {meal.name} - {meal.description}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Scan Mode Toggle */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={scanMode === 'scanner' ? 'default' : 'outline'}
                onClick={() => setScanMode('scanner')}
                className="flex-1"
              >
                <Scan className="h-4 w-4 mr-2" />
                Scanner Device
              </Button>
              <Button
                variant={scanMode === 'camera' ? 'default' : 'outline'}
                onClick={() => setScanMode('camera')}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Camera
              </Button>
              <Button
                variant={scanMode === 'manual' ? 'default' : 'outline'}
                onClick={() => setScanMode('manual')}
                className="flex-1"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Manual Entry
              </Button>
            </div>

            {/* Scanner Interface */}
            {scanMode === 'scanner' ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center">
                  <Scan className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Scanner Device Ready</h3>
                  <p className="text-blue-700 mb-4">
                    Use your barcode scanner device to scan QR codes. 
                    Scanned codes will appear in the field below automatically.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-2">
                        Scanner Input (Focus here and scan)
                      </label>
                      <Input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && manualCode.trim()) {
                            handleManualScan()
                          }
                        }}
                        placeholder="QR code will appear here when scanned..."
                        className="text-lg font-mono bg-white border-2 border-blue-300 focus:border-blue-500"
                        autoFocus
                      />
                    </div>
                    <Button 
                      onClick={handleManualScan}
                      disabled={!manualCode.trim() || isValidating}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isValidating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Process Scanned Code
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                  <strong>Scanner Device Tips:</strong>
                  <ul className="mt-2 space-y-1 text-blue-700">
                    <li>• Click in the input field above to focus it</li>
                    <li>• Point your scanner at the QR code and press the trigger</li>
                    <li>• The code will appear automatically and process when you press Enter</li>
                    <li>• For best results, hold scanner 4-8 inches from the QR code</li>
                  </ul>
                </div>
              </div>
            ) : scanMode === 'camera' ? (
              <div className="space-y-4">
                <div className="relative">
                  {/* Video element - always present but hidden when not scanning */}
                  <video
                    ref={videoRef}
                    className={`w-full h-64 object-cover rounded-lg ${isScanning ? 'block' : 'hidden'}`}
                    autoPlay
                    playsInline
                    muted
                  />
                  
                  {/* Camera start interface */}
                  {!isScanning && (
                    <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">
                        {cameraError || 'Ready to start camera scanning'}
                      </p>
                      <Button 
                        onClick={startCamera}
                        disabled={isValidating}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera
                      </Button>
                      {cameraError && (
                        <p className="text-red-500 text-sm mt-2">{cameraError}</p>
                      )}
                    </div>
                  )}
                  
                  {/* Camera scanning interface */}
                  {isScanning && (
                    <>
                      {/* Scanning overlay */}
                      <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-lg"></div>
                      </div>
                      
                      {/* Processing overlay */}
                      {isValidating && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                          <div className="text-white text-center">
                            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                            <p>Processing scan...</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Stop camera button */}
                      <div className="mt-4 flex gap-2 justify-center">
                        <Button 
                          onClick={stopCamera}
                          variant="outline"
                          className="flex-1"
                        >
                          <CameraOff className="h-4 w-4 mr-2" />
                          Stop Camera
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="text-sm text-gray-500 text-center">
                  {isScanning 
                    ? 'Position the QR code within the white frame to scan'
                    : 'Click "Start Camera" to begin scanning QR codes'
                  }
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter QR Code
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="QR123456789"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                    />
                    <Button 
                      onClick={handleManualScan} 
                      disabled={!manualCode.trim() || isValidating || validateLoading || scanLoading || (allowMealSelection && !internalSelectedMeal)}
                    >
                      {(isValidating || validateLoading || scanLoading) ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Scan className="h-4 w-4 mr-2" />
                      )}
                      {(isValidating || validateLoading || scanLoading) ? 'Scanning...' : 'Scan'}
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Manually enter the QR code if camera scanning is not available.
                  {allowMealSelection && " Make sure to select an event and meal session first."}
                </div>
                
                {/* Last Scan Result */}
                {lastScanResult && (
                  <div className={`p-3 rounded-lg border ${
                    lastScanResult.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {lastScanResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`font-medium ${
                        lastScanResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {lastScanResult.success ? 'Valid QR Code' : 'Invalid QR Code'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Code: {lastScanResult.qrCode}</div>
                      {lastScanResult.success && lastScanResult.data && (
                        <div className="mt-1">
                          <div>Participant: {lastScanResult.data.participantName}</div>
                          <div>Message: {lastScanResult.data.message}</div>
                          {lastScanResult.data.alreadyScanned && (
                            <div className="text-yellow-600">⚠️ Already scanned</div>
                          )}
                        </div>
                      )}
                      {!lastScanResult.success && (
                        <div className="text-red-600 mt-1">
                          Error: {lastScanResult.error}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        Scanned: {new Date(lastScanResult.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setLastScanResult(null)
                    setManualCode('')
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Scanner
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Log
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Scans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Scans
            </CardTitle>
            <CardDescription>
              Latest QR code scan results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search scans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Scan Results */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredScans.map((scan) => (
                <div key={scan.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(scan.scanResult)}
                        <span className="font-medium text-gray-900">{scan.participantName}</span>
                        <Badge className={getStatusColor(scan.status)}>
                          {scan.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <div>{scan.email}</div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {scan.eventName}
                          </span>
                          <span className="flex items-center">
                            <QrCode className="h-3 w-3 mr-1" />
                            {scan.qrCode}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Meal: {scan.mealName} | Scanned by: {scan.scannedBy}
                          {scan.isManualOverride && <span className="text-orange-600"> (Manual Override)</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{scan.category}</div>
                      <div className="text-xs text-gray-500">{formatDate(scan.scannedAt)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredScans.length === 0 && (
              <div className="text-center py-8">
                <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No scans found</h3>
                <p className="text-gray-500">
                  {attendancesLoading ? 'Loading scan history...' :
                   searchTerm ? 'Try adjusting your search criteria' : 
                   scanHistory.length === 0 ? 'No meal scan history available. Start scanning QR codes to see results here.' :
                   'Start scanning QR codes to see results here'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      {showInstructions && (
        <Card>
          <CardHeader>
            <CardTitle>Scanner Instructions</CardTitle>
            <CardDescription>
              How to use the QR code scanner effectively
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Camera Scanning</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Ensure good lighting for clear QR code visibility
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Hold device steady and center the QR code in frame
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Wait for automatic detection and processing
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Check scan result and participant status
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Manual Entry</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Use when camera scanning is not available
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Type or paste the QR code value exactly
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Press Enter or click Scan to process
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Verify participant details before confirming
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
