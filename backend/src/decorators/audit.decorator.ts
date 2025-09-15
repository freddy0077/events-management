import { SetMetadata } from '@nestjs/common';
import { AuditActionType } from '../services/dto/audit.dto';

export const AUDIT_KEY = 'audit';

export interface AuditOptions {
  action: AuditActionType;
  resourceType?: 'event' | 'registration' | 'meal' | 'transaction' | 'user' | 'category' | 'event_draft';
  description?: string;
  includeRequest?: boolean;
  includeResponse?: boolean;
}

/**
 * Decorator to automatically log actions for audit purposes
 * 
 * @param options - Audit configuration options
 * 
 * @example
 * @Audit({ 
 *   action: 'EVENT_CREATED', 
 *   resourceType: 'event',
 *   description: 'User created a new event' 
 * })
 * async createEvent(input: CreateEventInput) {
 *   // method implementation
 * }
 */
export const Audit = (options: AuditOptions) => SetMetadata(AUDIT_KEY, options);
