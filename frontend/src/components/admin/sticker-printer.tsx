'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Printer, QrCode, User, Calendar, MapPin, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Participant {
  id: string
  firstName: string
  lastName: string
  email: string
  eventName: string
  eventDate: string
  eventVenue: string
  category: string
  qrCode: string
  paymentStatus: 'approved' | 'pending' | 'declined'
}

interface StickerPrinterProps {
  eventId?: string
  participant?: Participant
  onPrintComplete?: () => void
}

export default function StickerPrinter({ eventId, participant, onPrintComplete }: StickerPrinterProps) {
  const [isPrinting, setIsPrinting] = useState(false)
  const [printStatus, setPrintStatus] = useState<'idle' | 'printing' | 'success' | 'error'>('idle')
  const currentParticipant = participant

  // Guard against undefined participant
  if (!currentParticipant) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>No Participant Selected</CardTitle>
          <CardDescription>Please select a participant to print stickers.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // BRS Requirement: Print QR code and Name directly onto a sticker
  const handlePrintSticker = async () => {
    if (currentParticipant.paymentStatus !== 'approved') {
      toast.error('Cannot print sticker. Payment must be approved first.')
      return
    }

    setIsPrinting(true)
    setPrintStatus('printing')

    try {
      // Simulate printer API call
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Mock printing process
      console.log('Printing sticker for:', {
        name: `${currentParticipant.firstName} ${currentParticipant.lastName}`,
        qrCode: currentParticipant.qrCode,
        event: currentParticipant.eventName,
        category: currentParticipant.category
      })

      setPrintStatus('success')
      toast.success('Sticker printed successfully!')
      
      // Call completion callback
      onPrintComplete?.()
      
    } catch (error) {
      setPrintStatus('error')
      toast.error('Failed to print sticker. Please try again.')
    } finally {
      setIsPrinting(false)
    }
  }

  const generateMockQRCode = (data: string) => {
    // In real implementation, this would generate actual QR code
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
        <rect width="120" height="120" fill="white"/>
        <rect x="10" y="10" width="100" height="100" fill="black"/>
        <rect x="20" y="20" width="80" height="80" fill="white"/>
        <text x="60" y="65" text-anchor="middle" font-size="8" fill="black">QR</text>
      </svg>
    `)}`
  }

  if (!currentParticipant) return null;

  return (
    <div className="space-y-6">
      {/* Sticker Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Printer className="h-5 w-5 mr-2" />
            Sticker Preview
          </CardTitle>
          <CardDescription>
            Preview of the name tag sticker that will be printed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Sticker Design Preview */}
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 max-w-md mx-auto">
            <div className="text-center space-y-4">
              {/* Event Header */}
              <div className="border-b pb-3">
                <h3 className="font-bold text-lg text-gray-800">{currentParticipant.eventName}</h3>
                <div className="flex items-center justify-center text-sm text-gray-600 mt-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(currentParticipant.eventDate).toLocaleDateString()}
                </div>
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  {currentParticipant.eventVenue}
                </div>
              </div>

              {/* Participant Name */}
              <div className="py-2">
                <div className="flex items-center justify-center mb-2">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">PARTICIPANT</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {currentParticipant.firstName} {currentParticipant.lastName}
                </h2>
                <Badge variant="secondary" className="mt-2">
                  {currentParticipant.category}
                </Badge>
              </div>

              {/* QR Code */}
              <div className="border-t pt-3">
                <div className="flex items-center justify-center mb-2">
                  <QrCode className="h-4 w-4 mr-1 text-gray-600" />
                  <span className="text-xs text-gray-600">SCAN FOR MEALS</span>
                </div>
                <div className="flex justify-center">
                  <img 
                    src={generateMockQRCode(currentParticipant.qrCode)} 
                    alt="QR Code"
                    className="w-24 h-24 border border-gray-200"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">ID: {currentParticipant.qrCode}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Print Controls</CardTitle>
          <CardDescription>
            Print the name tag sticker for this participant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Status Check */}
          <div className={`p-3 rounded-lg border ${
            currentParticipant.paymentStatus === 'approved' 
              ? 'bg-green-50 border-green-200 text-green-800'
              : currentParticipant.paymentStatus === 'pending'
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {currentParticipant.paymentStatus === 'approved' ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              <div>
                <p className="font-medium">
                  Payment Status: {currentParticipant.paymentStatus.charAt(0).toUpperCase() + currentParticipant.paymentStatus.slice(1)}
                </p>
                <p className="text-sm">
                  {currentParticipant.paymentStatus === 'approved' 
                    ? 'Ready to print sticker'
                    : currentParticipant.paymentStatus === 'pending'
                    ? 'Waiting for payment approval'
                    : 'Payment declined - cannot print'}
                </p>
              </div>
            </div>
          </div>

          {/* Print Button */}
          <Button 
            onClick={handlePrintSticker}
            disabled={isPrinting || currentParticipant.paymentStatus !== 'approved'}
            className="w-full"
            size="lg"
          >
            {isPrinting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Printing Sticker...
              </>
            ) : (
              <>
                <Printer className="h-5 w-5 mr-2" />
                Print Name Tag Sticker
              </>
            )}
          </Button>

          {/* Print Status */}
          {printStatus !== 'idle' && (
            <div className={`p-3 rounded-lg border ${
              printStatus === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800'
                : printStatus === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              <div className="flex items-center">
                {printStatus === 'success' ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : printStatus === 'error' ? (
                  <AlertCircle className="h-5 w-5 mr-2" />
                ) : (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                )}
                <div>
                  <p className="font-medium">
                    {printStatus === 'success' ? 'Print Successful' 
                     : printStatus === 'error' ? 'Print Failed'
                     : 'Printing...'}
                  </p>
                  <p className="text-sm">
                    {printStatus === 'success' ? 'Sticker has been printed and is ready to be issued to participant'
                     : printStatus === 'error' ? 'There was an error printing the sticker. Please try again.'
                     : 'Please wait while the sticker is being printed...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Printing Instructions:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Ensure sticker paper is loaded in the printer</li>
              <li>• Verify participant payment is approved</li>
              <li>• Print one sticker per participant</li>
              <li>• Issue sticker immediately to participant</li>
              <li>• Keep backup of QR code data for troubleshooting</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
