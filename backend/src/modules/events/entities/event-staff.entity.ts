import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { EventStaffRole } from '@prisma/client';
import GraphQLJSON from 'graphql-type-json';
import { User } from '../../auth/entities/user.entity';
import { Event } from './event.entity';

// Register the EventStaffRole enum for GraphQL
registerEnumType(EventStaffRole, {
  name: 'EventStaffRole',
  description: 'The role of a staff member in an event',
});

@ObjectType()
export class EventStaff {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  eventId: string;

  @Field(() => ID)
  userId: string;

  @Field(() => EventStaffRole)
  role: EventStaffRole;

  @Field(() => GraphQLJSON, { nullable: true })
  permissions?: any;

  @Field()
  isActive: boolean;

  @Field(() => ID)
  assignedBy: string;

  @Field()
  assignedAt: Date;

  // Relations (will be resolved by field resolvers)
  @Field(() => Event, { nullable: true })
  event?: Event;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => User, { nullable: true })
  assignedByUser?: User;
}
