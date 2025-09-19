'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText,
  Download,
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  PieChart,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { useMyAssignedEvents } from '@/lib/graphql/hooks'
import { format } from 'date-fns'

export default function OrganizerReportsPage() {
  const { user } = useAuth()
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [reportType, setReportType] = useState<string>('registrations')
  
  // Fetch assigned events
  const { data, loading, error } = useMyAssignedEvents()
  const events = (data as any)?.myAssignedEvents || []

  const selectedEventData = events.find((event: any) => event.id === selectedEvent)

  const reportTypes = [
    {
      id: 'registrations',
      name: 'Registration Report',
      description: 'Detailed list of all registrations',
      icon: Users
    },
    {
      id: 'attendance',
      name: 'Attendance Report',
      description: 'Check-in status and attendance tracking',
      icon: CheckCircle
    },
    {
      id: 'analytics',
      name: 'Event Analytics',
      description: 'Registration trends and statistics',
      icon: BarChart3
    },
    {
      id: 'financial',
      name: 'Financial Summary',
      description: 'Payment status and revenue overview',
      icon: TrendingUp
    }
  ]

  const generateReport = (type: string) => {
    if (!selectedEventData) return

    const event = selectedEventData
    const registrations = event.registrations || []

    let csvContent = ''
    let filename = ''

    switch (type) {
      case 'registrations':
        csvContent = generateRegistrationReport(event, registrations)
        filename = `${event.name}-registrations-${format(new Date(), 'yyyy-MM-dd')}.csv`
        break
      case 'attendance':
        csvContent = generateAttendanceReport(event, registrations)
        filename = `${event.name}-attendance-${format(new Date(), 'yyyy-MM-dd')}.csv`
        break
      case 'analytics':
        csvContent = generateAnalyticsReport(event, registrations)
        filename = `${event.name}-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`
        break
      case 'financial':
        csvContent = generateFinancialReport(event, registrations)
        filename = `${event.name}-financial-${format(new Date(), 'yyyy-MM-dd')}.csv`
        break
    }

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const generateRegistrationReport = (event: any, registrations: any[]) => {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Category', 'Registration Date', 'Payment Status']
    const rows = registrations.map(reg => [
      `"${reg.firstName} ${reg.lastName}"`,
      reg.email,
      reg.phone || '',
      reg.status,
      reg.category?.name || '',
      format(new Date(reg.createdAt), 'yyyy-MM-dd HH:mm'),
      reg.transactions?.[0]?.status || 'N/A'
    ])
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  const generateAttendanceReport = (event: any, registrations: any[]) => {
    const headers = ['Name', 'Email', 'Check-in Status', 'Check-in Time', 'QR Code Scanned']
    const rows = registrations.map(reg => [
      `"${reg.firstName} ${reg.lastName}"`,
      reg.email,
      reg.checkedIn ? 'Checked In' : 'Not Checked In',
      reg.checkedInAt ? format(new Date(reg.checkedInAt), 'yyyy-MM-dd HH:mm') : '',
      reg.qrCodeScanned ? 'Yes' : 'No'
    ])
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  const generateAnalyticsReport = (event: any, registrations: any[]) => {
    const totalRegistrations = registrations.length
    const approvedRegistrations = registrations.filter(r => r.status === 'APPROVED').length
    const pendingRegistrations = registrations.filter(r => r.status === 'PENDING').length
    const checkedInCount = registrations.filter(r => r.checkedIn).length

    const headers = ['Metric', 'Value']
    const rows = [
      ['Total Registrations', totalRegistrations],
      ['Approved Registrations', approvedRegistrations],
      ['Pending Registrations', pendingRegistrations],
      ['Checked In', checkedInCount],
      ['Check-in Rate', `${totalRegistrations > 0 ? ((checkedInCount / totalRegistrations) * 100).toFixed(1) : 0}%`],
      ['Approval Rate', `${totalRegistrations > 0 ? ((approvedRegistrations / totalRegistrations) * 100).toFixed(1) : 0}%`]
    ]
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  const generateFinancialReport = (event: any, registrations: any[]) => {
    const headers = ['Name', 'Email', 'Amount Paid', 'Payment Status', 'Payment Date', 'Receipt Number']
    const rows = registrations.flatMap(reg => 
      (reg.transactions || []).map((transaction: any) => [
        `"${reg.firstName} ${reg.lastName}"`,
        reg.email,
        transaction.amount,
        transaction.status,
        transaction.createdAt ? format(new Date(transaction.createdAt), 'yyyy-MM-dd') : '',
        transaction.receiptNumber || ''
      ])
    )
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          <span className="text-gray-600">Loading events...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Reports</h1>
          <p className="text-gray-600 mt-1">
            Generate and download reports for your assigned events
          </p>
        </div>
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          Event Organizer
        </Badge>
      </div>

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Select Event
          </CardTitle>
          <CardDescription>
            Choose an event to generate reports for
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an event to generate reports" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event: any) => (
                <SelectItem key={event.id} value={event.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{event.name}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      {event.date && format(new Date(event.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedEventData && (
        <>
          {/* Event Summary */}
          <Card>
            <CardHeader>
              <CardTitle>{selectedEventData.name}</CardTitle>
              <CardDescription>
                {selectedEventData.date && format(new Date(selectedEventData.date), 'PPPP')} • {selectedEventData.venue}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedEventData.registrations?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Registrations</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {selectedEventData.registrations?.filter((r: any) => r.status === 'APPROVED').length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Approved</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {selectedEventData.registrations?.filter((r: any) => r.status === 'PENDING').length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {selectedEventData.registrations?.filter((r: any) => r.checkedIn).length || 0}
                  </p>
                  <p className="text-sm text-gray-600">Checked In</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Types */}
          <div className="grid gap-6 md:grid-cols-2">
            {reportTypes.map((report: any) => {
              const Icon = report.icon
              return (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Icon className="h-5 w-5 mr-2 text-orange-600" />
                      {report.name}
                    </CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={() => generateReport(report.id)}
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download {report.name}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Report Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">CSV Format</h4>
                <p className="text-sm text-gray-600">
                  All reports are generated in CSV format for easy import into spreadsheet applications
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Privacy Compliance</h4>
                <p className="text-sm text-gray-600">
                  Reports contain participant data - ensure compliance with privacy regulations
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Real-time Data</h4>
                <p className="text-sm text-gray-600">
                  Reports reflect current data at the time of generation
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Download className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Secure Downloads</h4>
                <p className="text-sm text-gray-600">
                  Files are generated locally and downloaded directly to your device
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
