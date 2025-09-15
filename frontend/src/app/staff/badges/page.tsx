'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useMyAssignedEvents, useMyEventRegistrations } from '@/lib/graphql/hooks'
import { useCentralizedQRBadge } from '@/hooks/use-centralized-qr-badge'
import { ProfessionalBadgeDesign, BadgeData, renderBadgeToHTML } from '@/components/badges/ProfessionalBadgeDesign'
import { BadgePreviewCustomizer } from '@/components/badges/BadgePreviewCustomizer'
import { badgeTemplates, getTemplateById } from '@/components/badges/BadgeTemplates'
import { BadgeSheetGenerator } from '@/components/badges/BadgeSheetGenerator'
import { toast } from 'sonner'
import { 
  CreditCard, 
  Search,
  Filter,
  Printer,
  Download,
  Eye,
  Users,
  Calendar,
  QrCode,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Settings,
  Palette
} from 'lucide-react'
import Link from 'next/link'

export default function StaffBadgesPage() {
  const searchParams = useSearchParams()
  const registrationId = searchParams.get('registrationId')
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEvent, setFilterEvent] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [badgeVariant, setBadgeVariant] = useState<'standard'>('standard')
  const [processingQRCodes, setProcessingQRCodes] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewBadge, setPreviewBadge] = useState<BadgeData | null>(null)
  const [showSheetGenerator, setShowSheetGenerator] = useState(false)

  // Centralized QR Code and Badge hooks
  const qrBadge = useCentralizedQRBadge()

  // Fetch assigned events
  const { data: eventsData, loading: eventsLoading, error: eventsError } = useMyAssignedEvents()
  const assignedEvents = (eventsData as any)?.myAssignedEvents || []
  
  // Get event IDs for fetching registrations
  const eventIds = assignedEvents.map((event: any) => event.id)
  
  // Fetch registrations for assigned events
  const { data: registrationsData, loading: registrationsLoading } = useMyEventRegistrations(eventIds)
  const allRegistrations = (registrationsData as any)?.registrations || []
  
  // Auto-select registration if provided via URL
  useEffect(() => {
    if (registrationId && allRegistrations.length > 0 && !selectedParticipants.includes(registrationId)) {
      // Check if the registration ID exists in our data
      const registrationExists = allRegistrations.some((reg: any) => reg.id === registrationId)
      if (registrationExists) {
        setSelectedParticipants([registrationId])
        toast.info('Registration automatically selected for badge printing')
      }
    }
  }, [registrationId, allRegistrations, selectedParticipants])
  
  // Transform assigned events for display
  const events = assignedEvents.map((event: any) => ({
    id: event.id,
    name: event.name,
    date: event.date
  }))
  
  // Helper function to get badge template for an event
  const getEventBadgeTemplate = (eventId: string): string => {
    const event = assignedEvents.find((e: any) => e.id === eventId)
    return event?.badgeTemplateId || 'microsoft-inspire' // Default fallback
  }

  // Transform registrations into participant records for badge printing
  const participants = allRegistrations.map((reg: any) => {
    // Determine badge status based on payment and check-in status
    const badgeStatus = reg.paymentStatus === 'PAID' ? 'READY' :
                       reg.paymentStatus === 'PENDING' || reg.paymentStatus === 'PARTIAL' ? 'PENDING' :
                       reg.paymentStatus === 'FAILED' ? 'ERROR' : 'PENDING'
    
    return {
      id: reg.id,
      name: reg.fullName || `${reg.firstName} ${reg.lastName}`,
      email: reg.email,
      phone: reg.phone || 'Not provided',
      eventId: reg.event?.id || '', // Add eventId for template lookup
      eventName: reg.event?.name || 'Unknown Event',
      eventDate: reg.event?.date || '',
      category: reg.category?.name || 'General',
      company: reg.organization || 'Not specified',
      title: reg.jobTitle || 'Participant',
      badgeStatus,
      qrCode: reg.qrCode || `QR${reg.id.slice(-9)}`,
      specialRequests: reg.specialRequests || null,
      registrationNumber: reg.transactions?.[0]?.receiptNumber || `REG-${reg.id.slice(-6)}`,
      checkedIn: reg.checkedIn || false,
      address: reg.address || 'Not provided'
    }
  })

  const filteredParticipants = participants.filter((participant: any) => {
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEvent = filterEvent === 'all' || participant.eventName === events.find((e: any) => e.id === filterEvent)?.name
    const matchesStatus = filterStatus === 'all' || participant.badgeStatus === filterStatus
    return matchesSearch && matchesEvent && matchesStatus
  })
  
  // Loading state
  if (eventsLoading || registrationsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Badge Printing</h1>
            <p className="text-gray-600 mt-2">Loading participant data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i: number) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  
  // Error state
  if (eventsError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Badge Printing</h1>
          <p className="text-red-600 mt-2">Error loading participant data: {eventsError.message}</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY':
        return 'bg-green-100 text-green-800'
      case 'PRINTED':
        return 'bg-blue-100 text-blue-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ERROR':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'READY':
        return <CheckCircle className="h-4 w-4" />
      case 'PRINTED':
        return <Printer className="h-4 w-4" />
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'ERROR':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const handleSelectParticipant = (participantId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(participantId) 
        ? prev.filter(id => id !== participantId)
        : [...prev, participantId]
    )
  }

  const handleSelectAll = () => {
    if (selectedParticipants.length === filteredParticipants.length) {
      setSelectedParticipants([])
    } else {
      setSelectedParticipants(filteredParticipants.map((p: any) => p.id))
    }
  }

  // Handle individual QR code generation
  const handleGenerateQRCode = async (registrationId: string) => {
    setProcessingQRCodes(prev => [...prev, registrationId])
    try {
      const result = await qrBadge.qrCode.generate(registrationId)
      
      if (result) {
        // Refresh the registrations data to show updated QR code
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    } finally {
      setProcessingQRCodes(prev => prev.filter(id => id !== registrationId))
    }
  }

  // Handle QR code regeneration
  const handleRegenerateQRCode = async (registrationId: string) => {
    setProcessingQRCodes(prev => [...prev, registrationId])
    try {
      const result = await qrBadge.qrCode.regenerate(registrationId)
      
      if (result) {
        // Refresh the registrations data to show updated QR code
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to regenerate QR code:', error)
    } finally {
      setProcessingQRCodes(prev => prev.filter(id => id !== registrationId))
    }
  }

  // Handle bulk QR code generation
  const handleBulkGenerateQRCodes = async () => {
    if (selectedParticipants.length === 0) {
      return
    }

    setProcessingQRCodes(prev => [...prev, ...selectedParticipants])
    try {
      const result = await qrBadge.qrCode.bulkGenerate(selectedParticipants)
      
      if (result) {
        // Refresh the registrations data to show updated QR codes
        window.location.reload()
        setSelectedParticipants([])
      }
    } catch (error) {
      console.error('Failed to bulk generate QR codes:', error)
    } finally {
      setProcessingQRCodes([])
    }
  }

  const handleBulkPrint = async () => {
    if (selectedParticipants.length === 0) {
      toast.error('Please select at least one participant')
      return
    }
    
    try {
      const selectedRegs = participants.filter((p: any) => selectedParticipants.includes(p.id))
      
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
            @page { size: 4in 6in; margin: 0.25in; }
            @media print {
              body { margin: 0; padding: 0; }
              .page-break { page-break-after: always; }
              .badge { margin: 0 auto; }
            }
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          </style>
        </head>
        <body>
      `

      selectedRegs.forEach((participant: any, index: any) => {
        const badgeData: BadgeData = {
          firstName: participant.name.split(' ')[0] || '',
          lastName: participant.name.split(' ').slice(1).join(' ') || '',
          title: participant.title,
          company: participant.company,
          email: participant.email,
          eventName: participant.eventName,
          eventDate: participant.eventDate,
          eventVenue: participant.address,
          registrationId: participant.id,
          category: participant.category,
          badgeType: 'ATTENDEE',
          qrCodeData: participant.qrCode,
          accessLevel: ['Main Hall', 'Sessions', 'Networking'],
          mealPreferences: []
        }

        const eventTemplateId = getEventBadgeTemplate(participant.eventId)
        const template = getTemplateById(eventTemplateId)
        if (template) {
          Object.assign(badgeData, template.defaultData)
        }

        const badgeHTML = renderBadgeToHTML(badgeData, badgeVariant, eventTemplateId)
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
      setSelectedParticipants([])
    } catch (error) {
      console.error('Error printing badges:', error)
      toast.error('Failed to print badges. Please try again.')
    }
  }

  const stats = {
    total: participants.length,
    ready: participants.filter((p: any) => p.badgeStatus === 'READY').length,
    printed: participants.filter((p: any) => p.badgeStatus === 'PRINTED').length,
    pending: participants.filter((p: any) => p.badgeStatus === 'PENDING').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Professional Badge Printing</h1>
          <p className="text-gray-600 mt-2">
            Generate and print professional event badges with modern templates
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowSheetGenerator(true)}
            disabled={selectedParticipants.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            Badge Sheet
          </Button>
          <Button 
            onClick={handleBulkGenerateQRCodes}
            disabled={selectedParticipants.length === 0 || processingQRCodes.length > 0}
            variant="outline"
          >
            <QrCode className="h-4 w-4 mr-2" />
            Generate QR ({selectedParticipants.length})
          </Button>
          <Button 
            onClick={handleBulkPrint}
            disabled={selectedParticipants.length === 0}
            className="bg-gradient-to-r from-brand-600 to-primary-600 hover:from-brand-700 hover:to-primary-700 text-white"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Selected ({selectedParticipants.length})
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Badges</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Ready</p>
                <p className="text-2xl font-bold text-gray-900">{stats.ready}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Printer className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Printed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.printed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badge Design Settings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Badge Design Settings</CardTitle>
          <CardDescription>Event-specific badge template and style options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Event Template Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Event Badge Template</h3>
              {participants.length > 0 ? (
                (() => {
                  const sampleParticipant = participants[0]
                  const eventTemplateId = getEventBadgeTemplate(sampleParticipant.eventId)
                  const template = getTemplateById(eventTemplateId)
                  return (
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{template?.preview || '🎫'}</div>
                      <div>
                        <div className="text-sm font-medium text-blue-900">
                          {template?.name || 'Default Template'}
                        </div>
                        <div className="text-xs text-blue-700">
                          {template?.category || 'Professional'} • Automatically selected for this event
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Template ID: {eventTemplateId}
                        </div>
                      </div>
                    </div>
                  )
                })()
              ) : (
                <div className="text-sm text-blue-700">
                  Badge template will be automatically selected based on the event
                </div>
              )}
            </div>

            {/* Style Options */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Badge Style</label>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      className="flex-1"
                      size="sm"
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
                      if (participants.length > 0) {
                        const sampleParticipant = participants[0]
                        const eventTemplateId = getEventBadgeTemplate(sampleParticipant.eventId)
                        const template = getTemplateById(eventTemplateId)
                        const badgeData: BadgeData = {
                          firstName: sampleParticipant.name.split(' ')[0] || '',
                          lastName: sampleParticipant.name.split(' ').slice(1).join(' ') || '',
                          title: sampleParticipant.title,
                          company: sampleParticipant.company,
                          email: sampleParticipant.email,
                          eventName: sampleParticipant.eventName,
                          eventDate: sampleParticipant.eventDate,
                          eventVenue: sampleParticipant.address,
                          registrationId: sampleParticipant.id,
                          category: sampleParticipant.category,
                          badgeType: 'ATTENDEE',
                          qrCodeData: sampleParticipant.qrCode,
                          accessLevel: ['Main Hall', 'Sessions', 'Networking'],
                          mealPreferences: [],
                          ...template?.defaultData
                        }
                        setPreviewBadge(badgeData)
                        setShowPreview(true)
                      } else {
                        toast.error('No participants available for preview')
                      }
                    }}
                    className="w-full"
                    size="sm"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Badge Design
                  </Button>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Customize</label>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Open customizer with sample data
                      setShowPreview(true)
                    }}
                    className="w-full"
                    size="sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Open Customizer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Participants List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Participants ({filteredParticipants.length})</CardTitle>
                  <CardDescription>
                    Select participants to print badges
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedParticipants.length === filteredParticipants.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search participants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={filterEvent}
                    onChange={(e) => setFilterEvent(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Events</option>
                    {events.map((event: any) => (
                      <option key={event.id} value={event.id}>{event.name}</option>
                    ))}
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="READY">Ready</option>
                    <option value="PRINTED">Printed</option>
                    <option value="PENDING">Pending</option>
                    <option value="ERROR">Error</option>
                  </select>
                </div>
              </div>

              {/* Participants List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredParticipants.map((participant: any) => (
                  <div key={participant.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(participant.id)}
                        onChange={() => handleSelectParticipant(participant.id)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{participant.name}</h3>
                              <Badge className={getStatusColor(participant.badgeStatus)}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(participant.badgeStatus)}
                                  {participant.badgeStatus}
                                </span>
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              <div>{participant.title} at {participant.company}</div>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {participant.email}
                                </span>
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {participant.eventName}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <Badge variant="outline">{participant.category}</Badge>
                            <div className="text-xs text-gray-500 mt-1">
                              {participant.registrationNumber}
                            </div>
                          </div>
                        </div>

                        {participant.specialRequests && (
                          <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                            <strong>Special Request:</strong> {participant.specialRequests}
                          </div>
                        )}

                        <div className="flex justify-end gap-2 mt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Show participant details
                              alert(`Participant Details:\nName: ${participant.name}\nEmail: ${participant.email}\nPhone: ${participant.phone}\nEvent: ${participant.eventName}\nCategory: ${participant.category}\nRegistration: ${participant.registrationNumber}`)
                            }}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {participant.qrCode ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRegenerateQRCode(participant.id)}
                              disabled={processingQRCodes.includes(participant.id)}
                              title="Regenerate QR Code"
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleGenerateQRCode(participant.id)}
                              disabled={processingQRCodes.includes(participant.id)}
                              title="Generate QR Code"
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Print individual badge with event's template
                              const eventTemplateId = getEventBadgeTemplate(participant.eventId)
                              const template = getTemplateById(eventTemplateId)
                              
                              const badgeData: BadgeData = {
                                firstName: participant.name.split(' ')[0] || '',
                                lastName: participant.name.split(' ').slice(1).join(' ') || '',
                                title: participant.title,
                                company: participant.company,
                                email: participant.email,
                                eventName: participant.eventName,
                                eventDate: participant.eventDate,
                                eventVenue: participant.address,
                                registrationId: participant.id,
                                category: participant.category,
                                badgeType: 'ATTENDEE',
                                qrCodeData: participant.qrCode,
                                accessLevel: ['Main Hall', 'Sessions', 'Networking'],
                                mealPreferences: []
                              }
                              
                              if (template) {
                                Object.assign(badgeData, template.defaultData)
                              }
                              
                              const printWindow = window.open('', '_blank')
                              if (printWindow) {
                                const badgeHTML = renderBadgeToHTML(badgeData, badgeVariant, eventTemplateId)
                                printWindow.document.write(badgeHTML)
                                printWindow.document.close()
                                printWindow.onload = () => {
                                  printWindow.print()
                                  printWindow.onafterprint = () => printWindow.close()
                                }
                                toast.success(`Badge sent to printer using ${template?.name || 'default'} template`)
                              }
                            }}
                            title="Print Badge"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {filteredParticipants.length === 0 && (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No participants found</h3>
                  <p className="text-gray-500">
                    {searchTerm || filterEvent !== 'all' || filterStatus !== 'all'
                      ? 'Try adjusting your search or filter criteria'
                      : participants.length === 0
                        ? 'No participants available for badge printing in your assigned events'
                        : 'No participants match your current filters'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Printing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Printing Instructions</CardTitle>
          <CardDescription>
            Guidelines for badge printing and handling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Before Printing</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  Verify participant information is accurate
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  Check badge template and design settings
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  Ensure printer has sufficient badge stock
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  Test print one badge before bulk printing
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">After Printing</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  Quality check each printed badge
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  Organize badges by event or category
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  Update badge status to 'PRINTED'
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  Store badges securely until distribution
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badge Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Badge Preview & Customization</DialogTitle>
            <DialogDescription>
              Preview and customize badge design before printing
            </DialogDescription>
          </DialogHeader>
          {previewBadge ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Standard Design</h3>
                  <div className="border rounded-lg p-4 bg-white">
                    <ProfessionalBadgeDesign data={previewBadge} />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-3">Professional Standard Design</h3>
                  <div className="border rounded-lg p-4 bg-white">
                    <ProfessionalBadgeDesign data={previewBadge} />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    const printWindow = window.open('', '_blank')
                    if (printWindow && previewBadge && participants.length > 0) {
                      const sampleParticipant = participants[0]
                      const eventTemplateId = getEventBadgeTemplate(sampleParticipant.eventId)
                      const badgeHTML = renderBadgeToHTML(previewBadge, badgeVariant, eventTemplateId)
                      printWindow.document.write(badgeHTML)
                      printWindow.document.close()
                      printWindow.onload = () => {
                        printWindow.print()
                        printWindow.onafterprint = () => printWindow.close()
                      }
                    }
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Preview
                </Button>
                <Button onClick={() => setShowPreview(false)}>Close</Button>
              </div>
            </div>
          ) : (
            <BadgePreviewCustomizer />
          )}
        </DialogContent>
      </Dialog>

      {/* Badge Sheet Generator Dialog */}
      <Dialog open={showSheetGenerator} onOpenChange={setShowSheetGenerator}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Badge Sheet Generator</DialogTitle>
            <DialogDescription>
              Configure and generate badge sheets for batch printing
            </DialogDescription>
          </DialogHeader>
          {selectedParticipants.length > 0 && (
            <BadgeSheetGenerator
              badges={participants
                .filter((p: any) => selectedParticipants.includes(p.id))
                .map((participant: any) => {
                  const badgeData: BadgeData = {
                    firstName: participant.name.split(' ')[0] || '',
                    lastName: participant.name.split(' ').slice(1).join(' ') || '',
                    title: participant.title,
                    company: participant.company,
                    email: participant.email,
                    eventName: participant.eventName,
                    eventDate: participant.eventDate,
                    eventVenue: participant.address,
                    registrationId: participant.id,
                    category: participant.category,
                    badgeType: 'ATTENDEE',
                    qrCodeData: participant.qrCode,
                    accessLevel: ['Main Hall', 'Sessions', 'Networking'],
                    mealPreferences: []
                  }
                  const eventTemplateId = getEventBadgeTemplate(participant.eventId)
                  const template = getTemplateById(eventTemplateId)
                  if (template) {
                    Object.assign(badgeData, template.defaultData)
                  }
                  return badgeData
                })}
              variant={badgeVariant}
              templateId={participants.length > 0 ? getEventBadgeTemplate(participants[0].eventId) : 'microsoft-inspire'}
              onGenerate={(format) => {
                toast.success(`Badge sheet ${format === 'pdf' ? 'PDF generated' : 'sent to printer'} successfully`)
                setShowSheetGenerator(false)
                setSelectedParticipants([])
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
