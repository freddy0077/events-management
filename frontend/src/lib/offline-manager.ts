// BRS Requirement: Offline Mode Support for registration and meal scanning
// This module provides comprehensive offline functionality with sync capabilities

export interface OfflineRegistration {
  id: string
  timestamp: string
  eventId: string
  participantData: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    category: string
  }
  paymentData: {
    receiptNumber?: string
    amount: number
    status: 'PENDING' | 'APPROVED' | 'DECLINED'
  }
  qrCode?: string
  synced: boolean
  syncAttempts: number
  lastSyncAttempt?: string
  syncError?: string
}

export interface OfflineMealScan {
  id: string
  timestamp: string
  qrCode: string
  mealSession: string
  scannerId: string
  scannerUserId: string
  result: {
    success: boolean
    participantName?: string
    error?: string
    isDuplicate?: boolean
    isManualOverride?: boolean
    overrideReason?: string
  }
  synced: boolean
  syncAttempts: number
  lastSyncAttempt?: string
  syncError?: string
}

export interface OfflineData {
  registrations: OfflineRegistration[]
  mealScans: OfflineMealScan[]
  lastSync: string
  pendingSync: number
}

class OfflineManager {
  private storageKey = 'offline_data'
  private maxRetries = 3
  private syncInterval: NodeJS.Timeout | null = null
  private isOnline = true
  private syncInProgress = false

  constructor() {
    this.initializeOfflineMode()
    this.setupNetworkListeners()
    this.startPeriodicSync()
  }

  /**
   * Initialize offline mode and check network status
   */
  private initializeOfflineMode(): void {
    this.isOnline = navigator.onLine
    console.log(`🌐 Offline Manager initialized - Network: ${this.isOnline ? 'Online' : 'Offline'}`)
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      console.log('🌐 Network: Back online - Starting sync...')
      this.syncOfflineData()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      console.log('🌐 Network: Offline mode activated')
    })
  }

  /**
   * Start periodic sync when online
   */
  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncOfflineData()
      }
    }, 30000) // Sync every 30 seconds when online
  }

  /**
   * Get current network status
   */
  isNetworkOnline(): boolean {
    return this.isOnline
  }

  /**
   * Store registration offline
   */
  async storeOfflineRegistration(
    eventId: string,
    participantData: OfflineRegistration['participantData'],
    paymentData: OfflineRegistration['paymentData']
  ): Promise<string> {
    const registrationId = `offline_reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const offlineRegistration: OfflineRegistration = {
      id: registrationId,
      timestamp: new Date().toISOString(),
      eventId,
      participantData,
      paymentData,
      qrCode: `QR_${registrationId}`, // Generate offline QR code
      synced: false,
      syncAttempts: 0
    }

    const data = this.getOfflineData()
    data.registrations.push(offlineRegistration)
    data.pendingSync++
    this.saveOfflineData(data)

    console.log('💾 Registration stored offline:', registrationId)
    return registrationId
  }

  /**
   * Store meal scan offline
   */
  async storeOfflineMealScan(
    qrCode: string,
    mealSession: string,
    scannerId: string,
    scannerUserId: string,
    result: OfflineMealScan['result']
  ): Promise<string> {
    const scanId = `offline_scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const offlineScan: OfflineMealScan = {
      id: scanId,
      timestamp: new Date().toISOString(),
      qrCode,
      mealSession,
      scannerId,
      scannerUserId,
      result,
      synced: false,
      syncAttempts: 0
    }

    const data = this.getOfflineData()
    data.mealScans.push(offlineScan)
    data.pendingSync++
    this.saveOfflineData(data)

    console.log('💾 Meal scan stored offline:', scanId)
    return scanId
  }

  /**
   * Get offline data statistics
   */
  getOfflineStats(): {
    isOnline: boolean
    pendingRegistrations: number
    pendingScans: number
    totalPending: number
    lastSync: string
    syncInProgress: boolean
  } {
    const data = this.getOfflineData()
    const pendingRegistrations = data.registrations.filter(r => !r.synced).length
    const pendingScans = data.mealScans.filter(s => !s.synced).length

    return {
      isOnline: this.isOnline,
      pendingRegistrations,
      pendingScans,
      totalPending: pendingRegistrations + pendingScans,
      lastSync: data.lastSync,
      syncInProgress: this.syncInProgress
    }
  }

  /**
   * Get pending offline registrations
   */
  getPendingRegistrations(): OfflineRegistration[] {
    const data = this.getOfflineData()
    return data.registrations.filter(r => !r.synced)
  }

  /**
   * Get pending offline meal scans
   */
  getPendingMealScans(): OfflineMealScan[] {
    const data = this.getOfflineData()
    return data.mealScans.filter(s => !s.synced)
  }

  /**
   * Sync all offline data to backend
   */
  async syncOfflineData(): Promise<{
    success: boolean
    syncedRegistrations: number
    syncedScans: number
    errors: string[]
  }> {
    if (!this.isOnline || this.syncInProgress) {
      return {
        success: false,
        syncedRegistrations: 0,
        syncedScans: 0,
        errors: ['Network offline or sync in progress']
      }
    }

    this.syncInProgress = true
    console.log('🔄 Starting offline data sync...')

    const data = this.getOfflineData()
    const errors: string[] = []
    let syncedRegistrations = 0
    let syncedScans = 0

    try {
      // Sync registrations
      const pendingRegistrations = data.registrations.filter(r => !r.synced && r.syncAttempts < this.maxRetries)
      for (const registration of pendingRegistrations) {
        try {
          const synced = await this.syncRegistration(registration)
          if (synced) {
            registration.synced = true
            syncedRegistrations++
            data.pendingSync--
          } else {
            registration.syncAttempts++
            registration.lastSyncAttempt = new Date().toISOString()
          }
        } catch (error) {
          registration.syncAttempts++
          registration.lastSyncAttempt = new Date().toISOString()
          registration.syncError = error instanceof Error ? error.message : 'Sync failed'
          errors.push(`Registration ${registration.id}: ${registration.syncError}`)
        }
      }

      // Sync meal scans
      const pendingScans = data.mealScans.filter(s => !s.synced && s.syncAttempts < this.maxRetries)
      for (const scan of pendingScans) {
        try {
          const synced = await this.syncMealScan(scan)
          if (synced) {
            scan.synced = true
            syncedScans++
            data.pendingSync--
          } else {
            scan.syncAttempts++
            scan.lastSyncAttempt = new Date().toISOString()
          }
        } catch (error) {
          scan.syncAttempts++
          scan.lastSyncAttempt = new Date().toISOString()
          scan.syncError = error instanceof Error ? error.message : 'Sync failed'
          errors.push(`Meal scan ${scan.id}: ${scan.syncError}`)
        }
      }

      data.lastSync = new Date().toISOString()
      this.saveOfflineData(data)

      console.log(`✅ Sync completed: ${syncedRegistrations} registrations, ${syncedScans} scans`)
      
      return {
        success: errors.length === 0,
        syncedRegistrations,
        syncedScans,
        errors
      }
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Force sync now (manual trigger)
   */
  async forceSyncNow(): Promise<{
    success: boolean
    syncedRegistrations: number
    syncedScans: number
    errors: string[]
  }> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline')
    }
    return await this.syncOfflineData()
  }

  /**
   * Clear synced data (maintenance)
   */
  clearSyncedData(): void {
    const data = this.getOfflineData()
    data.registrations = data.registrations.filter(r => !r.synced)
    data.mealScans = data.mealScans.filter(s => !s.synced)
    this.saveOfflineData(data)
    console.log('🧹 Cleared synced offline data')
  }

  /**
   * Export offline data for backup
   */
  exportOfflineData(): string {
    const data = this.getOfflineData()
    return JSON.stringify(data, null, 2)
  }

  /**
   * Import offline data from backup
   */
  importOfflineData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData) as OfflineData
      this.saveOfflineData(data)
      console.log('📥 Offline data imported successfully')
    } catch (error) {
      throw new Error('Invalid offline data format')
    }
  }

  private async syncRegistration(registration: OfflineRegistration): Promise<boolean> {
    try {
      // In production, this would call the GraphQL API
      // const response = await fetch('/api/graphql', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     query: CREATE_REGISTRATION_MUTATION,
      //     variables: { input: registration }
      //   })
      // })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock success (90% success rate)
      const success = Math.random() > 0.1
      console.log(`📤 Registration sync ${success ? 'successful' : 'failed'}:`, registration.id)
      return success
    } catch (error) {
      console.error('Registration sync error:', error)
      return false
    }
  }

  private async syncMealScan(scan: OfflineMealScan): Promise<boolean> {
    try {
      // In production, this would call the GraphQL API
      // const response = await fetch('/api/graphql', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     query: CREATE_MEAL_ATTENDANCE_MUTATION,
      //     variables: { input: scan }
      //   })
      // })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock success (95% success rate)
      const success = Math.random() > 0.05
      console.log(`📤 Meal scan sync ${success ? 'successful' : 'failed'}:`, scan.id)
      return success
    } catch (error) {
      console.error('Meal scan sync error:', error)
      return false
    }
  }

  private getOfflineData(): OfflineData {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load offline data:', error)
    }

    // Return default structure
    return {
      registrations: [],
      mealScans: [],
      lastSync: new Date().toISOString(),
      pendingSync: 0
    }
  }

  private saveOfflineData(data: OfflineData): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save offline data:', error)
    }
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    window.removeEventListener('online', this.syncOfflineData)
    window.removeEventListener('offline', this.syncOfflineData)
  }
}

// Create singleton instance
export const offlineManager = new OfflineManager()

// Convenience functions
export const storeOfflineRegistration = offlineManager.storeOfflineRegistration.bind(offlineManager)
export const storeOfflineMealScan = offlineManager.storeOfflineMealScan.bind(offlineManager)
export const syncOfflineData = offlineManager.syncOfflineData.bind(offlineManager)
export const getOfflineStats = offlineManager.getOfflineStats.bind(offlineManager)
