'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Download, 
  Search, 
  Filter, 
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react'
import { useAuditLogs, useAuditStats, AuditLog, AuditLogFilters } from '@/lib/graphql/hooks/useAuditLogs'
import { toast } from 'sonner'

interface AuditLogsProps {
  className?: string
}

export default function AuditLogs({ className }: AuditLogsProps) {
  const [filters, setFilters] = useState<AuditLogFilters>({
    action: '',
    performedBy: '',
    startDate: undefined,
    endDate: undefined,
    limit: 50,
    offset: 0
  })
  const [searchTerm, setSearchTerm] = useState('')

  // API calls
  const { data: auditData, loading: logsLoading, error: logsError, refetch } = useAuditLogs(filters)
  const { data: statsData, loading: statsLoading, error: statsError } = useAuditStats({
    startDate: filters.startDate,
    endDate: filters.endDate
  })

  const logs = auditData?.getAuditLogs?.logs || []
  const stats = statsData?.getAuditStats
  const isLoading = logsLoading || statsLoading

  useEffect(() => {
    if (logsError) {
      console.error('Failed to load audit logs:', logsError)
      toast.error('Failed to load audit logs')
    }
    if (statsError) {
      console.error('Failed to load audit stats:', statsError)
      toast.error('Failed to load audit statistics')
    }
  }, [logsError, statsError])

  const handleFilterChange = (field: keyof AuditLogFilters, value: string | Date | undefined) => {
    setFilters(prev => ({ 
      ...prev, 
      [field]: value,
      offset: 0 // Reset pagination when filters change
    }))
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    // For search, we'll filter client-side for better UX
  }

  // Filter logs client-side for search term
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    const userName = log.performedByUser?.fullName || ''
    const userEmail = log.performedByUser?.email || ''
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.performedBy.toLowerCase().includes(searchLower) ||
      userName.toLowerCase().includes(searchLower) ||
      userEmail.toLowerCase().includes(searchLower) ||
      log.event?.name.toLowerCase().includes(searchLower) ||
      log.registration?.fullName.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.details).toLowerCase().includes(searchLower)
    )
  })

  const clearFilters = () => {
    setFilters({
      action: '',
      performedBy: '',
      startDate: undefined,
      endDate: undefined,
      limit: 50,
      offset: 0
    })
    setSearchTerm('')
  }

  const exportLogs = (format: 'json' | 'csv') => {
    try {
      let exportData: string
      
      if (format === 'csv') {
        const headers = [
          'ID', 'Timestamp', 'Action', 'Event', 'Registration', 
          'Performed By', 'IP Address', 'Details'
        ]
        
        const rows = filteredLogs.map(log => [
          log.id,
          new Date(log.createdAt).toLocaleString(),
          log.action,
          log.event?.name || '',
          log.registration?.fullName || '',
          log.performedByUser?.fullName || log.performedByUser?.email || log.performedBy,
          log.ipAddress || '',
          JSON.stringify(log.details)
        ])

        exportData = [headers, ...rows].map(row => row.join(',')).join('\n')
      } else {
        exportData = JSON.stringify(filteredLogs, null, 2)
      }
      
      const blob = new Blob([exportData], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success(`Audit logs exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export audit logs')
    }
  }

  const getActionBadgeColor = (action: string): string => {
    if (action.includes('CREATED') || action.includes('SUCCESS') || action.includes('APPROVED') || action.includes('LOGIN')) {
      return 'bg-green-100 text-green-800'
    }
    if (action.includes('FAILED') || action.includes('REJECTED') || action.includes('DENIED') || action.includes('DELETED')) {
      return 'bg-red-100 text-red-800'
    }
    if (action.includes('UPDATED') || action.includes('OVERRIDE') || action.includes('CHANGE')) {
      return 'bg-yellow-100 text-yellow-800'
    }
    if (action.includes('SCANNED') || action.includes('VALIDATED')) {
      return 'bg-purple-100 text-purple-800'
    }
    return 'bg-blue-100 text-blue-800'
  }

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString()
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2">Loading audit logs...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Logs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalLogs}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <User className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Top Actions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.actionCounts.length > 0 ? stats.actionCounts[0].count : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.topUsers.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredLogs.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Audit Logs
          </CardTitle>
          <CardDescription>
            Comprehensive audit trail of all system activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Export */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportLogs('csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={() => exportLogs('json')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Action</Label>
                <select
                  value={filters.action || ''}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Actions</option>
                  <option value="LOGIN">Login</option>
                  <option value="LOGOUT">Logout</option>
                  <option value="EVENT_CREATED">Event Created</option>
                  <option value="REGISTRATION_CREATED">Registration Created</option>
                  <option value="QR_SCANNED">QR Scanned</option>
                  <option value="QR_VALIDATED">QR Validated</option>
                  <option value="MEAL_SESSION_CREATED">Meal Session Created</option>
                  <option value="PASSWORD_CHANGE">Password Change</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>

              <div className="space-y-2">
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : undefined)}
                />
              </div>

              <div className="space-y-2">
                <Label>Performed By</Label>
                <Input
                  placeholder="Filter by user name or ID"
                  value={filters.performedBy || ''}
                  onChange={(e) => handleFilterChange('performedBy', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
              <span className="text-sm text-gray-500">
                Showing {filteredLogs.length} of {auditData?.getAuditLogs?.total || 0} logs
                {auditData?.getAuditLogs?.hasMore && ' (more available)'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event/Registration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performed By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTimestamp(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`text-xs ${getActionBadgeColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {log.event && (
                          <>
                            <div className="font-medium">{log.event.name}</div>
                            <div className="text-gray-500 text-xs">Event</div>
                          </>
                        )}
                        {log.registration && (
                          <>
                            <div className="font-medium">{log.registration.fullName}</div>
                            <div className="text-gray-500 text-xs">{log.registration.email}</div>
                          </>
                        )}
                        {!log.event && !log.registration && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">
                        {log.performedByUser?.fullName || log.performedByUser?.email || log.performedBy}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <details className="cursor-pointer">
                        <summary className="text-blue-600 hover:text-blue-800">
                          View Details
                        </summary>
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                          {(log as any).errorMessage && (
                            <div className="mt-2 text-red-600">
                              <strong>Error:</strong> {(log as any).errorMessage}
                            </div>
                          )}
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your filters or check back later.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
