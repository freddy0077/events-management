import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface QRCodePayload {
  registrationId: string;
  eventId: string;
  participantName: string;
  category: string;
  timestamp: string;
  checksum: string;
}

export interface QRCodeGenerationResult {
  qrCode: string;
  qrCodeData: QRCodePayload;
  base64Image: string;
}

@Injectable()
export class QRCodeService {
  private readonly encryptionKey: string;
  private readonly algorithm = 'aes-256-gcm';

  constructor(private prisma: PrismaService) {
    // Use environment variable or generate a secure key for development
    this.encryptionKey = process.env.QR_ENCRYPTION_KEY || 'dev-qr-key-32-chars-long-secure!';
    if (this.encryptionKey.length !== 32) {
      throw new Error(`QR_ENCRYPTION_KEY must be exactly 32 characters long. Current length: ${this.encryptionKey.length}`);
    }
  }

  /**
   * Generate QR code for a registration
   */
  async generateQRCode(registrationId: string): Promise<QRCodeGenerationResult> {
    // Fetch registration with related data
    const registration = await this.prisma.registration.findUnique({
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
      },
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    // Check if registration has a paid transaction
    const hasPaidTransaction = registration.transactions && registration.transactions.length > 0;
    if (!hasPaidTransaction) {
      throw new Error('Cannot generate QR code for registration without paid transaction');
    }

    // Create QR code payload
    const payload: QRCodePayload = {
      registrationId: registration.id,
      eventId: registration.eventId,
      participantName: registration.fullName,
      category: registration.category.name,
      timestamp: new Date().toISOString(),
      checksum: '', // Will be set after encryption
    };

    // Generate checksum
    const checksumData = `${payload.registrationId}${payload.eventId}${payload.participantName}${payload.timestamp}`;
    payload.checksum = this.generateChecksum(checksumData);

    // Encrypt the payload
    const encryptedPayload = this.encryptPayload(payload);

    // Generate QR code image
    const qrCodeOptions = {
      errorCorrectionLevel: 'M' as const,
      type: 'image/png' as const,
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 256,
    };

    const base64Image = await QRCode.toDataURL(encryptedPayload, qrCodeOptions);

    // Update registration with QR code data
    await this.prisma.registration.update({
      where: { id: registrationId },
      data: {
        qrCode: encryptedPayload,
        qrCodeData: payload as any,
        qrCodeGeneratedAt: new Date(),
      },
    });

    return {
      qrCode: encryptedPayload,
      qrCodeData: payload,
      base64Image,
    };
  }

  /**
   * Validate QR code and return payload
   */
  async validateQRCode(qrCode: string): Promise<QRCodePayload | null> {
    try {
      // Decrypt the payload
      const payload = this.decryptPayload(qrCode);

      // Verify checksum
      const checksumData = `${payload.registrationId}${payload.eventId}${payload.participantName}${payload.timestamp}`;
      const expectedChecksum = this.generateChecksum(checksumData);

      if (payload.checksum !== expectedChecksum) {
        throw new Error('Invalid QR code checksum');
      }

      // Check if registration exists and is valid
      const registration = await this.prisma.registration.findUnique({
        where: { id: payload.registrationId },
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
        },
      });

      if (!registration) {
        throw new Error('Registration not found');
      }

      // Check if registration has a paid transaction
      const hasPaidTransaction = registration.transactions && registration.transactions.length > 0;
      if (!hasPaidTransaction) {
        throw new Error('Registration not approved - no paid transaction found');
      }

      // Check if event is still active (not expired)
      const eventDate = new Date(registration.event.date);
      const now = new Date();
      const eventEndDate = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000); // Event + 1 day

      if (now > eventEndDate) {
        throw new Error('QR code expired - event has ended');
      }

      return payload;
    } catch (error) {
      console.error('QR code validation failed:', error.message);
      return null;
    }
  }

  /**
   * Regenerate QR code for a registration (in case of reprint)
   */
  async regenerateQRCode(registrationId: string): Promise<QRCodeGenerationResult> {
    // Clear existing QR code data
    await this.prisma.registration.update({
      where: { id: registrationId },
      data: {
        qrCode: null,
        qrCodeData: null,
        qrCodeGeneratedAt: null,
      },
    });

    // Generate new QR code
    return this.generateQRCode(registrationId);
  }

  /**
   * Get QR code image for existing registration
   * Auto-generates QR code if it doesn't exist and registration has paid transaction
   */
  async getQRCodeImage(registrationId: string): Promise<string | null> {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        transactions: {
          where: {
            paymentStatus: 'PAID'
          },
          take: 1
        }
      }
    });

    if (!registration) {
      return null;
    }

    // If QR code doesn't exist but registration has paid transaction, generate it
    if (!registration.qrCode && registration.transactions && registration.transactions.length > 0) {
      try {
        const qrResult = await this.generateQRCode(registrationId);
        return qrResult.base64Image;
      } catch (error) {
        console.error('Failed to auto-generate QR code:', error.message);
        return null;
      }
    }

    // If QR code exists, generate image from it
    if (registration.qrCode) {
      const qrCodeOptions = {
        errorCorrectionLevel: 'M' as const,
        type: 'image/png' as const,
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        width: 256,
      };

      return QRCode.toDataURL(registration.qrCode, qrCodeOptions);
    }

    // No QR code and no paid transaction
    return null;
  }

  /**
   * Encrypt QR code payload
   */
  private encryptPayload(payload: QRCodePayload): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    
    let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt QR code payload
   */
  private decryptPayload(encryptedData: string): QRCodePayload {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    
    const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  /**
   * Generate checksum for payload verification
   */
  private generateChecksum(data: string): string {
    return crypto
      .createHmac('sha256', this.encryptionKey)
      .update(data)
      .digest('hex')
      .substring(0, 16); // Use first 16 characters
  }

  /**
   * Bulk generate QR codes for multiple registrations
   */
  async bulkGenerateQRCodes(registrationIds: string[]): Promise<QRCodeGenerationResult[]> {
    const results: QRCodeGenerationResult[] = [];

    for (const registrationId of registrationIds) {
      try {
        const result = await this.generateQRCode(registrationId);
        results.push(result);
      } catch (error) {
        console.error(`Failed to generate QR code for registration ${registrationId}:`, error.message);
        // Continue with other registrations
      }
    }

    return results;
  }
}
