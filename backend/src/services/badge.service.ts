import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QRCodeService, QRCodeGenerationResult } from './qr-code.service';
import * as PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { getTemplateLayout, applyTemplateColors, getPDFAlignment, getPDFFont } from '../lib/badge-templates';

export interface BadgeData {
  participantName: string;
  eventName: string;
  eventStartDate: string;
  eventEndDate?: string;
  venue: string;
  category: string;
  categoryColor?: string;
  registrationNumber: string;
  eventLogo?: string;
  badgeTemplateId?: string; // Event's selected badge template
}

export interface BadgePrintOptions {
  format: 'pdf' | 'png' | 'svg';
  size: 'standard' | 'large' | 'small';
  includeQRCode: boolean;
  template: 'default' | 'minimal' | 'corporate';
  badgeTemplateId?: string; // Override event's badge template
}

export interface BadgeGenerationResult {
  badgeData: BadgeData;
  qrCodeResult?: QRCodeGenerationResult;
  printData: Buffer;
  format: string;
}

@Injectable()
export class BadgeService {
  constructor(
    private prisma: PrismaService,
    private qrCodeService: QRCodeService
  ) {}

  /**
   * Generate complete badge with QR code for a registration
   */
  async generateBadge(
    registrationId: string, 
    options: Partial<BadgePrintOptions> = {}
  ): Promise<BadgeGenerationResult> {
    const defaultOptions: BadgePrintOptions = {
      format: 'pdf',
      size: 'standard',
      includeQRCode: true,
      template: 'default',
      ...options
    };

    // Fetch registration data
    const registration = await this.getRegistrationData(registrationId);
    if (!registration) {
      throw new Error('Registration not found');
    }

    // Generate badge data
    const badgeData = this.createBadgeData(registration, defaultOptions.badgeTemplateId);

    // Generate QR code if requested
    let qrCodeResult: QRCodeGenerationResult | undefined;
    if (defaultOptions.includeQRCode) {
      try {
        qrCodeResult = await this.qrCodeService.generateQRCode(registrationId);
      } catch (error) {
        console.warn(`Failed to generate QR code for badge ${registrationId}:`, error.message);
        // Continue without QR code
      }
    }

    // Generate print data based on format
    const printData = await this.generatePrintData(badgeData, qrCodeResult, defaultOptions);

    // Track badge printing
    await this.prisma.registration.update({
      where: { id: registrationId },
      data: {
        badgePrinted: true,
        badgePrintedAt: new Date(),
        badgePrintCount: {
          increment: 1
        }
      }
    });

    return {
      badgeData,
      qrCodeResult,
      printData,
      format: defaultOptions.format
    };
  }

  /**
   * Generate badges for multiple registrations
   */
  async generateBadges(
    registrationIds: string[], 
    options: Partial<BadgePrintOptions> = {}
  ): Promise<BadgeGenerationResult[]> {
    const results: BadgeGenerationResult[] = [];

    for (const registrationId of registrationIds) {
      try {
        const result = await this.generateBadge(registrationId, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to generate badge for registration ${registrationId}:`, error.message);
        // Continue with other registrations
      }
    }

    return results;
  }

  /**
   * Generate combined PDF with multiple badges
   */
  async generateBadgeSheet(
    registrationIds: string[], 
    options: Partial<BadgePrintOptions> = {}
  ): Promise<Buffer> {
    const badges = await this.generateBadges(registrationIds, { ...options, format: 'pdf' });
    
    // Create combined PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 20,
      layout: 'portrait'
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    // Calculate layout for A6 badges (100mm x 135mm) on A4 page
    // A6 dimensions in points: 284 x 383
    const badgeWidth = 284;  // A6 width: 100mm
    const badgeHeight = 383; // A6 height: 135mm
    const badgesPerRow = 1;  // 1 badge per row (vertical layout)
    const badgesPerCol = 2;  // 2 A6 badges fit vertically on A4
    const verticalSpacing = (doc.page.height - (badgesPerCol * badgeHeight) - 40) / (badgesPerCol + 1);
    
    let currentRow = 0;

    for (const badge of badges) {
      // Center badge horizontally on the page
      const x = (doc.page.width - badgeWidth) / 2;
      const y = 20 + verticalSpacing + (currentRow * (badgeHeight + verticalSpacing));

      // Check if we need a new page (max 2 badges per A4 page)
      if (currentRow >= badgesPerCol) {
        doc.addPage();
        currentRow = 0;
      }

      // Draw badge content at actual A6 size
      await this.drawBadgeOnPDF(doc, badge, x, y, badgeWidth, badgeHeight);

      currentRow++;
    }

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });
  }

  /**
   * Get badge data for existing registration without regenerating QR code
   */
  async getBadgeData(registrationId: string, badgeTemplateId?: string): Promise<BadgeData | null> {
    const registration = await this.getRegistrationData(registrationId);
    if (!registration) {
      return null;
    }

    return this.createBadgeData(registration, badgeTemplateId);
  }

  /**
   * Regenerate badge with new QR code
   */
  async regenerateBadge(
    registrationId: string, 
    options: Partial<BadgePrintOptions> = {}
  ): Promise<BadgeGenerationResult> {
    // Force regenerate QR code
    await this.qrCodeService.regenerateQRCode(registrationId);
    
    // Generate new badge
    return this.generateBadge(registrationId, options);
  }

  /**
   * Private helper methods
   */
  private async getRegistrationData(registrationId: string) {
    return this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: true,
        category: true,
        transactions: {
          where: {
            paymentStatus: 'PAID'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });
  }

  private createBadgeData(registration: any, overrideBadgeTemplateId?: string): BadgeData {
    const finalTemplateId = overrideBadgeTemplateId || registration.event.badgeTemplateId || undefined;
    
    console.log('=== Badge Service Debug ===');
    console.log('Registration ID:', registration.id);
    console.log('Event Name:', registration.event.name);
    console.log('Event Badge Template ID:', registration.event.badgeTemplateId);
    console.log('Override Badge Template ID:', overrideBadgeTemplateId);
    console.log('Final Badge Template ID:', finalTemplateId);
    
    const startDate = new Date(registration.event.date);
    const endDate = registration.event.endDate ? new Date(registration.event.endDate) : null;
    
    // Format start date
    const eventStartDate = startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    // Format end date if exists
    const eventEndDate = endDate ? endDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) : undefined;
    
    return {
      participantName: registration.fullName,
      eventName: registration.event.name,
      eventStartDate,
      eventEndDate,
      venue: registration.event.venue,
      category: registration.category.name,
      categoryColor: this.getCategoryColor(registration.category.name),
      registrationNumber: registration.id.slice(-8).toUpperCase(),
      eventLogo: registration.event.logoUrl || undefined,
      badgeTemplateId: finalTemplateId // Use override or event's selected badge template
    };
  }

  private getTemplateColors(templateId: string): { primary: string; secondary: string; accent: string } {
    // Badge template color mappings matching frontend BadgeTemplates.tsx exactly
    const templateColors: Record<string, { primary: string; secondary: string; accent: string }> = {
      'festival-fun': { primary: '#FF6B35', secondary: '#F7931E', accent: '#FFD23F' },
      'wedding-elegant': { primary: '#D4A574', secondary: '#E8C5A0', accent: '#F4E4C1' },
      'sports-event': { primary: '#1E88E5', secondary: '#42A5F5', accent: '#90CAF9' },
      'community-gathering': { primary: '#4CAF50', secondary: '#66BB6A', accent: '#A5D6A7' },
      'birthday-party': { primary: '#E91E63', secondary: '#F06292', accent: '#F8BBD9' },
      'charity-fundraiser': { primary: '#9C27B0', secondary: '#BA68C8', accent: '#E1BEE7' },
      'conference-modern': { primary: '#2C3E50', secondary: '#34495E', accent: '#3498DB' },
      'workshop-creative': { primary: '#8E44AD', secondary: '#9B59B6', accent: '#F39C12' },
      'google-io': { primary: '#4285F4', secondary: '#EA4335', accent: '#FBBC04' },
      'aws-reinvent': { primary: '#FF9900', secondary: '#232F3E', accent: '#146EB4' },
      'salesforce-dreamforce': { primary: '#00A1E0', secondary: '#0176D3', accent: '#FFB75D' },
      'apple-wwdc': { primary: '#000000', secondary: '#1D1D1F', accent: '#007AFF' },
      'ted-talks': { primary: '#E62B1E', secondary: '#000000', accent: '#FFFFFF' },
      'medical-conference': { primary: '#0066CC', secondary: '#004499', accent: '#00AA44' },
      'government-summit': { primary: '#002868', secondary: '#BF0A30', accent: '#FFFFFF' },
      'startup-summit': { primary: '#FF6B35', secondary: '#F7931E', accent: '#4ECDC4' },
      'academic-research': { primary: '#8B4513', secondary: '#A0522D', accent: '#DAA520' },
      'nonprofit-gala': { primary: '#DC143C', secondary: '#B22222', accent: '#FFD700' },
      'trade-show': { primary: '#2E86AB', secondary: '#A23B72', accent: '#F18F01' }
    };
    
    console.log('=== Template Color Debug ===');
    console.log('Requested Template ID:', templateId);
    console.log('Available Templates:', Object.keys(templateColors));
    console.log('Selected Colors:', templateColors[templateId] || 'DEFAULT');
    
    return templateColors[templateId] || { primary: '#1e293b', secondary: '#334155', accent: '#475569' };
  }

  private getCategoryColor(categoryName: string): string {
    // Map category names to colors
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

  private async generatePrintData(
    badgeData: BadgeData, 
    qrCodeResult: QRCodeGenerationResult | undefined, 
    options: BadgePrintOptions
  ): Promise<Buffer> {
    switch (options.format) {
      case 'pdf':
        return this.generatePDFBadge(badgeData, qrCodeResult, options);
      case 'png':
        return this.generatePNGBadge(badgeData, qrCodeResult, options);
      case 'svg':
        return this.generateSVGBadge(badgeData, qrCodeResult, options);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  private async generatePDFBadge(
    badgeData: BadgeData, 
    qrCodeResult: QRCodeGenerationResult | undefined, 
    options: BadgePrintOptions
  ): Promise<Buffer> {
    const doc = new PDFDocument({
      size: [284, 383], // A6: 100mm x 135mm at 72 DPI
      margin: 14 // ~5mm margin
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    await this.drawBadgeOnPDF(doc, { badgeData, qrCodeResult }, 0, 0, 256, 355);

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
    });
  }

  private async drawBadgeOnPDF(
    doc: PDFKit.PDFDocument, 
    badge: { badgeData: BadgeData; qrCodeResult?: QRCodeGenerationResult }, 
    x: number, 
    y: number, 
    width: number, 
    height: number
  ): Promise<void> {
    const { badgeData, qrCodeResult } = badge;

    // SIMPLE BADGE DESIGN - Logo, Name and QR Code
    
    // White background
    doc.rect(x, y, width, height)
       .fill('#ffffff');

    const margin = 20;
    const contentWidth = width - (margin * 2);
    
    let currentY = y + 20;
    
    // Event Logo (if provided) - Centered at top
    if (badgeData.eventLogo) {
      try {
        const logoMaxWidth = 120;
        const logoMaxHeight = 60;
        const logoX = x + (width - logoMaxWidth) / 2;
        
        doc.image(badgeData.eventLogo, logoX, currentY, {
          fit: [logoMaxWidth, logoMaxHeight],
          align: 'center',
          valign: 'center'
        });
        
        currentY += logoMaxHeight + 20; // Space after logo
      } catch (error) {
        console.warn('Failed to load event logo:', error.message);
        // Continue without logo
        currentY += 20;
      }
    } else {
      currentY += 20;
    }
    
    // Participant Name - Large and centered
    const nameSize = badgeData.participantName.length > 20 ? 24 : 32;
    
    doc.fontSize(nameSize)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text(badgeData.participantName, x + margin, currentY, { 
         width: contentWidth, 
         align: 'center'
       });

    currentY += 70; // Space after name

    // QR CODE - Centered below name
    if (qrCodeResult?.base64Image) {
      const qrSize = 150; // Large QR code
      const qrX = x + (width - qrSize) / 2; // Center horizontally

      // QR Code
      const qrBuffer = Buffer.from(qrCodeResult.base64Image.split(',')[1], 'base64');
      doc.image(qrBuffer, qrX, currentY, { width: qrSize, height: qrSize });
    }
  }

  private async generatePNGBadge(
    badgeData: BadgeData, 
    qrCodeResult: QRCodeGenerationResult | undefined, 
    options: BadgePrintOptions
  ): Promise<Buffer> {
    // For PNG generation, we would use a library like canvas or sharp
    // For now, return a placeholder
    throw new Error('PNG badge generation not yet implemented');
  }

  private async generateSVGBadge(
    badgeData: BadgeData, 
    qrCodeResult: QRCodeGenerationResult | undefined, 
    options: BadgePrintOptions
  ): Promise<Buffer> {
    // For SVG generation, we would generate SVG markup
    // For now, return a placeholder
    throw new Error('SVG badge generation not yet implemented');
  }
}
