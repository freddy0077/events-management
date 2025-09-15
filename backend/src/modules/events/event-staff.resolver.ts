import { Resolver, Query, Mutation, Args, ID, Context, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { EventStaffService } from './event-staff.service';
import { EventStaff } from './entities/event-staff.entity';
import { 
  AssignStaffInput, 
  UpdateStaffRoleInput, 
  StaffAssignmentPayload,
  EventStaffList 
} from './dto/event-staff.dto';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { Event } from './entities/event.entity';
import { User } from '../auth/entities/user.entity';

@Resolver(() => EventStaff)
export class EventStaffResolver {
  constructor(private eventStaffService: EventStaffService) {}

  @Mutation(() => StaffAssignmentPayload)
  @UseGuards(GqlAuthGuard)
  async assignStaffToEvent(
    @Args('input') assignStaffInput: AssignStaffInput,
    @Context() context: any,
  ): Promise<StaffAssignmentPayload> {
    try {
      const userId = context.req.user.id;
      const staff = await this.eventStaffService.assignStaffToEvent(userId, assignStaffInput);
      
      return {
        success: true,
        staff,
        message: 'Staff member assigned successfully',
      };
    } catch (error) {
      return {
        success: false,
        staff: null,
        message: error.message,
      };
    }
  }

  @Mutation(() => StaffAssignmentPayload)
  @UseGuards(GqlAuthGuard)
  async updateStaffRole(
    @Args('input') updateStaffRoleInput: UpdateStaffRoleInput,
    @Context() context: any,
  ): Promise<StaffAssignmentPayload> {
    try {
      const userId = context.req.user.id;
      const staff = await this.eventStaffService.updateStaffRole(userId, updateStaffRoleInput);
      
      return {
        success: true,
        staff,
        message: 'Staff role updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        staff: null,
        message: error.message,
      };
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async removeStaffFromEvent(
    @Args('staffId', { type: () => ID }) staffId: string,
    @Context() context: any,
  ): Promise<boolean> {
    const userId = context.req.user.id;
    return this.eventStaffService.removeStaffFromEvent(userId, staffId);
  }

  @Query(() => EventStaffList)
  @UseGuards(GqlAuthGuard)
  async eventStaff(
    @Args('eventId', { type: () => ID }) eventId: string,
    @Context() context: any,
  ): Promise<EventStaffList> {
    const userId = context.req.user.id;
    const staff = await this.eventStaffService.getEventStaff(eventId, userId);
    
    return {
      staff,
      total: staff.length,
    };
  }

  @Query(() => [EventStaff])
  @UseGuards(GqlAuthGuard)
  async myEventStaff(@Context() context: any): Promise<EventStaff[]> {
    const userId = context.req.user.id;
    return this.eventStaffService.getUserEventStaff(userId);
  }

  @Query(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async checkEventPermission(
    @Args('eventId', { type: () => ID }) eventId: string,
    @Args('requiredRole', { nullable: true }) requiredRole: string,
    @Context() context: any,
  ): Promise<boolean> {
    const userId = context.req.user.id;
    const result = await this.eventStaffService.checkUserEventPermission(
      userId, 
      eventId, 
      requiredRole as any
    );
    return result.hasAccess;
  }

  // Field resolvers for relations
  @ResolveField(() => Event, { nullable: true })
  event(@Parent() eventStaff: EventStaff): Event | null {
    // If the relation was included in the service, return it; otherwise null
    return (eventStaff as any).event ?? null;
  }

  @ResolveField(() => User, { nullable: true })
  user(@Parent() eventStaff: EventStaff): User | null {
    // If the relation was included in the service, return it; otherwise null
    return (eventStaff as any).user ?? null;
  }

  @ResolveField(() => User, { nullable: true })
  assignedByUser(@Parent() eventStaff: EventStaff): User | null {
    // If the relation was included in the service, return it; otherwise null
    return (eventStaff as any).assignedByUser ?? null;
  }
}
