import { InputType, Field, ID, Float } from '@nestjs/graphql';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

@InputType()
export class CreateTransactionInput {
  @Field(() => ID)
  registrationId: string;

  @Field(() => Float)
  amount: number;

  @Field(() => PaymentMethod)
  paymentMethod: PaymentMethod;

  @Field({ nullable: true })
  receiptNumber?: string;

  @Field({ nullable: true })
  transactionRef?: string;

  @Field({ nullable: true })
  notes?: string;
}

@InputType()
export class UpdateTransactionInput {
  @Field(() => PaymentStatus, { nullable: true })
  paymentStatus?: PaymentStatus;

  @Field({ nullable: true })
  paymentDate?: Date;

  @Field({ nullable: true })
  receiptNumber?: string;

  @Field({ nullable: true })
  transactionRef?: string;

  @Field({ nullable: true })
  notes?: string;
}

@InputType()
export class RefundTransactionInput {
  @Field(() => Float)
  refundAmount: number;

  @Field()
  refundReason: string;

  @Field(() => ID)
  refundedBy: string;
}
