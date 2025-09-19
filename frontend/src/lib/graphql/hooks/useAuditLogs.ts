import { useQuery } from '@apollo/client/react';
import { GET_AUDIT_LOGS, GET_AUDIT_STATS, GET_FAILED_SCANS } from '../queries/audit';

export interface AuditLogFilters {
  eventId?: string;
  registrationId?: string;
  action?: string;
  performedBy?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditLog {
  id: string;
  eventId?: string;
  registrationId?: string;
  action: string;
  details: any;
  performedBy: string;
  performedByUser?: {
    id: string;
    fullName: string;
    email: string;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  event?: {
    id: string;
    name: string;
  };
  registration?: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface AuditLogConnection {
  logs: AuditLog[];
  total: number;
  hasMore: boolean;
}

export interface AuditStats {
  totalLogs: number;
  actionCounts: {
    action: string;
    count: number;
  }[];
  topUsers: {
    userId: string;
    count: number;
  }[];
}

export function useAuditLogs(filters: AuditLogFilters = {}) {
  return useQuery<{ getAuditLogs: AuditLogConnection }>(GET_AUDIT_LOGS, {
    variables: filters,
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  });
}

export function useAuditStats(filters: { eventId?: string; startDate?: Date; endDate?: Date } = {}) {
  return useQuery<{ getAuditStats: AuditStats }>(GET_AUDIT_STATS, {
    variables: filters,
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  });
}

export interface FailedScanFilters {
  eventId?: string;
  limit?: number;
  offset?: number;
}

export function useFailedScans(filters: FailedScanFilters = {}) {
  return useQuery<{ getFailedScans: AuditLogConnection }>(GET_FAILED_SCANS, {
    variables: filters,
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  });
}
