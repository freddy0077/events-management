import { IsString, IsOptional, IsObject, IsUUID } from 'class-validator';

export interface CreateAuditLogInput {
  eventId?: string;
  registrationId?: string;
  action: string;
  details: any;
  performedBy: string;
  ipAddress?: string;
  userAgent?: string;
}

export type AuditActionType = 
  // Authentication
  | 'LOGIN'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'FAILED_LOGIN'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  
  // Event Management
  | 'EVENT_CREATED'
  | 'EVENT_UPDATED'
  | 'EVENT_DELETED'
  | 'EVENT_ACTIVATED'
  | 'EVENT_DEACTIVATED'
  | 'EVENT_DRAFT_SAVED'
  | 'EVENT_DRAFT_UPDATED'
  | 'EVENT_DRAFT_DELETED'
  
  // Registration Management
  | 'REGISTRATION_CREATED'
  | 'REGISTRATION_UPDATED'
  | 'REGISTRATION_DELETED'
  | 'REGISTRATION_APPROVED'
  | 'REGISTRATION_REJECTED'
  | 'PARTICIPANT_CHECKED_IN'
  | 'PARTICIPANT_CHECKED_OUT'
  
  // Payment Management
  | 'PAYMENT_PROCESSED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_FAILED'
  | 'TRANSACTION_CREATED'
  | 'TRANSACTION_UPDATED'
  
  // Meal/Catering Management
  | 'MEAL_SESSION_CREATED'
  | 'MEAL_SESSION_UPDATED'
  | 'MEAL_SESSION_DELETED'
  | 'MEAL_SESSION_STARTED'
  | 'MEAL_SESSION_ENDED'
  | 'MEAL_SERVED'
  | 'MEAL_ATTENDANCE_RECORDED'
  | 'MEAL_ATTENDANCE_UPDATED'
  
  // QR Code Management
  | 'QR_GENERATED'
  | 'QR_REGENERATED'
  | 'QR_SCANNED'
  | 'QR_SCAN_FAILED'
  | 'QR_VALIDATED'
  | 'QR_VALIDATION_FAILED'
  | 'BADGE_PRINTED'
  | 'BADGE_REPRINTED'
  
  // Staff Management
  | 'STAFF_ASSIGNED'
  | 'STAFF_REMOVED'
  | 'STAFF_ROLE_CHANGED'
  | 'STAFF_PERMISSIONS_UPDATED'
  
  // Category Management
  | 'CATEGORY_CREATED'
  | 'CATEGORY_UPDATED'
  | 'CATEGORY_DELETED'
  
  // Report Generation
  | 'REPORT_GENERATED'
  | 'REPORT_DOWNLOADED'
  | 'DATA_EXPORTED'
  
  // System Actions
  | 'SYSTEM_BACKUP'
  | 'SYSTEM_RESTORE'
  | 'DATABASE_MIGRATION'
  | 'CONFIGURATION_CHANGED'
  
  // Security Events
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'PERMISSION_DENIED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'DATA_BREACH_DETECTED';

export class GetAuditLogsInput {
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsUUID()
  registrationId?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsUUID()
  performedBy?: string;

  @IsOptional()
  startDate?: Date;

  @IsOptional()
  endDate?: Date;

  @IsOptional()
  limit?: number = 50;

  @IsOptional()
  offset?: number = 0;
}

export class AuditStatsInput {
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  startDate?: Date;

  @IsOptional()
  endDate?: Date;
}
