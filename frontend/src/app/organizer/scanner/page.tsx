'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  QrCode,
  Camera,
  Search,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Clock,
  Scan
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { useMyAssignedEvents } from '@/lib/graphql/hooks'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { useCentralizedQRBadge } from '@/hooks/use-centralized-qr-badge'
import { QRCodeUtils } from '@/lib/utils/qr-badge-utils'

export default function OrganizerScannerPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const preselectedEventId = searchParams.get('eventId')
  
  const [selectedEvent, setSelectedEvent] = useState<string>(preselectedEventId || '')
  const [manualCode, setManualCode] = useState('')
  const [scannerActive, setScannerActive] = useState(false)
  const [recentScans, setRecentScans] = useState<any[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [lastScanResult, setLastScanResult] = useState<any>(null)
  
  // Use centralized QR validation system
  const centralizedQR = useCentralizedQRBadge()
  
  // Fetch assigned events
  const { data, loading, error } = useMyAssignedEvents()
  const events = (data as any)?.myAssignedEvents || []

  const selectedEventData = events.find((event: any) => event.id === selectedEvent)

  const handleManualScan = async () => {
    if (!manualCode.trim()) {
      toast.error('Please enter a QR code')
      return
    }

    if (!selectedEvent) {
      toast.error('Please select an event first')
      return
    }

    setIsValidating(true)
    try {
      // Use centralized QR validation
      const validationResult = await centralizedQR.qrCode.validate(manualCode.trim())
      
      if (validationResult) {
        // Create scan record
        const scanRecord = {
          id: Date.now().toString(),
          participantName: validationResult.participantName,
          participantEmail: (validationResult as any).participantEmail || 'N/A',
          qrCode: manualCode.trim(),
          eventId: (validationResult as any).eventId,
          category: validationResult.category,
          status: 'success',
          timestamp: new Date()
        }
        
        setRecentScans(prev => [scanRecord, ...prev.slice(0, 9)]) // Keep last 10 scans
        setLastScanResult({
          success: true,
          data: validationResult,
          timestamp: new Date().toISOString()
        })
        
        toast.success(`Successfully checked in ${validationResult.participantName}`)
      } else {
        const failedScan = {
          id: Date.now().toString(),
          participantName: 'Unknown',
          participantEmail: 'N/A',
          qrCode: manualCode.trim(),
          eventId: selectedEvent,
          category: 'N/A',
          status: 'failed',
          timestamp: new Date()
        }
        
        setRecentScans(prev => [failedScan, ...prev.slice(0, 9)])
        setLastScanResult({
          success: false,
          error: 'Invalid QR code',
          timestamp: new Date().toISOString()
        })
        
        toast.error('Invalid QR code')
      }
      
      setManualCode('')
    } catch (error) {
      console.error('QR validation error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Validation failed'
      
      const failedScan = {
        id: Date.now().toString(),
        participantName: 'Error',
        participantEmail: 'N/A',
        qrCode: manualCode.trim(),
        eventId: selectedEvent,
        category: 'N/A',
        status: 'failed',
        timestamp: new Date()
      }
      
      setRecentScans(prev => [failedScan, ...prev.slice(0, 9)])
      setLastScanResult({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      })
      
      toast.error(`Failed to process QR code: ${errorMessage}`)
      setManualCode('')
    } finally {
      setIsValidating(false)
    }
  }

  const startCamera = () => {
    if (!selectedEvent) {
      toast.error('Please select an event first')
      return
    }
    setScannerActive(true)
    toast.info('Camera scanner activated - functionality will be implemented with camera integration')
  }

  const stopCamera = () => {
    setScannerActive(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          <span className="text-gray-600">Loading events...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">QR Code Scanner</h1>
          <p className="text-gray-600 mt-1">
            Scan participant QR codes for event check-in
          </p>
        </div>
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          Event Organizer
        </Badge>
      </div>

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Select Event
          </CardTitle>
          <CardDescription>
            Choose an event to scan QR codes for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an event for QR scanning" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event: any) => (
                <SelectItem key={event.id} value={event.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{event.name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {event.date && format(new Date(event.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedEventData && (
        <>
          {/* Event Info */}
          <Card>
            <CardHeader>
              <CardTitle>{selectedEventData.name}</CardTitle>
              <CardDescription>
                {selectedEventData.date && format(new Date(selectedEventData.date), 'PPPP')} • {selectedEventData.venue}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedEventData.registrations?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Registrations</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {selectedEventData.registrations?.filter((r: any) => r.checkedIn).length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Checked In</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {recentScans.length}
                  </p>
                  <p className="text-sm text-gray-600">Scanned Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scanner Options */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Camera Scanner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2 text-green-600" />
                  Camera Scanner
                </CardTitle>
                <CardDescription>
                  Use your device camera to scan QR codes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  {scannerActive ? (
                    <div className="text-center">
                      <Camera className="h-12 w-12 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Camera Active</p>
                      <p className="text-xs text-gray-500">Point camera at QR code</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Camera Inactive</p>
                      <p className="text-xs text-gray-500">Click start to begin scanning</p>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  {!scannerActive ? (
                    <Button onClick={startCamera} className="flex-1 bg-green-600 hover:bg-green-700">
                      <Camera className="h-4 w-4 mr-2" />
                      Start Camera
                    </Button>
                  ) : (
                    <Button onClick={stopCamera} variant="outline" className="flex-1">
                      <Camera className="h-4 w-4 mr-2" />
                      Stop Camera
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Manual Entry */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Scan className="h-5 w-5 mr-2 text-blue-600" />
                  Manual Entry
                </CardTitle>
                <CardDescription>
                  Manually enter QR code for scanning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    QR Code
                  </label>
                  <Input
                    placeholder="Enter QR code manually..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                  />
                </div>
                
                <Button 
                  onClick={handleManualScan}
                  disabled={!manualCode.trim() || isValidating}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isValidating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  {isValidating ? 'Processing...' : 'Process QR Code'}
                </Button>

                <div className="text-xs text-gray-500 text-center">
                  Tip: You can also paste QR codes here
                </div>
                
                {/* Last Scan Result */}
                {lastScanResult && (
                  <div className={`p-3 rounded-lg border mt-4 ${
                    lastScanResult.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {lastScanResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`font-medium text-sm ${
                        lastScanResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {lastScanResult.success ? 'Valid QR Code' : 'Invalid QR Code'}
                      </span>
                    </div>
                    {lastScanResult.success && lastScanResult.data && (
                      <div className="text-sm text-gray-600">
                        <div>Participant: {lastScanResult.data.participantName}</div>
                        <div>Event: {lastScanResult.data.eventId}</div>
                        <div>Category: {lastScanResult.data.category}</div>
                      </div>
                    )}
                    {!lastScanResult.success && (
                      <div className="text-sm text-red-600">
                        Error: {lastScanResult.error}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Scanned: {new Date(lastScanResult.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Scans */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Recent Scans
                </span>
                <Badge variant="secondary">
                  {recentScans.length} scan{recentScans.length !== 1 ? 's' : ''} today
                </Badge>
              </CardTitle>
              <CardDescription>
                QR codes scanned in this session
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentScans.length === 0 ? (
                <div className="text-center py-8">
                  <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Scans Yet</h3>
                  <p className="text-gray-600">
                    Start scanning QR codes to see check-in activity here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentScans.map((scan) => (
                    <div key={scan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          scan.status === 'success' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {scan.status === 'success' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {scan.participantName}
                          </h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            <span>{scan.participantEmail}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(scan.timestamp, 'HH:mm:ss')}
                        </div>
                        <Badge 
                          variant={scan.status === 'success' ? 'default' : 'destructive'}
                          className={scan.status === 'success' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {scan.status === 'success' ? 'Checked In' : 'Failed'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Scanner Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">QR Code Scanning Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Camera className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Camera Scanning</h4>
                <p className="text-sm text-gray-600">
                  Use the camera scanner for quick and easy QR code detection. Ensure good lighting for best results.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Scan className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Manual Entry</h4>
                <p className="text-sm text-gray-600">
                  If camera scanning isn't available, manually enter or paste QR codes for processing.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Check-in Process</h4>
                <p className="text-sm text-gray-600">
                  Successfully scanned QR codes automatically check participants into the selected event.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Real-time Updates</h4>
                <p className="text-sm text-gray-600">
                  Scan results are processed immediately and reflected in attendance reports.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
