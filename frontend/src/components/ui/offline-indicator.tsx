'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Database
} from 'lucide-react'
import { offlineManager, getOfflineStats } from '@/lib/offline-manager'
import { toast } from 'sonner'

interface OfflineIndicatorProps {
  className?: string
  showDetails?: boolean
}

export default function OfflineIndicator({ className, showDetails = false }: OfflineIndicatorProps) {
  const [stats, setStats] = useState({
    isOnline: true,
    pendingRegistrations: 0,
    pendingScans: 0,
    totalPending: 0,
    lastSync: '',
    syncInProgress: false
  })
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    updateStats()
    
    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000)
    
    // Listen for network changes
    const handleOnline = () => updateStats()
    const handleOffline = () => updateStats()
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const updateStats = () => {
    const currentStats = getOfflineStats()
    setStats(currentStats)
  }

  const handleForceSync = async () => {
    if (!stats.isOnline) {
      toast.error('Cannot sync while offline')
      return
    }

    try {
      toast.loading('Syncing offline data...', { id: 'sync' })
      const result = await offlineManager.forceSyncNow()
      
      if (result.success) {
        toast.success(
          `Sync completed! ${result.syncedRegistrations} registrations, ${result.syncedScans} scans synced.`,
          { id: 'sync' }
        )
      } else {
        toast.error(
          `Sync completed with errors. ${result.errors.length} items failed.`,
          { id: 'sync' }
        )
      }
      
      updateStats()
    } catch (error) {
      toast.error('Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'), { id: 'sync' })
    }
  }

  const formatLastSync = (timestamp: string): string => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  if (!showDetails && stats.isOnline && stats.totalPending === 0) {
    return null // Hide when online and no pending data
  }

  return (
    <div className={className}>
      {/* Compact Indicator */}
      <div 
        className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${
          stats.isOnline 
            ? stats.totalPending > 0 
              ? 'bg-yellow-50 border border-yellow-200 hover:bg-yellow-100' 
              : 'bg-green-50 border border-green-200 hover:bg-green-100'
            : 'bg-red-50 border border-red-200 hover:bg-red-100'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {stats.isOnline ? (
          <Wifi className={`h-4 w-4 ${stats.totalPending > 0 ? 'text-yellow-600' : 'text-green-600'}`} />
        ) : (
          <WifiOff className="h-4 w-4 text-red-600" />
        )}
        
        <span className={`text-sm font-medium ${
          stats.isOnline 
            ? stats.totalPending > 0 ? 'text-yellow-800' : 'text-green-800'
            : 'text-red-800'
        }`}>
          {stats.isOnline ? 'Online' : 'Offline'}
        </span>

        {stats.totalPending > 0 && (
          <Badge variant="secondary" className="text-xs">
            {stats.totalPending} pending
          </Badge>
        )}

        {stats.syncInProgress && (
          <RefreshCw className="h-3 w-3 animate-spin text-blue-600" />
        )}
      </div>

      {/* Expanded Details */}
      {(isExpanded || showDetails) && (
        <Card className="mt-2">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Offline Mode Status</h4>
              <div className="flex items-center space-x-2">
                {stats.isOnline ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm ${stats.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.isOnline ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            {/* Pending Data Summary */}
            {stats.totalPending > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center">
                  <Database className="h-4 w-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">Pending Sync</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Registrations:</span>
                    <span className="ml-2 font-medium">{stats.pendingRegistrations}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Meal Scans:</span>
                    <span className="ml-2 font-medium">{stats.pendingScans}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Last Sync Info */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>Last sync: {formatLastSync(stats.lastSync)}</span>
              </div>
              
              {stats.isOnline && stats.totalPending > 0 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleForceSync}
                  disabled={stats.syncInProgress}
                >
                  {stats.syncInProgress ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Sync Now
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Offline Mode Info */}
            {!stats.isOnline && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Offline Mode Active</p>
                    <p className="mt-1">
                      You can continue registering participants and scanning QR codes. 
                      Data will sync automatically when connection is restored.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
