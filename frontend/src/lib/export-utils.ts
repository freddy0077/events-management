// BRS Requirement: Export Options - CSV, PDF, Excel
import { formatDate, formatDateTime, formatCurrency } from './utils'

export interface ExportData {
  headers: string[]
  rows: (string | number)[][]
  title: string
  filename: string
}

export interface RegistrationExportData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  organization: string
  category: string
  paymentStatus: string
  registrationDate: string
  amount: number
}

export interface MealAttendanceExportData {
  participantName: string
  email: string
  category: string
  mealSession: string
  scanTime: string
  status: string
  scannedBy: string
}

export interface AuditLogExportData {
  timestamp: string
  action: string
  user: string
  details: string
  ipAddress?: string
  result: string
}

// CSV Export Functionality
export const exportToCSV = (data: ExportData): void => {
  const csvContent = [
    data.headers.join(','),
    ...data.rows.map((row: any[]) => 
      row.map((cell: any) => {
        // Escape commas and quotes in CSV
        const cellStr = String(cell)
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${data.filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Excel Export Functionality (using basic HTML table format)
export const exportToExcel = (data: ExportData): void => {
  const excelContent = `
    <html>
      <head>
        <meta charset="utf-8">
        <title>${data.title}</title>
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>
              ${data.headers.map((header: string) => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.rows.map((row: any[]) => 
              `<tr>${row.map((cell: any) => `<td>${cell}</td>`).join('')}</tr>`
            ).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `

  const blob = new Blob([excelContent], { 
    type: 'application/vnd.ms-excel;charset=utf-8;' 
  })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${data.filename}.xls`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// PDF Export Functionality (basic HTML to PDF)
export const exportToPDF = (data: ExportData): void => {
  const pdfContent = `
    <html>
      <head>
        <meta charset="utf-8">
        <title>${data.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>${data.title}</h1>
        <p>Generated on: ${formatDateTime(new Date().toISOString())}</p>
        <table>
          <thead>
            <tr>
              ${data.headers.map((header: string) => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.rows.map((row: any[]) => 
              `<tr>${row.map((cell: any) => `<td>${cell}</td>`).join('')}</tr>`
            ).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>Total Records: ${data.rows.length}</p>
          <p>Event Registration System - Export Report</p>
        </div>
      </body>
    </html>
  `

  // Create a new window for printing/PDF generation
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(pdfContent)
    printWindow.document.close()
    printWindow.focus()
    
    // Trigger print dialog (user can save as PDF)
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}

// Registration Report Export
export const exportRegistrationReport = (
  registrations: RegistrationExportData[], 
  format: 'csv' | 'excel' | 'pdf'
): void => {
  const exportData: ExportData = {
    title: 'Event Registration Report',
    filename: `registration-report-${formatDate(new Date().toISOString()).replace(/\//g, '-')}`,
    headers: [
      'Registration ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Organization',
      'Category',
      'Payment Status',
      'Registration Date',
      'Amount'
    ],
    rows: registrations.map((reg: any) => [
      reg.id,
      reg.firstName,
      reg.lastName,
      reg.email,
      reg.phone,
      reg.organization || 'N/A',
      reg.category,
      reg.paymentStatus,
      formatDateTime(reg.registrationDate),
      formatCurrency(reg.amount)
    ])
  }

  switch (format) {
    case 'csv':
      exportToCSV(exportData)
      break
    case 'excel':
      exportToExcel(exportData)
      break
    case 'pdf':
      exportToPDF(exportData)
      break
  }
}

// Meal Attendance Report Export
export const exportMealAttendanceReport = (
  attendanceData: MealAttendanceExportData[], 
  format: 'csv' | 'excel' | 'pdf'
): void => {
  const exportData: ExportData = {
    title: 'Meal Attendance Report',
    filename: `meal-attendance-report-${formatDate(new Date().toISOString()).replace(/\//g, '-')}`,
    headers: [
      'Participant Name',
      'Email',
      'Category',
      'Meal Session',
      'Scan Time',
      'Status',
      'Scanned By'
    ],
    rows: attendanceData.map((attendance: any) => [
      attendance.participantName,
      attendance.email,
      attendance.category,
      attendance.mealSession,
      formatDateTime(attendance.scanTime),
      attendance.status,
      attendance.scannedBy
    ])
  }

  switch (format) {
    case 'csv':
      exportToCSV(exportData)
      break
    case 'excel':
      exportToExcel(exportData)
      break
    case 'pdf':
      exportToPDF(exportData)
      break
  }
}

// Audit Log Export
export const exportAuditLogReport = (
  auditLogs: AuditLogExportData[], 
  format: 'csv' | 'excel' | 'pdf'
): void => {
  const exportData: ExportData = {
    title: 'System Audit Log Report',
    filename: `audit-log-report-${formatDate(new Date().toISOString()).replace(/\//g, '-')}`,
    headers: [
      'Timestamp',
      'Action',
      'User',
      'Details',
      'IP Address',
      'Result'
    ],
    rows: auditLogs.map((log: any) => [
      formatDateTime(log.timestamp),
      log.action,
      log.user,
      log.details,
      log.ipAddress || 'N/A',
      log.result
    ])
  }

  switch (format) {
    case 'csv':
      exportToCSV(exportData)
      break
    case 'excel':
      exportToExcel(exportData)
      break
    case 'pdf':
      exportToPDF(exportData)
      break
  }
}

// Combined Event Report Export
export const exportEventSummaryReport = (
  eventData: {
    eventName: string
    eventDate: string
    totalRegistrations: number
    totalRevenue: number
    registrationsByCategory: { category: string; count: number; revenue: number }[]
    mealAttendanceBySession: { session: string; attended: number; total: number }[]
  },
  format: 'csv' | 'excel' | 'pdf'
): void => {
  const summaryRows = [
    ['Event Name', eventData.eventName],
    ['Event Date', formatDate(eventData.eventDate)],
    ['Total Registrations', eventData.totalRegistrations.toString()],
    ['Total Revenue', formatCurrency(eventData.totalRevenue)],
    ['', ''], // Empty row
    ['Registration by Category', ''],
    ...eventData.registrationsByCategory.map((cat: any) => [
      `  ${cat.category}`, 
      `${cat.count} (${formatCurrency(cat.revenue)})`
    ]),
    ['', ''], // Empty row
    ['Meal Attendance by Session', ''],
    ...eventData.mealAttendanceBySession.map((session: any) => [
      `  ${session.session}`, 
      `${session.attended}/${session.total} (${Math.round((session.attended/session.total)*100)}%)`
    ])
  ]

  const exportData: ExportData = {
    title: `Event Summary Report - ${eventData.eventName}`,
    filename: `event-summary-${eventData.eventName.toLowerCase().replace(/\s+/g, '-')}-${formatDate(new Date().toISOString()).replace(/\//g, '-')}`,
    headers: ['Metric', 'Value'],
    rows: summaryRows
  }

  switch (format) {
    case 'csv':
      exportToCSV(exportData)
      break
    case 'excel':
      exportToExcel(exportData)
      break
    case 'pdf':
      exportToPDF(exportData)
      break
  }
}
