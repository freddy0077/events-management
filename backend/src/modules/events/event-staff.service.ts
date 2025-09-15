import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AssignStaffInput, UpdateStaffRoleInput } from './dto/event-staff.dto';
import { EventStaff, EventStaffRole } from '@prisma/client';

@Injectable()
export class EventStaffService {
  constructor(private prisma: PrismaService) {}

  async assignStaffToEvent(
    assignerId: string,
    assignStaffInput: AssignStaffInput,
  ): Promise<EventStaff> {
    const { eventId, userId, role, permissions } = assignStaffInput;
    
    console.log('🚀 Starting staff assignment process:', {
      assignerId,
      assignStaffInput: { eventId, userId, role, permissions }
    });

    try {

    // Verify the event exists and the assigner has permission
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: true,
        staff: {
          where: { userId: assignerId, isActive: true },
        },
      },
    });

    if (!event) {
      console.log('❌ Event not found:', { eventId });
      throw new NotFoundException('Event not found');
    }

    console.log('✅ Event found:', { 
      eventId: event.id, 
      eventName: event.name, 
      createdBy: event.createdBy,
      staffCount: event.staff?.length 
    });

    // Check if assigner has permission (event creator or manager/organizer)
    const isCreator = event.createdBy === assignerId;
    const assignerStaff = event.staff.find(s => s.userId === assignerId);
    const hasPermission = isCreator || 
      (assignerStaff && ['ORGANIZER', 'MANAGER'].includes(assignerStaff.role));

    console.log('🔐 Permission check:', {
      assignerId,
      isCreator,
      assignerStaff: assignerStaff ? { 
        id: assignerStaff.id, 
        role: assignerStaff.role, 
        isActive: assignerStaff.isActive 
      } : null,
      hasPermission
    });

    if (!hasPermission) {
      console.log('❌ Permission denied for assigner:', { assignerId, eventId });
      throw new ForbiddenException('You do not have permission to assign staff to this event');
    }

    // Verify the user to be assigned exists
    const userToAssign = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToAssign) {
      console.log('❌ User to assign not found:', { userId });
      throw new NotFoundException('User to assign not found');
    }

    console.log('✅ User to assign found:', { 
      userId: userToAssign.id, 
      email: userToAssign.email,
      role: userToAssign.role 
    });

    // Check if user is already assigned to this event
    const existingAssignment = await this.prisma.eventStaff.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existingAssignment) {
      console.log('❌ User already assigned to event:', {
        userId,
        eventId,
        existingAssignment: {
          id: existingAssignment.id,
          role: existingAssignment.role,
          isActive: existingAssignment.isActive
        }
      });
      throw new BadRequestException('User is already assigned to this event');
    }

    // Create the staff assignment
    console.log('🔄 Creating staff assignment:', {
      eventId,
      userId,
      role,
      permissions,
      assignedBy: assignerId,
    });
    
    const staffAssignment = await this.prisma.eventStaff.create({
      data: {
        eventId,
        userId,
        role,
        permissions,
        assignedBy: assignerId,
      },
      include: {
        user: true,
        event: true,
      },
    });
    
    console.log('✅ Staff assignment created successfully:', {
      id: staffAssignment.id,
      eventId: staffAssignment.eventId,
      userId: staffAssignment.userId,
      role: staffAssignment.role,
      isActive: staffAssignment.isActive
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        eventId,
        action: 'STAFF_ASSIGNED',
        details: {
          message: `Staff member ${userToAssign.email} assigned with role ${role}`,
          assignedUserId: userId,
          assignedRole: role,
        },
        performedBy: assignerId,
      },
    });

    return staffAssignment;
    
    } catch (error) {
      console.error('💥 Error in assignStaffToEvent:', {
        assignerId,
        assignStaffInput: { eventId, userId, role, permissions },
        error: error.message,
        stack: error.stack
      });
      throw error; // Re-throw the original error
    }
  }

  async updateStaffRole(
    updaterId: string,
    updateStaffRoleInput: UpdateStaffRoleInput,
  ): Promise<EventStaff> {
    const { staffId, role, permissions, isActive } = updateStaffRoleInput;

    // Find the staff assignment
    const staffAssignment = await this.prisma.eventStaff.findUnique({
      where: { id: staffId },
      include: {
        event: {
          include: {
            staff: {
              where: { userId: updaterId, isActive: true },
            },
          },
        },
        user: true,
      },
    });

    if (!staffAssignment) {
      throw new NotFoundException('Staff assignment not found');
    }

    // Check if updater has permission
    const isCreator = staffAssignment.event.createdBy === updaterId;
    const updaterStaff = staffAssignment.event.staff.find(s => s.userId === updaterId);
    const hasPermission = isCreator || 
      (updaterStaff && ['ORGANIZER', 'MANAGER'].includes(updaterStaff.role));

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to update staff roles for this event');
    }

    // Update the staff assignment
    const updatedStaff = await this.prisma.eventStaff.update({
      where: { id: staffId },
      data: {
        role,
        permissions,
        isActive,
      },
      include: {
        user: true,
        event: true,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        eventId: staffAssignment.eventId,
        action: 'STAFF_ROLE_UPDATED',
        details: {
          message: `Staff member ${staffAssignment.user.email} role updated to ${role}`,
          previousRole: staffAssignment.role,
          newRole: role,
          isActive,
        },
        performedBy: updaterId,
      },
    });

    return updatedStaff;
  }

  async removeStaffFromEvent(
    removerId: string,
    staffId: string,
  ): Promise<boolean> {
    // Find the staff assignment
    const staffAssignment = await this.prisma.eventStaff.findUnique({
      where: { id: staffId },
      include: {
        event: {
          include: {
            staff: {
              where: { userId: removerId, isActive: true },
            },
          },
        },
        user: true,
      },
    });

    if (!staffAssignment) {
      throw new NotFoundException('Staff assignment not found');
    }

    // Check if remover has permission
    const isCreator = staffAssignment.event.createdBy === removerId;
    const removerStaff = staffAssignment.event.staff.find(s => s.userId === removerId);
    const hasPermission = isCreator || 
      (removerStaff && ['ORGANIZER', 'MANAGER'].includes(removerStaff.role));

    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to remove staff from this event');
    }

    // Remove the staff assignment
    await this.prisma.eventStaff.delete({
      where: { id: staffId },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        eventId: staffAssignment.eventId,
        action: 'STAFF_REMOVED',
        details: {
          message: `Staff member ${staffAssignment.user.email} removed from event`,
          removedUserId: staffAssignment.userId,
          previousRole: staffAssignment.role,
        },
        performedBy: removerId,
      },
    });

    return true;
  }

  async getEventStaff(eventId: string, requesterId: string): Promise<EventStaff[]> {
    // Verify the event exists and the requester has access
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        staff: {
          where: { userId: requesterId, isActive: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if requester has access to view staff
    const isCreator = event.createdBy === requesterId;
    const requesterStaff = event.staff.find(s => s.userId === requesterId);
    const hasAccess = isCreator || requesterStaff;

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to view staff for this event');
    }

    return this.prisma.eventStaff.findMany({
      where: { eventId },
      include: {
        user: true,
      },
      orderBy: [
        { role: 'asc' },
        { assignedAt: 'desc' },
      ],
    });
  }

  async getUserEventStaff(userId: string): Promise<EventStaff[]> {
    return this.prisma.eventStaff.findMany({
      where: { 
        userId,
        isActive: true,
      },
      include: {
        event: true,
      },
      orderBy: { assignedAt: 'desc' },
    });
  }

  async checkUserEventPermission(
    userId: string,
    eventId: string,
    requiredRole?: EventStaffRole,
  ): Promise<{ hasAccess: boolean; role?: EventStaffRole }> {
    // Check if user is the event creator
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (event?.createdBy === userId) {
      return { hasAccess: true, role: EventStaffRole.ORGANIZER };
    }

    // Check staff assignment
    const staffAssignment = await this.prisma.eventStaff.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (!staffAssignment || !staffAssignment.isActive) {
      return { hasAccess: false };
    }

    // If specific role is required, check hierarchy
    if (requiredRole) {
      const roleHierarchy = {
        [EventStaffRole.STAFF]: 1,
        [EventStaffRole.SUPERVISOR]: 2,
        [EventStaffRole.MANAGER]: 3,
        [EventStaffRole.ORGANIZER]: 4,
      };

      const hasRequiredRole = roleHierarchy[staffAssignment.role] >= roleHierarchy[requiredRole];
      return { hasAccess: hasRequiredRole, role: staffAssignment.role };
    }

    return { hasAccess: true, role: staffAssignment.role };
  }
}
