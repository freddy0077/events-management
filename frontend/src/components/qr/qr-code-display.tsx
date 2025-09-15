'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  QrCode, 
  Download, 
  RefreshCw, 
  Copy, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Printer
} from 'lucide-react'
import { toast } from 'sonner'
import { QRCodeUtils } from '@/lib/utils/qr-badge-utils'

interface QRCodeData {
  registrationId: string
  eventId: string
  participantName: string
  category: string
  timestamp: string
  checksum: string
}

interface QRCodeDisplayProps {
  registrationId: string
  participantName?: string
  qrCode?: string
  qrCodeData?: QRCodeData
  base64Image?: string
  onGenerate?: () => void
  onRegenerate?: () => void
  loading?: boolean
  error?: string
}

export function QRCodeDisplay({
  registrationId,
  participantName,
  qrCode,
  qrCodeData,
  base64Image,
  onGenerate,
  onRegenerate,
  loading = false,
  error
}: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyQRCode = async () => {
    if (qrCode) {
      try {
        await navigator.clipboard.writeText(qrCode)
        setCopied(true)
        toast.success('QR code copied to clipboard')
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        toast.error('Failed to copy QR code')
      }
    }
  }

  const handleDownloadQRCode = () => {
    if (base64Image) {
      const filename = `qr_code_${participantName?.replace(/[^a-zA-Z0-9]/g, '_') || registrationId}.png`
      QRCodeUtils.downloadQRCode(base64Image, filename)
    }
  }

  const handleCopyQRCodeImage = async () => {
    if (base64Image) {
      await QRCodeUtils.copyQRCodeToClipboard(base64Image)
    }
  }

  const handlePrintQRCode = () => {
    if (base64Image) {
      QRCodeUtils.printQRCode(base64Image, participantName || 'Participant')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-orange-600" />
            QR Code
          </CardTitle>
          <CardDescription>
            Generating QR code for registration
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
            <p className="text-gray-600">Generating QR code...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            QR Code Error
          </CardTitle>
          <CardDescription>
            Failed to generate QR code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <p className="text-red-600 mb-4">{error}</p>
            {onGenerate && (
              <Button onClick={onGenerate} className="bg-orange-600 hover:bg-orange-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!qrCode && !base64Image) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-orange-600" />
            QR Code
          </CardTitle>
          <CardDescription>
            Generate QR code for this registration
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="space-y-4">
            <QrCode className="h-16 w-16 text-gray-300 mx-auto" />
            <p className="text-gray-600">No QR code generated yet</p>
            {onGenerate && (
              <Button onClick={onGenerate} className="bg-orange-600 hover:bg-orange-700">
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR Code
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-orange-600" />
              QR Code
            </CardTitle>
            <CardDescription>
              Registration QR code for scanning
            </CardDescription>
          </div>
          <Badge className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Generated
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code Image */}
        {base64Image && (
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
              <img 
                src={base64Image} 
                alt="QR Code" 
                className="w-48 h-48 object-contain"
              />
            </div>
          </div>
        )}

        {/* QR Code Data */}
        {qrCodeData && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">QR Code Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-500">Participant:</span>
                <p className="text-gray-900">{qrCodeData.participantName}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Category:</span>
                <p className="text-gray-900">{qrCodeData.category}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Generated:</span>
                <p className="text-gray-900">
                  {new Date(qrCodeData.timestamp).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Checksum:</span>
                <p className="text-gray-900 font-mono text-xs">
                  {qrCodeData.checksum}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* QR Code String */}
        {qrCode && (
          <div className="space-y-2">
            <span className="font-medium text-gray-500 text-sm">QR Code Data:</span>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs font-mono text-gray-700 break-all">
                {qrCode}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {qrCode && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyQRCode}
              className="flex items-center justify-center"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copied ? 'Copied!' : 'Copy Code'}
            </Button>
          )}
          
          {base64Image && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadQRCode}
                className="flex items-center justify-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyQRCodeImage}
                className="flex items-center justify-center"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Image
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintQRCode}
                className="flex items-center justify-center"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </>
          )}
          
          {onRegenerate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              className="flex items-center justify-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
