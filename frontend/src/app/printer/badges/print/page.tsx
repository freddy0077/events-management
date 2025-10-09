'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Printer, 
  Search,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Eye
} from 'lucide-react'
import { useQuery, useMutation } from '@apollo/client/react'
import { GET_MY_ASSIGNED_EVENTS, GET_EVENT_REGISTRATIONS } from '@/lib/graphql/queries'
import { GENERATE_BADGE, GENERATE_BADGE_SHEET } from '@/lib/graphql/mutations/qr-mutations'
import { toast } from 'sonner'

export default function PrintBadgesPage() {
  const [selectedEvent, setSelectedEvent] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('PAID')

  const { data: eventsData, loading: eventsLoading } = useQuery(GET_MY_ASSIGNED_EVENTS)
  const events = (eventsData as any)?.myAssignedEvents || []

  const { data: registrationsData, loading: registrationsLoading } = useQuery(GET_EVENT_REGISTRATIONS, {
    variables: { eventId: selectedEvent },
    skip: !selectedEvent
  })

  const [generateBadge, { loading: printingBadge }] = useMutation(GENERATE_BADGE)
  const [generateBadgeSheet, { loading: printingSheet }] = useMutation(GENERATE_BADGE_SHEET)

  const selectedEventData = events.find((e: any) => e.id === selectedEvent)
  const registrations = (registrationsData as any)?.eventRegistrations || []

  const filteredRegistrations = registrations.filter((reg: any) => {
    const matchesSearch = reg.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.id?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || reg.category?.name === selectedCategory
    const matchesStatus = reg.paymentStatus === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handlePrintBadge = async (registrationId: string, hasQRCode: boolean) => {
    if (!hasQRCode) {
      toast.error('Cannot print badge - QR code not generated yet. Please generate QR code first.')
      return
    }

    try {
      const result = await generateBadge({
        variables: { registrationId, format: 'pdf' },
        refetchQueries: [{ query: GET_EVENT_REGISTRATIONS, variables: { eventId: selectedEvent } }]
      })
      
      // Download the badge PDF
      const base64Data = result.data.generateBadge
      const link = document.createElement('a')
      link.href = `data:application/pdf;base64,${base64Data}`
      link.download = `badge-${registrationId}.pdf`
      link.click()
      
      toast.success('Badge printed successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to print badge')
    }
  }

  const handlePrintAll = async () => {
    const withQR = filteredRegistrations.filter((r: any) => r.qrCode)
    const withoutQR = filteredRegistrations.filter((r: any) => !r.qrCode)

    if (withQR.length === 0) {
      toast.error('No participants with QR codes to print')
      return
    }

    if (withoutQR.length > 0) {
      toast.warning(`Printing ${withQR.length} badges. ${withoutQR.length} participant(s) skipped (no QR code)`)
    }

    try {
      const registrationIds = withQR.map((r: any) => r.id)
      const result = await generateBadgeSheet({
        variables: { registrationIds }
      })
      
      // Download the badge sheet PDF
      const base64Data = result.data.generateBadgeSheet
      const link = document.createElement('a')
      link.href = `data:application/pdf;base64,${base64Data}`
      link.download = `badges-${selectedEvent}.pdf`
      link.click()
      
      toast.success(`Successfully printed ${withQR.length} badges!`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to print badges')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Print Badges</h1>
          <p className="text-gray-600 mt-1">
            Select an event and print participant badges
          </p>
        </div>
        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
          <Printer className="h-4 w-4 mr-1" />
          Badge Printer
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
            Choose an event to view and print participant badges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {eventsLoading ? (
                <div className="p-2 text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                </div>
              ) : events.length === 0 ? (
                <div className="p-2 text-center text-gray-500">
                  No events assigned
                </div>
              ) : (
                events.map((event: any) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedEvent && (
        <>
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Participants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Name, email, or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Category
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {selectedEventData?.categories?.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Payment Status
                  </label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Found {filteredRegistrations.length} participant(s)
                </div>
                <Button 
                  onClick={handlePrintAll}
                  disabled={filteredRegistrations.length === 0}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print All ({filteredRegistrations.length})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Participants List */}
          <Card>
            <CardHeader>
              <CardTitle>Participants</CardTitle>
              <CardDescription>
                Click print to generate and print individual badges
              </CardDescription>
            </CardHeader>
            <CardContent>
              {registrationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No participants found</p>
                  <p className="text-sm mt-2">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRegistrations.map((registration: any) => (
                    <div
                      key={registration.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${
                          registration.badgePrinted ? 'bg-green-100' : 'bg-gray-200'
                        }`}>
                          {registration.badgePrinted ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Printer className="h-5 w-5 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {registration.firstName} {registration.lastName}
                          </h4>
                          <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <span>{registration.email}</span>
                            <span>•</span>
                            <span>{registration.id.slice(0, 8)}</span>
                            <Badge variant="outline" className="ml-2">
                              {registration.category?.name}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm"
                          onClick={() => handlePrintBadge(registration.id, !!registration.qrCode)}
                          disabled={printingBadge || !registration.qrCode}
                          className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                        >
                          {printingBadge ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Printer className="h-4 w-4 mr-1" />
                          )}
                          {!registration.qrCode ? 'No QR Code' : 'Print Badge'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
