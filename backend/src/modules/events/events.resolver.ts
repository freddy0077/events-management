import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';
import { Category } from './entities/category.entity';
import { EventStaff } from './entities/event-staff.entity';
import { DashboardStats } from './entities/dashboard-stats.entity';
import { EventDraft } from './entities/event-draft.entity';
import { CreateEventInput, UpdateEventInput, UpdateCategoryInput, SaveEventDraftInput, UpdateEventDraftInput, DashboardPaginationInput } from './dto/event.dto';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { StaffPermissionGuard, StaffPermissions, StaffPermission } from '../auth/guards/staff-permission.guard';
import { User } from '../auth/entities/user.entity';
import { Meal } from '../meals/entities/meal.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';
import { Audit } from '../../decorators/audit.decorator';

@Resolver(() => Event)
export class EventsResolver {
  constructor(
    private eventsService: EventsService,
    private prisma: PrismaService,
  ) {}

  @Mutation(() => Event)
  @UseGuards(GqlAuthGuard)
  @Audit({ 
    action: 'EVENT_CREATED', 
    resourceType: 'event',
    description: 'User created a new event',
    includeRequest: true 
  })
  async createEvent(
    @Args('input') createEventInput: CreateEventInput,
    @Context() context: any,
  ): Promise<any> {
    const userId = context.req.user.id;
    return this.eventsService.createEvent(userId, createEventInput);
  }

  @Query(() => [Event])
  async events(): Promise<any[]> {
    return this.eventsService.findAllEvents();
  }

  @Query(() => [Event])
  async activeEvents(): Promise<any[]> {
    return this.eventsService.findActiveEvents();
  }

  @Query(() => Event)
  async event(@Args('id', { type: () => ID }) id: string): Promise<any> {
    return this.eventsService.findEventById(id);
  }

  @Query(() => Event)
  async eventBySlug(@Args('slug') slug: string): Promise<any> {
    return this.eventsService.findEventBySlug(slug);
  }

  @Query(() => DashboardStats)
  async dashboardStats(
    @Args('pagination', { nullable: true }) pagination?: DashboardPaginationInput,
  ): Promise<DashboardStats> {
    return this.eventsService.getDashboardStats(pagination);
  }

  @Query(() => [Event])
  @UseGuards(GqlAuthGuard)
  async myAssignedEvents(@Context() context: any): Promise<any[]> {
    const userId = context.req.user.id;
    return this.eventsService.findEventsByStaffAssignment(userId);
  }

  @Mutation(() => Event)
  @UseGuards(GqlAuthGuard)
  async updateEvent(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') updateEventInput: UpdateEventInput,
  ): Promise<any> {
    return this.eventsService.updateEvent(id, updateEventInput);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteEvent(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.eventsService.deleteEvent(id);
  }

  @Mutation(() => Category)
  @UseGuards(GqlAuthGuard)
  async updateCategory(
    @Args('categoryId', { type: () => ID }) categoryId: string,
    @Args('input') updateCategoryInput: UpdateCategoryInput,
  ): Promise<Category> {
    return this.eventsService.updateCategory(categoryId, updateCategoryInput);
  }

  @ResolveField(() => Number)
  async totalRegistrations(@Parent() event: Event): Promise<number> {
    return await this.prisma.registration.count({
      where: { eventId: event.id }
    });
  }

  @ResolveField(() => Number)
  async paidRegistrations(@Parent() event: Event): Promise<number> {
    return await this.prisma.registration.count({
      where: {
        eventId: event.id,
        transactions: {
          some: {
            paymentStatus: PaymentStatus.PAID
          }
        }
      }
    });
  }

  @ResolveField(() => Number)
  async pendingRegistrations(@Parent() event: Event): Promise<number> {
    const totalRegistrations = await this.prisma.registration.count({
      where: { eventId: event.id }
    });
    
    const paidRegistrations = await this.prisma.registration.count({
      where: {
        eventId: event.id,
        transactions: {
          some: {
            paymentStatus: PaymentStatus.PAID
          }
        }
      }
    });
    
    const failedRegistrations = await this.prisma.registration.count({
      where: {
        eventId: event.id,
        transactions: {
          some: {
            paymentStatus: PaymentStatus.FAILED
          }
        }
      }
    });
    
    return totalRegistrations - paidRegistrations - failedRegistrations;
  }

  @ResolveField(() => Number)
  async failedRegistrations(@Parent() event: Event): Promise<number> {
    return await this.prisma.registration.count({
      where: {
        eventId: event.id,
        transactions: {
          some: {
            paymentStatus: PaymentStatus.FAILED
          }
        }
      }
    });
  }

  @ResolveField(() => Number)
  async approvedRegistrations(@Parent() event: Event): Promise<number> {
    // Approved registrations are the same as paid registrations in our system
    return this.paidRegistrations(event);
  }

  @ResolveField(() => String)
  status(@Parent() event: Event): string {
    return event.isActive ? 'ACTIVE' : 'INACTIVE';
  }

  @ResolveField(() => [Category])
  categories(@Parent() event: Event): Category[] {
    return event.categories || [];
  }

  @ResolveField(() => [Meal])
  meals(@Parent() event: Event): Meal[] {
    return event.meals || [];
  }

  @ResolveField(() => [EventStaff])
  staff(@Parent() event: Event): EventStaff[] {
    return event.staff || [];
  }

  // Event Manager Assignment Mutations
  @Mutation(() => EventStaff)
  @UseGuards(GqlAuthGuard, StaffPermissionGuard)
  @StaffPermissions(StaffPermission.ASSIGN_EVENT_STAFF)
  async assignEventManager(
    @Args('eventId', { type: () => ID }) eventId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @Context() context: any,
  ): Promise<EventStaff> {
    const assignedBy = context.req.user.id;
    return this.eventsService.assignEventManager(eventId, userId, assignedBy);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, StaffPermissionGuard)
  @StaffPermissions(StaffPermission.ASSIGN_EVENT_STAFF)
  async removeEventManager(
    @Args('eventId', { type: () => ID }) eventId: string,
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<boolean> {
    return this.eventsService.removeEventManager(eventId, userId);
  }

  // Event Manager Queries
  @Query(() => [EventStaff])
  @UseGuards(GqlAuthGuard, StaffPermissionGuard)
  @StaffPermissions(StaffPermission.VIEW_REPORTS)
  async eventManagers(
    @Args('eventId', { type: () => ID }) eventId: string,
  ): Promise<EventStaff[]> {
    return this.eventsService.getEventManagers(eventId);
  }

  @Query(() => [User])
  @UseGuards(GqlAuthGuard, StaffPermissionGuard)
  @StaffPermissions(StaffPermission.ASSIGN_EVENT_STAFF)
  async availableEventManagers(
    @Args('searchQuery', { type: () => String, nullable: true }) searchQuery?: string,
  ): Promise<User[]> {
    return this.eventsService.getAvailableEventManagers(searchQuery);
  }
}

@Resolver(() => Category)
export class CategoriesResolver {
  constructor(
    private eventsService: EventsService,
    private prisma: PrismaService,
  ) {}

  @ResolveField(() => Number)
  async currentCount(@Parent() category: Category): Promise<number> {
    return await this.prisma.registration.count({
      where: {
        categoryId: category.id,
        transactions: {
          some: {
            paymentStatus: PaymentStatus.PAID
          }
        }
      }
    });
  }

  // ===== EVENT DRAFT RESOLVERS =====

  @Mutation(() => EventDraft)
  @UseGuards(GqlAuthGuard)
  @Audit({ 
    action: 'EVENT_DRAFT_SAVED', 
    resourceType: 'event_draft',
    description: 'User saved event creation draft',
    includeRequest: true 
  })
  async saveEventDraft(
    @Args('input') saveEventDraftInput: SaveEventDraftInput,
    @Context() context: any,
  ): Promise<EventDraft> {
    const userId = context.req.user.id;
    return this.eventsService.saveEventDraft(userId, saveEventDraftInput);
  }

  @Query(() => EventDraft, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async getEventDraft(@Context() context: any): Promise<EventDraft | null> {
    const userId = context.req.user.id;
    return this.eventsService.getEventDraft(userId);
  }

  @Mutation(() => EventDraft)
  @UseGuards(GqlAuthGuard)
  @Audit({ 
    action: 'EVENT_DRAFT_UPDATED', 
    resourceType: 'event_draft',
    description: 'User updated event creation draft',
    includeRequest: true 
  })
  async updateEventDraft(
    @Args('input') updateEventDraftInput: UpdateEventDraftInput,
    @Context() context: any,
  ): Promise<EventDraft> {
    const userId = context.req.user.id;
    return this.eventsService.updateEventDraft(userId, updateEventDraftInput);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  @Audit({ 
    action: 'EVENT_DRAFT_DELETED', 
    resourceType: 'event_draft',
    description: 'User deleted event creation draft',
    includeRequest: true 
  })
  async deleteEventDraft(@Context() context: any): Promise<boolean> {
    const userId = context.req.user.id;
    return this.eventsService.deleteEventDraft(userId);
  }
}
