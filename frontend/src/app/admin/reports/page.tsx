'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  BarChart3, 
  Users, 
  Calendar,
  DollarSign,
  Utensils,
  TrendingUp,
  Filter,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  FileImage,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { toast } from 'sonner'
import { exportToCSV, exportToPDF, exportToExcel } from '@/lib/export-utils'

// Data will be fetched from GraphQL API
const reportData = {
  registrationSummary: {
    totalRegistrations: 0,
    approvedRegistrations: 0,
    pendingRegistrations: 0,
    declinedRegistrations: 0,
    totalRevenue: 0,
    averageTicketPrice: 0
  },
  eventBreakdown: [],
  mealAttendance: []
}

export default function AdminReportsPage() {
  const { isAuthenticated, user } = useAuth()
  
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [reportType, setReportType] = useState<'registration' | 'meal' | 'financial' | 'audit'>('registration')
  const [isExporting, setIsExporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access reports</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleExport = async (format: 'csv' | 'pdf' | 'excel') => {
    setIsExporting(true)
    try {
      const data = reportType === 'registration' ? reportData.eventBreakdown : reportData.mealAttendance
      const filename = `${reportType}-report-${new Date().toISOString().split('T')[0]}`
      
      switch (format) {
        case 'csv':
          await exportToCSV({
            headers: ['Name', 'Email', 'Event', 'Status'],
            rows: data.map((item: any) => [item.name, item.email, item.event, item.status]),
            title: 'Admin Report',
            filename: 'admin-report.csv'
          })
          break
        case 'pdf':
          await exportToPDF({
            headers: ['Name', 'Email', 'Event', 'Status'],
            rows: data.map((item: any) => [item.name, item.email, item.event, item.status]),
            title: 'Admin Report',
            filename: 'admin-report.pdf'
          })
          break
        case 'excel':
          await exportToExcel({
            headers: ['Name', 'Email', 'Event', 'Status'],
            rows: data.map((item: any) => [item.name, item.email, item.event, item.status]),
            title: 'Admin Report',
            filename: 'admin-report.xlsx'
          })
          break
      }
      
      toast.success(`Report exported as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-primary-50 to-neutral-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-12 space-y-4 lg:space-y-0">
          <div>
            <Button variant="outline" asChild className="mb-6 border-2 border-neutral-200 hover:border-brand-300 hover:bg-brand-50">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-2 mb-4">
              <BarChart3 className="h-4 w-4 text-brand-600" />
              <span className="text-sm font-medium text-brand-700">Reports & Analytics</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
              Event Reports
              <span className="block bg-gradient-to-r from-brand-600 to-primary-600 bg-clip-text text-transparent">
                & Analytics
              </span>
            </h1>
            <p className="text-xl text-neutral-600">
              Comprehensive reporting for registrations, payments, and meal attendance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-2 border-neutral-200 hover:border-brand-300">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registration">Registration Reports</SelectItem>
                    <SelectItem value="meal">Meal Attendance</SelectItem>
                    <SelectItem value="financial">Financial Reports</SelectItem>
                    <SelectItem value="audit">Audit Logs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Event</Label>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {/* Events will be populated from GraphQL API */}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Total Registrations</p>
                  <p className="text-3xl font-bold text-orange-900">{reportData.registrationSummary.totalRegistrations.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Approved</p>
                  <p className="text-3xl font-bold text-green-900">{reportData.registrationSummary.approvedRegistrations.toLocaleString()}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Pending</p>
                  <p className="text-3xl font-bold text-yellow-900">{reportData.registrationSummary.pendingRegistrations.toLocaleString()}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-purple-900">{formatCurrency(reportData.registrationSummary.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Report Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Registration Reports */}
            {reportType === 'registration' && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Registration Reports</CardTitle>
                      <CardDescription>Detailed breakdown by event and category</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={isExporting}>
                        <FileSpreadsheet className="h-4 w-4 mr-1" />
                        CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleExport('excel')} disabled={isExporting}>
                        <FileText className="h-4 w-4 mr-1" />
                        Excel
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={isExporting}>
                        <FileImage className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {reportData.eventBreakdown.map((event: any) => (
                      <div key={event.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{event.name}</h3>
                            <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
                          </div>
                          <Badge variant="secondary">{formatCurrency(event.revenue)}</Badge>
                        </div>
                        
                        <div className="grid md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{event.totalRegistrations}</p>
                            <p className="text-sm text-gray-600">Total</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{event.approvedRegistrations}</p>
                            <p className="text-sm text-gray-600">Approved</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-yellow-600">{event.pendingRegistrations}</p>
                            <p className="text-sm text-gray-600">Pending</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">{event.declinedRegistrations}</p>
                            <p className="text-sm text-gray-600">Declined</p>
                          </div>
                        </div>
                        
                        <div className="border-t pt-3">
                          <h4 className="font-medium mb-2">Category Breakdown</h4>
                          <div className="space-y-2">
                            {event.categories.map((category: any, index: number) => (
                              <div key={index} className="flex justify-between items-center">
                                <span className="text-sm">{category.name}</span>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{category.count} registrations</Badge>
                                  <span className="text-sm font-medium">{formatCurrency(category.revenue)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Meal Attendance Reports */}
            {reportType === 'meal' && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Meal Attendance Reports</CardTitle>
                      <CardDescription>Session attendance and capacity utilization</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={isExporting}>
                        <FileSpreadsheet className="h-4 w-4 mr-1" />
                        CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={isExporting}>
                        <FileImage className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {reportData.mealAttendance.map((event: any) => (
                      <div key={event.eventId} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-4">{event.eventName}</h3>
                        <div className="space-y-3">
                          {event.sessions.map((session: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <Utensils className="h-5 w-5 text-gray-600" />
                                <div>
                                  <p className="font-medium">{session.name}</p>
                                  <p className="text-sm text-gray-600">{session.time}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-semibold">{session.attended}/{session.capacity}</span>
                                  <Badge variant={session.percentage > 90 ? "default" : session.percentage > 70 ? "secondary" : "outline"}>
                                    {session.percentage}%
                                  </Badge>
                                </div>
                                <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${session.percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Export Options */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="h-5 w-5 mr-2" />
                  Export Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => handleExport('csv')} 
                  disabled={isExporting}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export as CSV
                </Button>
                <Button 
                  onClick={() => handleExport('excel')} 
                  disabled={isExporting}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export as Excel
                </Button>
                <Button 
                  onClick={() => handleExport('pdf')} 
                  disabled={isExporting}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <FileImage className="h-4 w-4 mr-2" />
                  Export as PDF
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg. Ticket Price</span>
                  <span className="font-medium">{formatCurrency(reportData.registrationSummary.averageTicketPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Approval Rate</span>
                  <span className="font-medium">87.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Events</span>
                  <span className="font-medium">{reportData.eventBreakdown.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
