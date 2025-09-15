import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { QRCodeService } from '../../services/qr-code.service';
import { CreateMealInput, UpdateMealInput, ScanQRCodeInput, ScanResult, CateringMetrics, ServeMealInput, ServeMealResult, CateringReports, CateringReportsFilter, CateringReportSummary, MealSessionReport, AttendanceAnalytics, AttendanceByCategory, AttendanceByTimeSlot, ValidateQRCodeInput, QRCodeValidationResponse, QRCodeData, MealSessionActionResult, FailedScanInput, FailedScanResult } from './dto/meal.dto';
import { Meal, MealAttendance } from '@prisma/client';

@Injectable()
export class MealsService {
  constructor(
    private prisma: PrismaService,
    private qrCodeService: QRCodeService,
  ) {}

  async createMeal(createMealInput: CreateMealInput): Promise<Meal> {
    const { eventId, name, startTime, endTime, description } = createMealInput;

    // Verify event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Validate time range
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      throw new BadRequestException('Start time must be before end time');
    }

    return this.prisma.meal.create({
      data: {
        eventId,
        sessionName: name,
        startTime: start,
        endTime: end,
        description,
      },
      include: {
        attendances: {
          include: {
            registration: true,
          },
        },
      },
    });
  }

  async findMealsByEvent(eventId: string): Promise<Meal[]> {
    return this.prisma.meal.findMany({
      where: { eventId },
      include: {
        attendances: {
          include: {
            registration: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findActiveMeals(): Promise<Meal[]> {
    const now = new Date();
    
    return this.prisma.meal.findMany({
      where: {
        isActive: true,
        startTime: { lte: now },
        endTime: { gte: now },
      },
      include: {
        attendances: {
          include: {
            registration: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findMealById(id: string): Promise<Meal> {
    const meal = await this.prisma.meal.findUnique({
      where: { id },
      include: {
        attendances: {
          include: {
            registration: true,
          },
        },
      },
    });

    if (!meal) {
      throw new NotFoundException('Meal not found');
    }

    return meal;
  }

  async updateMeal(id: string, updateMealInput: UpdateMealInput): Promise<Meal> {
    const meal = await this.findMealById(id);

    const updateData: any = { ...updateMealInput };

    // Validate time range if both times are provided
    if (updateMealInput.startTime && updateMealInput.endTime) {
      const start = new Date(updateMealInput.startTime);
      const end = new Date(updateMealInput.endTime);

      if (start >= end) {
        throw new BadRequestException('Start time must be before end time');
      }

      updateData.startTime = start;
      updateData.endTime = end;
    } else if (updateMealInput.startTime) {
      updateData.startTime = new Date(updateMealInput.startTime);
    } else if (updateMealInput.endTime) {
      updateData.endTime = new Date(updateMealInput.endTime);
    }

    return this.prisma.meal.update({
      where: { id },
      data: updateData,
      include: {
        attendances: {
          include: {
            registration: true,
          },
        },
      },
    });
  }

  async scanQRCode(scanInput: ScanQRCodeInput, scannedBy: string): Promise<ScanResult> {
    const { mealId, qrCode, notes } = scanInput;

    // Verify meal exists and is active
    const meal = await this.prisma.meal.findUnique({
      where: { id: mealId },
    });

    if (!meal || !meal.isActive) {
      return {
        success: false,
        message: 'Meal session not found or inactive',
      };
    }

    // Check if meal is currently active (within time range)
    const now = new Date();
    if (now < meal.startTime || now > meal.endTime) {
      return {
        success: false,
        message: 'Meal session is not currently active',
      };
    }

    // Find registration by QR code
    const registration = await this.prisma.registration.findUnique({
      where: { qrCode },
      include: {
        event: true,
      },
    });

    if (!registration) {
      return {
        success: false,
        message: 'Invalid QR code',
      };
    }

    // Check if registration is for the same event as the meal
    if (registration.eventId !== meal.eventId) {
      return {
        success: false,
        message: 'QR code is not valid for this event',
      };
    }

    // Check if registration has paid transactions
    const paidTransaction = await this.prisma.transaction.findFirst({
      where: {
        registrationId: registration.id,
        paymentStatus: 'PAID'
      }
    });

    if (!paidTransaction) {
      return {
        success: false,
        message: 'Registration payment not completed',
      };
    }

    // Check if already scanned for this meal
    const existingAttendance = await this.prisma.mealAttendance.findFirst({
      where: {
        mealId,
        registrationId: registration.id,
      },
    });

    if (existingAttendance) {
      return {
        success: false,
        message: 'Already scanned for this meal session',
        alreadyScanned: true,
        participantName: registration.fullName || registration.email,
      };
    }

    // Create meal attendance record
    const attendance = await this.prisma.mealAttendance.create({
      data: {
        mealId,
        registrationId: registration.id,
        scannedBy,
        notes,
        scannedAt: new Date(),
      },
      include: {
        meal: true,
        registration: true,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        eventId: meal.eventId,
        registrationId: registration.id,
        action: 'MEAL_SCANNED',
        details: { message: `Meal attendance recorded for: ${meal.sessionName}` },
        performedBy: scannedBy,
      },
    });

    const participantName = registration.fullName || registration.email;

    return {
      success: true,
      message: `Successfully recorded attendance for ${participantName}`,
      attendance,
      participantName,
      alreadyScanned: false,
    };
  }

  /**
   * Record a failed QR code scan attempt for audit and security purposes
   */
  async recordFailedScan(failedScanInput: FailedScanInput, scannedBy: string): Promise<FailedScanResult> {
    const { qrCode, errorMessage, scanMethod, eventId, mealId, notes } = failedScanInput;

    try {
      // Try to validate the QR code to get additional context
      let registrationId: string | null = null;
      let actualEventId: string | null = eventId || null;
      
      try {
        const qrValidation = await this.qrCodeService.validateQRCode(qrCode);
        if (qrValidation) {
          registrationId = qrValidation.registrationId;
          actualEventId = qrValidation.eventId;
        }
      } catch (error) {
        // QR validation failed, which is expected for invalid QR codes
        console.log('QR validation failed during failed scan recording:', error.message);
      }

      // Create detailed audit log for the failed scan
      const auditLog = await this.prisma.auditLog.create({
        data: {
          eventId: actualEventId,
          registrationId,
          action: 'QR_SCAN_FAILED',
          details: {
            qrCode: qrCode.substring(0, 50) + '...', // Truncate for security
            errorMessage,
            scanMethod,
            mealId,
            notes,
            timestamp: new Date().toISOString(),
            failureReason: this.categorizeFailureReason(errorMessage),
          },
          performedBy: scannedBy,
        },
      });

      return {
        success: true,
        message: 'Failed scan recorded successfully',
        auditLogId: auditLog.id,
      };
    } catch (error) {
      console.error('Error recording failed scan:', error);
      return {
        success: false,
        message: 'Failed to record failed scan attempt',
      };
    }
  }

  /**
   * Helper method to log failed scan attempts during regular scan operations
   */
  private async logFailedScanAttempt(
    qrCode: string, 
    errorMessage: string, 
    scanMethod: string, 
    scannedBy: string, 
    mealId?: string, 
    eventId?: string
  ): Promise<void> {
    try {
      await this.recordFailedScan({
        qrCode,
        errorMessage,
        scanMethod,
        mealId,
        eventId,
      }, scannedBy);
    } catch (error) {
      console.error('Failed to log failed scan attempt:', error);
    }
  }

  /**
   * Helper method to categorize failure reasons for better reporting
   */
  private categorizeFailureReason(errorMessage: string): string {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('invalid') || message.includes('not found')) {
      return 'INVALID_QR_CODE';
    }
    if (message.includes('expired') || message.includes('event has ended')) {
      return 'EXPIRED_QR_CODE';
    }
    if (message.includes('payment') || message.includes('not paid')) {
      return 'PAYMENT_REQUIRED';
    }
    if (message.includes('already scanned') || message.includes('duplicate')) {
      return 'ALREADY_SCANNED';
    }
    if (message.includes('meal') && message.includes('inactive')) {
      return 'MEAL_SESSION_INACTIVE';
    }
    if (message.includes('wrong event') || message.includes('not valid for this event')) {
      return 'WRONG_EVENT';
    }
    
    return 'OTHER';
  }

  async getMealAttendance(mealId: string): Promise<MealAttendance[]> {
    return this.prisma.mealAttendance.findMany({
      where: { mealId },
      include: {
        registration: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { scannedAt: 'desc' },
    });
  }

  async getRecentMealAttendances(eventId?: string, limit: number = 50): Promise<MealAttendance[]> {
    const whereClause: any = {};
    
    if (eventId) {
      // Filter by event ID through meal relationship
      whereClause.meal = {
        eventId: eventId
      };
    }

    return this.prisma.mealAttendance.findMany({
      where: whereClause,
      include: {
        meal: true,
        registration: {
          include: {
            event: true,
            category: true,
          },
        },
      },
      orderBy: { scannedAt: 'desc' },
      take: limit,
    });
  }

  async validateQRCode(validateInput: ValidateQRCodeInput): Promise<QRCodeValidationResponse> {
    const { qrCode } = validateInput;

    try {
      // Find registration by QR code
      const registration = await this.prisma.registration.findFirst({
        where: { qrCode },
        include: {
          event: true,
          category: true,
          transactions: {
            where: { paymentStatus: 'PAID' }
          },
        },
      });

      if (!registration) {
        return {
          success: false,
          message: 'Invalid QR code - registration not found',
          isValid: false,
          qrCodeData: null,
        };
      }

      // Check if registration has paid transactions
      if (!registration.transactions || registration.transactions.length === 0) {
        return {
          success: false,
          message: 'Registration payment is not completed',
          isValid: false,
          qrCodeData: null,
        };
      }

      // Create QR code data response
      const qrCodeData: QRCodeData = {
        registrationId: registration.id,
        eventId: registration.eventId,
        participantName: registration.fullName,
        category: registration.category?.name || 'General',
        timestamp: registration.createdAt.toISOString(),
        checksum: qrCode.slice(-8), // Use last 8 characters as checksum
      };

      return {
        success: true,
        message: 'QR code is valid',
        isValid: true,
        qrCodeData,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error validating QR code',
        isValid: false,
        qrCodeData: null,
      };
    }
  }

  async getMealStats(mealId: string) {
    const meal = await this.findMealById(mealId);
    
    const totalAttendees = await this.prisma.mealAttendance.count({
      where: { mealId },
    });

    // Count registrations with paid transactions for this event
    const registrationsWithPaidTransactions = await this.prisma.registration.findMany({
      where: { eventId: meal.eventId },
      include: {
        transactions: {
          where: { paymentStatus: 'PAID' }
        }
      }
    });
    
    const totalRegistrations = registrationsWithPaidTransactions.filter(r => r.transactions.length > 0).length;

    const attendanceByCategory = await this.prisma.mealAttendance.groupBy({
      by: ['registrationId'],
      where: { mealId },
      _count: true,
    });

    return {
      meal,
      totalAttendees,
      totalRegistrations,
      attendanceRate: totalRegistrations > 0 ? (totalAttendees / totalRegistrations) * 100 : 0,
      attendanceByCategory,
    };
  }

  async deleteMeal(id: string): Promise<boolean> {
    const meal = await this.findMealById(id);

    // Check if meal has any attendance records
    const attendanceCount = await this.prisma.mealAttendance.count({
      where: { mealId: id },
    });

    if (attendanceCount > 0) {
      throw new BadRequestException('Cannot delete meal with existing attendance records');
    }

    await this.prisma.meal.delete({
      where: { id },
    });

    return true;
  }

  async getCateringMetrics(eventId?: string): Promise<CateringMetrics> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Base where clause for event filtering
    const eventWhere = eventId ? { eventId } : {};

    // Get total participants with paid transactions
    const registrationsWithPaidTransactions = await this.prisma.registration.findMany({
      where: {
        ...eventWhere,
        transactions: {
          some: {
            paymentStatus: 'PAID'
          }
        }
      },
      include: {
        transactions: {
          where: { paymentStatus: 'PAID' }
        }
      }
    });

    const totalParticipants = registrationsWithPaidTransactions.length;

    // Get participants checked in today
    const checkedInToday = await this.prisma.mealAttendance.count({
      where: {
        scannedAt: {
          gte: today,
          lt: tomorrow
        },
        ...(eventId && {
          meal: {
            eventId
          }
        })
      }
    });

    // Get meal attendance stats
    const totalMealAttendances = await this.prisma.mealAttendance.count({
      where: {
        ...(eventId && {
          meal: {
            eventId
          }
        })
      }
    });

    // Get unique participants who have been served meals
    const servedParticipants = await this.prisma.mealAttendance.groupBy({
      by: ['registrationId'],
      where: {
        ...(eventId && {
          meal: {
            eventId
          }
        })
      }
    });

    const completedMeals = servedParticipants.length;
    const pendingMeals = totalParticipants - completedMeals;

    // Get meal session stats
    const totalMealSessions = await this.prisma.meal.count({
      where: eventWhere
    });

    const now = new Date();
    const activeMealSessions = await this.prisma.meal.count({
      where: {
        ...eventWhere,
        isActive: true,
        startTime: { lte: now },
        endTime: { gte: now }
      }
    });

    return {
      totalParticipants,
      checkedInToday,
      pendingMeals: Math.max(0, pendingMeals),
      completedMeals,
      totalMealSessions,
      activeMealSessions
    };
  }

  async getCateringRegistrations(eventId?: string, mealFilter?: string, statusFilter?: string): Promise<any[]> {
    const where: any = {};

    // Event filter
    if (eventId) {
      where.eventId = eventId;
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter.toUpperCase();
    }

    // Only include registrations with paid transactions
    where.transactions = {
      some: {
        paymentStatus: 'PAID'
      }
    };

    const registrations = await this.prisma.registration.findMany({
      where,
      include: {
        event: true,
        category: true,
        transactions: {
          where: { paymentStatus: 'PAID' }
        },
        mealAttendances: {
          include: {
            meal: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Apply meal filter
    if (mealFilter && mealFilter !== 'all') {
      return registrations.filter(registration => {
        const hasAttendance = registration.mealAttendances.length > 0;
        if (mealFilter === 'served') {
          return hasAttendance;
        } else if (mealFilter === 'pending') {
          return !hasAttendance;
        }
        return true;
      });
    }

    return registrations;
  }

  async serveMeal(serveMealInput: ServeMealInput, servedBy: string): Promise<ServeMealResult> {
    const { registrationId, mealId, notes } = serveMealInput;

    // Verify meal exists and is active
    const meal = await this.prisma.meal.findUnique({
      where: { id: mealId },
    });

    if (!meal || !meal.isActive) {
      return {
        success: false,
        message: 'Meal session not found or inactive',
      };
    }

    // Verify registration exists and has paid transaction
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: true,
        transactions: {
          where: { paymentStatus: 'PAID' }
        }
      },
    });

    if (!registration) {
      return {
        success: false,
        message: 'Registration not found',
      };
    }

    if (registration.transactions.length === 0) {
      return {
        success: false,
        message: 'Registration payment not completed',
      };
    }

    // Check if registration is for the same event as the meal
    if (registration.eventId !== meal.eventId) {
      return {
        success: false,
        message: 'Registration is not valid for this meal event',
      };
    }

    // Check if already served for this meal
    const existingAttendance = await this.prisma.mealAttendance.findFirst({
      where: {
        mealId,
        registrationId,
      },
    });

    if (existingAttendance) {
      return {
        success: false,
        message: 'Meal already served to this participant',
        participantName: registration.fullName || registration.email,
      };
    }

    // Create meal attendance record
    const attendance = await this.prisma.mealAttendance.create({
      data: {
        mealId,
        registrationId,
        scannedBy: servedBy,
        notes,
        scannedAt: new Date(),
      },
      include: {
        meal: true,
        registration: true,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        eventId: meal.eventId,
        registrationId,
        action: 'MEAL_SERVED',
        details: { message: `Meal served manually: ${meal.sessionName}` },
        performedBy: servedBy,
      },
    });

    const participantName = registration.fullName || registration.email;

    return {
      success: true,
      message: `Successfully served meal to ${participantName}`,
      attendance,
      participantName,
    };
  }

  async getMealSessions(eventId?: string, userId?: string): Promise<Meal[]> {
    // Build where clause to filter by assigned events
    const where: any = {};
    
    if (userId) {
      // Only return meal sessions for events the user is assigned to
      where.event = {
        staff: {
          some: {
            userId: userId,
          },
        },
      };
    }
    
    // If specific eventId is provided, add that filter too
    if (eventId) {
      where.eventId = eventId;
    }
    
    return this.prisma.meal.findMany({
      where,
      include: {
        attendances: {
          include: {
            registration: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            date: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async getCateringReports(filter?: CateringReportsFilter): Promise<CateringReports> {
    // Build where clause based on filter
    const where: any = {};
    
    if (filter?.eventId) {
      where.eventId = filter.eventId;
    }
    
    if (filter?.dateFrom || filter?.dateTo) {
      where.startTime = {};
      if (filter.dateFrom) {
        where.startTime.gte = filter.dateFrom;
      }
      if (filter.dateTo) {
        where.startTime.lte = filter.dateTo;
      }
    }

    if (filter?.searchTerm) {
      where.OR = [
        { sessionName: { contains: filter.searchTerm, mode: 'insensitive' } },
        { event: { name: { contains: filter.searchTerm, mode: 'insensitive' } } },
      ];
    }

    // Get all meals with attendances and registrations
    const meals = await this.prisma.meal.findMany({
      where,
      include: {
        event: true,
        attendances: {
          include: {
            registration: {
              include: {
                transactions: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });

    // Get all registrations for events (to calculate expected attendees)
    const eventIds = [...new Set(meals.map(meal => meal.eventId))];
    const allRegistrations = await this.prisma.registration.findMany({
      where: {
        eventId: { in: eventIds },
        transactions: {
          some: {
            paymentStatus: 'PAID',
          },
        },
      },
      include: {
        transactions: true,
        category: true,
      },
    });

    // Calculate summary metrics
    const totalEvents = eventIds.length;
    const totalMealSessions = meals.length;
    const totalParticipants = allRegistrations.length;
    const totalMealsServed = meals.reduce((sum, meal) => sum + (meal.attendances?.length || 0), 0);
    
    let totalAttendanceRate = 0;
    let validSessions = 0;
    
    // Generate meal session reports
    const mealSessionReports: MealSessionReport[] = meals.map(meal => {
      const expectedAttendees = allRegistrations.filter(reg => reg.eventId === meal.eventId).length;
      const actualAttendees = meal.attendances?.length || 0;
      const attendanceRate = expectedAttendees > 0 ? (actualAttendees / expectedAttendees) * 100 : 0;
      
      if (expectedAttendees > 0) {
        totalAttendanceRate += attendanceRate;
        validSessions++;
      }

      // Determine status based on current time and meal time
      const now = new Date();
      const mealStart = new Date(meal.startTime);
      const mealEnd = new Date(meal.endTime);
      
      let status = 'upcoming';
      if (now > mealEnd) {
        status = 'completed';
      } else if (now >= mealStart && now <= mealEnd) {
        status = 'in-progress';
      }

      return {
        id: meal.id,
        eventName: meal.event?.name || 'Unknown Event',
        mealName: meal.sessionName,
        date: meal.startTime,
        expectedAttendees,
        actualAttendees,
        attendanceRate,
        status,
      };
    });

    const averageAttendanceRate = validSessions > 0 ? totalAttendanceRate / validSessions : 0;

    // Calculate attendance by category (VIP, Regular, Student)
    const categoryStats = new Map<string, { expected: number; actual: number }>();
    
    allRegistrations.forEach(reg => {
      const category = reg.category?.name || 'Regular';
      if (!categoryStats.has(category)) {
        categoryStats.set(category, { expected: 0, actual: 0 });
      }
      categoryStats.get(category)!.expected++;
    });

    meals.forEach(meal => {
      meal.attendances?.forEach(attendance => {
        const category = attendance.registration.category?.name || 'Regular';
        if (categoryStats.has(category)) {
          categoryStats.get(category)!.actual++;
        }
      });
    });

    const byCategory: AttendanceByCategory[] = Array.from(categoryStats.entries()).map(([category, stats]) => ({
      category,
      expected: stats.expected,
      actual: stats.actual,
      rate: stats.expected > 0 ? (stats.actual / stats.expected) * 100 : 0,
    }));

    // Calculate attendance by time slot
    const timeSlotStats = new Map<string, { sessions: number; totalAttendance: number; totalExpected: number }>();
    
    meals.forEach(meal => {
      const hour = new Date(meal.startTime).getHours();
      let timeSlot = 'Other';
      
      if (hour >= 6 && hour < 11) {
        timeSlot = 'Breakfast';
      } else if (hour >= 11 && hour < 16) {
        timeSlot = 'Lunch';
      } else if (hour >= 16 && hour < 22) {
        timeSlot = 'Dinner';
      }

      if (!timeSlotStats.has(timeSlot)) {
        timeSlotStats.set(timeSlot, { sessions: 0, totalAttendance: 0, totalExpected: 0 });
      }

      const stats = timeSlotStats.get(timeSlot)!;
      stats.sessions++;
      stats.totalAttendance += meal.attendances?.length || 0;
      stats.totalExpected += allRegistrations.filter(reg => reg.eventId === meal.eventId).length;
    });

    const byTimeSlot: AttendanceByTimeSlot[] = Array.from(timeSlotStats.entries()).map(([timeSlot, stats]) => ({
      timeSlot,
      sessions: stats.sessions,
      avgAttendance: stats.totalExpected > 0 ? (stats.totalAttendance / stats.totalExpected) * 100 : 0,
    }));

    const summary: CateringReportSummary = {
      totalEvents,
      totalMealSessions,
      totalParticipants,
      totalMealsServed,
      averageAttendanceRate,
    };

    const attendanceAnalytics: AttendanceAnalytics = {
      byCategory,
      byTimeSlot,
    };

    return {
      summary,
      mealSessionReports,
      attendanceAnalytics,
    };
  }

  async startMealSession(id: string, userId: string): Promise<MealSessionActionResult> {
    try {
      // Find the meal session
      const meal = await this.prisma.meal.findUnique({
        where: { id },
        include: {
          event: {
            include: {
              staff: {
                where: { userId },
              },
            },
          },
        },
      });

      if (!meal) {
        return {
          success: false,
          message: 'Meal session not found',
        };
      }

      // Check if user is assigned to this event
      if (!meal.event.staff || meal.event.staff.length === 0) {
        return {
          success: false,
          message: 'You are not authorized to manage this meal session',
        };
      }

      // Check if meal is already active
      if (meal.isActive) {
        return {
          success: false,
          message: 'Meal session is already active',
        };
      }

      // Update meal to active status
      const updatedMeal = await this.prisma.meal.update({
        where: { id },
        data: {
          isActive: true,
          updatedAt: new Date(),
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              date: true,
            },
          },
          attendances: {
            include: {
              registration: true,
            },
          },
        },
      });

      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          eventId: meal.eventId,
          action: 'MEAL_SESSION_STARTED',
          details: { message: `Meal session started: ${meal.sessionName}` },
          performedBy: userId,
        },
      });

      return {
        success: true,
        message: `Meal session "${meal.sessionName}" started successfully`,
        meal: updatedMeal,
      };
    } catch (error) {
      console.error('Error starting meal session:', error);
      return {
        success: false,
        message: 'Failed to start meal session',
      };
    }
  }

  async endMealSession(id: string, userId: string): Promise<MealSessionActionResult> {
    try {
      // Find the meal session
      const meal = await this.prisma.meal.findUnique({
        where: { id },
        include: {
          event: {
            include: {
              staff: {
                where: { userId },
              },
            },
          },
        },
      });

      if (!meal) {
        return {
          success: false,
          message: 'Meal session not found',
        };
      }

      // Check if user is assigned to this event
      if (!meal.event.staff || meal.event.staff.length === 0) {
        return {
          success: false,
          message: 'You are not authorized to manage this meal session',
        };
      }

      // Check if meal is not active
      if (!meal.isActive) {
        return {
          success: false,
          message: 'Meal session is not currently active',
        };
      }

      // Update meal to inactive status
      const updatedMeal = await this.prisma.meal.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
              date: true,
            },
          },
          attendances: {
            include: {
              registration: true,
            },
          },
        },
      });

      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          eventId: meal.eventId,
          action: 'MEAL_SESSION_ENDED',
          details: { message: `Meal session ended: ${meal.sessionName}` },
          performedBy: userId,
        },
      });

      return {
        success: true,
        message: `Meal session "${meal.sessionName}" ended successfully`,
        meal: updatedMeal,
      };
    } catch (error) {
      console.error('Error ending meal session:', error);
      return {
        success: false,
        message: 'Failed to end meal session',
      };
    }
  }

  /**
   * Automatic meal session time-based management
   * Runs every minute to check and auto-end sessions that have passed their end time
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async autoManageMealSessions(): Promise<void> {
    try {
      const now = new Date();
      
      // Find all active meal sessions that have passed their end time
      const expiredSessions = await this.prisma.meal.findMany({
        where: {
          isActive: true,
          endTime: {
            lt: now, // Less than current time (expired)
          },
        },
        include: {
          event: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (expiredSessions.length === 0) {
        return; // No expired sessions to process
      }

      console.log(`Found ${expiredSessions.length} expired meal sessions to auto-end`);

      // Auto-end each expired session
      for (const session of expiredSessions) {
        try {
          await this.prisma.meal.update({
            where: { id: session.id },
            data: {
              isActive: false,
              updatedAt: now,
            },
          });

          // Create audit log for automatic session end
          await this.prisma.auditLog.create({
            data: {
              eventId: session.eventId,
              action: 'MEAL_SESSION_AUTO_ENDED',
              details: {
                message: `Meal session automatically ended due to time expiry: ${session.sessionName}`,
                endTime: session.endTime.toISOString(),
                autoEndedAt: now.toISOString(),
              },
              performedBy: 'SYSTEM', // System-performed action
            },
          });

          console.log(`Auto-ended meal session: ${session.sessionName} (${session.id})`);
        } catch (error) {
          console.error(`Failed to auto-end meal session ${session.id}:`, error);
        }
      }

      console.log(`Successfully auto-ended ${expiredSessions.length} meal sessions`);
    } catch (error) {
      console.error('Error in automatic meal session management:', error);
    }
  }
}
