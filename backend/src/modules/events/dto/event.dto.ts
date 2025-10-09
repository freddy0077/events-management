import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsString, IsOptional, IsDateString, IsBoolean, IsNumber, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AssignStaffInput } from './event-staff.dto';

// Export draft DTOs for use in other modules
export { SaveEventDraftInput, UpdateEventDraftInput } from './event-draft.dto';

@InputType()
export class DashboardPaginationInput {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  eventsPage?: number = 1;

  @Field(() => Int, { nullable: true, defaultValue: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  eventsLimit?: number = 5;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  registrationsPage?: number = 1;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  registrationsLimit?: number = 10;
}

@InputType()
export class CreateEventInput {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsString()
  slug: string;

  @Field()
  @IsDateString()
  date: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: string;

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

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxCapacity?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  paymentRequired?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  paymentDeadline?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  depositAllowed?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(10)
  depositPercentage?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  fullPaymentDeadline?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  latePaymentFee?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  refundPolicy?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  badgeTemplateId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @Field(() => [CreateCategoryInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCategoryInput)
  categories: CreateCategoryInput[];

  @Field(() => [CreateEventMealInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventMealInput)
  meals?: CreateEventMealInput[];

  @Field(() => [AssignStaffInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignStaffInput)
  staffAssignments?: AssignStaffInput[];
}

@InputType()
export class CreateCategoryInput {
  @Field()
  @IsString()
  name: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  price: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxCapacity?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}

@InputType()
export class CreateEventMealInput {
  @Field()
  @IsString()
  name: string;

  @Field()
  @IsDateString()
  beginTime: string;

  @Field()
  @IsDateString()
  endTime: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}

@InputType()
export class UpdateEventInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  slug?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  date?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  venue?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxCapacity?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

@InputType()
export class UpdateCategoryInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxCapacity?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
