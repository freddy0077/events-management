import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { Meal } from '../../meals/entities/meal.entity';
import { Category } from './category.entity';
import { EventStaff } from './event-staff.entity';
import { Registration } from '../../registration/entities/registration.entity';

@ObjectType()
export class Event {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field()
  date: Date;

  @Field({ nullable: true })
  endDate?: Date;

  @Field()
  venue: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int, { nullable: true })
  maxCapacity?: number;

  @Field({ nullable: true })
  paymentRequired?: boolean;

  @Field({ nullable: true })
  registrationDeadline?: Date;

  @Field({ nullable: true })
  paymentDeadline?: Date;

  @Field({ nullable: true })
  depositAllowed?: boolean;

  @Field(() => Int, { nullable: true })
  depositPercentage?: number;

  @Field({ nullable: true })
  fullPaymentDeadline?: Date;

  @Field(() => Float, { nullable: true })
  latePaymentFee?: any;

  @Field({ nullable: true })
  refundPolicy?: string;

  @Field({ nullable: true })
  badgeTemplateId?: string;

  @Field({ nullable: true })
  logoUrl?: string;

  @Field()
  isActive: boolean;

  @Field({ nullable: true })
  status?: string;

  // Event creator/organizer
  @Field(() => ID)
  createdBy: string;

  // Relations handled by field resolvers
  @Field(() => [Category], { nullable: true })
  categories?: Category[];
  
  @Field(() => [Registration], { nullable: true })
  registrations?: Registration[];
  
  @Field(() => [Meal], { nullable: true })
  meals?: Meal[];

  @Field(() => [EventStaff], { nullable: true })
  staff?: EventStaff[];

  @Field(() => Int, { nullable: true })
  totalRegistrations?: number;

  @Field(() => Int, { nullable: true })
  paidRegistrations?: number;

  @Field(() => Int, { nullable: true })
  pendingRegistrations?: number;

  @Field(() => Int, { nullable: true })
  failedRegistrations?: number;

  @Field(() => Int, { nullable: true })
  approvedRegistrations?: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
