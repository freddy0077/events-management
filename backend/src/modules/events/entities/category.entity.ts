import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { Decimal } from '@prisma/client/runtime/library';

@ObjectType()
export class Category {
  @Field(() => ID)
  id: string;

  @Field()
  eventId: string;

  @Field()
  name: string;

  @Field(() => Float)
  price: number;

  @Field(() => Int, { nullable: true })
  maxCapacity?: number;

  @Field({ nullable: true })
  description?: string;

  @Field()
  isActive: boolean;

  // Relations handled by field resolvers
  event?: any;
  registrations?: any[];

  @Field(() => Int, { nullable: true })
  currentCount?: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Static method to convert Prisma data to GraphQL type
  static fromPrisma(prismaCategory: any): Category {
    return {
      ...prismaCategory,
      price: prismaCategory.price ? parseFloat(prismaCategory.price.toString()) : 0,
      currentCount: prismaCategory._count?.registrations || 0,
    };
  }
}
