import { Resolver, Query, Mutation, Args, ID, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { StaffPermissionGuard, StaffPermissions, StaffPermission } from '../auth/guards/staff-permission.guard';
import { TransactionService } from './transaction.service';
import { CreateTransactionInput, UpdateTransactionInput, RefundTransactionInput } from './dto/transaction-input.dto';
import { Transaction, FinancialSummary, RegistrationPaymentStatus, TransactionConnection } from './transaction.types';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

@Resolver(() => Transaction)
@UseGuards(GqlAuthGuard, StaffPermissionGuard)
export class TransactionResolver {
  constructor(private transactionService: TransactionService) {}

  @Mutation(() => Transaction)
  // @StaffPermissions(StaffPermission.PROCESS_PAYMENT)
  async createTransaction(
    @Args('input') input: CreateTransactionInput,
    @Context() context?: any,
  ): Promise<any> {
    const userId = context.req.user.id;
    return this.transactionService.createTransaction(userId, input);
  }

  @Mutation(() => Transaction)
  // @StaffPermissions(StaffPermission.APPROVE_PAYMENT)
  async confirmPayment(
    @Args('transactionId', { type: () => ID }) transactionId: string,
    @Args('paymentDate', { nullable: true }) paymentDate?: Date,
    @Context() context?: any,
  ): Promise<any> {
    const userId = context.req.user.id;
    return this.transactionService.confirmPayment(transactionId, userId, paymentDate);
  }

  @Mutation(() => Transaction)
  // @StaffPermissions(StaffPermission.PROCESS_PAYMENT)
  async markTransactionFailed(
    @Args('transactionId', { type: () => ID }) transactionId: string,
    @Args('reason', { nullable: true }) reason?: string,
    @Context() context?: any,
  ): Promise<any> {
    const userId = context.req.user.id;
    return this.transactionService.markTransactionFailed(transactionId, userId, reason);
  }

  @Mutation(() => Transaction)
  // @StaffPermissions(StaffPermission.RECONCILE_PAYMENTS)
  async processRefund(
    @Args('transactionId', { type: () => ID }) transactionId: string,
    @Args('input') input: RefundTransactionInput,
    @Context() context?: any,
  ): Promise<any> {
    const userId = context.req.user.id;
    return this.transactionService.processRefund(transactionId, userId, input);
  }

  @Query(() => [Transaction])
  // @StaffPermissions(StaffPermission.VIEW_REPORTS)
  async getTransactionsByRegistration(
    @Args('registrationId', { type: () => ID }) registrationId: string,
  ): Promise<any[]> {
    return this.transactionService.getTransactionsByRegistration(registrationId);
  }

  @Query(() => Transaction, { nullable: true })
  // @StaffPermissions(StaffPermission.VIEW_REPORTS)
  async getTransaction(
    @Args('transactionId', { type: () => ID }) transactionId: string,
  ): Promise<any | null> {
    return this.transactionService.getTransactionById(transactionId);
  }

  @Query(() => TransactionConnection)
  // @StaffPermissions(StaffPermission.VIEW_REPORTS)
  async getTransactions(
    @Args('paymentStatus', { type: () => PaymentStatus, nullable: true }) paymentStatus?: PaymentStatus,
    @Args('paymentMethod', { type: () => PaymentMethod, nullable: true }) paymentMethod?: PaymentMethod,
    @Args('eventId', { type: () => ID, nullable: true }) eventId?: string,
    @Args('dateFrom', { nullable: true }) dateFrom?: Date,
    @Args('dateTo', { nullable: true }) dateTo?: Date,
    @Args('limit', { nullable: true, defaultValue: 50 }) limit?: number,
    @Args('offset', { nullable: true, defaultValue: 0 }) offset?: number,
  ): Promise<any> {
    return this.transactionService.getTransactions({
      paymentStatus,
      paymentMethod,
      eventId,
      dateFrom,
      dateTo,
      limit,
      offset,
    });
  }

  @Query(() => FinancialSummary)
  // @StaffPermissions(StaffPermission.VIEW_REPORTS)
  async getFinancialSummary(
    @Args('eventId', { type: () => ID, nullable: true }) eventId?: string,
  ): Promise<any> {
    return this.transactionService.getFinancialSummary(eventId);
  }

  @Query(() => RegistrationPaymentStatus)
  // @StaffPermissions(StaffPermission.VIEW_REPORTS)
  async getRegistrationPaymentStatus(
    @Args('registrationId', { type: () => ID }) registrationId: string,
  ): Promise<any> {
    return this.transactionService.getRegistrationPaymentStatus(registrationId);
  }
}
