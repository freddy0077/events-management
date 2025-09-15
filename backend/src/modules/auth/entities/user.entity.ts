import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Role } from '@prisma/client';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field(() => String)
  role: Role;

  @Field()
  isActive: boolean;

  @Field({ nullable: true })
  mustChangePassword?: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
