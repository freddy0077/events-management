/**
 * Centralized QR Code and Badge Utilities
 * 
 * This module provides a unified interface for QR code generation, validation,
 * and badge printing functionality across the entire application.
 */

import { toast } from 'sonner';

// Types
export interface QRCodeData {
  registrationId: string;
  eventId: string;
  participantName: string;
  category: string;
  timestamp: string;
  checksum: string;
}

export interface QRCodeResult {
  qrCode: string;
  qrCodeData: QRCodeData;
  base64Image: string;
}

export interface QRCodeValidationResult {
  isValid: boolean;
  registrationId?: string;
  participantName?: string;
  eventName?: string;
  category?: string;
  errors?: string[];
}

export interface BadgeData {
  participantName: string;
  eventName: string;
  eventDate: string;
  venue: string;
  category: string;
  categoryColor?: string;
  registrationNumber: string;
  eventLogo?: string;
}

export interface BadgePrintOptions {
  format: 'pdf' | 'png' | 'svg';
  size: 'standard' | 'large' | 'small';
  includeQRCode: boolean;
  template: 'default' | 'minimal' | 'corporate';
}

// QR Code Utilities
export class QRCodeUtils {
  /**
   * Download QR code image as file
   */
  static downloadQRCode(base64Image: string, filename: string = 'qr-code.png'): void {
    try {
      const link = document.createElement('a');
      link.href = base64Image;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('QR code downloaded successfully!');
    } catch (error) {
      console.error('Failed to download QR code:', error);
      toast.error('Failed to download QR code');
    }
  }

  /**
   * Copy QR code image to clipboard
   */
  static async copyQRCodeToClipboard(base64Image: string): Promise<void> {
    try {
      // Convert base64 to blob
      const response = await fetch(base64Image);
      const blob = await response.blob();
      
      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      toast.success('QR code copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy QR code:', error);
      toast.error('Failed to copy QR code to clipboard');
    }
  }

  /**
   * Print QR code image
   */
  static printQRCode(base64Image: string, participantName: string = 'Participant'): void {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Failed to open print window');
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${participantName}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                text-align: center;
                font-family: Arial, sans-serif;
              }
              .qr-container {
                margin: 20px auto;
                max-width: 300px;
              }
              .qr-image {
                width: 256px;
                height: 256px;
                border-radius: 8px;
                margin: 0 auto 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .participant-name {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .instructions {
                font-size: 14px;
                color: #666;
                margin-top: 20px;
              }
              @media print {
                body { margin: 0; padding: 10px; }
                .qr-container { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="participant-name">${participantName}</div>
              <img src="${base64Image}" alt="QR Code" class="qr-image" />
              <div class="instructions">
                Scan this QR code for event check-in
              </div>
            </div>
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);

      toast.success('QR code sent to printer!');
    } catch (error) {
      console.error('Failed to print QR code:', error);
      toast.error('Failed to print QR code');
    }
  }

  /**
   * Validate QR code format
   */
  static isValidQRCodeFormat(qrCode: string): boolean {
    // Check if it's a valid encrypted QR code format (hex:hex)
    const parts = qrCode.split(':');
    return parts.length === 2 && /^[0-9a-fA-F]+$/.test(parts[0]) && /^[0-9a-fA-F]+$/.test(parts[1]);
  }

  /**
   * Generate QR code display URL for sharing
   */
  static generateQRCodeShareUrl(registrationId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/qr/${registrationId}`;
  }
}

// Badge Utilities
export class BadgeUtils {
  /**
   * Download badge as PDF file
   */
  static downloadBadge(base64PDF: string, filename: string = 'badge.pdf'): void {
    try {
      const byteCharacters = atob(base64PDF);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast.success('Badge downloaded successfully!');
    } catch (error) {
      console.error('Failed to download badge:', error);
      toast.error('Failed to download badge');
    }
  }

  /**
   * Print badge PDF (opens print dialog)
   */
  static printBadge(base64PDF: string, participantName: string = 'Participant'): void {
    try {
      const byteCharacters = atob(base64PDF);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank');
      
      if (!printWindow) {
        toast.error('Failed to open print window');
        return;
      }

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          URL.revokeObjectURL(blobUrl);
        }, 250);
      };

      toast.success('Badge sent to printer!');
    } catch (error) {
      console.error('Failed to print badge:', error);
      toast.error('Failed to print badge');
    }
  }

  /**
   * Convert badge to PDF and download directly (no print preview)
   */
  static convertToPDF(base64PDF: string, participantName: string = 'Participant', eventName: string = 'Event'): void {
    try {
      const filename = BadgeUtils.generateBadgeFilename(participantName, eventName);
      BadgeUtils.downloadBadge(base64PDF, filename);
      toast.success('Badge converted to PDF and downloaded!');
    } catch (error) {
      console.error('Failed to convert badge to PDF:', error);
      toast.error('Failed to convert badge to PDF');
    }
  }

  /**
   * Generate filename for badge download
   */
  static generateBadgeFilename(participantName: string, eventName: string, format: string = 'pdf'): string {
    const sanitizedParticipant = participantName.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedEvent = eventName.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    return `badge_${sanitizedParticipant}_${sanitizedEvent}_${timestamp}.${format}`;
  }

  /**
   * Generate filename for badge sheet download
   */
  static generateBadgeSheetFilename(eventName: string, count: number): string {
    const sanitizedEvent = eventName.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().split('T')[0];
    return `badge_sheet_${sanitizedEvent}_${count}_badges_${timestamp}.pdf`;
  }

  /**
   * Get category color mapping
   */
  static getCategoryColor(categoryName: string): string {
    const colorMap: Record<string, string> = {
      'VIP': '#8b5cf6', // purple
      'Premium': '#3b82f6', // blue
      'Standard': '#10b981', // emerald
      'Student': '#f59e0b', // amber
      'Staff': '#ef4444', // red
      'Speaker': '#06b6d4', // cyan
      'Sponsor': '#84cc16', // lime
      'Media': '#f97316', // orange
    };

    return colorMap[categoryName] || '#ea580c'; // default orange
  }

  /**
   * Preview badge in new window
   */
  static previewBadge(base64PDF: string, participantName: string = 'Participant'): void {
    try {
      const byteCharacters = atob(base64PDF);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      const blobUrl = URL.createObjectURL(blob);
      const previewWindow = window.open(blobUrl, '_blank');
      
      if (!previewWindow) {
        toast.error('Failed to open preview window');
        return;
      }

      // Clean up blob URL when window is closed
      previewWindow.onbeforeunload = () => {
        URL.revokeObjectURL(blobUrl);
      };

      toast.success('Badge preview opened!');
    } catch (error) {
      console.error('Failed to preview badge:', error);
      toast.error('Failed to preview badge');
    }
  }
}

// Combined Utilities
export class QRBadgeUtils {
  /**
   * Generate and download complete badge with QR code
   */
  static async generateAndDownloadBadge(
    registrationId: string,
    participantName: string,
    eventName: string,
    generateBadgeFunction: (registrationId: string, format?: string) => Promise<string | null>
  ): Promise<void> {
    try {
      toast.loading('Generating badge...', { id: 'badge-generation' });
      
      const badgeData = await generateBadgeFunction(registrationId, 'pdf');
      
      if (!badgeData) {
        throw new Error('Failed to generate badge data');
      }

      const filename = BadgeUtils.generateBadgeFilename(participantName, eventName);
      BadgeUtils.downloadBadge(badgeData, filename);
      
      toast.success('Badge generated and downloaded!', { id: 'badge-generation' });
    } catch (error) {
      console.error('Failed to generate and download badge:', error);
      toast.error('Failed to generate badge', { id: 'badge-generation' });
    }
  }

  /**
   * Generate and print complete badge with QR code
   */
  static async generateAndPrintBadge(
    registrationId: string,
    participantName: string,
    generateBadgeFunction: (registrationId: string, format?: string) => Promise<string | null>
  ): Promise<void> {
    try {
      toast.loading('Generating badge for printing...', { id: 'badge-print' });
      
      const badgeData = await generateBadgeFunction(registrationId, 'pdf');
      
      if (!badgeData) {
        throw new Error('Failed to generate badge data');
      }

      BadgeUtils.printBadge(badgeData, participantName);
      
      toast.success('Badge sent to printer!', { id: 'badge-print' });
    } catch (error) {
      console.error('Failed to generate and print badge:', error);
      toast.error('Failed to print badge', { id: 'badge-print' });
    }
  }

  /**
   * Generate and convert complete badge with QR code directly to PDF (no print preview)
   */
  static async generateAndConvertToPDF(
    registrationId: string,
    participantName: string,
    eventName: string,
    generateBadgeFunction: (registrationId: string, format?: string) => Promise<string | null>
  ): Promise<void> {
    try {
      toast.loading('Generating badge PDF...', { id: 'badge-pdf-convert' });
      
      const badgeData = await generateBadgeFunction(registrationId, 'pdf');
      
      if (!badgeData) {
        throw new Error('Failed to generate badge data');
      }

      BadgeUtils.convertToPDF(badgeData, participantName, eventName);
      
      toast.success('Badge converted to PDF successfully!', { id: 'badge-pdf-convert' });
    } catch (error) {
      console.error('Failed to generate and convert badge to PDF:', error);
      toast.error('Failed to convert badge to PDF', { id: 'badge-pdf-convert' });
    }
  }

  /**
   * Bulk generate and download badge sheet
   */
  static async bulkGenerateAndDownloadBadges(
    registrationIds: string[],
    eventName: string,
    generateBadgeSheetFunction: (registrationIds: string[]) => Promise<string | null>
  ): Promise<void> {
    try {
      toast.loading(`Generating ${registrationIds.length} badges...`, { id: 'bulk-badge-generation' });
      
      const badgeSheetData = await generateBadgeSheetFunction(registrationIds);
      
      if (!badgeSheetData) {
        throw new Error('Failed to generate badge sheet');
      }

      const filename = BadgeUtils.generateBadgeSheetFilename(eventName, registrationIds.length);
      BadgeUtils.downloadBadge(badgeSheetData, filename);
      
      toast.success(`${registrationIds.length} badges generated and downloaded!`, { id: 'bulk-badge-generation' });
    } catch (error) {
      console.error('Failed to generate bulk badges:', error);
      toast.error('Failed to generate badge sheet', { id: 'bulk-badge-generation' });
    }
  }

  /**
   * Validate registration data for badge generation
   */
  static validateRegistrationForBadge(registration: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!registration) {
      errors.push('Registration data is missing');
      return { isValid: false, errors };
    }

    if (!registration.fullName || registration.fullName.trim() === '') {
      errors.push('Participant name is required');
    }

    if (!registration.event) {
      errors.push('Event information is missing');
    }

    if (!registration.category) {
      errors.push('Category information is missing');
    }

    if (!registration.transactions || registration.transactions.length === 0) {
      errors.push('No payment transaction found');
    } else {
      const paidTransaction = registration.transactions.find(
        (t: any) => t.paymentStatus === 'PAID'
      );
      if (!paidTransaction) {
        errors.push('No paid transaction found');
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

// Export default combined utilities
export default QRBadgeUtils;
