import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType()
export class AuditEvent {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;
}

@ObjectType()
export class AuditRegistration {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  fullName: string;

  @Field(() => String)
  email: string;
}

@ObjectType()
export class AuditUser {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  firstName?: string;

  @Field(() => String, { nullable: true })
  lastName?: string;

  @Field(() => String)
  fullName: string;

  @Field(() => String, { nullable: true })
  email: string;
}

@ObjectType()
export class AuditLog {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  eventId?: string;

  @Field(() => String, { nullable: true })
  registrationId?: string;

  @Field(() => String)
  action: string;

  @Field(() => GraphQLJSON)
  details: any;

  @Field(() => String)
  performedBy: string;

  @Field(() => AuditUser, { nullable: true })
  performedByUser?: AuditUser;

  @Field(() => String, { nullable: true })
  ipAddress?: string;

  @Field(() => String, { nullable: true })
  userAgent?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => AuditEvent, { nullable: true })
  event?: AuditEvent;

  @Field(() => AuditRegistration, { nullable: true })
  registration?: AuditRegistration;
}

@ObjectType()
export class AuditLogConnection {
  @Field(() => [AuditLog])
  logs: AuditLog[];

  @Field(() => Int)
  total: number;

  @Field(() => Boolean)
  hasMore: boolean;
}

@ObjectType()
export class AuditActionCount {
  @Field(() => String)
  action: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class AuditUserCount {
  @Field(() => String)
  userId: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class AuditStats {
  @Field(() => Int)
  totalLogs: number;

  @Field(() => [AuditActionCount])
  actionCounts: AuditActionCount[];

  @Field(() => [AuditUserCount])
  topUsers: AuditUserCount[];
}
