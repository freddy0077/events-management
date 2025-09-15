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

  // Use provided participant data - no fallback data in production
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
      
      setPrintStatus('success')
      toast.success(`Sticker printed successfully for ${currentParticipant.firstName} ${currentParticipant.lastName}!`)
      
      if (onPrintComplete) {
        onPrintComplete()
      }
    } catch (error) {
      setPrintStatus('error')
      toast.error('Failed to print sticker. Please try again.')
    } finally {
      setIsPrinting(false)
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'declined': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!currentParticipant) return null;

  return (
    <div className="space-y-6">
      {/* Participant Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Participant Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{currentParticipant.firstName} {currentParticipant.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{currentParticipant.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <p className="font-medium">{currentParticipant.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Status</p>
              <Badge className={getPaymentStatusColor(currentParticipant.paymentStatus)}>
                {currentParticipant.paymentStatus.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sticker Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
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
              <div className="py-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentParticipant.firstName} {currentParticipant.lastName}
                </h2>
                <p className="text-lg text-gray-600 mt-1">{currentParticipant.category}</p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="w-24 h-24 bg-black flex items-center justify-center text-white text-xs font-mono">
                    {currentParticipant.qrCode}
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                QR Code: {currentParticipant.qrCode}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Printer className="h-5 w-5 mr-2" />
            Print Sticker
          </CardTitle>
          <CardDescription>
            Print the name tag sticker with QR code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handlePrintSticker}
            disabled={currentParticipant.paymentStatus !== 'approved' || isPrinting}
            className="w-full"
            size="lg"
          >
            {isPrinting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Printing Sticker...
              </>
            ) : (
              <>
                <Printer className="h-4 w-4 mr-2" />
                Print Sticker
              </>
            )}
          </Button>

          {/* Payment Status Warning */}
          {currentParticipant.paymentStatus !== 'approved' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Payment Required</p>
                  <p className="mt-1">
                    Payment must be approved before printing stickers for {currentParticipant.firstName} {currentParticipant.lastName}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Print Status */}
          {printStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <p className="text-sm text-green-800 font-medium">
                  Sticker printed successfully!
                </p>
              </div>
            </div>
          )}

          {printStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                <p className="text-sm text-red-800 font-medium">
                  Printing failed. Please try again.
                </p>
              </div>
            </div>
          )}

          {/* Printing Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800">
              <p className="font-medium">Printing Instructions:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Ensure sticker paper is loaded in the printer</li>
                <li>Verify participant payment is approved</li>
                <li>QR code will be generated automatically</li>
                <li>Print one sticker per participant</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
