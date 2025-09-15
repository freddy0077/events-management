import { IsString, IsOptional, IsNumber, IsBoolean, IsInt } from 'class-validator';
import { Field, InputType, Int, Float } from '@nestjs/graphql';
import { Type } from 'class-transformer';

@InputType()
export class CreateStandaloneCategoryInput {
  @Field()
  @IsString()
  eventId: string;

  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Float)
  @IsNumber()
  @Type(() => Number)
  price: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  maxCapacity?: number;

  @Field({ defaultValue: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
