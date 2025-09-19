'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  Printer, 
  Eye, 
  QrCode, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { BadgeTemplate } from './badge-template'
import { QRCodeDisplay } from '../qr/qr-code-display'
import { useCentralizedQRBadge, useRegistrationQRBadge } from '@/hooks/use-centralized-qr-badge'
import { toast } from 'sonner'

interface BadgePreviewProps {
  registrationId: string
  participantName: string
  eventName: string
  eventDate: string
  venue: string
  category: string
  registrationNumber?: string
  eventLogo?: string
  showActions?: boolean
  showQRCode?: boolean
  className?: string
}

export function CentralizedBadgePreview({
  registrationId,
  participantName,
  eventName,
  eventDate,
  venue,
  category,
  registrationNumber,
  eventLogo,
  showActions = true,
  showQRCode = true,
  className = ''
}: BadgePreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [badgeGenerated, setBadgeGenerated] = useState(false)
  
  // Use the centralized QR/badge system
  const registrationQRBadge = useRegistrationQRBadge(registrationId)

  const handleGenerateBadge = async () => {
    setIsGenerating(true)
    try {
      await registrationQRBadge.generateCompleteSet(participantName, eventName)
      setBadgeGenerated(true)
      toast.success('Badge generated and downloaded successfully!')
    } catch (error) {
      console.error('Failed to generate badge:', error)
      toast.error('Failed to generate badge')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrintBadge = async () => {
    setIsGenerating(true)
    try {
      await registrationQRBadge.printCompleteSet(participantName)
      toast.success('Badge sent to printer!')
    } catch (error) {
      console.error('Failed to print badge:', error)
      toast.error('Failed to print badge')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePreviewBadge = async () => {
    setIsGenerating(true)
    try {
      const badgeData = await registrationQRBadge.badge.generate(registrationId, 'pdf')
      if (badgeData) {
        registrationQRBadge.badge.previewBadge(badgeData, participantName)
      }
    } catch (error) {
      console.error('Failed to preview badge:', error)
      toast.error('Failed to preview badge')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerateQRCode = async () => {
    await registrationQRBadge.regenerate()
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Badge Preview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-orange-600" />
                Badge Preview
              </CardTitle>
              <CardDescription>
                Preview of the participant badge for {participantName}
              </CardDescription>
            </div>
            {badgeGenerated && (
              <Badge className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Generated
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Badge Template Preview */}
          <div className="flex justify-center">
            <div className="transform scale-75 origin-top">
              <BadgeTemplate
                participantName={participantName}
                eventName={eventName}
                eventDate={eventDate}
                venue={venue}
                category={category}
                qrCodeImage={registrationQRBadge.qrCodeImage}
                registrationNumber={registrationNumber}
                eventLogo={eventLogo}
              />
            </div>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                onClick={handleGenerateBadge}
                disabled={isGenerating || registrationQRBadge.loading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Generate & Download
              </Button>
              
              <Button
                variant="outline"
                onClick={handlePrintBadge}
                disabled={isGenerating || registrationQRBadge.loading}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4 mr-2" />
                )}
                Print Badge
              </Button>
              
              <Button
                variant="outline"
                onClick={handlePreviewBadge}
                disabled={isGenerating || registrationQRBadge.loading}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Preview PDF
              </Button>
            </div>
          )}

          {/* Badge Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Participant Details</h4>
              <div className="text-sm space-y-1">
                <p><span className="font-medium text-gray-500">Name:</span> {participantName}</p>
                <p><span className="font-medium text-gray-500">Category:</span> {category}</p>
                {registrationNumber && (
                  <p><span className="font-medium text-gray-500">Registration:</span> {registrationNumber}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Event Details</h4>
              <div className="text-sm space-y-1">
                <p><span className="font-medium text-gray-500">Event:</span> {eventName}</p>
                <p><span className="font-medium text-gray-500">Date:</span> {eventDate}</p>
                <p><span className="font-medium text-gray-500">Venue:</span> {venue}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Section */}
      {showQRCode && (
        <QRCodeDisplay
          registrationId={registrationId}
          participantName={participantName}
          qrCode={registrationQRBadge.qrCodeImage ? 'generated' : undefined}
          base64Image={registrationQRBadge.qrCodeImage}
          onGenerate={registrationQRBadge.generate}
          onRegenerate={handleRegenerateQRCode}
          loading={registrationQRBadge.loading}
          error={registrationQRBadge.error?.message}
        />
      )}

      {/* Status Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-orange-600" />
            Badge Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                registrationQRBadge.hasQRCode ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-sm">
                QR Code: {registrationQRBadge.hasQRCode ? 'Generated' : 'Not Generated'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                badgeGenerated ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              <span className="text-sm">
                Badge: {badgeGenerated ? 'Generated' : 'Not Generated'}
              </span>
            </div>
          </div>
          
          {registrationQRBadge.loading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-orange-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </div>
          )}
          
          {registrationQRBadge.error && (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {registrationQRBadge.error.message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Simplified version for quick badge actions
export function QuickBadgeActions({
  registrationId,
  participantName,
  eventName,
  className = ''
}: {
  registrationId: string
  participantName: string
  eventName: string
  className?: string
}) {
  const registrationQRBadge = useRegistrationQRBadge(registrationId)

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        size="sm"
        variant="outline"
        onClick={() => registrationQRBadge.generateAndDownloadBadge(registrationId, participantName, eventName)}
        disabled={registrationQRBadge.loading}
      >
        <Download className="h-4 w-4 mr-1" />
        Download
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={() => registrationQRBadge.generateAndPrintBadge(registrationId, participantName)}
        disabled={registrationQRBadge.loading}
      >
        <Printer className="h-4 w-4 mr-1" />
        Print
      </Button>
    </div>
  )
}
