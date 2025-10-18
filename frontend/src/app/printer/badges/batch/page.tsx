'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  FileText,
  Printer,
  Calendar,
  Users,
  CheckCircle,
  Loader2,
  Download,
  Filter
} from 'lucide-react'
import { useQuery, useMutation } from '@apollo/client/react'
import { GET_MY_ASSIGNED_EVENTS, GET_EVENT_REGISTRATIONS } from '@/lib/graphql/queries'
import { GENERATE_BADGE_SHEET } from '@/lib/graphql/mutations/qr-mutations'
import { toast } from 'sonner'

export default function BatchPrintPage() {
  const [selectedEvent, setSelectedEvent] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('PAID')
  const [onlyUnprinted, setOnlyUnprinted] = useState(true)
  const [selectedBadges, setSelectedBadges] = useState<string[]>([])

  const { data: eventsData, loading: eventsLoading } = useQuery(GET_MY_ASSIGNED_EVENTS)
  const events = (eventsData as any)?.myAssignedEvents || []

  const { data: registrationsData, loading: registrationsLoading } = useQuery(GET_EVENT_REGISTRATIONS, {
    variables: { eventId: selectedEvent },
    skip: !selectedEvent
  })

  const [generateBadgeSheet, { loading: printingSheet }] = useMutation(GENERATE_BADGE_SHEET)

  const selectedEventData = events.find((e: any) => e.id === selectedEvent)
  const registrations = (registrationsData as any)?.eventRegistrations || []

  const filteredRegistrations = registrations.filter((reg: any) => {
    const matchesCategory = selectedCategory === 'all' || reg.category?.name === selectedCategory
    const matchesStatus = reg.paymentStatus === selectedStatus
    const matchesPrintStatus = !onlyUnprinted || !reg.badgePrinted
    return matchesCategory && matchesStatus && matchesPrintStatus
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBadges(filteredRegistrations.map((r: any) => r.id))
    } else {
      setSelectedBadges([])
    }
  }

  const handleSelectBadge = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedBadges([...selectedBadges, id])
    } else {
      setSelectedBadges(selectedBadges.filter((b: string) => b !== id))
    }
  }

  const handleBatchPrint = async () => {
    if (selectedBadges.length === 0) {
      toast.error('Please select badges to print')
      return
    }

    // Filter only registrations with QR codes
    const selectedRegs = filteredRegistrations.filter((r: any) => selectedBadges.includes(r.id))
    const withQR = selectedRegs.filter((r: any) => r.qrCode)
    const withoutQR = selectedRegs.filter((r: any) => !r.qrCode)

    if (withQR.length === 0) {
      toast.error('None of the selected participants have QR codes generated')
      return
    }

    if (withoutQR.length > 0) {
      toast.warning(`Printing ${withQR.length} badges. ${withoutQR.length} selected participant(s) skipped (no QR code)`)
    }

    try {
      const registrationIds = withQR.map((r: any) => r.id)
      const result = await generateBadgeSheet({
        variables: { registrationIds }
      }) as any
      
      // Download the badge sheet PDF
      const base64Data = result.data.generateBadgeSheet
      const link = document.createElement('a')
      link.href = `data:application/pdf;base64,${base64Data}`
      link.download = `badges-batch-${selectedEvent}.pdf`
      link.click()
      
      toast.success(`Successfully printed ${withQR.length} badges!`)
      setSelectedBadges([])
    } catch (error: any) {
      toast.error(error.message || 'Failed to print badges')
    }
  }

  const handleDownloadPDF = async () => {
    if (selectedBadges.length === 0) {
      toast.error('Please select badges to download')
      return
    }

    // Filter only registrations with QR codes
    const selectedRegs = filteredRegistrations.filter((r: any) => selectedBadges.includes(r.id))
    const withQR = selectedRegs.filter((r: any) => r.qrCode)
    const withoutQR = selectedRegs.filter((r: any) => !r.qrCode)

    if (withQR.length === 0) {
      toast.error('None of the selected participants have QR codes generated')
      return
    }

    if (withoutQR.length > 0) {
      toast.warning(`Downloading ${withQR.length} badges. ${withoutQR.length} selected participant(s) skipped (no QR code)`)
    }

    try {
      const registrationIds = withQR.map((r: any) => r.id)
      const result = await generateBadgeSheet({
        variables: { registrationIds }
      }) as any
      
      // Download the badge sheet PDF
      const base64Data = result.data.generateBadgeSheet
      const link = document.createElement('a')
      link.href = `data:application/pdf;base64,${base64Data}`
      link.download = `badges-batch-${selectedEvent}.pdf`
      link.click()
      
      toast.success(`Successfully downloaded ${withQR.length} badges as PDF`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to download PDF')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Batch Print Badges</h1>
          <p className="text-gray-600 mt-1">
            Select multiple badges and print them all at once
          </p>
        </div>
        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
          <FileText className="h-4 w-4 mr-1" />
          Batch Print
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
            Choose an event to batch print badges
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
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2 text-purple-600" />
                Filter Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
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

                {/* Print Status */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Print Status
                  </label>
                  <div className="flex items-center space-x-2 h-10">
                    <Checkbox
                      id="onlyUnprinted"
                      checked={onlyUnprinted}
                      onCheckedChange={(checked) => setOnlyUnprinted(checked as boolean)}
                    />
                    <label
                      htmlFor="onlyUnprinted"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Only show unprinted badges
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-600">
                  {selectedBadges.length} of {filteredRegistrations.length} selected
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline"
                    onClick={handleDownloadPDF}
                    disabled={selectedBadges.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button 
                    onClick={handleBatchPrint}
                    disabled={selectedBadges.length === 0}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Selected ({selectedBadges.length})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Batch Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Select Badges to Print</CardTitle>
                  <CardDescription>
                    Choose which badges to include in the batch
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="selectAll"
                    checked={selectedBadges.length === filteredRegistrations.length && filteredRegistrations.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <label
                    htmlFor="selectAll"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Select All
                  </label>
                </div>
              </div>
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
                <div className="space-y-2">
                  {filteredRegistrations.map((registration: any) => (
                    <div
                      key={registration.id}
                      className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Checkbox
                        checked={selectedBadges.includes(registration.id)}
                        onCheckedChange={(checked) => handleSelectBadge(registration.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-semibold text-gray-900">
                            {registration.firstName} {registration.lastName}
                          </h4>
                          <Badge variant="outline">
                            {registration.category?.name}
                          </Badge>
                          {registration.badgePrinted && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Printed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {registration.id.slice(0, 8)}
                        </p>
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
