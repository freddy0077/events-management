'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Palette } from 'lucide-react'
import { StepProps } from './types'
import { badgeTemplates, getTemplateById } from '@/components/badges/BadgeTemplates'
import { CentralizedBadgeRenderer } from '@/components/badges/CentralizedBadgeRenderer'

export function BadgeTemplateStep({ formData, setFormData, errors, setErrors }: StepProps) {
  const handleTemplateSelect = (templateId: string) => {
    setFormData(prev => ({
      ...prev,
      badgeTemplateId: templateId
    }))
    
    // Clear any template selection errors
    if (errors.badgeTemplateId) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.badgeTemplateId
        return newErrors
      })
    }
  }

  // Generate dynamic sample badge data based on selected template and event info
  const generateSampleBadgeData = () => {
    const selectedTemplate = formData.badgeTemplateId ? getTemplateById(formData.badgeTemplateId) : null
    
    // Template-specific sample participant data
    const templateSampleData = {
      'festival-fun': {
        firstName: 'Alex',
        lastName: 'Rivera',
        title: 'Festival Goer',
        company: 'Music Lover',
        email: 'alex.rivera@email.com'
      },
      'wedding-elegant': {
        firstName: 'Sarah',
        lastName: 'Johnson',
        title: 'Guest',
        company: 'Friend of Bride',
        email: 'sarah.johnson@email.com'
      },
      'sports-event': {
        firstName: 'Mike',
        lastName: 'Thompson',
        title: 'Athlete',
        company: 'Team Thunder',
        email: 'mike.thompson@email.com'
      },
      'community-gathering': {
        firstName: 'Maria',
        lastName: 'Garcia',
        title: 'Community Member',
        company: 'Local Resident',
        email: 'maria.garcia@email.com'
      },
      'birthday-party': {
        firstName: 'Emma',
        lastName: 'Davis',
        title: 'Party Guest',
        company: 'Best Friend',
        email: 'emma.davis@email.com'
      },
      'charity-fundraiser': {
        firstName: 'David',
        lastName: 'Wilson',
        title: 'Supporter',
        company: 'Volunteer',
        email: 'david.wilson@email.com'
      },
      'conference-modern': {
        firstName: 'Jennifer',
        lastName: 'Lee',
        title: 'Attendee',
        company: 'Professional',
        email: 'jennifer.lee@email.com'
      },
      'workshop-creative': {
        firstName: 'Carlos',
        lastName: 'Martinez',
        title: 'Participant',
        company: 'Artist',
        email: 'carlos.martinez@email.com'
      }
    }

    const defaultSample = {
      firstName: 'John',
      lastName: 'Doe',
      title: 'Attendee',
      company: 'Participant',
      email: 'john.doe@email.com'
    }

    const participantData = selectedTemplate?.id && templateSampleData[selectedTemplate.id as keyof typeof templateSampleData] 
      ? templateSampleData[selectedTemplate.id as keyof typeof templateSampleData]
      : defaultSample

    return {
      ...participantData,
      eventName: formData.name || 'Sample Event',
      eventDate: formData.date ? new Date(formData.date).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }) : new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      eventVenue: formData.venue || 'Sample Venue',
      registrationId: 'SAMPLE001',
      category: formData.categories[0]?.name || 'General Admission',
      badgeType: 'ATTENDEE' as const,
      qrCodeData: `SAMPLE-QR-${participantData.firstName.toUpperCase()}-${participantData.lastName.toUpperCase()}-REG001`,
      accessLevel: ['Main Area', 'General Access'],
      mealPreferences: ['V'],
      badgeTemplateId: formData.badgeTemplateId
    }
  }

  const sampleBadgeData = generateSampleBadgeData()

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Palette className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-purple-800">Badge Template Selection</h3>
          </div>
          <p className="text-purple-600 max-w-2xl mx-auto">
            Choose a professional badge template for your event. This template will be used for all participant badges.
          </p>
        </div>

        {/* Template Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badgeTemplates.map((template) => (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                formData.badgeTemplateId === template.id 
                  ? 'ring-2 ring-purple-500 bg-purple-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleTemplateSelect(template.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {template.name}
                  </CardTitle>
                  {formData.badgeTemplateId === template.id && (
                    <div className="p-1 bg-purple-500 rounded-full">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Template Metadata */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {template.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {template.preview}
                  </Badge>
                </div>

                {/* Template Colors Preview */}
                {template.styling && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-600">Color Scheme:</p>
                    <div className="flex gap-2">
                      <div 
                        className="w-6 h-6 rounded border border-gray-200"
                        style={{ background: template.styling.headerGradient || template.styling.primaryColor }}
                        title="Header Color"
                      />
                      <div 
                        className="w-6 h-6 rounded border border-gray-200"
                        style={{ backgroundColor: template.styling.backgroundColor }}
                        title="Background Color"
                      />
                      <div 
                        className="w-6 h-6 rounded border border-gray-200"
                        style={{ backgroundColor: template.styling.accentColor }}
                        title="Accent Color"
                      />
                    </div>
                  </div>
                )}

                {/* Select Button */}
                <Button
                  type="button"
                  variant={formData.badgeTemplateId === template.id ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTemplateSelect(template.id)
                  }}
                >
                  {formData.badgeTemplateId === template.id ? 'Selected' : 'Select Template'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Badge Preview */}
        {formData.badgeTemplateId && (
          <div className="mt-8">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Badge Preview
                </CardTitle>
                <CardDescription>
                  Preview of how badges will look with the selected template
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-visible">
                <div className="flex justify-center items-center min-h-[600px] overflow-visible">
                  <CentralizedBadgeRenderer
                    data={sampleBadgeData}
                    templateId={formData.badgeTemplateId}
                    size="large"
                    showQR={true}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Display */}
        {errors.badgeTemplateId && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
            {errors.badgeTemplateId}
          </div>
        )}

        {/* Info Note */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-blue-100 rounded">
              <Palette className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Badge Template Selection</p>
              <p>
                The selected template will be used for all participant badges in this event. 
                You can choose from professional templates designed for different types of events and organizations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
