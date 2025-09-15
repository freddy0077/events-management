import { InputType, Field, ID, Int } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { IsNotEmpty, IsInt, Min, IsOptional, IsObject } from 'class-validator';

@InputType()
export class SaveEventDraftInput {
  @Field(() => GraphQLJSON)
  @IsObject()
  draftData: any;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  currentStep: number;
}

@InputType()
export class UpdateEventDraftInput {
  @Field(() => ID)
  @IsNotEmpty()
  id: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  @IsObject()
  draftData?: any;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  currentStep?: number;
}
