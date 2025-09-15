import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventInput, UpdateEventInput, UpdateCategoryInput, CreateEventMealInput, SaveEventDraftInput, UpdateEventDraftInput, DashboardPaginationInput } from './dto/event.dto';
import { Event, EventStaff, User, Role, EventDraft } from '@prisma/client';
import { Category as PrismaCategory } from '@prisma/client';
import { DashboardStats } from './entities/dashboard-stats.entity';
import { Category } from './entities/category.entity';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async createEvent(userId: string, createEventInput: CreateEventInput): Promise<Event> {
    const { categories, meals, staffAssignments, ...eventData } = createEventInput;

    // Check if slug already exists
    const existingEvent = await this.prisma.event.findUnique({
      where: { slug: eventData.slug },
    });

    if (existingEvent) {
      throw new BadRequestException('Event with this slug already exists');
    }

    // Prepare event data with proper date conversions
    const eventCreateData: any = {
      ...eventData,
      createdBy: userId, // Set the event creator
      date: new Date(eventData.date),
      endDate: eventData.endDate ? new Date(eventData.endDate) : undefined,
      registrationDeadline: eventData.registrationDeadline ? new Date(eventData.registrationDeadline) : undefined,
      paymentDeadline: eventData.paymentDeadline ? new Date(eventData.paymentDeadline) : undefined,
      fullPaymentDeadline: eventData.fullPaymentDeadline ? new Date(eventData.fullPaymentDeadline) : undefined,
      categories: {
        create: categories,
      },
    };

    // Add meals if provided
    if (meals && meals.length > 0) {
      // Track session names to ensure uniqueness
      const sessionNameCounts = new Map<string, number>();
      
      eventCreateData.meals = {
        create: meals.map(meal => {
          let sessionName = meal.name;
          
          // Check if this session name already exists
          if (sessionNameCounts.has(sessionName)) {
            const count = sessionNameCounts.get(sessionName)! + 1;
            sessionNameCounts.set(sessionName, count);
            sessionName = `${meal.name} ${count}`;
          } else {
            sessionNameCounts.set(sessionName, 1);
          }
          
          return {
            sessionName,
            startTime: new Date(meal.beginTime),
            endTime: new Date(meal.endTime),
            description: meal.description,
          };
        }),
      };
    }

    // Create event with categories and meals
    const event = await this.prisma.event.create({
      data: eventCreateData,
      include: {
        categories: true,
        registrations: true,
        meals: true,
        staff: true,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    // Assign staff to the event if provided
    if (staffAssignments && staffAssignments.length > 0) {
      const staffData = staffAssignments.map(assignment => ({
        eventId: event.id,
        userId: assignment.userId,
        role: assignment.role,
        permissions: assignment.permissions,
        assignedBy: userId,
      }));

      await this.prisma.eventStaff.createMany({
        data: staffData,
      });
    }

    // Create audit log for event creation
    await this.prisma.auditLog.create({
      data: {
        eventId: event.id,
        action: 'EVENT_CREATED',
        details: {
          message: `Event "${event.name}" created`,
          eventName: event.name,
          staffAssigned: staffAssignments?.length || 0,
        },
        performedBy: userId,
      },
    });

    // Clean up any existing draft for this user since event was successfully created
    try {
      await this.deleteEventDraft(userId);
    } catch (error) {
      // Ignore errors - draft cleanup is not critical
      console.log('Draft cleanup after event creation failed:', error);
    }

    // Return event with staff included
    return this.prisma.event.findUnique({
      where: { id: event.id },
      include: {
        categories: true,
        registrations: true,
        meals: true,
        staff: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });
  }

  async findAllEvents(): Promise<Event[]> {
    return this.prisma.event.findMany({
      include: {
        categories: true,
        registrations: {
          include: {
            transactions: {
              where: { paymentStatus: 'PAID' }
            }
          },
        },
        meals: true,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findActiveEvents(): Promise<Event[]> {
    return this.prisma.event.findMany({
      where: { isActive: true },
      include: {
        categories: {
          where: { isActive: true },
        },
        registrations: {
          include: {
            transactions: {
              where: { paymentStatus: 'PAID' }
            }
          },
        },
        meals: true,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async findEventById(id: string): Promise<Event> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        categories: true,
        registrations: true,
        meals: true,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async findEventBySlug(slug: string): Promise<Event> {
    const event = await this.prisma.event.findUnique({
      where: { slug },
      include: {
        categories: {
          where: { isActive: true },
        },
        registrations: {
          include: {
            transactions: {
              where: { paymentStatus: 'PAID' }
            }
          },
        },
        meals: true,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async updateEvent(id: string, updateEventInput: UpdateEventInput): Promise<Event> {
    const existingEvent = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      throw new NotFoundException('Event not found');
    }

    // Check if slug is being updated and if it conflicts
    if (updateEventInput.slug && updateEventInput.slug !== existingEvent.slug) {
      const conflictingEvent = await this.prisma.event.findUnique({
        where: { slug: updateEventInput.slug },
      });

      if (conflictingEvent) {
        throw new BadRequestException('Event with this slug already exists');
      }
    }

    const updateData: any = { ...updateEventInput };
    if (updateEventInput.date) {
      updateData.date = new Date(updateEventInput.date);
    }

    return this.prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        categories: true,
        registrations: true,
        meals: true,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });
  }

  async deleteEvent(id: string): Promise<boolean> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        registrations: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if event has registrations
    if (event.registrations.length > 0) {
      throw new BadRequestException('Cannot delete event with existing registrations');
    }

    await this.prisma.event.delete({
      where: { id },
    });

    return true;
  }

  async updateCategory(categoryId: string, updateCategoryInput: UpdateCategoryInput): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id: categoryId },
      data: updateCategoryInput,
      include: {
        event: true,
        registrations: true,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    return Category.fromPrisma(updatedCategory);
  }

  async getEventStats(eventId: string) {
    const event = await this.findEventById(eventId);
    
    const stats = await this.prisma.registration.groupBy({
      by: ['categoryId'],
      where: { eventId },
      _count: true,
    });

    const categoryStats = await this.prisma.category.findMany({
      where: { eventId },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    // Get approved registrations count by checking transactions
    const approvedRegistrations = await this.prisma.registration.count({
      where: {
        eventId,
        transactions: {
          some: {
            paymentStatus: 'PAID',
          },
        },
      },
    });

    return {
      event,
      registrationStats: stats,
      categoryStats,
      totalRegistrations: stats.reduce((sum, stat) => sum + stat._count, 0),
      approvedRegistrations,
    };
  }

  async getDashboardStats(pagination?: DashboardPaginationInput): Promise<DashboardStats> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    // Previous month for growth calculations
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Pagination parameters with defaults
    const eventsPage = pagination?.eventsPage || 1;
    const eventsLimit = pagination?.eventsLimit || 5;
    const registrationsPage = pagination?.registrationsPage || 1;
    const registrationsLimit = pagination?.registrationsLimit || 10;

    // Calculate offsets
    const eventsOffset = (eventsPage - 1) * eventsLimit;
    const registrationsOffset = (registrationsPage - 1) * registrationsLimit;

    // Basic metrics
    const totalEvents = await this.prisma.event.count();
    const activeEvents = await this.prisma.event.count({
      where: { isActive: true },
    });
    const totalRegistrations = await this.prisma.registration.count();

    // Revenue calculations
    const paidTransactions = await this.prisma.transaction.findMany({
      where: { paymentStatus: 'PAID' },
      select: { amount: true, createdAt: true },
    });

    const totalRevenue = paidTransactions.reduce((sum, transaction) => {
      return sum + (transaction.amount?.toNumber() || 0);
    }, 0);

    // Today's activity metrics
    const todayRegistrations = await this.prisma.registration.count({
      where: {
        createdAt: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });

    const todayRevenue = paidTransactions
      .filter(t => t.createdAt >= todayStart && t.createdAt < todayEnd)
      .reduce((sum, transaction) => sum + (transaction.amount?.toNumber() || 0), 0);

    // QR Scans today (from meal attendance)
    const todayScans = await this.prisma.mealAttendance.count({
      where: {
        scannedAt: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });

    // Active staff (users with staff assignments)
    const activeStaffData = await this.prisma.eventStaff.findMany({
      where: { isActive: true },
      distinct: ['userId'],
      select: { userId: true },
    });
    const activeStaff = activeStaffData.length;

    // Growth calculations
    const lastMonthRegistrations = await this.prisma.registration.count({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lt: lastMonthEnd,
        },
      },
    });

    const thisMonthRegistrations = await this.prisma.registration.count({
      where: {
        createdAt: {
          gte: thisMonthStart,
        },
      },
    });

    const lastMonthRevenue = paidTransactions
      .filter(t => t.createdAt >= lastMonthStart && t.createdAt < lastMonthEnd)
      .reduce((sum, transaction) => sum + (transaction.amount?.toNumber() || 0), 0);

    const thisMonthRevenue = paidTransactions
      .filter(t => t.createdAt >= thisMonthStart)
      .reduce((sum, transaction) => sum + (transaction.amount?.toNumber() || 0), 0);

    // Calculate growth percentages
    const registrationGrowth = lastMonthRegistrations > 0 
      ? ((thisMonthRegistrations - lastMonthRegistrations) / lastMonthRegistrations) * 100 
      : null;

    const revenueGrowth = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : null;

    // Additional metrics
    const totalStaff = await this.prisma.user.count({
      where: {
        role: { in: ['REGISTRATION_STAFF', 'FINANCE_TEAM', 'CATERING_TEAM', 'EVENT_ORGANIZER'] },
      },
    });

    const upcomingEvents = await this.prisma.event.count({
      where: {
        date: { gt: now },
        isActive: true,
      },
    });

    const completedEvents = await this.prisma.event.count({
      where: {
        date: { lt: now },
      },
    });

    // Event completion rate (events that actually happened vs planned)
    const totalPlannedEvents = await this.prisma.event.count({
      where: {
        date: { lt: now },
      },
    });
    const eventCompletionRate = totalPlannedEvents > 0 ? (completedEvents / totalPlannedEvents) * 100 : null;

    // Average event capacity
    const eventsWithCapacity = await this.prisma.event.findMany({
      where: { maxCapacity: { not: null } },
      select: { maxCapacity: true },
    });
    const averageEventCapacity = eventsWithCapacity.length > 0
      ? eventsWithCapacity.reduce((sum, event) => sum + (event.maxCapacity || 0), 0) / eventsWithCapacity.length
      : 0;

    // Average registration value
    const averageRegistrationValue = totalRegistrations > 0 ? totalRevenue / totalRegistrations : 0;

    // Pending payments
    const pendingPayments = await this.prisma.registration.count({
      where: {
        OR: [
          { transactions: { none: {} } },
          { 
            transactions: {
              every: {
                paymentStatus: { in: ['PENDING', 'FAILED'] }
              }
            }
          }
        ]
      },
    });

    const pendingTransactions = await this.prisma.transaction.findMany({
      where: { paymentStatus: 'PENDING' },
      select: { amount: true },
    });

    const pendingPaymentAmount = pendingTransactions.reduce((sum, transaction) => {
      return sum + (transaction.amount?.toNumber() || 0);
    }, 0);

    // Total QR scans (all time)
    const totalQRScans = await this.prisma.mealAttendance.count();

    // Total badges printed (assuming we track this - for now using registration count as proxy)
    const totalBadgesPrinted = await this.prisma.registration.count({
      where: {
        transactions: {
          some: {
            paymentStatus: 'PAID'
          }
        }
      }
    });

    // Get total counts for pagination
    const totalEventsCount = await this.prisma.event.count();
    const totalRegistrationsCount = await this.prisma.registration.count();

    // Get paginated recent registrations
    const recentRegistrations = await this.prisma.registration.findMany({
      skip: registrationsOffset,
      take: registrationsLimit,
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: { name: true },
        },
        category: {
          select: { name: true, price: true },
        },
      },
    });

    // Get paginated recent events
    const recentEvents = await this.prisma.event.findMany({
      skip: eventsOffset,
      take: eventsLimit,
      orderBy: { createdAt: 'desc' },
      include: {
        registrations: {
          include: {
            transactions: {
              where: { paymentStatus: 'PAID' }
            }
          }
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    // Calculate pagination metadata
    const eventsTotalPages = Math.ceil(totalEventsCount / eventsLimit);
    const registrationsTotalPages = Math.ceil(totalRegistrationsCount / registrationsLimit);

    const recentEventsPagination = {
      total: totalEventsCount,
      page: eventsPage,
      limit: eventsLimit,
      totalPages: eventsTotalPages,
      hasNext: eventsPage < eventsTotalPages,
      hasPrev: eventsPage > 1,
    };

    const recentRegistrationsPagination = {
      total: totalRegistrationsCount,
      page: registrationsPage,
      limit: registrationsLimit,
      totalPages: registrationsTotalPages,
      hasNext: registrationsPage < registrationsTotalPages,
      hasPrev: registrationsPage > 1,
    };

    // Transform recent events to include computed fields
    const transformedRecentEvents = recentEvents.map(event => ({
      ...event,
      totalRegistrations: event._count.registrations,
      approvedRegistrations: event.registrations.filter(r => r.transactions.length > 0).length,
      status: event.isActive ? 'ACTIVE' : 'INACTIVE',
    }));

    return {
      // Basic metrics
      totalEvents,
      totalRegistrations,
      totalRevenue,
      activeEvents,
      recentRegistrations,
      recentEvents: transformedRecentEvents,
      
      // Pagination metadata
      recentEventsPagination,
      recentRegistrationsPagination,
      
      // Today's activity
      todayRegistrations,
      todayScans,
      activeStaff,
      todayRevenue,
      
      // Growth metrics
      revenueGrowth,
      registrationGrowth,
      eventCompletionRate,
      
      // Additional metrics
      totalStaff,
      upcomingEvents,
      completedEvents,
      averageEventCapacity,
      averageRegistrationValue,
      pendingPayments,
      pendingPaymentAmount,
      totalQRScans,
      totalBadgesPrinted,
    };
  }

  async findEventsByStaffAssignment(userId: string): Promise<Event[]> {
    console.log('🔍 Finding events for staff user:', userId);
    
    // Find events where the user is assigned as staff
    const events = await this.prisma.event.findMany({
      where: {
        staff: {
          some: {
            userId: userId,
            isActive: true,
          },
        },
      },
      include: {
        categories: true,
        meals: true,
        staff: {
          where: {
            userId: userId,
          },
          select: {
            id: true,
            role: true,
            permissions: true,
            isActive: true,
            assignedAt: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    console.log(`📊 Found ${events.length} events for user ${userId}:`, 
      events.map(e => ({ id: e.id, name: e.name, staffCount: e.staff?.length }))
    );

    // Transform events to include computed fields
    return events.map(event => ({
      ...event,
      totalRegistrations: event._count.registrations,
      status: event.isActive ? 'ACTIVE' : 'INACTIVE',
    }));
  }

  async assignEventManager(eventId: string, userId: string, assignedBy: string): Promise<EventStaff> {
    // Check if event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user exists and has EVENT_ORGANIZER role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    if (user.role !== 'EVENT_ORGANIZER') {
      throw new BadRequestException('User must have EVENT_ORGANIZER role to be assigned as event manager');
    }

    // Check if assignment already exists
    const existingAssignment = await this.prisma.eventStaff.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existingAssignment) {
      // Update existing assignment to make it active
      return this.prisma.eventStaff.update({
        where: { id: existingAssignment.id },
        data: {
          isActive: true,
          assignedBy,
          assignedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          event: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    }

    // Create new assignment
    return this.prisma.eventStaff.create({
      data: {
        eventId,
        userId,
        role: 'ORGANIZER',
        isActive: true,
        assignedBy,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async removeEventManager(eventId: string, userId: string): Promise<boolean> {
    // Check if assignment exists
    const assignment = await this.prisma.eventStaff.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Event manager assignment not found');
    }

    // Deactivate the assignment instead of deleting it for audit purposes
    await this.prisma.eventStaff.update({
      where: { id: assignment.id },
      data: { isActive: false },
    });

    return true;
  }

  async getEventManagers(eventId: string): Promise<EventStaff[]> {
    return this.prisma.eventStaff.findMany({
      where: {
        eventId,
        role: 'ORGANIZER',
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            date: true,
            venue: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });
  }

  async getAvailableEventManagers(searchQuery?: string): Promise<Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'role' | 'isActive' | 'createdAt' | 'updatedAt'>[]> {
    const whereClause: any = {
      role: Role.EVENT_ORGANIZER,
      isActive: true,
    };

    // Add search functionality if query is provided
    if (searchQuery && searchQuery.trim().length > 0) {
      const searchTerm = searchQuery.trim();
      whereClause.OR = [
        {
          firstName: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        // Support searching full name
        {
          AND: [
            {
              firstName: {
                contains: searchTerm.split(' ')[0],
                mode: 'insensitive',
              },
            },
            {
              lastName: {
                contains: searchTerm.split(' ').slice(1).join(' ') || searchTerm.split(' ')[0],
                mode: 'insensitive',
              },
            },
          ],
        },
      ];
    }

    return this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
      ],
      take: 50, // Limit results for performance
    });
  }

  // ===== EVENT DRAFT METHODS =====

  async saveEventDraft(userId: string, saveEventDraftInput: SaveEventDraftInput): Promise<EventDraft> {
    const { draftData, currentStep } = saveEventDraftInput;
    
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Upsert the draft (create or update if exists)
    return this.prisma.eventDraft.upsert({
      where: { userId },
      create: {
        userId,
        draftData,
        currentStep,
        expiresAt,
        lastSavedAt: new Date(),
      },
      update: {
        draftData,
        currentStep,
        lastSavedAt: new Date(),
        expiresAt, // Extend expiration on each save
      },
    });
  }

  async getEventDraft(userId: string): Promise<EventDraft | null> {
    const draft = await this.prisma.eventDraft.findUnique({
      where: { userId },
    });

    // Check if draft has expired
    if (draft && draft.expiresAt < new Date()) {
      // Delete expired draft
      await this.prisma.eventDraft.delete({
        where: { id: draft.id },
      });
      return null;
    }

    return draft;
  }

  async updateEventDraft(userId: string, updateEventDraftInput: UpdateEventDraftInput): Promise<EventDraft> {
    const { draftData, currentStep } = updateEventDraftInput;

    const existingDraft = await this.prisma.eventDraft.findUnique({
      where: { userId },
    });

    if (!existingDraft) {
      throw new NotFoundException('Event draft not found');
    }

    // Extend expiration on each update
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.prisma.eventDraft.update({
      where: { userId },
      data: {
        ...(draftData && { draftData }),
        ...(currentStep && { currentStep }),
        lastSavedAt: new Date(),
        expiresAt,
      },
    });
  }

  async deleteEventDraft(userId: string): Promise<boolean> {
    try {
      await this.prisma.eventDraft.delete({
        where: { userId },
      });
      return true;
    } catch (error) {
      // Draft doesn't exist, which is fine
      return false;
    }
  }

  async cleanupExpiredDrafts(): Promise<number> {
    const result = await this.prisma.eventDraft.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }
}
