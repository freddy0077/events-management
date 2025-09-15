import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Event } from '../../events/entities/event.entity';

@ObjectType()
export class Meal {
  @Field(() => ID)
  id: string;

  @Field()
  eventId: string;

  @Field()
  sessionName: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  sessionTime?: string;

  @Field()
  startTime: Date;

  @Field()
  endTime: Date;

  @Field(() => Int, { nullable: true })
  maxCapacity?: number;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  status?: string;

  @Field()
  isActive: boolean;

  @Field(() => Event, { nullable: true })
  event?: Event;

  // Relations handled by field resolvers
  attendances?: any[];

  @Field(() => Int, { nullable: true })
  totalAttendees?: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
