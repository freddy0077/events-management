import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from '../../../prisma/prisma.service';

export enum StaffPermission {
  CREATE_REGISTRATION = 'CREATE_REGISTRATION',
  PROCESS_PAYMENT = 'PROCESS_PAYMENT',
  APPROVE_PAYMENT = 'APPROVE_PAYMENT',
  RECONCILE_PAYMENTS = 'RECONCILE_PAYMENTS',
  MANAGE_STAFF = 'MANAGE_STAFF',
  VIEW_REPORTS = 'VIEW_REPORTS',
  SCAN_QR_CODES = 'SCAN_QR_CODES',
  SERVE_MEALS = 'SERVE_MEALS',
  VERIFY_MEAL_ELIGIBILITY = 'VERIFY_MEAL_ELIGIBILITY',
  EXPORT_DATA = 'EXPORT_DATA',
  MANAGE_EVENTS = 'MANAGE_EVENTS',
  ASSIGN_EVENT_STAFF = 'ASSIGN_EVENT_STAFF',
  PRINT_BADGES = 'PRINT_BADGES',
  MANAGE_BADGES = 'MANAGE_BADGES',
}

export const STAFF_PERMISSIONS_KEY = 'staffPermissions';
export const StaffPermissions = (...permissions: StaffPermission[]) => 
  SetMetadata(STAFF_PERMISSIONS_KEY, permissions);

@Injectable()
export class StaffPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<StaffPermission[]>(
      STAFF_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Admins have all permissions
    if (user.role === 'ADMIN') {
      return true;
    }

    // Get event ID from arguments if available
    const args = ctx.getArgs();
    const eventId = args.eventId || args.input?.eventId;

    if (eventId) {
      // Check event-specific staff permissions
      const eventStaff = await this.prisma.eventStaff.findFirst({
        where: {
          eventId,
          userId: user.id,
          isActive: true,
        },
      });

      if (eventStaff) {
        // Check if user has required permissions for this event
        const userPermissions = Array.isArray(eventStaff.permissions) 
          ? eventStaff.permissions 
          : (eventStaff.permissions ? [eventStaff.permissions] : []);
        const hasEventPermission = requiredPermissions.some(permission => 
          userPermissions.includes(permission)
        );

        if (hasEventPermission) {
          return true;
        }

        // Check role-based permissions
        const rolePermissions = this.getRolePermissions(eventStaff.role);
        const hasRolePermission = requiredPermissions.some(permission => 
          rolePermissions.includes(permission)
        );

        if (hasRolePermission) {
          return true;
        }
      }
    }

    // Check global role permissions
    const globalPermissions = this.getGlobalRolePermissions(user.role);
    const hasGlobalPermission = requiredPermissions.some(permission => 
      globalPermissions.includes(permission)
    );

    if (hasGlobalPermission) {
      return true;
    }

    throw new ForbiddenException(
      `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`
    );
  }

  private getRolePermissions(role: string): StaffPermission[] {
    switch (role) {
      case 'ORGANIZER':
        return [
          StaffPermission.CREATE_REGISTRATION,
          StaffPermission.APPROVE_PAYMENT,
          StaffPermission.MANAGE_STAFF,
          StaffPermission.VIEW_REPORTS,
          StaffPermission.SCAN_QR_CODES,
          StaffPermission.EXPORT_DATA,
          StaffPermission.PRINT_BADGES,
          StaffPermission.MANAGE_BADGES,
        ];
      case 'MANAGER':
        return [
          StaffPermission.CREATE_REGISTRATION,
          StaffPermission.VIEW_REPORTS,
          StaffPermission.SCAN_QR_CODES,
          StaffPermission.EXPORT_DATA,
          StaffPermission.MANAGE_STAFF,
          StaffPermission.PRINT_BADGES,
          StaffPermission.MANAGE_BADGES,
        ];
      case 'SUPERVISOR':
      case 'COORDINATOR':
        return [
          StaffPermission.CREATE_REGISTRATION,
          StaffPermission.VIEW_REPORTS,
          StaffPermission.SCAN_QR_CODES,
          StaffPermission.EXPORT_DATA,
          StaffPermission.PRINT_BADGES,
          StaffPermission.MANAGE_BADGES,
        ];
      case 'STAFF':
        return [
          StaffPermission.CREATE_REGISTRATION,
          StaffPermission.SCAN_QR_CODES,
        ];
      case 'REGISTRATION_ONLY':
        return [
          StaffPermission.CREATE_REGISTRATION,
        ];
      case 'BADGE_PRINTER':
        return [
          StaffPermission.PRINT_BADGES,
          StaffPermission.MANAGE_BADGES,
        ];
      default:
        return [];
    }
  }

  private getGlobalRolePermissions(role: string): StaffPermission[] {
    switch (role) {
      case 'ADMIN':
        // System owner - full access to everything
        return Object.values(StaffPermission);
      case 'EVENT_ORGANIZER':
        // Event manager - manages assigned events, adds staff, oversees operations
        return [
          StaffPermission.MANAGE_EVENTS,
          StaffPermission.ASSIGN_EVENT_STAFF,
          StaffPermission.CREATE_REGISTRATION,
          StaffPermission.PROCESS_PAYMENT,
          StaffPermission.APPROVE_PAYMENT,
          StaffPermission.VIEW_REPORTS,
          StaffPermission.SCAN_QR_CODES,
          StaffPermission.SERVE_MEALS,
          StaffPermission.VERIFY_MEAL_ELIGIBILITY,
          StaffPermission.EXPORT_DATA,
          StaffPermission.PRINT_BADGES,
          StaffPermission.MANAGE_BADGES,
        ];
      case 'REGISTRATION_STAFF':
        // Registers participants, processes payments, prints QR tags
        return [
          StaffPermission.CREATE_REGISTRATION,
          StaffPermission.PROCESS_PAYMENT,
          StaffPermission.PRINT_BADGES,
          StaffPermission.MANAGE_BADGES,
          StaffPermission.SCAN_QR_CODES,
        ];
      case 'FINANCE_TEAM':
        // Monitors and reconciles payments received
        return [
          StaffPermission.VIEW_REPORTS,
          StaffPermission.RECONCILE_PAYMENTS,
          StaffPermission.APPROVE_PAYMENT,
          StaffPermission.EXPORT_DATA,
        ];
      case 'CATERING_TEAM':
        // Verifies eligibility during meal sessions via QR scans
        return [
          StaffPermission.SCAN_QR_CODES,
          StaffPermission.SERVE_MEALS,
          StaffPermission.VERIFY_MEAL_ELIGIBILITY,
        ];
      default:
        return [];
    }
  }
}
