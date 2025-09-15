import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType()
export class EventDraft {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => GraphQLJSON)
  draftData: any;

  @Field(() => Int)
  currentStep: number;

  @Field()
  lastSavedAt: Date;

  @Field()
  expiresAt: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
