import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { Event } from './event.entity';
import { Registration } from '../../registration/entities/registration.entity';

@ObjectType()
export class PaginationInfo {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => Boolean)
  hasNext: boolean;

  @Field(() => Boolean)
  hasPrev: boolean;
}

@ObjectType()
export class DashboardStats {
  @Field(() => Int)
  totalEvents: number;

  @Field(() => Int)
  totalRegistrations: number;

  @Field(() => Float)
  totalRevenue: number;

  @Field(() => Int)
  activeEvents: number;

  @Field(() => [Registration])
  recentRegistrations: Registration[];

  @Field(() => [Event])
  recentEvents: any[];

  // Pagination metadata
  @Field(() => PaginationInfo)
  recentEventsPagination: PaginationInfo;

  @Field(() => PaginationInfo)
  recentRegistrationsPagination: PaginationInfo;

  // Today's Activity Metrics
  @Field(() => Int)
  todayRegistrations: number;

  @Field(() => Int)
  todayScans: number;

  @Field(() => Int)
  activeStaff: number;

  @Field(() => Int)
  todayRevenue: number;

  // Performance Metrics (Growth Percentages)
  @Field(() => Float, { nullable: true })
  revenueGrowth?: number;

  @Field(() => Float, { nullable: true })
  registrationGrowth?: number;

  @Field(() => Float, { nullable: true })
  eventCompletionRate?: number;

  // Additional Useful Metrics
  @Field(() => Int)
  totalStaff: number;

  @Field(() => Int)
  upcomingEvents: number;

  @Field(() => Int)
  completedEvents: number;

  @Field(() => Float)
  averageEventCapacity: number;

  @Field(() => Float)
  averageRegistrationValue: number;

  @Field(() => Int)
  pendingPayments: number;

  @Field(() => Float)
  pendingPaymentAmount: number;

  @Field(() => Int)
  totalQRScans: number;

  @Field(() => Int)
  totalBadgesPrinted: number;
}
