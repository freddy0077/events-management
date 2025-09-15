import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditActionType, CreateAuditLogInput } from './dto/audit.dto';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create an audit log entry
   */
  async createAuditLog(input: CreateAuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          eventId: input.eventId,
          registrationId: input.registrationId,
          action: input.action,
          details: input.details,
          performedBy: input.performedBy,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      });
    } catch (error) {
      // Log error but don't throw - audit logging should not break main functionality
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Log user authentication events
   */
  async logAuthEvent(
    action: 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'FAILED_LOGIN',
    userId: string,
    details: any = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createAuditLog({
      action,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
      performedBy: userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log event management actions
   */
  async logEventAction(
    action: AuditActionType,
    eventId: string,
    userId: string,
    details: any = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createAuditLog({
      action,
      eventId,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
      performedBy: userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log registration actions
   */
  async logRegistrationAction(
    action: AuditActionType,
    registrationId: string,
    eventId: string,
    userId: string,
    details: any = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createAuditLog({
      action,
      eventId,
      registrationId,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
      performedBy: userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log meal/catering actions
   */
  async logMealAction(
    action: AuditActionType,
    mealId: string,
    registrationId: string,
    eventId: string,
    userId: string,
    details: any = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createAuditLog({
      action,
      eventId,
      registrationId,
      details: {
        mealId,
        ...details,
        timestamp: new Date().toISOString(),
      },
      performedBy: userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log QR code actions
   */
  async logQRAction(
    action: 'QR_GENERATED' | 'QR_SCANNED' | 'QR_VALIDATED' | 'QR_REGENERATED',
    registrationId: string,
    eventId: string,
    userId: string,
    details: any = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createAuditLog({
      action,
      eventId,
      registrationId,
      details: {
        ...details,
        timestamp: new Date().toISOString(),
      },
      performedBy: userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log payment actions
   */
  async logPaymentAction(
    action: 'PAYMENT_PROCESSED' | 'PAYMENT_CONFIRMED' | 'PAYMENT_REFUNDED' | 'PAYMENT_FAILED',
    transactionId: string,
    registrationId: string,
    eventId: string,
    userId: string,
    details: any = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createAuditLog({
      action,
      eventId,
      registrationId,
      details: {
        transactionId,
        ...details,
        timestamp: new Date().toISOString(),
      },
      performedBy: userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log staff management actions
   */
  async logStaffAction(
    action: 'STAFF_ASSIGNED' | 'STAFF_REMOVED' | 'STAFF_ROLE_CHANGED',
    eventId: string,
    targetUserId: string,
    performedBy: string,
    details: any = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.createAuditLog({
      action,
      eventId,
      details: {
        targetUserId,
        ...details,
        timestamp: new Date().toISOString(),
      },
      performedBy,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(
    eventId?: string,
    registrationId?: string,
    action?: string,
    performedBy?: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 50,
    offset: number = 0
  ) {
    const where: any = {};

    if (eventId) where.eventId = eventId;
    if (registrationId) where.registrationId = registrationId;
    if (action) where.action = action;
    if (performedBy) where.performedBy = performedBy;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              name: true,
            },
          },
          registration: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // Fetch user details for performedBy
    const userIds = Array.from(new Set(logs.map(l => l.performedBy).filter(Boolean)));
    let userMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });
      userMap = users.reduce((acc, u) => {
        acc[u.id] = {
          ...u,
          fullName: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || u.id,
        };
        return acc;
      }, {} as Record<string, any>);
    }

    const logsWithUser = logs.map((log: any) => ({
      ...log,
      performedByUser: userMap[log.performedBy] || null,
    }));

    return {
      logs: logsWithUser,
      total,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(eventId?: string, startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (eventId) where.eventId = eventId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [
      totalLogs,
      actionCounts,
      userCounts,
    ] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: {
          action: true,
        },
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
      }),
      this.prisma.auditLog.groupBy({
        by: ['performedBy'],
        where,
        _count: {
          performedBy: true,
        },
        orderBy: {
          _count: {
            performedBy: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      totalLogs,
      actionCounts: actionCounts.map(item => ({
        action: item.action,
        count: item._count.action,
      })),
      topUsers: userCounts.map(item => ({
        userId: item.performedBy,
        count: item._count.performedBy,
      })),
    };
  }
}
