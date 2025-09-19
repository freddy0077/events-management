import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QRCodeService, QRCodeGenerationResult } from './qr-code.service';
import * as PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { getTemplateLayout, applyTemplateColors, getPDFAlignment, getPDFFont } from '../lib/badge-templates';

export interface BadgeData {
  participantName: string;
  eventName: string;
  eventDate: string;
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
    const badgesPerRow = 2;  // 2 A6 badges fit horizontally on A4
    const badgesPerCol = 2;  // 2 A6 badges fit vertically on A4
    const horizontalSpacing = (doc.page.width - (badgesPerRow * badgeWidth) - 40) / (badgesPerRow - 1);
    const verticalSpacing = (doc.page.height - (badgesPerCol * badgeHeight) - 40) / (badgesPerCol - 1);
    
    let currentRow = 0;
    let currentCol = 0;

    for (const badge of badges) {
      const x = 20 + (currentCol * (badgeWidth + horizontalSpacing));
      const y = 20 + (currentRow * (badgeHeight + verticalSpacing));

      // Check if we need a new page (max 4 badges per A4 page)
      if (currentRow >= badgesPerCol) {
        doc.addPage();
        currentRow = 0;
        currentCol = 0;
      }

      // Draw badge content at actual A6 size
      await this.drawBadgeOnPDF(doc, badge, x, y, badgeWidth, badgeHeight);

      currentCol++;
      if (currentCol >= badgesPerRow) {
        currentCol = 0;
        currentRow++;
      }
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
    
    return {
      participantName: registration.fullName,
      eventName: registration.event.name,
      eventDate: new Date(registration.event.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
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

    // Get centralized template layout
    const templateLayout = getTemplateLayout('professional');
    
    // Get template colors based on event's selected badge template
    const templateColors = badgeData.badgeTemplateId 
      ? this.getTemplateColors(badgeData.badgeTemplateId)
      : { primary: '#1e293b', secondary: '#334155', accent: '#475569' };

    // Apply template colors to layout
    const styledLayout = applyTemplateColors(templateLayout, templateColors);

    // CENTRALIZED BADGE DESIGN - Using Template Structure
    
    // Clean background
    doc.rect(x, y, width, height)
       .fill(styledLayout.backgroundColor);

    // Professional outer border using template colors
    doc.roundedRect(
      x + styledLayout.border.width, 
      y + styledLayout.border.width, 
      width - (styledLayout.border.width * 2), 
      height - (styledLayout.border.width * 2), 
      styledLayout.border.borderRadius
    )
       .lineWidth(styledLayout.border.width)
       .stroke(styledLayout.border.color);

    // HEADER SECTION - Using template structure
    const headerX = x + styledLayout.dimensions.margin;
    const headerY = y + styledLayout.dimensions.margin;
    const headerWidth = width - (styledLayout.dimensions.margin * 2);
    
    // Header background
    doc.roundedRect(headerX, headerY, headerWidth, styledLayout.header.height, styledLayout.header.borderRadius)
       .fill(styledLayout.header.backgroundColor);

    // Company branding
    doc.fontSize(styledLayout.header.branding.fontSize)
       .font(getPDFFont(styledLayout.header.branding.fontWeight))
       .fillColor(styledLayout.header.branding.color)
       .text(styledLayout.header.branding.text, headerX + 12, headerY + 12);

    // Professional tagline
    doc.fontSize(styledLayout.header.tagline.fontSize)
       .font(getPDFFont('normal'))
       .fillColor(styledLayout.header.tagline.color)
       .text(styledLayout.header.tagline.text, headerX + 12, headerY + 42);

    // Registration ID box
    if (badgeData.registrationNumber) {
      const regBoxWidth = 70;
      const regBoxX = headerX + headerWidth - regBoxWidth - 8;
      
      doc.roundedRect(regBoxX, headerY + 8, regBoxWidth, 35, 4)
         .fill('#ffffff')
         .stroke('#e2e8f0')
         .lineWidth(1);

      doc.fontSize(7).font('Helvetica')
         .fillColor('#64748b')
         .text('REG ID', regBoxX + 5, headerY + 13, { 
           align: 'center', 
           width: regBoxWidth - 10
         });
      
      doc.fontSize(8).font('Helvetica-Bold')
         .fillColor(styledLayout.border.color)
         .text(badgeData.registrationNumber, regBoxX + 5, headerY + 25, { 
           align: 'center', 
           width: regBoxWidth - 10 
         });
    }

    // EVENT SECTION - Using template structure
    const eventSectionY = headerY + styledLayout.header.height + styledLayout.eventSection.marginTop;
    
    // Event name - Full width since QR is now in separate section
    doc.fontSize(styledLayout.eventSection.eventName.fontSize)
       .font(getPDFFont(styledLayout.eventSection.eventName.fontWeight))
       .fillColor(styledLayout.eventSection.eventName.color)
       .text(badgeData.eventName, headerX, eventSectionY, { 
         width: headerWidth,
         align: getPDFAlignment(styledLayout.eventSection.eventName.align)
       });

    // Professional separator line using template styling
    const separatorY = eventSectionY + styledLayout.eventSection.separator.marginTop;
    const separatorMargin = 35;
    doc.moveTo(headerX + separatorMargin, separatorY)
       .lineTo(headerX + headerWidth - separatorMargin, separatorY)
       .lineWidth(styledLayout.eventSection.separator.width)
       .stroke(styledLayout.eventSection.separator.color);

    // Event details - Using template styling
    const eventDetailsY = separatorY + styledLayout.eventSection.separator.marginBottom;
    
    doc.fontSize(styledLayout.eventSection.eventDetails.date.fontSize)
       .font(getPDFFont('normal'))
       .fillColor(styledLayout.eventSection.eventDetails.date.color)
       .text(badgeData.eventDate, headerX, eventDetailsY, { 
         width: headerWidth,
         align: getPDFAlignment(styledLayout.eventSection.eventDetails.date.align)
       });

    doc.fontSize(styledLayout.eventSection.eventDetails.venue.fontSize)
       .font(getPDFFont('normal'))
       .fillColor(styledLayout.eventSection.eventDetails.venue.color)
       .text(badgeData.venue, headerX, eventDetailsY + 16, { 
         width: headerWidth,
         align: getPDFAlignment(styledLayout.eventSection.eventDetails.venue.align)
       });

    // PARTICIPANT SECTION - Using template structure
    const participantSectionY = eventDetailsY + styledLayout.participantSection.marginTop;
    
    // Participant label - Using template styling
    doc.fontSize(styledLayout.participantSection.label.fontSize)
       .font(getPDFFont(styledLayout.participantSection.label.fontWeight))
       .fillColor(styledLayout.participantSection.label.color)
       .text(styledLayout.participantSection.label.text, headerX, participantSectionY, { 
         width: headerWidth,
         align: getPDFAlignment(styledLayout.participantSection.label.align)
       });

    // PARTICIPANT NAME CARD - Using template structure
    const nameCardY = participantSectionY + styledLayout.participantSection.nameCard.marginTop;
    const nameCardHeight = styledLayout.participantSection.nameCard.height;
    
    // Name background using template styling
    doc.roundedRect(headerX, nameCardY, headerWidth, nameCardHeight, styledLayout.participantSection.nameCard.borderRadius)
       .fill(styledLayout.participantSection.nameCard.backgroundColor);

    // Participant name - Dynamic sizing and template styling
    const nameSize = badgeData.participantName.length > 25 ? styledLayout.participantSection.nameCard.name.fontSize * 0.8 : 
                     badgeData.participantName.length > 18 ? styledLayout.participantSection.nameCard.name.fontSize * 0.9 : 
                     styledLayout.participantSection.nameCard.name.fontSize;
    
    doc.fontSize(nameSize)
       .font(getPDFFont(styledLayout.participantSection.nameCard.name.fontWeight))
       .fillColor(styledLayout.participantSection.nameCard.name.color)
       .text(badgeData.participantName, headerX + 6, nameCardY + 16, { 
         width: headerWidth - 12, 
         align: getPDFAlignment(styledLayout.participantSection.nameCard.name.align)
       });

    // Category badge - Using template structure
    const categoryBadgeY = nameCardY + nameCardHeight + styledLayout.participantSection.categoryBadge.marginTop;
    const categoryText = badgeData.category.toUpperCase();
    const categoryTextWidth = doc.widthOfString(categoryText);
    const categoryBadgeWidth = categoryTextWidth + (styledLayout.participantSection.categoryBadge.padding * 2);
    const categoryBadgeX = headerX + (headerWidth - categoryBadgeWidth) / 2;

    doc.roundedRect(categoryBadgeX, categoryBadgeY, categoryBadgeWidth, 16, styledLayout.participantSection.categoryBadge.borderRadius)
       .fill(styledLayout.participantSection.categoryBadge.backgroundColor)
       .stroke(styledLayout.participantSection.categoryBadge.borderColor)
       .lineWidth(styledLayout.participantSection.categoryBadge.borderWidth);

    doc.fontSize(styledLayout.participantSection.categoryBadge.fontSize)
       .font(getPDFFont(styledLayout.participantSection.categoryBadge.fontWeight))
       .fillColor(styledLayout.participantSection.categoryBadge.color)
       .text(categoryText, categoryBadgeX + styledLayout.participantSection.categoryBadge.padding, categoryBadgeY + 4);

    // QR CODE SECTION - Positioned as separate section below participant info
    if (qrCodeResult?.base64Image && styledLayout.qrSection.position === 'separate-section') {
      const qrSectionY = categoryBadgeY + 20 + (styledLayout.qrSection.marginTop || 16);
      const qrSize = styledLayout.qrSection.size;
      const qrX = headerX + (headerWidth - qrSize) / 2; // Center the QR code

      // QR frame using template styling
      doc.roundedRect(qrX - 8, qrSectionY - 8, qrSize + 16, qrSize + 16, 8)
         .fill('#ffffff')
         .stroke(styledLayout.qrSection.frameColor)
         .lineWidth(styledLayout.qrSection.frameWidth);

      // QR Code
      const qrBuffer = Buffer.from(qrCodeResult.base64Image.split(',')[1], 'base64');
      doc.image(qrBuffer, qrX, qrSectionY, { width: qrSize, height: qrSize });

      // QR instruction - Below QR code
      doc.fontSize(styledLayout.qrSection.instruction.fontSize)
         .font(getPDFFont(styledLayout.qrSection.instruction.fontWeight))
         .fillColor(styledLayout.qrSection.instruction.color)
         .text(styledLayout.qrSection.instruction.text, headerX, qrSectionY + qrSize + styledLayout.qrSection.instruction.marginTop, { 
           width: headerWidth, 
           align: getPDFAlignment(styledLayout.qrSection.instruction.align)
         });
    }

    // FOOTER - Using template structure
    const footerY = y + height - styledLayout.dimensions.margin - 30;
    
    // Clean separator line using template styling
    doc.moveTo(headerX + 20, footerY - styledLayout.footer.separator.marginBottom)
       .lineTo(headerX + headerWidth - 20, footerY - styledLayout.footer.separator.marginBottom)
       .lineWidth(styledLayout.footer.separator.width)
       .stroke(styledLayout.footer.separator.color);

    // Instructions - Using template styling
    doc.fontSize(styledLayout.footer.instruction.fontSize)
       .font(getPDFFont('normal'))
       .fillColor(styledLayout.footer.instruction.color)
       .text(styledLayout.footer.instruction.text, headerX, footerY, { 
         width: headerWidth, 
         align: getPDFAlignment(styledLayout.footer.instruction.align) 
       });

    // Branding - Using template styling
    doc.fontSize(styledLayout.footer.branding.fontSize)
       .font(getPDFFont('normal'))
       .fillColor(styledLayout.footer.branding.color)
       .text(styledLayout.footer.branding.text, headerX, footerY + styledLayout.footer.branding.marginTop, { 
         width: headerWidth, 
         align: getPDFAlignment(styledLayout.footer.branding.align) 
       });
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
