'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  QrCode,
  Camera,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Loader2,
  AlertCircle,
  Printer
} from 'lucide-react'
import { useQuery, useLazyQuery, useMutation } from '@apollo/client/react'
import { GET_MY_ASSIGNED_EVENTS } from '@/lib/graphql/queries'
import { GENERATE_BADGE } from '@/lib/graphql/mutations/qr-mutations'
import { gql } from '@apollo/client'
import { toast } from 'sonner'

const GET_REGISTRATION_BY_QR = gql`
  query GetRegistrationByQR($qrCode: String!) {
    registrationByQRCode(qrCode: $qrCode) {
      id
      firstName
      lastName
      email
      qrCode
      badgePrinted
      badgePrintedAt
      badgePrintCount
      checkedIn
      checkedInAt
      paymentStatus
      category {
        id
        name
      }
      event {
        id
        name
      }
    }
  }
`

export default function PrinterScannerPage() {
  const [selectedEvent, setSelectedEvent] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [lastScan, setLastScan] = useState<any>(null)
  const [scanHistory, setScanHistory] = useState<any[]>([])

  const { data: eventsData, loading: eventsLoading } = useQuery(GET_MY_ASSIGNED_EVENTS)
  const events = (eventsData as any)?.myAssignedEvents || []

  const [getRegistrationByQR, { loading: scanning }] = useLazyQuery(GET_REGISTRATION_BY_QR, {
    onCompleted: (data) => {
      const registration = data.registrationByQRCode
      const result = {
        success: true,
        participant: {
          id: registration.id,
          firstName: registration.firstName,
          lastName: registration.lastName,
          email: registration.email,
          category: registration.category?.name,
          registrationId: registration.id,
          qrCode: registration.qrCode,
          paymentStatus: registration.paymentStatus,
          checkedIn: registration.checkedIn,
          badgePrinted: registration.badgePrinted,
          badgePrintCount: registration.badgePrintCount
        },
        timestamp: new Date().toISOString()
      }
      
      setLastScan(result)
      setScanHistory([result, ...scanHistory])
      toast.success('Badge verified successfully!')
      setManualCode('')
    },
    onError: (error) => {
      const errorResult = {
        success: false,
        error: error.message || 'Invalid QR code',
        timestamp: new Date().toISOString()
      }
      setLastScan(errorResult)
      setScanHistory([errorResult, ...scanHistory])
      toast.error('Invalid QR code or registration not found')
    }
  })

  const [generateBadge, { loading: printingBadge }] = useMutation(GENERATE_BADGE)

  const handleManualScan = async () => {
    if (!manualCode.trim()) {
      toast.error('Please enter a QR code or registration ID')
      return
    }

    if (!selectedEvent) {
      toast.error('Please select an event first')
      return
    }

    getRegistrationByQR({
      variables: { qrCode: manualCode }
    })
  }

  const handlePrintBadge = async (registrationId: string) => {
    try {
      const result = await generateBadge({
        variables: { registrationId, format: 'pdf' }
      })
      
      // Download the badge PDF
      const base64Data = result.data.generateBadge
      const link = document.createElement('a')
      link.href = `data:application/pdf;base64,${base64Data}`
      link.download = `badge-${registrationId}.pdf`
      link.click()
      
      toast.success('Badge printed successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to print badge')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">QR Code Scanner</h1>
          <p className="text-gray-600 mt-1">
            Scan badges to verify participants and print if needed
          </p>
        </div>
        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
          <QrCode className="h-4 w-4 mr-1" />
          Scanner
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
            Choose an event to scan badges for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {eventsLoading ? (
                <div className="p-2 text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                </div>
              ) : events.length === 0 ? (
                <div className="p-2 text-center text-gray-500">
                  No events assigned
                </div>
              ) : (
                events.map((event: any) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedEvent && (
        <>
          {/* Scanner */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Camera Scanner */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2 text-purple-600" />
                  Camera Scanner
                </CardTitle>
                <CardDescription>
                  Use your device camera to scan QR codes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center text-gray-500">
                    <Camera className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p>Camera scanner</p>
                    <p className="text-sm mt-2">Click to activate camera</p>
                  </div>
                </div>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera Scanner
                </Button>
              </CardContent>
            </Card>

            {/* Manual Entry */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="h-5 w-5 mr-2 text-amber-600" />
                  Manual Entry
                </CardTitle>
                <CardDescription>
                  Enter QR code or registration ID manually
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    QR Code / Registration ID
                  </label>
                  <Input
                    placeholder="Enter code or ID..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                    className="text-lg"
                  />
                </div>
                <Button 
                  onClick={handleManualScan}
                  disabled={scanning || !manualCode.trim()}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Verify Badge
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Last Scan Result */}
          {lastScan && (
            <Card className={lastScan.success ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {lastScan.success ? (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                      <span className="text-green-900">Valid Badge</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 mr-2 text-red-600" />
                      <span className="text-red-900">Invalid Badge</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lastScan.success ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Participant</label>
                        <p className="text-lg font-semibold text-gray-900">
                          {lastScan.participant.firstName} {lastScan.participant.lastName}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Category</label>
                        <p className="text-lg font-semibold text-gray-900">
                          {lastScan.participant.category}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Registration ID</label>
                        <p className="text-lg font-semibold text-gray-900">
                          {lastScan.participant.registrationId}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Badge Status</label>
                        <p className="text-lg font-semibold text-gray-900">
                          {lastScan.participant.badgePrinted ? 'Printed' : 'Not Printed'}
                        </p>
                      </div>
                    </div>
                    {!lastScan.participant.badgePrinted && (
                      <Button 
                        onClick={() => handlePrintBadge(lastScan.participant.id)}
                        disabled={printingBadge}
                        className="w-full bg-amber-600 hover:bg-amber-700"
                      >
                        {printingBadge ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Printer className="h-4 w-4 mr-2" />
                        )}
                        Print Badge Now
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-red-900">
                    <p className="font-semibold">{lastScan.error}</p>
                    <p className="text-sm mt-2">Please check the QR code and try again</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Scan History */}
          <Card>
            <CardHeader>
              <CardTitle>Scan History</CardTitle>
              <CardDescription>
                Recent badge scans for this session
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scanHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <QrCode className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No scans yet</p>
                  <p className="text-sm mt-2">Scan history will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scanHistory.map((scan, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        scan.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {scan.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          {scan.success ? (
                            <>
                              <p className="font-semibold text-gray-900">
                                {scan.participant.firstName} {scan.participant.lastName}
                              </p>
                              <p className="text-sm text-gray-600">
                                {scan.participant.registrationId} • {scan.participant.category}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-red-900">Scan Failed</p>
                              <p className="text-sm text-red-700">{scan.error}</p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(scan.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
