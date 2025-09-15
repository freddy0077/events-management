import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStatus, PaymentMethod, Transaction, Prisma } from '@prisma/client';
import { CreateTransactionInput, UpdateTransactionInput, RefundTransactionInput } from './dto/transaction-input.dto';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new transaction for a registration
   */
  async createTransaction(
    processedBy: string,
    input: CreateTransactionInput,
  ): Promise<any> {
    const { registrationId, amount, paymentMethod, receiptNumber, transactionRef, notes } = input;

    // Verify registration exists
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: { category: true, event: true },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    // Create the transaction
    const transaction = await this.prisma.transaction.create({
      data: {
        registrationId,
        amount,
        paymentMethod,
        receiptNumber,
        transactionRef,
        notes,
        processedBy,
      },
      include: {
        registration: {
          include: {
            event: true,
            category: true,
          },
        },
        processor: true,
      },
    });

    return transaction;
  }

  /**
   * Update transaction status (e.g., confirm payment)
   */
  async updateTransaction(
    transactionId: string,
    processedBy: string,
    input: UpdateTransactionInput,
  ): Promise<any> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const updatedTransaction = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        ...input,
        updatedAt: new Date(),
      },
      include: {
        registration: {
          include: {
            event: true,
            category: true,
          },
        },
        processor: true,
      },
    });

    return updatedTransaction;
  }

  /**
   * Confirm payment for a transaction
   */
  async confirmPayment(
    transactionId: string,
    processedBy: string,
    paymentDate?: Date,
  ): Promise<any> {
    return this.updateTransaction(transactionId, processedBy, {
      paymentStatus: PaymentStatus.PAID,
      paymentDate: paymentDate || new Date(),
    });
  }

  /**
   * Mark transaction as failed
   */
  async markTransactionFailed(
    transactionId: string,
    processedBy: string,
    reason?: string,
  ): Promise<any> {
    return this.updateTransaction(transactionId, processedBy, {
      paymentStatus: PaymentStatus.FAILED,
      notes: reason,
    });
  }

  /**
   * Process a refund for a transaction
   */
  async processRefund(
    transactionId: string,
    refundedBy: string,
    input: RefundTransactionInput,
  ): Promise<any> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Can only refund paid transactions');
    }

    if (input.refundAmount > transaction.amount.toNumber()) {
      throw new BadRequestException('Refund amount cannot exceed original payment amount');
    }

    const updatedTransaction = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        paymentStatus: PaymentStatus.REFUNDED,
        refundAmount: input.refundAmount,
        refundedAt: new Date(),
        refundReason: input.refundReason,
        refundedBy,
        updatedAt: new Date(),
      },
      include: {
        registration: {
          include: {
            event: true,
            category: true,
          },
        },
        processor: true,
      },
    });

    return updatedTransaction;
  }

  /**
   * Get all transactions for a registration
   */
  async getTransactionsByRegistration(registrationId: string): Promise<any[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: { registrationId },
      include: {
        registration: {
          include: {
            event: true,
            category: true,
          },
        },
        processor: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Convert Decimal amounts to numbers for GraphQL compatibility
    return transactions.map(transaction => ({
      ...transaction,
      amount: transaction.amount.toNumber(),
      refundAmount: transaction.refundAmount?.toNumber() || null,
    }));
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(transactionId: string): Promise<Transaction | null> {
    return this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        registration: {
          include: {
            event: true,
            category: true,
          },
        },
        processor: true,
      },
    });
  }

  /**
   * Get transactions with filters for finance team
   */
  async getTransactions(filters: {
    paymentStatus?: PaymentStatus;
    paymentMethod?: PaymentMethod;
    eventId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ transactions: Transaction[]; total: number }> {
    const where: Prisma.TransactionWhereInput = {};

    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    if (filters.eventId) {
      where.registration = {
        eventId: filters.eventId,
      };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          registration: {
            include: {
                event: true,
              category: true,
            },
          },
          processor: true,
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { transactions, total };
  }

  /**
   * Get financial summary for reporting
   */
  async getFinancialSummary(eventId?: string): Promise<{
    totalRevenue: number;
    paidAmount: number;
    pendingAmount: number;
    refundedAmount: number;
    transactionCount: number;
    averageTransaction: number;
  }> {
    const where: Prisma.TransactionWhereInput = {};
    
    if (eventId) {
      where.registration = {
        eventId,
      };
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      select: {
        amount: true,
        paymentStatus: true,
        refundAmount: true,
      },
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount.toNumber(), 0);
    const paidTransactions = transactions.filter(t => t.paymentStatus === PaymentStatus.PAID);
    const pendingTransactions = transactions.filter(t => t.paymentStatus === PaymentStatus.PENDING);
    const refundedTransactions = transactions.filter(t => t.paymentStatus === PaymentStatus.REFUNDED);

    const paidAmount = paidTransactions.reduce((sum, t) => sum + t.amount.toNumber(), 0);
    const pendingAmount = pendingTransactions.reduce((sum, t) => sum + t.amount.toNumber(), 0);
    const refundedAmount = refundedTransactions.reduce((sum, t) => sum + (t.refundAmount?.toNumber() || 0), 0);

    return {
      totalRevenue,
      paidAmount,
      pendingAmount,
      refundedAmount,
      transactionCount: transactions.length,
      averageTransaction: transactions.length > 0 ? totalRevenue / transactions.length : 0,
    };
  }

  /**
   * Get payment status for a registration
   */
  async getRegistrationPaymentStatus(registrationId: string): Promise<{
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    refundedAmount: number;
    paymentStatus: 'FULLY_PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'FAILED';
  }> {
    const transactions = await this.getTransactionsByRegistration(registrationId);

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount.toNumber(), 0);
    const paidAmount = transactions
      .filter(t => t.paymentStatus === PaymentStatus.PAID)
      .reduce((sum, t) => sum + t.amount.toNumber(), 0);
    const pendingAmount = transactions
      .filter(t => t.paymentStatus === PaymentStatus.PENDING)
      .reduce((sum, t) => sum + t.amount.toNumber(), 0);
    const refundedAmount = transactions
      .filter(t => t.paymentStatus === PaymentStatus.REFUNDED)
      .reduce((sum, t) => sum + (t.refundAmount?.toNumber() || 0), 0);

    let paymentStatus: 'FULLY_PAID' | 'PARTIALLY_PAID' | 'PENDING' | 'FAILED';

    if (paidAmount >= totalAmount && totalAmount > 0) {
      paymentStatus = 'FULLY_PAID';
    } else if (paidAmount > 0) {
      paymentStatus = 'PARTIALLY_PAID';
    } else if (pendingAmount > 0) {
      paymentStatus = 'PENDING';
    } else {
      paymentStatus = 'FAILED';
    }

    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      refundedAmount,
      paymentStatus,
    };
  }
}
