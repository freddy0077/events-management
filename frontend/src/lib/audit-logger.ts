// BRS Requirement: Audit Logging System for all registration and scan actions
// This module provides comprehensive audit logging functionality

export interface AuditLog {
  id: string
  timestamp: string
  action: AuditAction
  entityType: 'REGISTRATION' | 'MEAL_SCAN' | 'PAYMENT' | 'EVENT' | 'USER'
  entityId: string
  userId: string
  userRole: 'ADMIN' | 'STAFF' | 'PARTICIPANT'
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  success: boolean
  errorMessage?: string
}

export type AuditAction = 
  // Registration actions
  | 'REGISTRATION_CREATED'
  | 'REGISTRATION_UPDATED'
  | 'REGISTRATION_APPROVED'
  | 'REGISTRATION_REJECTED'
  | 'REGISTRATION_CANCELLED'
  | 'RECEIPT_VERIFIED'
  | 'QR_CODE_GENERATED'
  | 'STICKER_PRINTED'
  
  // Meal scan actions
  | 'MEAL_SCAN_SUCCESS'
  | 'MEAL_SCAN_FAILED'
  | 'MEAL_SCAN_DUPLICATE'
  | 'MANUAL_OVERRIDE'
  | 'ATTENDANCE_MARKED'
  
  // Payment actions
  | 'PAYMENT_PROCESSED'
  | 'PAYMENT_APPROVED'
  | 'PAYMENT_DECLINED'
  | 'REFUND_PROCESSED'
  
  // Event actions
  | 'EVENT_CREATED'
  | 'EVENT_UPDATED'
  | 'EVENT_PUBLISHED'
  | 'EVENT_CANCELLED'
  
  // User actions
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'ADMIN_ACCESS'
  | 'PERMISSION_DENIED'

class AuditLogger {
  private logs: AuditLog[] = []
  private maxLogs = 10000 // Keep last 10k logs in memory

  constructor() {
    // Load existing logs from localStorage (only on client-side)
    if (typeof window !== 'undefined') {
      this.loadLogs()
    }
  }

  /**
   * Log an audit event
   */
  async log(
    action: AuditAction,
    entityType: AuditLog['entityType'],
    entityId: string,
    userId: string,
    userRole: AuditLog['userRole'],
    details: Record<string, any> = {},
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const auditLog: AuditLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      action,
      entityType,
      entityId,
      userId,
      userRole,
      details,
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId(),
      success,
      errorMessage
    }

    // Add to memory
    this.logs.unshift(auditLog)
    
    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Persist to localStorage
    this.saveLogs()

    // In production, also send to backend
    await this.sendToBackend(auditLog)

    console.log('🔍 Audit Log:', auditLog)
  }

  /**
   * Log registration actions
   */
  async logRegistration(
    action: Extract<AuditAction, 'REGISTRATION_CREATED' | 'REGISTRATION_UPDATED' | 'REGISTRATION_APPROVED' | 'REGISTRATION_REJECTED' | 'REGISTRATION_CANCELLED'>,
    registrationId: string,
    userId: string,
    userRole: AuditLog['userRole'],
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.log(action, 'REGISTRATION', registrationId, userId, userRole, details)
  }

  /**
   * Log meal scan actions
   */
  async logMealScan(
    action: Extract<AuditAction, 'MEAL_SCAN_SUCCESS' | 'MEAL_SCAN_FAILED' | 'MEAL_SCAN_DUPLICATE' | 'MANUAL_OVERRIDE' | 'ATTENDANCE_MARKED'>,
    scanId: string,
    userId: string,
    userRole: AuditLog['userRole'],
    details: Record<string, any> = {},
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await this.log(action, 'MEAL_SCAN', scanId, userId, userRole, details, success, errorMessage)
  }

  /**
   * Log payment actions
   */
  async logPayment(
    action: Extract<AuditAction, 'PAYMENT_PROCESSED' | 'PAYMENT_APPROVED' | 'PAYMENT_DECLINED' | 'REFUND_PROCESSED'>,
    paymentId: string,
    userId: string,
    userRole: AuditLog['userRole'],
    details: Record<string, any> = {}
  ): Promise<void> {
    await this.log(action, 'PAYMENT', paymentId, userId, userRole, details)
  }

  /**
   * Get audit logs with filtering
   */
  getLogs(filters?: {
    action?: AuditAction
    entityType?: AuditLog['entityType']
    userId?: string
    dateFrom?: string
    dateTo?: string
    success?: boolean
    limit?: number
  }): AuditLog[] {
    let filteredLogs = [...this.logs]

    if (filters) {
      if (filters.action) {
        filteredLogs = filteredLogs.filter(log => log.action === filters.action)
      }
      if (filters.entityType) {
        filteredLogs = filteredLogs.filter(log => log.entityType === filters.entityType)
      }
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId)
      }
      if (filters.dateFrom) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.dateFrom!)
      }
      if (filters.dateTo) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.dateTo!)
      }
      if (filters.success !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.success === filters.success)
      }
      if (filters.limit) {
        filteredLogs = filteredLogs.slice(0, filters.limit)
      }
    }

    return filteredLogs
  }

  /**
   * Get audit statistics
   */
  getStats(): {
    totalLogs: number
    successRate: number
    actionBreakdown: Record<AuditAction, number>
    entityBreakdown: Record<AuditLog['entityType'], number>
    recentActivity: AuditLog[]
  } {
    const totalLogs = this.logs.length
    const successfulLogs = this.logs.filter(log => log.success).length
    const successRate = totalLogs > 0 ? (successfulLogs / totalLogs) * 100 : 0

    const actionBreakdown: Record<string, number> = {}
    const entityBreakdown: Record<string, number> = {}

    this.logs.forEach(log => {
      actionBreakdown[log.action] = (actionBreakdown[log.action] || 0) + 1
      entityBreakdown[log.entityType] = (entityBreakdown[log.entityType] || 0) + 1
    })

    return {
      totalLogs,
      successRate,
      actionBreakdown: actionBreakdown as Record<AuditAction, number>,
      entityBreakdown: entityBreakdown as Record<AuditLog['entityType'], number>,
      recentActivity: this.logs.slice(0, 10)
    }
  }

  /**
   * Export audit logs for compliance
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'ID', 'Timestamp', 'Action', 'Entity Type', 'Entity ID', 
        'User ID', 'User Role', 'Success', 'Error Message', 'Details'
      ]
      
      const rows = this.logs.map(log => [
        log.id,
        log.timestamp,
        log.action,
        log.entityType,
        log.entityId,
        log.userId,
        log.userRole,
        log.success.toString(),
        log.errorMessage || '',
        JSON.stringify(log.details)
      ])

      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }

    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * Clear old logs (for maintenance)
   */
  clearOldLogs(daysToKeep: number = 90): void {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    
    this.logs = this.logs.filter(log => new Date(log.timestamp) >= cutoffDate)
    this.saveLogs()
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async getClientIP(): Promise<string> {
    try {
      // In production, this would be handled by the backend
      return 'localhost'
    } catch {
      return 'unknown'
    }
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    
    let sessionId = sessionStorage.getItem('audit_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('audit_session_id', sessionId)
    }
    return sessionId
  }

  private loadLogs(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('audit_logs')
        if (stored) {
          this.logs = JSON.parse(stored)
        }
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error)
      this.logs = []
    }
  }

  private saveLogs(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('audit_logs', JSON.stringify(this.logs))
      }
    } catch (error) {
      console.error('Failed to save audit logs:', error)
    }
  }

  private async sendToBackend(auditLog: AuditLog): Promise<void> {
    try {
      // In production, send to backend API
      // await fetch('/api/audit-logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(auditLog)
      // })
      
      // For now, just simulate the API call
      console.log('📤 Audit log sent to backend:', auditLog.id)
    } catch (error) {
      console.error('Failed to send audit log to backend:', error)
    }
  }
}

// Create singleton instance
export const auditLogger = new AuditLogger()

// Convenience functions for common audit actions
export const logRegistrationAction = auditLogger.logRegistration.bind(auditLogger)
export const logMealScanAction = auditLogger.logMealScan.bind(auditLogger)
export const logPaymentAction = auditLogger.logPayment.bind(auditLogger)
