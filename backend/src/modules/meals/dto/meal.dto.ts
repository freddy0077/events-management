import { InputType, ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsDateString, IsUUID, IsDate, MaxLength, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { MealAttendance } from '../entities/meal-attendance.entity';
import { Registration } from '../../registration/entities/registration.entity';
import { Meal } from '../entities/meal.entity';

@InputType()
export class CreateMealInput {
  @Field(() => ID)
  @IsUUID()
  eventId: string;

  @Field()
  @IsString()
  name: string;

  @Field()
  @IsDateString()
  startTime: string;

  @Field()
  @IsDateString()
  endTime: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}

@InputType()
export class UpdateMealInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  isActive?: boolean;
}

@InputType()
export class ScanQRCodeInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  mealId: string;

  @Field()
  @IsString()
  qrCode: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@ObjectType()
export class ScanResult {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => MealAttendance, { nullable: true })
  attendance?: MealAttendance;

  @Field({ nullable: true })
  participantName?: string;

  @Field({ nullable: true })
  alreadyScanned?: boolean;
}

@InputType()
export class ValidateQRCodeInput {
  @Field()
  @IsString()
  qrCode: string;
}

@InputType()
export class FailedScanInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  qrCode: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  errorMessage: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  scanMethod: string; // 'Manual Entry', 'Camera Scan', 'Scanner Device'

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  eventId?: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsString()
  mealId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@ObjectType()
export class QRCodeData {
  @Field()
  registrationId: string;

  @Field()
  eventId: string;

  @Field()
  participantName: string;

  @Field()
  category: string;

  @Field()
  timestamp: string;

  @Field()
  checksum: string;
}

@ObjectType()
export class QRCodeValidationResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field()
  isValid: boolean;

  @Field(() => QRCodeData, { nullable: true })
  qrCodeData?: QRCodeData;
}

@ObjectType()
export class CateringMetrics {
  @Field(() => Int)
  totalParticipants: number;

  @Field(() => Int)
  checkedInToday: number;

  @Field(() => Int)
  pendingMeals: number;

  @Field(() => Int)
  completedMeals: number;

  @Field(() => Int)
  totalMealSessions: number;

  @Field(() => Int)
  activeMealSessions: number;
}

@InputType()
export class ServeMealInput {
  @Field(() => ID)
  @IsUUID()
  registrationId: string;

  @Field(() => ID)
  @IsUUID()
  mealId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

@ObjectType()
export class ServeMealResult {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => MealAttendance, { nullable: true })
  attendance?: MealAttendance;

  @Field({ nullable: true })
  participantName?: string;
}

@ObjectType()
export class FailedScanResult {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field({ nullable: true })
  auditLogId?: string;
}

@ObjectType()
export class CateringReportSummary {
  @Field()
  totalEvents: number;

  @Field()
  totalMealSessions: number;

  @Field()
  totalParticipants: number;

  @Field()
  totalMealsServed: number;

  @Field()
  averageAttendanceRate: number;
}

@ObjectType()
export class MealSessionReport {
  @Field(() => ID)
  id: string;

  @Field()
  eventName: string;

  @Field()
  mealName: string;

  @Field()
  date: Date;

  @Field()
  expectedAttendees: number;

  @Field()
  actualAttendees: number;

  @Field()
  attendanceRate: number;

  @Field()
  status: string;
}

@ObjectType()
export class AttendanceByCategory {
  @Field()
  category: string;

  @Field()
  expected: number;

  @Field()
  actual: number;

  @Field()
  rate: number;
}

@ObjectType()
export class AttendanceByTimeSlot {
  @Field()
  timeSlot: string;

  @Field()
  sessions: number;

  @Field()
  avgAttendance: number;
}

@ObjectType()
export class AttendanceAnalytics {
  @Field(() => [AttendanceByCategory])
  byCategory: AttendanceByCategory[];

  @Field(() => [AttendanceByTimeSlot])
  byTimeSlot: AttendanceByTimeSlot[];
}

@ObjectType()
export class CateringReports {
  @Field(() => CateringReportSummary)
  summary: CateringReportSummary;

  @Field(() => [MealSessionReport])
  mealSessionReports: MealSessionReport[];

  @Field(() => AttendanceAnalytics)
  attendanceAnalytics: AttendanceAnalytics;
}

@InputType()
export class CateringReportsFilter {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  eventId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateFrom?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateTo?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  searchTerm?: string;
}

@ObjectType()
export class MealSessionActionResult {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => Meal, { nullable: true })
  meal?: any;
}
