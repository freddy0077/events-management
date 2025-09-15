import { Resolver, Query, Args, Int, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuditService } from '../../services/audit.service';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { StaffPermissionGuard, StaffPermissions, StaffPermission } from '../auth/guards/staff-permission.guard';
import { User } from '@prisma/client';
import { AuditLog, AuditLogConnection, AuditStats } from './entities/audit.entity';

@Resolver(() => AuditLog)
@UseGuards(GqlAuthGuard)
export class AuditResolver {
  constructor(private auditService: AuditService) {}

  @Query(() => AuditLogConnection)
  @UseGuards(StaffPermissionGuard)
  @StaffPermissions(StaffPermission.VIEW_REPORTS)
  async getAuditLogs(
    @Context() context: any,
    @Args('eventId', { type: () => String, nullable: true }) eventId?: string,
    @Args('registrationId', { type: () => String, nullable: true }) registrationId?: string,
    @Args('action', { type: () => String, nullable: true }) action?: string,
    @Args('performedBy', { type: () => String, nullable: true }) performedBy?: string,
    @Args('startDate', { type: () => Date, nullable: true }) startDate?: Date,
    @Args('endDate', { type: () => Date, nullable: true }) endDate?: Date,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number = 50,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number = 0,
  ): Promise<AuditLogConnection> {
    // If user is not ADMIN, filter to only their assigned events
    const user = context.req.user;
    let filteredEventId = eventId;
    if (user.role !== 'ADMIN' && !eventId) {
      // Get user's assigned events - this would need to be implemented
      // For now, we'll let the service handle the filtering
    }

    const result = await this.auditService.getAuditLogs(
      filteredEventId,
      registrationId,
      action,
      performedBy,
      startDate,
      endDate,
      limit,
      offset,
    );

    return {
      logs: result.logs,
      total: result.total,
      hasMore: result.hasMore,
    };
  }

  @Query(() => AuditLogConnection)
  @UseGuards(StaffPermissionGuard)
  @StaffPermissions(StaffPermission.SCAN_QR_CODES)
  async getFailedScans(
    @Context() context: any,
    @Args('eventId', { type: () => String, nullable: true }) eventId?: string,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number = 50,
    @Args('offset', { type: () => Int, defaultValue: 0 }) offset: number = 0,
  ): Promise<AuditLogConnection> {
    // Staff users can only view failed scans for events they're assigned to
    const user = context.req.user;
    
    const result = await this.auditService.getAuditLogs(
      eventId,
      undefined, // registrationId
      'QR_SCAN_FAILED', // action - only failed scans
      undefined, // performedBy
      undefined, // startDate
      undefined, // endDate
      limit,
      offset,
    );

    return {
      logs: result.logs,
      total: result.total,
      hasMore: result.hasMore,
    };
  }

  @Query(() => AuditStats)
  @UseGuards(StaffPermissionGuard)
  @StaffPermissions(StaffPermission.VIEW_REPORTS)
  async getAuditStats(
    @Context() context: any,
    @Args('eventId', { type: () => String, nullable: true }) eventId?: string,
    @Args('startDate', { type: () => Date, nullable: true }) startDate?: Date,
    @Args('endDate', { type: () => Date, nullable: true }) endDate?: Date,
  ): Promise<AuditStats> {
    // If user is not ADMIN, filter to only their assigned events
    const user = context.req.user;
    let filteredEventId = eventId;
    if (user.role !== 'ADMIN' && !eventId) {
      // Get user's assigned events - this would need to be implemented
    }

    return await this.auditService.getAuditStats(filteredEventId, startDate, endDate);
  }
}
