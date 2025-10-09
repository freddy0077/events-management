import { InputType, ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { IsString, IsOptional, IsUUID, IsEnum, IsEmail, Matches } from 'class-validator';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { Registration } from '../entities/registration.entity';
import GraphQLJSON from 'graphql-type-json';

@InputType()
export class CreateRegistrationInput {
  @Field(() => ID)
  @IsString()
  @Matches(/^c[a-z0-9]{24}$/, { message: 'eventId must be a valid CUID' })
  eventId: string;

  @Field(() => ID)
  @IsString()
  @Matches(/^c[a-z0-9]{24}$/, { message: 'categoryId must be a valid CUID' })
  categoryId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @Field(() => PaymentMethod, { nullable: true })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}

@InputType()
export class CreateStaffRegistrationInput {
  @Field(() => ID)
  @IsString()
  @Matches(/^c[a-z0-9]{24}$/, { message: 'eventId must be a valid CUID' })
  eventId: string;

  @Field(() => ID)
  @IsString()
  @Matches(/^c[a-z0-9]{24}$/, { message: 'categoryId must be a valid CUID' })
  categoryId: string;

  @Field()
  @IsString()
  fullName: string;

  @Field()
  @IsEmail()
  email: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  address?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  zone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @Field(() => PaymentMethod, { nullable: true })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}

@InputType()
export class UpdateRegistrationInput {
  @Field(() => PaymentStatus, { nullable: true })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  specialRequests?: string;
}

@ObjectType()
export class RegistrationPayload {
  @Field()
  registration: Registration;

  @Field()
  qrCodeData: string;

  @Field({ nullable: true })
  paymentUrl?: string;
}

@ObjectType()
export class PaymentConfirmationPayload {
  @Field()
  success: boolean;

  @Field()
  registration: Registration;

  @Field({ nullable: true })
  message?: string;
}

@ObjectType()
export class QRCodePayload {
  @Field()
  registrationId: string;

  @Field()
  eventId: string;

  @Field()
  participantName: string;

  @Field()
  category: string;

  @Field()
  timestamp: string;

  @Field()
  checksum: string;
}

@ObjectType()
export class QRCodeGenerationResult {
  @Field()
  qrCode: string;

  @Field(() => QRCodePayload)
  qrCodeData: QRCodePayload;

  @Field()
  base64Image: string;
}

@ObjectType()
export class QRCodeValidationResult {
  @Field()
  isValid: boolean;

  @Field(() => QRCodePayload, { nullable: true })
  payload?: QRCodePayload;

  @Field({ nullable: true })
  message?: string;
}
