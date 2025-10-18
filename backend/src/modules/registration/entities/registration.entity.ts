import { ObjectType, Field, ID, Float, registerEnumType } from '@nestjs/graphql';
import { PaymentStatus, PaymentMethod } from '@prisma/client';
import { Event } from '../../events/entities/event.entity';
import { Category } from '../../events/entities/category.entity';
import { MealAttendance } from '../../meals/entities/meal-attendance.entity';
import { Transaction } from '../../transaction/transaction.types';

// Register enums for GraphQL
registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
});

registerEnumType(PaymentMethod, {
  name: 'PaymentMethod',
});


@ObjectType()
export class Registration {
  @Field(() => ID)
  id: string;

  @Field()
  eventId: string;

  @Field()
  categoryId: string;

  @Field()
  fullName: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field()
  email: string;

  @Field()
  phone: string;

  @Field()
  address: string;

  @Field({ nullable: true })
  zone?: string;

  @Field({ nullable: true })
  qrCode?: string;

  @Field()
  badgePrinted: boolean;

  @Field({ nullable: true })
  badgePrintedAt?: Date;

  @Field({ nullable: true })
  badgePrintedBy?: string;

  @Field()
  badgePrintCount: number;

  @Field()
  checkedIn: boolean;

  @Field({ nullable: true })
  checkedInAt?: Date;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  registeredBy?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Computed field based on transactions
  @Field(() => PaymentStatus)
  paymentStatus?: PaymentStatus;

  // Computed field for registration status
  @Field({ nullable: true })
  status?: string;

  // Computed field for QR code scan status
  @Field({ nullable: true })
  qrCodeScanned?: boolean;

  // Relations handled by field resolvers
  @Field(() => Event, { nullable: true })
  event?: any;

  @Field(() => Category, { nullable: true })
  category?: any;

  @Field(() => [MealAttendance], { nullable: true })
  mealAttendances?: any[];

  @Field(() => [Transaction], { nullable: true })
  transactions?: Transaction[];

  user?: any;
}
