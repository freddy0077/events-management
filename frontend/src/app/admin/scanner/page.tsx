'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatDateTime } from '@/lib/utils'
import { 
  QrCode, 
  Camera, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  User,
  Calendar,
  Utensils,
  AlertTriangle,
  Settings,
  FileText,
  Loader2,
  Scan,
  Zap,
  Shield,
  Clock,
  Target,
  BarChart3,
  Users
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { toast } from 'sonner'
import { auditLogger } from '@/lib/audit-logger'
import { useScanQrCode, useManualOverrideAttendance, useValidateQrCode } from '@/lib/graphql/hooks'
import { ManualOverrideInput } from '@/lib/graphql/types'

interface ScanResult {
  success: boolean
  participant?: {
    name: string
    email: string
    registration: {
      id: string
      event: string
      category: string
      status: string
    }
  } | null
  mealSession?: {
    id: string
    name: string
    sessionTime: string
  }
  alreadyScanned?: boolean
  error?: string
}

export default function QRScannerPage() {
  const { isAuthenticated, user } = useAuth()
  
  // GraphQL mutations for QR scanning
  const [scanQrCode, { loading: scanLoading }] = useScanQrCode()
  const [manualOverrideAttendance, { loading: overrideLoading }] = useManualOverrideAttendance()
  
  const [qrInput, setQrInput] = useState('')
  const [selectedMealId, setSelectedMealId] = useState('meal-001') // Default meal session
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanHistory, setScanHistory] = useState<Array<ScanResult & { timestamp: string, qrCode: string }>>([])
  
  // BRS Requirement: Manual Override Functionality
  const [showManualOverride, setShowManualOverride] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')
  const [isProcessingOverride, setIsProcessingOverride] = useState(false)
  
  const isLoading = scanLoading || overrideLoading

  const handleScan = async () => {
    if (!qrInput.trim()) {
      toast.error('Please enter a QR code')
      return
    }

    setIsScanning(true)
    
    try {
      // Use GraphQL mutation to scan QR code
      const result = await scanQrCode({
        variables: {
          qrCode: qrInput.trim(),
          mealId: selectedMealId
        }
      })

      const scanResponse = result.data?.scanQrCode

      if (scanResponse?.success && scanResponse.attendance) {
        const scanResult: ScanResult = {
          success: true,
          participant: {
            name: `${scanResponse.attendance.registration?.firstName} ${scanResponse.attendance.registration?.lastName}`,
            email: scanResponse.attendance.registration?.email || '',
            registration: {
              id: scanResponse.attendance.registration?.id || '',
              event: scanResponse.attendance.meal?.name || '',
              category: scanResponse.attendance.registration?.category?.name || '',
              status: 'APPROVED'
            }
          },
          mealSession: {
            id: scanResponse.attendance.meal?.id || '',
            name: scanResponse.attendance.meal?.name || '',
            sessionTime: scanResponse.attendance.meal?.sessionTime || ''
          },
          alreadyScanned: scanResponse.alreadyScanned || false
        }

        setScanResult(scanResult)

        // Add to scan history
        const historyEntry = {
          ...scanResult,
          timestamp: new Date().toISOString(),
          qrCode: qrInput
        }
        setScanHistory(prev => [historyEntry, ...prev.slice(0, 9)]) // Keep last 10 scans

        // Log audit trail
        await auditLogger.logMealScan(
          scanResponse.alreadyScanned ? 'MEAL_SCAN_DUPLICATE' : 'MEAL_SCAN_SUCCESS',
          scanResponse.attendance.registration?.id || qrInput,
          user?.email || 'admin',
          'ADMIN',
          {
            qrCode: qrInput,
            mealId: selectedMealId,
            registrationId: scanResponse.attendance.registration?.id || '',
            result: 'SUCCESS',
            participantName: `${scanResponse.attendance.registration?.firstName} ${scanResponse.attendance.registration?.lastName}`,
            mealName: scanResponse.attendance.meal?.name || scanResponse.attendance.meal?.sessionName,
            alreadyScanned: scanResponse.alreadyScanned
          }
        )

        if (scanResponse.alreadyScanned) {
          toast.warning('Participant already scanned for this meal session')
        } else {
          toast.success('Scan successful! Meal attendance recorded.')
        }
      } else {
        // Handle scan failure
        const errorResult: ScanResult = {
          success: false,
          error: scanResponse?.error || 'Invalid QR code or registration not found'
        }

        setScanResult(errorResult)

        // Add to scan history
        const historyEntry = {
          ...errorResult,
          timestamp: new Date().toISOString(),
          qrCode: qrInput
        }
        setScanHistory(prev => [historyEntry, ...prev.slice(0, 9)])

        // Log audit trail
        await auditLogger.logMealScan(
          'MEAL_SCAN_FAILED',
          qrInput,
          user?.email || 'admin',
          'ADMIN',
          {
            qrCode: qrInput,
            mealId: selectedMealId,
            result: 'FAILED',
            error: scanResponse?.error || 'Invalid QR code'
          }
        )

        toast.error(scanResponse?.error || 'Invalid QR code or registration not found')
      }
      
    } catch (error: any) {
      toast.error('Scan failed. Please try again.')
    } finally {
      setIsScanning(false)
      setQrInput('')
    }
  }

  // BRS Requirement: Manual Override for Special Cases with Reason Logging
  const handleManualOverride = async () => {
    if (!overrideReason.trim()) {
      toast.error('Please provide a reason for the manual override')
      return
    }

    if (!qrInput.trim()) {
      toast.error('Please enter the participant QR code for override')
      return
    }

    setIsProcessingOverride(true)

    try {
      // Use GraphQL mutation for manual override
      const overrideInput: ManualOverrideInput = {
        mealId: selectedMealId,
        registrationId: qrInput.trim(), // Assuming QR code contains registration ID
        overrideReason: overrideReason.trim(),
        scannedBy: user?.email || 'admin'
      }

      const result = await manualOverrideAttendance({
        variables: { input: overrideInput }
      })

      const overrideResponse = result.data?.manualOverrideAttendance

      if (overrideResponse) {
        const overrideResult: ScanResult = {
          success: true,
          participant: {
            name: `${(overrideResponse as any).registration?.firstName} ${(overrideResponse as any).registration?.lastName}`,
            email: (overrideResponse as any).registration?.email || '',
            registration: {
              id: (overrideResponse as any).registration?.id || '',
              event: overrideResponse.meal?.name || overrideResponse.meal?.sessionName || '',
              category: (overrideResponse as any).registration?.category?.name || '',
              status: 'MANUAL_OVERRIDE'
            }
          },
        mealSession: {
          id: overrideResponse.meal?.id || '',
          name: overrideResponse.meal?.name || overrideResponse.meal?.sessionName || '',
          sessionTime: overrideResponse.meal?.sessionTime || overrideResponse.meal?.sessionName || ''
        },
        alreadyScanned: false
      }

      setScanResult(overrideResult)

      // Add to scan history with override reason
      const historyEntry = {
        ...overrideResult,
        timestamp: new Date().toISOString(),
        qrCode: qrInput,
        overrideReason: overrideReason,
        overrideBy: user?.email || 'Admin'
      }
      setScanHistory(prev => [historyEntry, ...prev.slice(0, 9)])

      // Log audit trail for manual override
      await auditLogger.logMealScan(
        'MANUAL_OVERRIDE',
        (overrideResponse as any).registration?.id || qrInput,
        user?.email || 'admin',
        'ADMIN',
        {
          qrCode: qrInput,
          mealId: selectedMealId,
          registrationId: (overrideResponse as any).registration?.id || '',
          result: 'SUCCESS',
          overrideReason: overrideReason,
          overrideBy: user?.email || 'admin',
          participantName: `${(overrideResponse as any).registration?.firstName} ${(overrideResponse as any).registration?.lastName}`,
          mealName: overrideResponse.meal?.name || overrideResponse.meal?.sessionName
        }
      )

      toast.success('Manual override processed successfully')
      setShowManualOverride(false)
      setOverrideReason('')
      setQrInput('')

      } else {
        throw new Error('Failed to process manual override')
      }

    } catch (error: any) {
      console.error('Manual override error:', error)
      toast.error(error.message || 'Manual override failed. Please try again.')
    } finally {
      setIsProcessingOverride(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleScan()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-primary-50 to-neutral-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-12 space-y-4 lg:space-y-0">
          <div>
            <Button variant="outline" asChild className="mb-6 border-2 border-neutral-200 hover:border-brand-300 hover:bg-brand-50 transition-all duration-300">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-2 mb-4 animate-fade-in">
              <Scan className="h-4 w-4 text-brand-600" />
              <span className="text-sm font-medium text-brand-700">QR Scanner</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4 animate-slide-in">
              Meal Attendance
              <span className="block bg-gradient-to-r from-brand-600 to-primary-600 bg-clip-text text-transparent">
                Scanner
              </span>
            </h1>
            <p className="text-xl text-neutral-600 animate-slide-in">
              Scan participant QR codes for real-time meal attendance tracking
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-success-500 to-success-600 rounded-full animate-pulse-glow"></div>
            <span className="text-sm font-medium text-success-700">Scanner Ready</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Scanner Interface */}
          <div className="space-y-6">
            {/* QR Input */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-neutral-900 flex items-center">
                      <div className="p-2 bg-brand-50 rounded-xl mr-3">
                        <QrCode className="h-6 w-6 text-brand-600" />
                      </div>
                      QR Code Scanner
                    </CardTitle>
                    <CardDescription className="text-neutral-600 mt-2">
                      Enter QR code manually or use camera to scan participant codes
                    </CardDescription>
                  </div>
                  <div className="p-2 bg-success-50 rounded-xl">
                    <Target className="h-5 w-5 text-success-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-brand-50 to-primary-50 rounded-2xl p-6 border border-brand-100">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="qrInput" className="text-neutral-700 font-medium">QR Code Input</Label>
                      <Input
                        id="qrInput"
                        value={qrInput}
                        onChange={(e) => setQrInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter QR code or scan with camera"
                        className="font-mono border-2 border-neutral-200 focus:border-brand-400 focus:ring-brand-200 text-lg py-3"
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleScan}
                        disabled={isLoading || !qrInput.trim()}
                        className="flex-1 bg-gradient-to-r from-brand-600 to-primary-600 hover:from-brand-700 hover:to-primary-700 text-white shadow-glow hover:shadow-medium transition-all duration-300 py-3"
                        size="lg"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Scanning...
                          </>
                        ) : (
                          <>
                            <Zap className="h-5 w-5 mr-2" />
                            Scan Now
                          </>
                        )}
                      </Button>
                      
                      <Button variant="outline" disabled className="border-2 border-neutral-200 px-6">
                        <Camera className="h-5 w-5 mr-2" />
                        Camera
                      </Button>
                    </div>
                    
                    <p className="text-sm text-neutral-500 text-center">
                      Camera scanning will be available in future updates
                    </p>
                  </div>
                </div>

                {/* BRS Requirement: Manual Override Button */}
                <div className="border-t border-neutral-200 pt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowManualOverride(!showManualOverride)}
                    className="w-full border-2 border-warning-200 hover:border-warning-300 hover:bg-warning-50 text-warning-700 transition-all duration-300"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Manual Override
                  </Button>
                </div>

                {/* Manual Override Form */}
                {showManualOverride && (
                  <div className="border-t border-neutral-200 pt-6 space-y-6 animate-fade-in">
                    <div className="bg-gradient-to-r from-warning-50 to-orange-50 border-2 border-warning-200 rounded-xl p-4">
                      <div className="flex items-center mb-2">
                        <div className="p-1 bg-warning-100 rounded-lg mr-3">
                          <AlertTriangle className="h-4 w-4 text-warning-600" />
                        </div>
                        <span className="text-sm font-semibold text-warning-800">Manual Override Mode</span>
                      </div>
                      <p className="text-sm text-warning-700">
                        Use this for special cases only. All overrides are logged with reason and require admin approval.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="overrideReason" className="text-neutral-700 font-medium">Override Reason *</Label>
                      <Input
                        id="overrideReason"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="e.g., QR code damaged, technical issue, special accommodation"
                        className="border-2 border-neutral-200 focus:border-warning-400 focus:ring-warning-200"
                        required
                      />
                      <p className="text-sm text-neutral-500">
                        Provide a detailed reason for this manual override
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        onClick={handleManualOverride}
                        disabled={isProcessingOverride || !overrideReason.trim() || !qrInput.trim()}
                        className="flex-1 bg-gradient-to-r from-warning-600 to-orange-600 hover:from-warning-700 hover:to-orange-700 text-white shadow-glow transition-all duration-300"
                        size="lg"
                      >
                        {isProcessingOverride ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <FileText className="h-5 w-5 mr-2" />
                            Process Override
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowManualOverride(false)
                          setOverrideReason('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scan Result */}
            {scanResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {scanResult.success ? (
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 mr-2 text-red-600" />
                    )}
                    Scan Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {scanResult.success && scanResult.participant ? (
                    <div className="space-y-4">
                      {scanResult.alreadyScanned && (
                        <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                          <span className="text-sm text-yellow-800">
                            Already scanned for this meal session
                          </span>
                        </div>
                      )}
                      
                      <div className="grid gap-3">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-500" />
                          <div>
                            <p className="font-medium">{scanResult.participant.name}</p>
                            <p className="text-sm text-gray-600">{scanResult.participant.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <div>
                            <p className="font-medium">{scanResult.participant.registration.event}</p>
                            <p className="text-sm text-gray-600">
                              {scanResult.participant.registration.category} - {scanResult.participant.registration.id}
                            </p>
                          </div>
                        </div>
                        
                        {scanResult.mealSession && (
                          <div className="flex items-center">
                            <Utensils className="h-4 w-4 mr-2 text-gray-500" />
                            <div>
                              <p className="font-medium">{scanResult.mealSession.name}</p>
                              <p className="text-sm text-gray-600">
                                {formatDateTime(scanResult.mealSession.sessionTime)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Badge 
                        variant={scanResult.alreadyScanned ? "secondary" : "default"}
                        className="w-fit"
                      >
                        {scanResult.alreadyScanned ? 'Already Attended' : 'Attendance Recorded'}
                      </Badge>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                      <p className="font-medium text-red-700">Scan Failed</p>
                      <p className="text-sm text-red-600">{scanResult.error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Scan History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Scans</CardTitle>
              <CardDescription>
                History of recent QR code scans
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scanHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <QrCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No scans yet</p>
                  <p className="text-sm">Scan history will appear here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {scanHistory.map((scan, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        {scan.success && scan.participant ? (
                          <div>
                            <p className="font-medium text-sm">{scan.participant.name}</p>
                            <p className="text-xs text-gray-600">{scan.participant.registration.event}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium text-sm text-red-600">Scan Failed</p>
                            <p className="text-xs text-gray-600">{scan.qrCode}</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDateTime(scan.timestamp)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {scan.success ? (
                          scan.alreadyScanned ? (
                            <Badge variant="secondary" className="text-xs">Duplicate</Badge>
                          ) : (
                            <Badge variant="default" className="text-xs">Success</Badge>
                          )
                        ) : (
                          <Badge variant="destructive" className="text-xs">Failed</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Scanner Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium mb-2">How to Use:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>1. Ask participant to show their QR code</li>
                  <li>2. Enter the QR code in the input field</li>
                  <li>3. Press Enter or click "Scan QR Code"</li>
                  <li>4. Verify participant information</li>
                  <li>5. Confirm meal attendance is recorded</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Troubleshooting:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Ensure QR code is valid and readable</li>
                  <li>• Check participant registration status</li>
                  <li>• Verify payment has been completed</li>
                  <li>• Contact support for technical issues</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
