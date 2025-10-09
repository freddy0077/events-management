import { InputType, ObjectType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @MinLength(6)
  password: string;
}

@ObjectType()
export class UserPayload {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  role: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  mustChangePassword?: boolean;

  @Field({ nullable: true })
  eventRole?: string;
}

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field()
  user: UserPayload;
}

@ObjectType()
export class LogoutPayload {
  @Field()
  success: boolean;

  @Field()
  message: string;
}

@InputType()
export class ChangePasswordInput {
  @Field()
  @IsString()
  @MinLength(6)
  currentPassword: string;

  @Field()
  @IsString()
  @MinLength(8)
  newPassword: string;
}

@ObjectType()
export class ChangePasswordPayload {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field({ nullable: true })
  user?: UserPayload;
}

@InputType()
export class RegisterUserInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsString()
  @MinLength(8)
  password: string;

  @Field()
  @IsString()
  firstName: string;

  @Field()
  @IsString()
  lastName: string;

  @Field()
  @IsEnum(Role)
  role: Role;

  @Field({ nullable: true })
  @IsOptional()
  mustChangePassword?: boolean;
}

@ObjectType()
export class RegisterUserPayload {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field({ nullable: true })
  user?: UserPayload;
}
