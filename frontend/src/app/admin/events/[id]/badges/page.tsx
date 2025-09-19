'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { formatDate, formatCurrency } from '@/lib/utils'
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Loader2, 
  Users, 
  CheckCircle,
  AlertCircle,
  CheckSquare,
  Filter,
  Search
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth-simple'
import { useEvent, useEventRegistrations } from '@/lib/graphql/hooks'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { useCentralizedQRBadge } from '@/hooks/use-centralized-qr-badge'
import { BadgeUtils } from '@/lib/utils/qr-badge-utils'
import { BadgePreviewCustomizer } from '@/components/badges/BadgePreviewCustomizer'
import { ProfessionalBadgeDesign, MinimalBadgeDesign, BadgeData, renderBadgeToHTML } from '@/components/badges/ProfessionalBadgeDesign'
import { badgeTemplates, getTemplateById, applyTemplate, templateCategories } from '@/components/badges/BadgeTemplates'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BadgePreviewModal } from '@/components/badges/BadgePreviewModal'
import { BadgeSheetGenerator } from '@/components/badges/BadgeSheetGenerator'

export default function BulkBadgePrintingPage() {
  const { isAuthenticated, user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING'>('APPROVED')
  const [isPrinting, setIsPrinting] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('microsoft-inspire')
  const [badgeVariant, setBadgeVariant] = useState<'standard'>('standard')
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<BadgeData | null>(null)

  const { data: eventData, loading: eventLoading, error: eventError } = useEvent({ id: eventId })
  const { data: registrationsData, loading: registrationsLoading, error: registrationsError } = useEventRegistrations({ eventIds: [eventId] })
  
  const event = eventData?.event
  const registrations = registrationsData?.eventRegistrations || []
  
  // Use centralized QR/badge system
  const centralizedQRBadge = useCentralizedQRBadge()

  // Filter registrations based on search and status
  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = searchTerm === '' || 
      `${reg.participant?.firstName || ''} ${reg.participant?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.participant?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'APPROVED' && reg.transactions?.[0]?.paymentStatus === 'PAID') ||
      (statusFilter === 'PENDING' && reg.transactions?.[0]?.paymentStatus === 'PENDING')
    
    return matchesSearch && matchesStatus
  })

  // Handle select all toggle
  const handleSelectAll = () => {
    if (selectedRegistrations.length === filteredRegistrations.length) {
      setSelectedRegistrations([])
    } else {
      setSelectedRegistrations(filteredRegistrations.map(reg => reg.id))
    }
  }

  // Handle individual registration selection
  const handleRegistrationSelect = (registrationId: string) => {
    setSelectedRegistrations(prev => 
      prev.includes(registrationId)
        ? prev.filter(id => id !== registrationId)
        : [...prev, registrationId]
    )
  }

  // Handle bulk printing with professional badge design
  const handleBulkPrint = async () => {
    if (selectedRegistrations.length === 0) {
      toast.error('Please select at least one registration to print')
      return
    }

    setIsPrinting(true)
    try {
      const selectedRegs = filteredRegistrations.filter(reg => 
        selectedRegistrations.includes(reg.id) && reg.transactions?.[0]?.paymentStatus === 'PAID'
      )

      if (selectedRegs.length === 0) {
        toast.error('No approved registrations selected')
        return
      }

      // Create print window with professional badges
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.error('Please allow popups to print badges')
        return
      }

      // Generate HTML for all selected badges
      let badgesHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @page { size: 3.5in 5.5in; margin: 0; }
            @media print {
              .page-break { page-break-after: always; }
            }
            body { margin: 0; padding: 0; }
          </style>
        </head>
        <body>
      `

      selectedRegs.forEach((reg, index) => {
        const badgeData: BadgeData = {
          firstName: reg.participant?.firstName || '',
          lastName: reg.participant?.lastName || '',
          title: reg.participant?.title || '',
          company: reg.participant?.company || '',
          email: reg.participant?.email || '',
          eventName: event?.name || '',
          eventDate: formatDate(event?.date || new Date()),
          eventVenue: event?.venue || '',
          registrationId: reg.id,
          category: reg.category?.name || '',
          badgeType: 'ATTENDEE',
          qrCodeData: reg.qrCode || JSON.stringify({ id: reg.id, name: `${reg.participant?.firstName || ''} ${reg.participant?.lastName || ''}` }),
          accessLevel: ['Main Hall', 'Sessions', 'Networking'],
          mealPreferences: reg.participant?.mealPreferences || []
        }

        const template = getTemplateById(selectedTemplate)
        if (template) {
          Object.assign(badgeData, template.defaultData)
        }

        const badgeHTML = renderBadgeToHTML(badgeData, badgeVariant)
        const innerContent = badgeHTML.match(/<body[^>]*>([\s\S]*)<\/body>/)?.[1] || ''
        
        badgesHTML += innerContent
        if (index < selectedRegs.length - 1) {
          badgesHTML += '<div class="page-break"></div>'
        }
      })

      badgesHTML += '</body></html>'

      printWindow.document.write(badgesHTML)
      printWindow.document.close()
      
      printWindow.onload = () => {
        printWindow.print()
        printWindow.onafterprint = () => {
          printWindow.close()
        }
      }
      
      toast.success(`${selectedRegs.length} professional badges prepared for printing`)
    } catch (error) {
      console.error('Error printing badges:', error)
      toast.error('Failed to print badges. Please try again.')
    } finally {
      setIsPrinting(false)
    }
  }

  // Handle PDF generation using centralized system
  const handleGeneratePDF = async () => {
    if (selectedRegistrations.length === 0) {
      toast.error('Please select at least one registration to generate PDF')
      return
    }

    setIsGeneratingPDF(true)
    try {
      const selectedRegs = filteredRegistrations.filter(reg => 
        selectedRegistrations.includes(reg.id) && reg.transactions?.[0]?.paymentStatus === 'PAID'
      )

      if (selectedRegs.length === 0) {
        toast.error('No approved registrations selected')
        return
      }

      // Generate and download bulk badge sheet using centralized system
      const badgeData = await centralizedQRBadge.badge.generateSheet(selectedRegistrations)
      
      if (badgeData) {
        const filename = BadgeUtils.generateBadgeFilename(
          `${event?.name || 'Event'} - Bulk Badges`,
          'Bulk',
          new Date().toISOString()
        )
        BadgeUtils.downloadBadge(badgeData, filename)
        toast.success(`PDF with ${selectedRegs.length} badges downloaded successfully`)
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF. Please try again.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access badge printing</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/admin">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (eventLoading || registrationsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-primary-50 to-neutral-50 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-soft">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto mb-3" />
              <span className="text-sm text-neutral-500">Loading event details...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (eventError || registrationsError || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-primary-50 to-neutral-50 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-soft">
          <CardHeader className="text-center">
            <CardTitle>Event Not Found</CardTitle>
            <CardDescription>Unable to load event details for badge printing.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/admin/events">Back to Events</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-primary-50 to-neutral-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="hover:bg-brand-50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-2 mb-2">
                <Printer className="h-4 w-4 text-brand-600" />
                <span className="text-sm font-medium text-brand-700">Badge Printing</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">
                {event.name}
              </h1>
              <p className="text-neutral-600 mt-1">
                Print badges for event registrations
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF || selectedRegistrations.length === 0}
              variant="outline"
              className="border-2 border-neutral-200 hover:border-brand-300 hover:bg-brand-50"
            >
              {isGeneratingPDF ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button 
              onClick={handleBulkPrint}
              disabled={isPrinting || selectedRegistrations.length === 0}
              className="bg-gradient-to-r from-brand-600 to-primary-600 hover:from-brand-700 hover:to-primary-700 text-white"
            >
              {isPrinting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Printer className="h-4 w-4 mr-2" />
              )}
              {isPrinting ? 'Printing...' : `Print ${selectedRegistrations.length} Badge${selectedRegistrations.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total Registrations</p>
                  <p className="text-2xl font-bold text-neutral-900">{registrations.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Approved</p>
                  <p className="text-2xl font-bold text-success-700">
                    {registrations.filter(r => r.transactions?.[0]?.paymentStatus === 'PAID').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-success-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Pending</p>
                  <p className="text-2xl font-bold text-warning-700">
                    {registrations.filter(r => r.transactions?.[0]?.paymentStatus === 'PENDING').length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-warning-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Selected</p>
                  <p className="text-2xl font-bold text-brand-700">{selectedRegistrations.length}</p>
                </div>
                <CheckSquare className="h-8 w-8 text-brand-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Badge Design Options */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft mb-6">
          <CardHeader>
            <CardTitle>Badge Design Settings</CardTitle>
            <CardDescription>Choose a professional badge template and style</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="templates" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="style">Style Options</TabsTrigger>
              </TabsList>
              
              <TabsContent value="templates" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {badgeTemplates.slice(0, 8).map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{template.preview}</div>
                      <div className="text-sm font-medium">{template.name}</div>
                      <div className="text-xs text-neutral-500 mt-1">{template.category}</div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="style" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Badge Style</label>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        className="flex-1"
                        disabled
                      >
                        Professional Standard
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">All badges use the professional standard design for consistency</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Preview Sample</label>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (filteredRegistrations.length > 0) {
                          const sampleReg = filteredRegistrations[0]
                          const template = getTemplateById(selectedTemplate)
                          const badgeData: BadgeData = {
                            firstName: sampleReg.participant?.firstName || 'John',
                            lastName: sampleReg.participant?.lastName || 'Doe',
                            title: sampleReg.participant?.title || 'Attendee',
                            company: sampleReg.participant?.company || 'Company',
                            email: sampleReg.participant?.email || 'john.doe@example.com',
                            eventName: event?.name || '',
                            eventDate: formatDate(event?.date || new Date()),
                            eventVenue: event?.venue || '',
                            registrationId: sampleReg.id,
                            category: sampleReg.category?.name || 'General',
                            badgeType: 'ATTENDEE',
                            qrCodeData: sampleReg.qrCode || JSON.stringify({ id: sampleReg.id }),
                            ...template?.defaultData
                          }
                          setPreviewData(badgeData)
                          setShowPreview(true)
                        } else {
                          toast.error('No registrations available for preview')
                        }
                      }}
                      className="w-full"
                    >
                      Preview Badge Design
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-neutral-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="border border-neutral-200 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="ALL">All Status</option>
                    <option value="APPROVED">Approved Only</option>
                    <option value="PENDING">Pending Only</option>
                  </select>
                </div>
              </div>
              <Button
                onClick={handleSelectAll}
                variant="outline"
                className="w-full md:w-auto"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                {selectedRegistrations.length === filteredRegistrations.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Registrations List */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
          <CardHeader>
            <CardTitle>Event Registrations</CardTitle>
            <CardDescription>
              Select registrations to print badges. Only approved registrations with QR codes can be printed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredRegistrations.map((registration) => (
                <div 
                  key={registration.id} 
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedRegistrations.includes(registration.id)
                      ? 'border-brand-300 bg-brand-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedRegistrations.includes(registration.id)}
                        onCheckedChange={() => handleRegistrationSelect(registration.id)}
                        disabled={registration.transactions?.[0]?.paymentStatus !== 'PAID' || !registration.qrCode}
                      />
                      <div>
                        <div className="font-semibold text-neutral-900">
                          {registration.participant?.firstName} {registration.participant?.lastName}
                        </div>
                        <div className="text-sm text-neutral-600">{registration.participant?.email}</div>
                        <div className="text-sm text-neutral-600">{registration.category?.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        className={
                          registration.transactions?.[0]?.paymentStatus === 'PAID' 
                            ? 'bg-success-50 text-success-700 border-success-200'
                            : 'bg-warning-50 text-warning-700 border-warning-200'
                        }
                      >
                        {registration.transactions?.[0]?.paymentStatus === 'PAID' ? 'APPROVED' : 'PENDING'}
                      </Badge>
                      {registration.qrCode ? (
                        <Badge className="bg-brand-50 text-brand-700 border-brand-200">
                          QR Ready
                        </Badge>
                      ) : (
                        <Badge className="bg-neutral-50 text-neutral-700 border-neutral-200">
                          No QR Code
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {filteredRegistrations.length === 0 && (
                <div className="text-center py-12 text-neutral-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
                  <p>No registrations found matching your criteria.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Badge Sheet Generator */}
        {selectedRegistrations.length > 0 && (
          <BadgeSheetGenerator
            badges={filteredRegistrations
              .filter(reg => selectedRegistrations.includes(reg.id))
              .map(reg => {
                const badgeData: BadgeData = {
                  firstName: reg.participant?.firstName || '',
                  lastName: reg.participant?.lastName || '',
                  title: reg.participant?.title || '',
                  company: reg.participant?.company || '',
                  email: reg.participant?.email || '',
                  eventName: event?.name || '',
                  eventDate: formatDate(event?.date || new Date()),
                  eventVenue: event?.venue || '',
                  registrationId: reg.id,
                  category: reg.category?.name || '',
                  badgeType: 'ATTENDEE',
                  qrCodeData: reg.qrCode || JSON.stringify({ id: reg.id, name: `${reg.participant?.firstName || ''} ${reg.participant?.lastName || ''}` }),
                  accessLevel: ['Main Hall', 'Sessions', 'Networking'],
                  mealPreferences: reg.participant?.mealPreferences || []
                }
                const template = getTemplateById(selectedTemplate)
                if (template) {
                  Object.assign(badgeData, template.defaultData)
                }
                return badgeData
              })}
            variant={badgeVariant}
            templateId={selectedTemplate}
            onGenerate={(format) => {
              toast.success(`Badge sheet ${format === 'pdf' ? 'PDF generated' : 'sent to printer'} successfully`)
            }}
          />
        )}

        {/* Badge Preview Modal */}
        {showPreview && previewData && (
          <BadgePreviewModal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            badgeData={previewData}
            variant={badgeVariant}
            onPrint={() => {
              // Handle print from modal
              console.log('Printing badge from modal')
            }}
            onDownload={() => {
              // Handle download from modal
              console.log('Downloading badge from modal')
            }}
          />
        )}
      </div>
    </div>
  )
}
