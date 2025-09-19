'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileImage,
  Users,
  Utensils,
  Shield,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'
import {
  exportRegistrationReport,
  exportMealAttendanceReport,
  exportAuditLogReport,
  exportEventSummaryReport,
  type RegistrationExportData,
  type MealAttendanceExportData,
  type AuditLogExportData
} from '@/lib/export-utils'

// Data will be fetched from GraphQL API
const registrationData: RegistrationExportData[] = []
const mealAttendanceData: MealAttendanceExportData[] = []
const auditLogData: AuditLogExportData[] = []

interface ExportReportsProps {
  eventName?: string
  eventDate?: string
}

export default function ExportReports({ eventName = 'Event', eventDate = new Date().toISOString() }: ExportReportsProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null)

  const handleExport = async (reportType: string, format: 'csv' | 'excel' | 'pdf') => {
    const exportKey = `${reportType}-${format}`
    setIsExporting(exportKey)

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      switch (reportType) {
        case 'registrations':
          if (registrationData.length === 0) {
            toast.error('No registration data available to export')
            return
          }
          exportRegistrationReport(registrationData, format)
          toast.success(`Registration report exported as ${format.toUpperCase()}`)
          break
        
        case 'meal-attendance':
          if (mealAttendanceData.length === 0) {
            toast.error('No meal attendance data available to export')
            return
          }
          exportMealAttendanceReport(mealAttendanceData, format)
          toast.success(`Meal attendance report exported as ${format.toUpperCase()}`)
          break
        
        case 'audit-logs':
          if (auditLogData.length === 0) {
            toast.error('No audit log data available to export')
            return
          }
          exportAuditLogReport(auditLogData, format)
          toast.success(`Audit log report exported as ${format.toUpperCase()}`)
          break
        
        case 'event-summary':
          const eventSummaryData = {
            eventName,
            eventDate,
            totalRegistrations: registrationData.length,
            totalRevenue: registrationData.reduce((sum, reg) => sum + reg.amount, 0),
            registrationsByCategory: [],
            mealAttendanceBySession: []
          }
          exportEventSummaryReport(eventSummaryData, format)
          toast.success(`Event summary report exported as ${format.toUpperCase()}`)
          break
        
        default:
          toast.error('Unknown report type')
      }
    } catch (error) {
      toast.error('Export failed. Please try again.')
    } finally {
      setIsExporting(null)
    }
  }

  const ExportButton = ({ 
    reportType, 
    format, 
    icon: Icon, 
    label, 
    variant = "outline" 
  }: { 
    reportType: string
    format: 'csv' | 'excel' | 'pdf'
    icon: any
    label: string
    variant?: "outline" | "default" | "destructive" | "secondary" | "ghost" | "link"
  }) => {
    const exportKey = `${reportType}-${format}`
    const loading = isExporting === exportKey

    return (
      <Button
        variant={variant}
        size="sm"
        onClick={() => handleExport(reportType, format)}
        disabled={!!isExporting}
        className="flex-1"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
        ) : (
          <Icon className="h-4 w-4 mr-2" />
        )}
        {label}
      </Button>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="h-5 w-5 mr-2" />
            Export Reports
          </CardTitle>
          <CardDescription>
            Export event data in various formats for analysis and record keeping
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Registration Reports */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                <div>
                  <h4 className="font-medium">Registration Reports</h4>
                  <p className="text-sm text-gray-600">
                    Participant details, payment status, and registration data
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                {registrationData.length} records
              </Badge>
            </div>
            <div className="flex gap-2">
              <ExportButton
                reportType="registrations"
                format="csv"
                icon={FileText}
                label="CSV"
              />
              <ExportButton
                reportType="registrations"
                format="excel"
                icon={FileSpreadsheet}
                label="Excel"
              />
              <ExportButton
                reportType="registrations"
                format="pdf"
                icon={FileImage}
                label="PDF"
              />
            </div>
          </div>

          {/* Meal Attendance Reports */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Utensils className="h-5 w-5 mr-2 text-green-600" />
                <div>
                  <h4 className="font-medium">Meal Attendance Reports</h4>
                  <p className="text-sm text-gray-600">
                    Session attendance, scan times, and meal distribution data
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                {mealAttendanceData.length} scans
              </Badge>
            </div>
            <div className="flex gap-2">
              <ExportButton
                reportType="meal-attendance"
                format="csv"
                icon={FileText}
                label="CSV"
              />
              <ExportButton
                reportType="meal-attendance"
                format="excel"
                icon={FileSpreadsheet}
                label="Excel"
              />
              <ExportButton
                reportType="meal-attendance"
                format="pdf"
                icon={FileImage}
                label="PDF"
              />
            </div>
          </div>

          {/* Audit Log Reports */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-purple-600" />
                <div>
                  <h4 className="font-medium">Audit Log Reports</h4>
                  <p className="text-sm text-gray-600">
                    System actions, user activities, and security audit trail
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                {auditLogData.length} entries
              </Badge>
            </div>
            <div className="flex gap-2">
              <ExportButton
                reportType="audit-logs"
                format="csv"
                icon={FileText}
                label="CSV"
              />
              <ExportButton
                reportType="audit-logs"
                format="excel"
                icon={FileSpreadsheet}
                label="Excel"
              />
              <ExportButton
                reportType="audit-logs"
                format="pdf"
                icon={FileImage}
                label="PDF"
              />
            </div>
          </div>

          {/* Event Summary Report */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-orange-600" />
                <div>
                  <h4 className="font-medium">Event Summary Report</h4>
                  <p className="text-sm text-gray-600">
                    Complete event overview with statistics and analytics
                  </p>
                </div>
              </div>
              <Badge variant="default">
                Complete Report
              </Badge>
            </div>
            <div className="flex gap-2">
              <ExportButton
                reportType="event-summary"
                format="csv"
                icon={FileText}
                label="CSV"
              />
              <ExportButton
                reportType="event-summary"
                format="excel"
                icon={FileSpreadsheet}
                label="Excel"
              />
              <ExportButton
                reportType="event-summary"
                format="pdf"
                icon={FileImage}
                label="PDF"
              />
            </div>
          </div>

          {/* Export Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h4 className="font-medium text-blue-800 mb-2">Export Instructions:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>CSV:</strong> Best for data analysis and import into other systems</li>
              <li>• <strong>Excel:</strong> Formatted spreadsheet with styling for presentations</li>
              <li>• <strong>PDF:</strong> Print-ready reports for documentation and archiving</li>
              <li>• All exports include timestamp and are automatically named with date</li>
              <li>• Large datasets may take a few moments to process</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
