'use client'

import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { BadgeTemplate } from './badge-template'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Printer, 
  Download, 
  Eye, 
  Award,
  Loader2,
  CheckCircle,
  AlertCircle 
} from 'lucide-react'
import { toast } from 'sonner'

interface BadgePreviewProps {
  participantName: string
  eventName: string
  eventDate: string
  venue: string
  category: string
  categoryColor?: string
  qrCodeImage?: string
  registrationNumber?: string
  eventLogo?: string
  loading?: boolean
  error?: string
  onPrint?: () => void
}

export function BadgePreview({
  participantName,
  eventName,
  eventDate,
  venue,
  category,
  categoryColor = '#ea580c',
  qrCodeImage,
  registrationNumber,
  eventLogo,
  loading = false,
  error,
  onPrint
}: BadgePreviewProps) {
  const badgeRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: badgeRef,
    documentTitle: `Badge-${participantName.replace(/\s+/g, '-')}-${registrationNumber || 'Unknown'}`,
    onBeforePrint: () => {
      // Log print action for audit
      console.log('Badge print initiated:', {
        participantName,
        registrationNumber,
        eventName,
        timestamp: new Date().toISOString()
      })
      return Promise.resolve()
    },
    onAfterPrint: () => {
      toast.success('Badge printed successfully!')
      onPrint?.()
    },
    onPrintError: (errorLocation, error) => {
      console.error('Print error:', errorLocation, error)
      toast.error('Failed to print badge. Please try again.')
    },
    pageStyle: `
      @page {
        size: 3.94in 5.35in; /* A6 format: 100mm x 135mm */
        margin: 0.2in;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
      }
    `
  })

  const handleDownloadPDF = async () => {
    try {
      // Dynamic import to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      if (!badgeRef.current) return

      const canvas = await html2canvas(badgeRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [3.94, 5.35] // A6 format: 100mm x 135mm
      })

      pdf.addImage(imgData, 'PNG', 0.2, 0.2, 3.54, 4.95) // A6 dimensions with margins
      pdf.save(`badge-${participantName.replace(/\s+/g, '-')}-${registrationNumber || 'unknown'}.pdf`)
      
      toast.success('Badge PDF downloaded successfully!')
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to generate PDF. Please try again.')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-orange-600" />
            Badge Preview
          </CardTitle>
          <CardDescription>
            Generating badge preview...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading badge preview...</p>
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
            Badge Preview Error
          </CardTitle>
          <CardDescription>
            Failed to generate badge preview
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
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
              <Award className="h-5 w-5 text-orange-600" />
              Badge Preview
            </CardTitle>
            <CardDescription>
              Preview and print participant badge
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {qrCodeImage ? (
              <Badge className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ready to Print
              </Badge>
            ) : (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                <Eye className="h-3 w-3 mr-1" />
                Preview Only
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Badge Preview */}
        <div className="flex justify-center">
          <div className="transform scale-75 origin-top">
            <BadgeTemplate
              ref={badgeRef}
              participantName={participantName}
              eventName={eventName}
              eventDate={eventDate}
              venue={venue}
              category={category}
              categoryColor={categoryColor}
              qrCodeImage={qrCodeImage}
              registrationNumber={registrationNumber}
              eventLogo={eventLogo}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            onClick={handlePrint}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Badge
          </Button>
          
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>

        {!qrCodeImage && (
          <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Badge will print with QR code placeholder. Generate QR code for full functionality.
            </p>
          </div>
        )}

        {/* Print Instructions */}
        <div className="text-center space-y-2 text-sm text-gray-600">
          <p className="font-medium">Print Instructions:</p>
          <ul className="text-left space-y-1 max-w-md mx-auto">
            <li>• Use high-quality cardstock (200-300 GSM)</li>
            <li>• Print in color for best results</li>
            <li>• Ensure printer is set to actual size (100%)</li>
            <li>• Badge size: 4" × 6" with 0.25" margins</li>
            <li>• Consider laminating for durability</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
