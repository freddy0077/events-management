import { ObjectType, Field, ID, Float, registerEnumType } from '@nestjs/graphql';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

// Register enums for GraphQL
registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
  description: 'Payment status for transactions',
});

registerEnumType(PaymentMethod, {
  name: 'PaymentMethod',
  description: 'Payment method used for transactions',
});

@ObjectType()
export class Transaction {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  registrationId: string;

  @Field(() => Float)
  amount: number;

  @Field(() => PaymentMethod)
  paymentMethod: PaymentMethod;

  @Field(() => PaymentStatus)
  paymentStatus: PaymentStatus;

  @Field({ nullable: true })
  receiptNumber?: string;

  @Field({ nullable: true })
  transactionRef?: string;

  @Field({ nullable: true })
  paymentDate?: Date;

  @Field(() => ID)
  processedBy: string;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => Float, { nullable: true })
  refundAmount?: number;

  @Field({ nullable: true })
  refundDate?: Date;

  @Field({ nullable: true })
  refundReason?: string;

  @Field({ nullable: true })
  refundedBy?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Relations - handled by field resolvers to avoid circular dependencies
  @Field(() => String, { nullable: true })
  processorId?: string;
}

@ObjectType()
export class FinancialSummary {
  @Field(() => Float)
  totalRevenue: number;

  @Field(() => Float)
  paidAmount: number;

  @Field(() => Float)
  pendingAmount: number;

  @Field(() => Float)
  refundedAmount: number;

  @Field()
  transactionCount: number;

  @Field(() => Float)
  averageTransaction: number;
}

@ObjectType()
export class RegistrationPaymentStatus {
  @Field(() => Float)
  totalAmount: number;

  @Field(() => Float)
  paidAmount: number;

  @Field(() => Float)
  pendingAmount: number;

  @Field(() => Float)
  refundedAmount: number;

  @Field()
  paymentStatus: string;
}

@ObjectType()
export class TransactionConnection {
  @Field(() => [Transaction])
  transactions: Transaction[];

  @Field()
  total: number;
}
