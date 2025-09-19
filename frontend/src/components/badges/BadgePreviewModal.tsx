'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ProfessionalBadgeDesign, BadgeData } from './ProfessionalBadgeDesign'
import { Download, Printer, X } from 'lucide-react'
import { toast } from 'sonner'

interface BadgePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  badgeData: BadgeData | null
  variant?: 'standard'
  onPrint?: () => void
  onDownload?: () => void
}

export const BadgePreviewModal: React.FC<BadgePreviewModalProps> = ({
  isOpen,
  onClose,
  badgeData,
  variant = 'standard',
  onPrint,
  onDownload
}) => {
  if (!badgeData) return null

  const handlePrint = () => {
    try {
      window.print()
      toast.success('Badge sent to printer')
      onPrint?.()
    } catch (error) {
      console.error('Print error:', error)
      toast.error('Failed to print badge')
    }
  }

  const handleDownload = async () => {
    try {
      // Implementation would use html2canvas or similar
      toast.success('Badge downloaded')
      onDownload?.()
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download badge')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Badge Preview</DialogTitle>
          <DialogDescription>
            Preview of the professional event badge design
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center items-center p-8 bg-gray-50 rounded-lg">
          <ProfessionalBadgeDesign data={badgeData} variant="standard" />
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
