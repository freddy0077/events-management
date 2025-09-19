import { gql } from '@apollo/client';

export const GET_AUDIT_LOGS = gql`
  query GetAuditLogs(
    $eventId: String
    $registrationId: String
    $action: String
    $performedBy: String
    $startDate: DateTime
    $endDate: DateTime
    $limit: Int = 50
    $offset: Int = 0
  ) {
    getAuditLogs(
      eventId: $eventId
      registrationId: $registrationId
      action: $action
      performedBy: $performedBy
      startDate: $startDate
      endDate: $endDate
      limit: $limit
      offset: $offset
    ) {
      logs {
        id
        eventId
        registrationId
        action
        details
        performedBy
        performedByUser {
          id
          fullName
          email
        }
        ipAddress
        userAgent
        createdAt
        event {
          id
          name
        }
        registration {
          id
          fullName
          email
        }
      }
      total
      hasMore
    }
  }
`;

export const GET_FAILED_SCANS = gql`
  query GetFailedScans(
    $eventId: String
    $limit: Int = 50
    $offset: Int = 0
  ) {
    getFailedScans(
      eventId: $eventId
      limit: $limit
      offset: $offset
    ) {
      logs {
        id
        eventId
        registrationId
        action
        details
        performedBy
        performedByUser {
          id
          fullName
          email
        }
        ipAddress
        userAgent
        createdAt
        event {
          id
          name
        }
        registration {
          id
          fullName
          email
        }
      }
      total
      hasMore
    }
  }
`;

export const GET_AUDIT_STATS = gql`
  query GetAuditStats(
    $eventId: String
    $startDate: DateTime
    $endDate: DateTime
  ) {
    getAuditStats(
      eventId: $eventId
      startDate: $startDate
      endDate: $endDate
    ) {
      totalLogs
      actionCounts {
        action
        count
      }
      topUsers {
        userId
        count
      }
    }
  }
`;
