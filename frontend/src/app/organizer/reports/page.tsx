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
  
  // Fetch assigned events with registrations
  const { data, loading, error } = useMyAssignedEvents()
  const events = (data as any)?.myAssignedEvents || []

  const selectedEventData = events.find((event: any) => event.id === selectedEvent)
  
  // Get registrations from selected event
  const eventRegistrations = selectedEventData?.registrations || []

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
    if (!selectedEventData || eventRegistrations.length === 0) {
      alert('No registration data available for this event')
      return
    }

    const event = selectedEventData
    const registrations = eventRegistrations

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
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Category', 'Category Price', 'Registration Date', 'Payment Status', 'QR Code']
    const rows = registrations.map((reg: any) => [
      `"${reg.firstName} ${reg.lastName}"`,
      reg.email,
      reg.phone || 'N/A',
      reg.status || 'PENDING',
      reg.category?.name || 'N/A',
      reg.category?.price || 0,
      format(new Date(reg.createdAt), 'yyyy-MM-dd HH:mm'),
      reg.paymentStatus || 'PENDING',
      reg.qrCode ? 'Generated' : 'Not Generated'
    ])
    return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n')
  }

  const generateAttendanceReport = (event: any, registrations: any[]) => {
    const headers = ['Name', 'Email', 'Check-in Status', 'Check-in Time', 'QR Code Scanned']
    const rows = registrations.map((reg: any) => [
      `"${reg.firstName} ${reg.lastName}"`,
      reg.email,
      reg.checkedIn ? 'Checked In' : 'Not Checked In',
      reg.checkedInAt ? format(new Date(reg.checkedInAt), 'yyyy-MM-dd HH:mm') : '',
      reg.qrCodeScanned ? 'Yes' : 'No'
    ])
    return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n')
  }

  const generateAnalyticsReport = (event: any, registrations: any[]) => {
    const totalRegistrations = registrations.length
    const approvedRegistrations = registrations.filter(r => r.status === 'APPROVED').length
    const pendingRegistrations = registrations.filter(r => r.status === 'PENDING').length
    const declinedRegistrations = registrations.filter(r => r.status === 'DECLINED').length
    const checkedInCount = registrations.filter(r => r.checkedIn).length
    const paidCount = registrations.filter(r => r.paymentStatus === 'PAID').length
    const qrGeneratedCount = registrations.filter(r => r.qrCode).length

    const headers = ['Metric', 'Value']
    const rows = [
      ['=== REGISTRATION METRICS ===', ''],
      ['Total Registrations', totalRegistrations],
      ['Approved Registrations', approvedRegistrations],
      ['Pending Registrations', pendingRegistrations],
      ['Declined Registrations', declinedRegistrations],
      ['', ''],
      ['=== PAYMENT METRICS ===', ''],
      ['Paid Registrations', paidCount],
      ['Payment Rate', `${totalRegistrations > 0 ? ((paidCount / totalRegistrations) * 100).toFixed(1) : 0}%`],
      ['', ''],
      ['=== ATTENDANCE METRICS ===', ''],
      ['Checked In', checkedInCount],
      ['Check-in Rate', `${totalRegistrations > 0 ? ((checkedInCount / totalRegistrations) * 100).toFixed(1) : 0}%`],
      ['QR Codes Generated', qrGeneratedCount],
      ['', ''],
      ['=== APPROVAL METRICS ===', ''],
      ['Approval Rate', `${totalRegistrations > 0 ? ((approvedRegistrations / totalRegistrations) * 100).toFixed(1) : 0}%`],
      ['Decline Rate', `${totalRegistrations > 0 ? ((declinedRegistrations / totalRegistrations) * 100).toFixed(1) : 0}%`]
    ]
    
    // Add category breakdown
    const categoryStats = event.categories?.map((cat: any) => {
      const catRegs = registrations.filter(r => r.category?.id === cat.id)
      return {
        name: cat.name,
        count: catRegs.length,
        capacity: cat.maxCapacity,
        price: cat.price,
        revenue: catRegs.filter(r => r.paymentStatus === 'PAID').length * cat.price
      }
    }) || []
    
    if (categoryStats.length > 0) {
      rows.push(['', ''])
      rows.push(['=== CATEGORY BREAKDOWN ===', ''])
      categoryStats.forEach((stat: any) => {
        rows.push([`${stat.name} - Registrations`, stat.count])
        rows.push([`${stat.name} - Capacity`, stat.capacity])
        rows.push([`${stat.name} - Utilization`, `${stat.capacity > 0 ? ((stat.count / stat.capacity) * 100).toFixed(1) : 0}%`])
        rows.push([`${stat.name} - Revenue`, `GHS ${stat.revenue}`])
        rows.push(['', ''])
      })
    }
    
    return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n')
  }

  const generateFinancialReport = (event: any, registrations: any[]) => {
    const headers = ['Name', 'Email', 'Category', 'Category Price', 'Payment Status', 'Amount Paid', 'Payment Date', 'Receipt Number']
    
    // Include all registrations, even those without transactions
    const rows = registrations.map(reg => {
      const transaction = reg.transactions?.[0] // Get first/latest transaction
      return [
        `"${reg.firstName} ${reg.lastName}"`,
        reg.email,
        reg.category?.name || 'N/A',
        reg.category?.price || 0,
        reg.paymentStatus || 'PENDING',
        transaction?.amount || 0,
        transaction?.createdAt ? format(new Date(transaction.createdAt), 'yyyy-MM-dd HH:mm') : 'N/A',
        transaction?.receiptNumber || 'N/A'
      ]
    })
    
    // Add summary row
    const totalRevenue = registrations.reduce((sum, reg) => {
      const amount = reg.transactions?.[0]?.amount || 0
      return sum + (reg.paymentStatus === 'PAID' ? amount : 0)
    }, 0)
    
    const paidCount = registrations.filter(r => r.paymentStatus === 'PAID').length
    const pendingCount = registrations.filter(r => r.paymentStatus === 'PENDING').length
    
    rows.push(['', '', '', '', '', '', '', '']) // Empty row
    rows.push(['SUMMARY', '', '', '', '', '', '', ''])
    rows.push(['Total Registrations', registrations.length, '', '', '', '', '', ''])
    rows.push(['Paid', paidCount, '', '', '', '', '', ''])
    rows.push(['Pending', pendingCount, '', '', '', '', '', ''])
    rows.push(['Total Revenue', '', '', '', '', totalRevenue, '', ''])
    
    return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
          <span className="text-gray-600">Loading events and registrations...</span>
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
                    {eventRegistrations.length}
                  </p>
                  <p className="text-sm text-gray-600">Total Registrations</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {eventRegistrations.filter((r: any) => r.status === 'APPROVED').length}
                  </p>
                  <p className="text-sm text-gray-600">Approved</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {eventRegistrations.filter((r: any) => r.status === 'PENDING').length}
                  </p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {eventRegistrations.filter((r: any) => r.checkedIn).length}
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
