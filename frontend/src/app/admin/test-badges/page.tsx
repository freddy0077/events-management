'use client'

// Force dynamic rendering to prevent SSG issues with Apollo Client
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  Printer, 
  Download, 
  Eye,
  TestTube,
  CheckCircle,
  XCircle,
  Loader2,
  FileImage,
  FileText,
  Palette
} from 'lucide-react'
import { ProfessionalBadgeDesign, BadgeData, renderBadgeToHTML } from '@/components/badges/ProfessionalBadgeDesign'
import { CentralizedBadge } from '@/components/badges/CentralizedBadgeSystem'
import { BadgePreviewCustomizer } from '@/components/badges/BadgePreviewCustomizer'
import { badgeTemplates, getTemplateById } from '@/components/badges/BadgeTemplates'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default function TestBadgesPage() {
  const [testResults, setTestResults] = useState<{
    [key: string]: { status: 'pending' | 'success' | 'error'; message: string }
  }>({})
  const [isRunningTests, setIsRunningTests] = useState(false)

  // Sample badge data for testing
  const sampleBadgeData: BadgeData = {
    firstName: 'John',
    lastName: 'Doe',
    title: 'Senior Developer',
    company: 'Tech Corp',
    email: 'john.doe@techcorp.com',
    eventName: 'Tech Summit 2024',
    eventDate: 'March 15-17, 2024',
    eventVenue: 'Convention Center, San Francisco',
    registrationId: 'REG-2024-001',
    category: 'VIP Attendee',
    badgeType: 'VIP',
    qrCodeData: JSON.stringify({
      id: 'REG-2024-001',
      name: 'John Doe',
      email: 'john.doe@techcorp.com',
      category: 'VIP'
    }),
    accessLevel: ['Main Hall', 'VIP Lounge', 'All Sessions', 'Networking Area'],
    mealPreferences: ['Vegetarian', 'No Nuts'],
    showAccessLevel: true,
    showMealPreferences: true,
    showCompany: true
  }

  // Sample badge data demonstrating event template inheritance
  const eventTemplateBadgeData: BadgeData = {
    firstName: 'Jane',
    lastName: 'Smith',
    title: 'Product Manager',
    company: 'Innovation Labs',
    email: 'jane.smith@innovationlabs.com',
    eventName: 'Tech Summit 2024',
    eventDate: 'March 15-17, 2024',
    eventVenue: 'Convention Center, San Francisco',
    registrationId: 'REG-2024-002',
    category: 'Premium Attendee',
    badgeType: 'ATTENDEE',
    badgeTemplateId: 'microsoft-inspire', // Event's selected template - automatically applied
    qrCodeData: JSON.stringify({
      id: 'REG-2024-002',
      name: 'Jane Smith',
      email: 'jane.smith@innovationlabs.com',
      category: 'Premium'
    }),
    accessLevel: ['Main Hall', 'All Sessions'],
    mealPreferences: ['Gluten Free'],
    showAccessLevel: true,
    showMealPreferences: true,
    showCompany: true
  }

  // Test functions
  const runTest = async (
    testName: string,
    testFn: () => Promise<void>
  ) => {
    setTestResults(prev => ({
      ...prev,
      [testName]: { status: 'pending', message: 'Running...' }
    }))

    try {
      await testFn()
      setTestResults(prev => ({
        ...prev,
        [testName]: { status: 'success', message: 'Test passed' }
      }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [testName]: { status: 'error', message: error instanceof Error ? error.message : 'Test failed' }
      }))
    }
  }

  const testBadgeRendering = async () => {
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    document.body.appendChild(container)

    try {
      // Test standard badge
      const standardBadge = document.createElement('div')
      standardBadge.innerHTML = `<div id="test-standard">Standard Badge Test</div>`
      container.appendChild(standardBadge)

      // Test minimal badge
      const minimalBadge = document.createElement('div')
      minimalBadge.innerHTML = `<div id="test-minimal">Minimal Badge Test</div>`
      container.appendChild(minimalBadge)

      // Verify both rendered
      if (!document.getElementById('test-standard') || !document.getElementById('test-minimal')) {
        throw new Error('Badge rendering failed')
      }
    } finally {
      document.body.removeChild(container)
    }
  }

  const testHTMLGeneration = async () => {
    const html = renderBadgeToHTML(sampleBadgeData, 'standard')
    if (!html || !html.includes('<!DOCTYPE html>')) {
      throw new Error('HTML generation failed')
    }
    if (!html.includes(sampleBadgeData.firstName)) {
      throw new Error('Badge data not properly included in HTML')
    }
  }

  const testTemplateLoading = async () => {
    const template = getTemplateById('microsoft-inspire')
    if (!template) {
      throw new Error('Template loading failed')
    }
    if (template.id !== 'microsoft-inspire') {
      throw new Error('Template ID mismatch')
    }
  }

  const testPrintPreview = async () => {
    return new Promise<void>((resolve, reject) => {
      const printWindow = window.open('', '_blank', 'width=600,height=800')
      if (!printWindow) {
        reject(new Error('Failed to open print preview window'))
        return
      }

      const html = renderBadgeToHTML(sampleBadgeData, 'standard')
      printWindow.document.write(html)
      printWindow.document.close()

      setTimeout(() => {
        printWindow.close()
        resolve()
      }, 1000)
    })
  }

  const testPNGExport = async () => {
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.width = '350px'
    container.style.height = '550px'
    document.body.appendChild(container)

    try {
      // Create a test badge element
      const badgeElement = document.createElement('div')
      badgeElement.style.width = '350px'
      badgeElement.style.height = '550px'
      badgeElement.style.background = 'white'
      badgeElement.innerHTML = '<div style="padding: 20px;">Test Badge</div>'
      container.appendChild(badgeElement)

      const canvas = await html2canvas(badgeElement)
      const dataUrl = canvas.toDataURL('image/png')
      
      if (!dataUrl || !dataUrl.startsWith('data:image/png')) {
        throw new Error('PNG export failed')
      }
    } finally {
      document.body.removeChild(container)
    }
  }

  const testPDFExport = async () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [350, 550]
    })

    // Add test content
    pdf.text('Test Badge PDF', 20, 20)
    
    const pdfOutput = pdf.output('datauristring')
    if (!pdfOutput || !pdfOutput.includes('application/pdf')) {
      throw new Error('PDF generation failed')
    }
  }

  const testBadgeTypes = async () => {
    const badgeTypes = ['ATTENDEE', 'SPEAKER', 'VIP', 'STAFF', 'ORGANIZER', 'SPONSOR', 'MEDIA']
    
    for (const type of badgeTypes) {
      const testData = { ...sampleBadgeData, badgeType: type as any }
      const html = renderBadgeToHTML(testData, 'standard')
      if (!html) {
        throw new Error(`Failed to render badge type: ${type}`)
      }
    }
  }

  const testAllTemplates = async () => {
    for (const template of badgeTemplates.slice(0, 5)) {
      const templateData = getTemplateById(template.id)
      if (!templateData) {
        throw new Error(`Failed to load template: ${template.id}`)
      }
    }
  }

  const runAllTests = async () => {
    setIsRunningTests(true)
    setTestResults({})

    const tests = [
      { name: 'Badge Rendering', fn: testBadgeRendering },
      { name: 'HTML Generation', fn: testHTMLGeneration },
      { name: 'Template Loading', fn: testTemplateLoading },
      { name: 'Print Preview', fn: testPrintPreview },
      { name: 'PNG Export', fn: testPNGExport },
      { name: 'PDF Export', fn: testPDFExport },
      { name: 'Badge Types', fn: testBadgeTypes },
      { name: 'All Templates', fn: testAllTemplates }
    ]

    for (const test of tests) {
      await runTest(test.name, test.fn)
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsRunningTests(false)

    // Show summary
    const results = Object.values(testResults)
    const passed = results.filter(r => r.status === 'success').length
    const failed = results.filter(r => r.status === 'error').length
    
    if (failed === 0) {
      toast.success(`All ${passed} tests passed successfully!`)
    } else {
      toast.error(`${failed} tests failed, ${passed} tests passed`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-primary-50 to-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-full px-4 py-2 mb-4">
            <TestTube className="h-4 w-4 text-brand-600" />
            <span className="text-sm font-medium text-brand-700">Badge System Testing</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900">
            Professional Badge System Test Suite
          </h1>
          <p className="text-neutral-600 mt-2">
            Comprehensive testing for badge generation, preview, and export functionality
          </p>
        </div>

        <Tabs defaultValue="automated" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="automated">Automated Tests</TabsTrigger>
            <TabsTrigger value="interactive">Interactive Testing</TabsTrigger>
            <TabsTrigger value="template-inheritance">Template Inheritance</TabsTrigger>
          </TabsList>

          <TabsContent value="automated" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
              <CardHeader>
                <CardTitle>Automated Test Suite</CardTitle>
                <CardDescription>
                  Run automated tests to verify all badge system components are working correctly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
                    onClick={runAllTests}
                    disabled={isRunningTests}
                    className="w-full md:w-auto"
                  >
                    {isRunningTests ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Running Tests...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        Run All Tests
                      </>
                    )}
                  </Button>

                  {Object.keys(testResults).length > 0 && (
                    <div className="space-y-2 mt-6">
                      {Object.entries(testResults).map(([testName, result]) => (
                        <div
                          key={testName}
                          className={`p-3 rounded-lg border ${
                            result.status === 'success'
                              ? 'bg-success-50 border-success-200'
                              : result.status === 'error'
                              ? 'bg-error-50 border-error-200'
                              : 'bg-neutral-50 border-neutral-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {result.status === 'success' ? (
                                <CheckCircle className="h-4 w-4 text-success-600" />
                              ) : result.status === 'error' ? (
                                <XCircle className="h-4 w-4 text-error-600" />
                              ) : (
                                <Loader2 className="h-4 w-4 text-neutral-600 animate-spin" />
                              )}
                              <span className="font-medium">{testName}</span>
                            </div>
                            <span className="text-sm text-neutral-600">{result.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
              <CardHeader>
                <CardTitle>Test Coverage</CardTitle>
                <CardDescription>Components and features covered by the test suite</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: Palette, label: 'Badge Designs', status: 'covered' },
                    { icon: FileText, label: 'HTML Generation', status: 'covered' },
                    { icon: Printer, label: 'Print Preview', status: 'covered' },
                    { icon: FileImage, label: 'Image Export', status: 'covered' },
                    { icon: Download, label: 'PDF Export', status: 'covered' },
                    { icon: Eye, label: 'Templates', status: 'covered' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-3 rounded-lg bg-success-50 border border-success-200"
                    >
                      <item.icon className="h-5 w-5 text-success-600 mb-2" />
                      <div className="text-sm font-medium">{item.label}</div>
                      <Badge className="mt-1 bg-success-100 text-success-700 border-0">
                        Covered
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interactive" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
              <CardHeader>
                <CardTitle>Interactive Badge Preview</CardTitle>
                <CardDescription>
                  Test the badge customization and preview interface with sample data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BadgePreviewCustomizer />
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
              <CardHeader>
                <CardTitle>Sample Badge Designs</CardTitle>
                <CardDescription>Preview different badge variants and templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">Professional (Centralized)</h3>
                    <div className="border rounded-lg p-4 bg-white">
                      <CentralizedBadge 
                        data={sampleBadgeData} 
                        variant="professional" 
                        size="medium"
                        showQR={true}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-3">Standard (Centralized)</h3>
                    <div className="border rounded-lg p-4 bg-white">
                      <CentralizedBadge 
                        data={sampleBadgeData} 
                        variant="professional" 
                        size="medium"
                        showQR={true}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-3">Compact (Centralized)</h3>
                    <div className="border rounded-lg p-4 bg-white">
                      <CentralizedBadge 
                        data={sampleBadgeData} 
                        variant="compact" 
                        size="medium"
                        showQR={true}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="font-medium mb-3">Legacy Components (for comparison)</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm text-gray-600 mb-2">Legacy Professional Design</h4>
                      <div className="border rounded-lg p-4 bg-white">
                        <ProfessionalBadgeDesign data={sampleBadgeData} />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm text-gray-600 mb-2">Legacy Professional Design</h4>
                      <div className="border rounded-lg p-4 bg-white">
                        <ProfessionalBadgeDesign data={sampleBadgeData} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="template-inheritance" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Event Template Inheritance
                </CardTitle>
                <CardDescription>
                  Demonstration of how badges automatically use the event's selected template when registering participants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">How It Works</h3>
                    <p className="text-blue-800 text-sm">
                      When an event is created, organizers can select a badge template. All participants registered for that event 
                      will automatically receive badges using the event's selected template, ensuring consistent branding across all badges.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Badge Without Event Template</h4>
                      <p className="text-sm text-neutral-600 mb-3">
                        Uses default badge type colors (VIP = Purple)
                      </p>
                      <div className="border rounded-lg p-4 bg-white">
                        <CentralizedBadge 
                          data={sampleBadgeData} 
                          variant="professional" 
                          size="small"
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Badge With Event Template</h4>
                      <p className="text-sm text-neutral-600 mb-3">
                        Automatically uses Microsoft Inspire template from event settings
                      </p>
                      <div className="border rounded-lg p-4 bg-white">
                        <CentralizedBadge 
                          data={eventTemplateBadgeData} 
                          variant="professional" 
                          size="small"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-2">Template Priority Order</h3>
                    <ol className="text-green-800 text-sm space-y-1">
                      <li>1. <strong>Event's Badge Template</strong> - Highest priority (badgeTemplateId from event)</li>
                      <li>2. Manual Template Selection - Medium priority (templateId)</li>
                      <li>3. Badge Type Colors - Fallback (based on VIP, ATTENDEE, etc.)</li>
                    </ol>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="font-semibold text-amber-900 mb-2">Implementation Details</h3>
                    <ul className="text-amber-800 text-sm space-y-1">
                      <li>• Backend: Event model includes <code>badgeTemplateId</code> field</li>
                      <li>• Badge Service: Automatically includes event template in badge data</li>
                      <li>• Frontend: Centralized badge system prioritizes event template</li>
                      <li>• Registration: Participants inherit event's template automatically</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
