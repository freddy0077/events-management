'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  ProfessionalBadgeDesign, 
  MinimalBadgeDesign, 
  BadgeData,
  renderBadgeToHTML 
} from './ProfessionalBadgeDesign'
import { 
  Download, 
  Printer, 
  Eye, 
  Palette, 
  Layout, 
  User,
  Building,
  Calendar,
  MapPin,
  QrCode,
  Shield,
  Utensils,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface BadgePreviewCustomizerProps {
  initialData?: Partial<BadgeData>
  onSave?: (data: BadgeData) => void
  onPrint?: (data: BadgeData) => void
  onDownload?: (data: BadgeData) => void
}

export const BadgePreviewCustomizer: React.FC<BadgePreviewCustomizerProps> = ({
  initialData,
  onSave,
  onPrint,
  onDownload
}) => {
  const badgeRef = useRef<HTMLDivElement>(null)
  
  // Badge data state
  const [badgeData, setBadgeData] = useState<BadgeData>({
    firstName: initialData?.firstName || 'John',
    lastName: initialData?.lastName || 'Doe',
    title: initialData?.title || 'Senior Developer',
    company: initialData?.company || 'Tech Corp',
    email: initialData?.email || 'john.doe@techcorp.com',
    eventName: initialData?.eventName || 'Tech Conference 2024',
    eventDate: initialData?.eventDate || 'March 15-17, 2024',
    eventVenue: initialData?.eventVenue || 'Convention Center',
    registrationId: initialData?.registrationId || 'TC2024-001234',
    category: initialData?.category || 'Professional',
    badgeType: initialData?.badgeType || 'ATTENDEE',
    qrCodeData: initialData?.qrCodeData || JSON.stringify({
      id: 'TC2024-001234',
      name: 'John Doe',
      type: 'ATTENDEE'
    }),
    accessLevel: initialData?.accessLevel || ['Main Hall', 'Workshops', 'Networking'],
    mealPreferences: initialData?.mealPreferences || ['V', 'GF'],
    ...initialData
  })

  // Customization options
  const [variant, setVariant] = useState<'standard'>('standard')
  const [size, setSize] = useState<'standard' | 'large'>('standard')
  const [colorScheme, setColorScheme] = useState<'default' | 'dark' | 'vibrant'>('default')
  const [showAccessLevels, setShowAccessLevels] = useState(true)
  const [showMealPreferences, setShowMealPreferences] = useState(true)
  const [showCompanyInfo, setShowCompanyInfo] = useState(true)

  // Update badge data
  const updateBadgeData = (field: keyof BadgeData, value: any) => {
    setBadgeData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle download as PDF
  const handleDownloadPDF = async () => {
    try {
      if (!badgeRef.current) return

      const canvas = await html2canvas(badgeRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [3.94, 5.35] // A6 format: 100mm x 135mm
      })

      pdf.addImage(imgData, 'PNG', 0, 0, 3.94, 5.35) // A6 dimensions
      pdf.save(`badge-${badgeData.registrationId}.pdf`)
      
      toast.success('Badge downloaded successfully!')
      onDownload?.(badgeData)
    } catch (error) {
      console.error('Error downloading badge:', error)
      toast.error('Failed to download badge')
    }
  }

  // Handle download as PNG
  const handleDownloadPNG = async () => {
    try {
      if (!badgeRef.current) return

      const canvas = await html2canvas(badgeRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      })

      const link = document.createElement('a')
      link.download = `badge-${badgeData.registrationId}.png`
      link.href = canvas.toDataURL()
      link.click()
      
      toast.success('Badge image downloaded successfully!')
      onDownload?.(badgeData)
    } catch (error) {
      console.error('Error downloading badge image:', error)
      toast.error('Failed to download badge image')
    }
  }

  // Handle print
  const handlePrint = () => {
    try {
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.error('Please allow popups to print the badge')
        return
      }

      const html = renderBadgeToHTML(badgeData, variant)
      printWindow.document.write(html)
      printWindow.document.close()
      
      printWindow.onload = () => {
        printWindow.print()
        printWindow.onafterprint = () => {
          printWindow.close()
        }
      }
      
      toast.success('Badge sent to printer!')
      onPrint?.(badgeData)
    } catch (error) {
      console.error('Error printing badge:', error)
      toast.error('Failed to print badge')
    }
  }

  // Generate sample QR data
  const generateQRData = () => {
    const qrData = JSON.stringify({
      id: badgeData.registrationId,
      name: `${badgeData.firstName} ${badgeData.lastName}`,
      type: badgeData.badgeType,
      event: badgeData.eventName,
      timestamp: new Date().toISOString()
    })
    updateBadgeData('qrCodeData', qrData)
    toast.success('QR code data regenerated!')
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Customization Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Badge Customization</CardTitle>
            <CardDescription>
              Design and customize professional event badges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="event">Event</TabsTrigger>
                <TabsTrigger value="access">Access</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={badgeData.firstName}
                      onChange={(e) => updateBadgeData('firstName', e.target.value)}
                      placeholder="First Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={badgeData.lastName}
                      onChange={(e) => updateBadgeData('lastName', e.target.value)}
                      placeholder="Last Name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={badgeData.title}
                    onChange={(e) => updateBadgeData('title', e.target.value)}
                    placeholder="Job Title"
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={badgeData.company}
                    onChange={(e) => updateBadgeData('company', e.target.value)}
                    placeholder="Company Name"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={badgeData.email}
                    onChange={(e) => updateBadgeData('email', e.target.value)}
                    placeholder="Email Address"
                  />
                </div>

                <div>
                  <Label htmlFor="badgeType">Badge Type</Label>
                  <Select
                    value={badgeData.badgeType}
                    onValueChange={(value: BadgeData['badgeType']) => updateBadgeData('badgeType', value)}
                  >
                    <SelectTrigger id="badgeType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATTENDEE">Attendee</SelectItem>
                      <SelectItem value="SPEAKER">Speaker</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="ORGANIZER">Organizer</SelectItem>
                      <SelectItem value="SPONSOR">Sponsor</SelectItem>
                      <SelectItem value="MEDIA">Media</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* Event Information Tab */}
              <TabsContent value="event" className="space-y-4">
                <div>
                  <Label htmlFor="eventName">Event Name</Label>
                  <Input
                    id="eventName"
                    value={badgeData.eventName}
                    onChange={(e) => updateBadgeData('eventName', e.target.value)}
                    placeholder="Event Name"
                  />
                </div>

                <div>
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Input
                    id="eventDate"
                    value={badgeData.eventDate}
                    onChange={(e) => updateBadgeData('eventDate', e.target.value)}
                    placeholder="March 15-17, 2024"
                  />
                </div>

                <div>
                  <Label htmlFor="eventVenue">Event Venue</Label>
                  <Input
                    id="eventVenue"
                    value={badgeData.eventVenue}
                    onChange={(e) => updateBadgeData('eventVenue', e.target.value)}
                    placeholder="Convention Center"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Registration Category</Label>
                  <Input
                    id="category"
                    value={badgeData.category}
                    onChange={(e) => updateBadgeData('category', e.target.value)}
                    placeholder="Professional"
                  />
                </div>

                <div>
                  <Label htmlFor="registrationId">Registration ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="registrationId"
                      value={badgeData.registrationId}
                      onChange={(e) => updateBadgeData('registrationId', e.target.value)}
                      placeholder="TC2024-001234"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={generateQRData}
                      title="Regenerate QR Code"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Access & Preferences Tab */}
              <TabsContent value="access" className="space-y-4">
                <div>
                  <Label>Access Areas</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['Main Hall', 'Workshops', 'Networking', 'VIP Lounge', 'Exhibition', 'Labs'].map(area => (
                      <Badge
                        key={area}
                        variant={badgeData.accessLevel?.includes(area) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const current = badgeData.accessLevel || []
                          if (current.includes(area)) {
                            updateBadgeData('accessLevel', current.filter(a => a !== area))
                          } else {
                            updateBadgeData('accessLevel', [...current, area])
                          }
                        }}
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Meal Preferences</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      { code: 'V', label: 'Vegetarian' },
                      { code: 'VG', label: 'Vegan' },
                      { code: 'GF', label: 'Gluten Free' },
                      { code: 'H', label: 'Halal' },
                      { code: 'K', label: 'Kosher' }
                    ].map(pref => (
                      <Badge
                        key={pref.code}
                        variant={badgeData.mealPreferences?.includes(pref.code) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const current = badgeData.mealPreferences || []
                          if (current.includes(pref.code)) {
                            updateBadgeData('mealPreferences', current.filter(p => p !== pref.code))
                          } else {
                            updateBadgeData('mealPreferences', [...current, pref.code])
                          }
                        }}
                      >
                        {pref.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialNotes">Special Notes</Label>
                  <Input
                    id="specialNotes"
                    value={badgeData.specialNotes || ''}
                    onChange={(e) => updateBadgeData('specialNotes', e.target.value)}
                    placeholder="Any special requirements or notes"
                  />
                </div>
              </TabsContent>

              {/* Design Options Tab */}
              <TabsContent value="design" className="space-y-4">
                <div>
                  <Label>Badge Style</Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="default"
                      className="flex-1"
                      disabled
                    >
                      <Layout className="h-4 w-4 mr-2" />
                      Professional Standard
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Badge Size</Label>
                  <Select
                    value={size}
                    onValueChange={(value: 'standard' | 'large') => setSize(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (3.5" × 5.5")</SelectItem>
                      <SelectItem value="large">Large (4" × 6")</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showAccess">Show Access Levels</Label>
                    <Switch
                      id="showAccess"
                      checked={showAccessLevels}
                      onCheckedChange={setShowAccessLevels}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showMeals">Show Meal Preferences</Label>
                    <Switch
                      id="showMeals"
                      checked={showMealPreferences}
                      onCheckedChange={setShowMealPreferences}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showCompany">Show Company Info</Label>
                    <Switch
                      id="showCompany"
                      checked={showCompanyInfo}
                      onCheckedChange={setShowCompanyInfo}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-6">
              <Button onClick={handleDownloadPDF} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button onClick={handleDownloadPNG} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download PNG
              </Button>
              <Button onClick={handlePrint} variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Badge Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Badge Preview</CardTitle>
            <CardDescription>
              Live preview of your professional badge design
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center min-h-[600px] bg-gray-50 rounded-lg p-8">
              <div ref={badgeRef} className="transform scale-90">
                {variant === 'standard' ? (
                  <ProfessionalBadgeDesign
                    data={{
                      ...badgeData,
                      accessLevel: showAccessLevels ? badgeData.accessLevel : undefined,
                      mealPreferences: showMealPreferences ? badgeData.mealPreferences : undefined,
                      company: showCompanyInfo ? badgeData.company : undefined,
                      title: showCompanyInfo ? badgeData.title : undefined
                    }}
                    variant={variant}
                    size={size}
                    colorScheme={colorScheme}
                  />
                ) : (
                  <MinimalBadgeDesign
                    data={{
                      ...badgeData,
                      company: showCompanyInfo ? badgeData.company : undefined,
                      title: showCompanyInfo ? badgeData.title : undefined
                    }}
                    variant={variant}
                    size={size}
                    colorScheme={colorScheme}
                  />
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                <div className="text-xs text-gray-500">Type</div>
                <div className="text-sm font-semibold">{badgeData.badgeType}</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Shield className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                <div className="text-xs text-gray-500">Access</div>
                <div className="text-sm font-semibold">{badgeData.accessLevel?.length || 0} Areas</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <QrCode className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                <div className="text-xs text-gray-500">ID</div>
                <div className="text-sm font-semibold truncate">{badgeData.registrationId}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
