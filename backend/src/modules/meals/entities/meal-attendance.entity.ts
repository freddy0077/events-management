import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Meal } from './meal.entity';

@ObjectType()
export class MealAttendance {
  @Field(() => ID)
  id: string;

  @Field()
  mealId: string;

  @Field()
  registrationId: string;

  @Field()
  scannedAt: Date;

  @Field({ nullable: true })
  scannedBy?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  // Relations handled by field resolvers
  @Field(() => Meal, { nullable: true })
  meal?: any;
  
  registration?: any;
  scannedByUser?: any;
}
