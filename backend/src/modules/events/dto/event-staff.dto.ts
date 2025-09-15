import { InputType, ObjectType, Field, ID } from '@nestjs/graphql';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { EventStaffRole } from '@prisma/client';
import { EventStaff } from '../entities/event-staff.entity';
import GraphQLJSON from 'graphql-type-json';

@InputType()
export class AssignStaffInput {
  @Field(() => ID)
  @IsString()
  eventId: string;

  @Field(() => ID)
  @IsString()
  userId: string;

  @Field(() => EventStaffRole)
  @IsEnum(EventStaffRole)
  role: EventStaffRole;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  permissions?: any;
}

@InputType()
export class UpdateStaffRoleInput {
  @Field(() => ID)
  @IsString()
  staffId: string;

  @Field(() => EventStaffRole)
  @IsEnum(EventStaffRole)
  role: EventStaffRole;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  permissions?: any;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@InputType()
export class CreateEventWithStaffInput {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  slug: string;

  @Field()
  date: Date;

  @Field({ nullable: true })
  @IsOptional()
  endDate?: Date;

  @Field()
  @IsString()
  venue: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  address?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  maxCapacity?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  paymentRequired?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  registrationDeadline?: Date;

  @Field({ nullable: true })
  @IsOptional()
  paymentDeadline?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  depositAllowed?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  depositPercentage?: number;

  @Field({ nullable: true })
  @IsOptional()
  fullPaymentDeadline?: Date;

  @Field({ nullable: true })
  @IsOptional()
  latePaymentFee?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  refundPolicy?: string;

  // Staff assignments
  @Field(() => [AssignStaffInput], { nullable: true })
  @IsOptional()
  staffAssignments?: AssignStaffInput[];

  // Categories and meals (existing)
  @Field(() => [String], { nullable: true })
  @IsOptional()
  categories?: any[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  meals?: any[];
}

@ObjectType()
export class StaffAssignmentPayload {
  @Field()
  success: boolean;

  @Field(() => EventStaff, { nullable: true })
  staff?: EventStaff;

  @Field({ nullable: true })
  message?: string;
}

@ObjectType()
export class EventStaffList {
  @Field(() => [EventStaff])
  staff: EventStaff[];

  @Field()
  total: number;
}
