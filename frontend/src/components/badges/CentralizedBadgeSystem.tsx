'use client'

import React, { forwardRef } from 'react'
import QRCode from 'react-qr-code'
import { Calendar, MapPin, User, Award, QrCode } from 'lucide-react'
import { getTemplateById } from './BadgeTemplates'

// Centralized Badge Data Interface
export interface BadgeData {
  // Participant Information
  firstName: string
  lastName: string
  title?: string
  company?: string
  email?: string
  
  // Event Information
  eventName: string
  eventDate: string
  eventEndDate?: string
  eventVenue: string
  eventLogo?: string
  
  // Badge Specific
  badgeType: 'VIP' | 'SPEAKER' | 'ATTENDEE' | 'STAFF' | 'ORGANIZER' | 'MEDIA' | 'SPONSOR'
  category: string
  registrationId: string
  qrCodeData: string
  
  // Access & Permissions
  accessLevel?: string[]
  showAccessLevel?: boolean // Add showAccessLevel property for test-badges page
  mealPreferences?: string[]
  showMealPreferences?: boolean // Add showMealPreferences property for test-badges page
  showCompany?: boolean // Add showCompany property for test-badges page
  
  // Additional Information
  specialNotes?: string
  
  // Template Styling
  templateId?: string
  badgeTemplateId?: string // Event's selected badge template (from backend)
  customStyling?: BadgeTemplateColors
}

// Template Color Scheme Interface
export interface BadgeTemplateColors {
  primary: string
  secondary: string
  accent: string
  text: string
  background: string
  headerGradient?: string
}

// Badge Template Definition
export interface BadgeTemplate {
  id: string
  name: string
  description: string
  category: 'professional' | 'minimal' | 'corporate' | 'tech' | 'academic' | 'medical' | 'government' | 'nonprofit' | 'festival'
  preview: string
  colors: BadgeTemplateColors
  features: string[]
  recommendedFor: string[]
}

// Centralized Badge Templates Registry
const BADGE_TEMPLATES: BadgeTemplate[] = [
  {
    id: 'professional-blue',
    name: 'Professional Blue',
    description: 'Clean, professional design with blue accent colors',
    category: 'professional',
    preview: '💼',
    colors: {
      primary: '#1E40AF',
      secondary: '#3B82F6',
      accent: '#60A5FA',
      text: '#1F2937',
      background: '#F8FAFC',
      headerGradient: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)'
    },
    features: ['Professional styling', 'QR code beside name', 'Clean typography', 'Corporate branding'],
    recommendedFor: ['Corporate events', 'Business conferences', 'Professional meetings']
  },
  {
    id: 'minimal-gray',
    name: 'Minimal Gray',
    description: 'Clean, minimalist design with subtle gray tones',
    category: 'minimal',
    preview: '⚪',
    colors: {
      primary: '#374151',
      secondary: '#6B7280',
      accent: '#9CA3AF',
      text: '#111827',
      background: '#FFFFFF'
    },
    features: ['Minimalist design', 'Compact layout', 'Subtle colors', 'Modern typography'],
    recommendedFor: ['Tech conferences', 'Startup events', 'Design workshops']
  },
  {
    id: 'corporate-green',
    name: 'Corporate Green',
    description: 'Professional green theme for corporate events',
    category: 'corporate',
    preview: '🏢',
    colors: {
      primary: '#059669',
      secondary: '#10B981',
      accent: '#34D399',
      text: '#064E3B',
      background: '#F0FDF4',
      headerGradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
    },
    features: ['Corporate styling', 'Green theme', 'Professional layout', 'Brand-friendly'],
    recommendedFor: ['Corporate meetings', 'Business summits', 'Company events']
  },
  {
    id: 'tech-purple',
    name: 'Tech Purple',
    description: 'Modern purple design perfect for tech events',
    category: 'tech',
    preview: '💻',
    colors: {
      primary: '#7C3AED',
      secondary: '#8B5CF6',
      accent: '#A78BFA',
      text: '#1F2937',
      background: '#FAFAFA',
      headerGradient: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)'
    },
    features: ['Tech-focused design', 'Modern colors', 'Innovation theme', 'Developer-friendly'],
    recommendedFor: ['Tech conferences', 'Hackathons', 'Developer meetups', 'Innovation summits']
  },
  {
    id: 'academic-navy',
    name: 'Academic Navy',
    description: 'Traditional navy design for academic institutions',
    category: 'academic',
    preview: '🎓',
    colors: {
      primary: '#1E3A8A',
      secondary: '#3B82F6',
      accent: '#93C5FD',
      text: '#1F2937',
      background: '#F8FAFC',
      headerGradient: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)'
    },
    features: ['Academic styling', 'Traditional colors', 'Scholarly design', 'Institution-friendly'],
    recommendedFor: ['Academic conferences', 'University events', 'Research symposiums', 'Educational workshops']
  }
]

// Badge Type Color Mapping
const BADGE_TYPE_COLORS: Record<string, BadgeTemplateColors> = {
  VIP: {
    primary: '#DC2626',
    secondary: '#EF4444',
    accent: '#FCA5A5',
    text: '#FFFFFF',
    background: '#FEF2F2'
  },
  SPEAKER: {
    primary: '#7C3AED',
    secondary: '#8B5CF6',
    accent: '#A78BFA',
    text: '#FFFFFF',
    background: '#F5F3FF'
  },
  ATTENDEE: {
    primary: '#059669',
    secondary: '#10B981',
    accent: '#34D399',
    text: '#FFFFFF',
    background: '#F0FDF4'
  },
  STAFF: {
    primary: '#1E40AF',
    secondary: '#3B82F6',
    accent: '#60A5FA',
    text: '#FFFFFF',
    background: '#EFF6FF'
  },
  ORGANIZER: {
    primary: '#B45309',
    secondary: '#D97706',
    accent: '#FBBF24',
    text: '#FFFFFF',
    background: '#FFFBEB'
  },
  MEDIA: {
    primary: '#7C2D12',
    secondary: '#EA580C',
    accent: '#FB923C',
    text: '#FFFFFF',
    background: '#FFF7ED'
  },
  SPONSOR: {
    primary: '#581C87',
    secondary: '#7C3AED',
    accent: '#A78BFA',
    text: '#FFFFFF',
    background: '#FAF5FF'
  }
}

// Utility Functions

const getTemplateColors = (templateId: string): BadgeTemplateColors => {
  const template = getTemplateById(templateId)
  return template?.colors || BADGE_TEMPLATES[0].colors
}

const getBadgeTypeColors = (badgeType: string): BadgeTemplateColors => {
  return BADGE_TYPE_COLORS[badgeType] || BADGE_TYPE_COLORS.ATTENDEE
}

// Helper function to get the effective template ID with proper fallback logic
const getEffectiveTemplateId = (data: BadgeData): string | undefined => {
  // Priority order: Event's badge template > Manual template selection > No template
  return data.badgeTemplateId || data.templateId
}

// Props for the centralized badge component
export interface CentralizedBadgeProps {
  data: BadgeData
  variant?: 'professional' | 'minimal' | 'compact'
  size?: 'small' | 'medium' | 'large'
  showQR?: boolean
  className?: string
}

// Main Centralized Badge Component
export const CentralizedBadge = forwardRef<HTMLDivElement, CentralizedBadgeProps>(
  ({ data, variant = 'professional', size = 'medium', showQR = true, className = '' }, ref) => {
    // Determine colors based on event's badge template, then fallback to other options
    const colors = data.badgeTemplateId 
      ? getTemplateColors(data.badgeTemplateId) 
      : data.templateId 
        ? getTemplateColors(data.templateId) 
        : data.customStyling || getBadgeTypeColors(data.badgeType)

    // Size configurations - optimized for PDF printing
    const sizeConfig = {
      small: { width: '3in', height: '4.5in', fontSize: '12px', qrSize: 70 },
      medium: { width: '3.5in', height: '5.5in', fontSize: '14px', qrSize: 80 },
      large: { width: '4in', height: '6in', fontSize: '16px', qrSize: 90 }
    }

    const config = sizeConfig[size]

    // Render based on variant
    switch (variant) {
      case 'minimal':
        return <MinimalBadgeVariant ref={ref} data={data} colors={colors} config={config} showQR={showQR} className={className} />
      case 'compact':
        return <CompactBadgeVariant ref={ref} data={data} colors={colors} config={config} showQR={showQR} className={className} />
      case 'professional':
      default:
        return <ProfessionalBadgeVariant ref={ref} data={data} colors={colors} config={config} showQR={showQR} className={className} />
    }
  }
)

CentralizedBadge.displayName = 'CentralizedBadge'

// Professional Badge Variant
const ProfessionalBadgeVariant = forwardRef<HTMLDivElement, {
  data: BadgeData
  colors: BadgeTemplateColors
  config: any
  showQR: boolean
  className: string
}>(({ data, colors, config, showQR, className }, ref) => (
  <div
    ref={ref}
    className={`badge-professional ${className}`}
    style={{
      width: config.width,
      minHeight: config.height,
      backgroundColor: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column'
    }}
  >
    {/* Header - Dedicated to Event Name and Logo */}
    <div style={{
      background: colors.headerGradient || colors.primary,
      color: 'white',
      padding: '32px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px'
    }}>
      {/* Event Logo */}
      {data.eventLogo && (
        <div style={{
          maxHeight: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img 
            src={data.eventLogo} 
            alt="Event Logo" 
            style={{
              maxHeight: '80px',
              maxWidth: '240px',
              objectFit: 'contain'
            }}
          />
        </div>
      )}
      
      {/* Event Name */}
      <div style={{
        fontSize: `calc(${config.fontSize} + 4px)`,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: '1.3'
      }}>
        {data.eventName}
      </div>
      
      {/* Event Dates */}
      <div style={{
        color: 'rgba(255, 255, 255, 0.95)',
        fontSize: config.fontSize,
        fontWeight: '500',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div>
          {data.eventEndDate ? (
            <>
              <div>Start: {data.eventDate}</div>
              <div>End: {data.eventEndDate}</div>
            </>
          ) : (
            data.eventDate
          )}
        </div>
        <div style={{
          fontSize: `calc(${config.fontSize} - 1px)`,
          color: 'rgba(255, 255, 255, 0.85)'
        }}>
          {data.eventVenue}
        </div>
      </div>
    </div>

    {/* Main Content */}
    <div style={{
      flex: 1,
      padding: '32px 24px 24px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      backgroundColor: '#FAFAFA'
    }}>
      {/* Name Section */}
      <div style={{
        marginBottom: '24px'
      }}>
        <div style={{
          fontSize: `calc(${config.fontSize} * 2.2)`,
          fontWeight: '700',
          color: '#1A1A1A',
          lineHeight: '1.2',
          marginBottom: '8px'
        }}>
          {data.firstName}
        </div>
        <div style={{
          fontSize: `calc(${config.fontSize} * 2.2)`,
          fontWeight: '700',
          color: '#1A1A1A',
          lineHeight: '1.2',
          marginBottom: '16px'
        }}>
          {data.lastName}
        </div>
      </div>

      {/* QR Code Section - Positioned below name to prevent overlap */}
      {showQR && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            minWidth: '120px'
          }}>
            <div style={{
              display: 'block',
              lineHeight: 0,
              overflow: 'hidden',
              backgroundColor: 'white',
              borderRadius: '4px'
            }}>
              <QRCode
                value={data.qrCodeData}
                size={config.qrSize}
                fgColor={colors.text}
                bgColor="white"
                style={{
                  display: 'block',
                  height: 'auto',
                  maxWidth: '100%',
                  width: '100%'
                }}
                viewBox={`0 0 ${config.qrSize} ${config.qrSize}`}
              />
            </div>
            <div style={{
              marginTop: '8px',
              fontSize: '10px',
              color: '#666666',
              textAlign: 'center',
              letterSpacing: '0.5px',
              fontWeight: '500'
            }}>
              SCAN TO CHECK-IN
            </div>
            <div style={{
              marginTop: '4px',
              fontSize: '8px',
              color: '#888888',
              textAlign: 'center',
              letterSpacing: '0.3px'
            }}>
              ID: {data.registrationId}
            </div>
          </div>
        </div>
      )}

      {/* Title & Company */}
      {(data.title || data.company) && (
        <div style={{
          borderLeft: `3px solid ${colors.accent}`,
          paddingLeft: '12px',
          marginBottom: '20px'
        }}>
          {data.title && (
            <div style={{
              fontSize: config.fontSize,
              color: '#555555',
              fontWeight: '500',
              marginBottom: '4px'
            }}>
              {data.title}
            </div>
          )}
          {data.company && (
            <div style={{
              fontSize: `calc(${config.fontSize} + 2px)`,
              color: '#333333',
              fontWeight: '600'
            }}>
              {data.company}
            </div>
          )}
        </div>
      )}

      {/* Category Badge - Enhanced Legibility */}
      <div style={{
        display: 'inline-block',
        backgroundColor: colors.primary,
        color: 'white',
        padding: '14px 28px',
        borderRadius: '28px',
        fontSize: '18px',
        fontWeight: '800',
        marginBottom: '20px',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        {data.category}
      </div>

      {/* Access Levels */}
      {data.accessLevel && data.accessLevel.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '11px',
            color: '#888888',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '6px',
            fontWeight: '600'
          }}>
            Access Areas
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {data.accessLevel.map((level, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#E8E8E8',
                  color: '#555555',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '500'
                }}
              >
                {level}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* Footer */}
    <div style={{
      backgroundColor: colors.primary,
      padding: '12px 24px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: '10px',
        textAlign: 'center',
        fontWeight: '500'
      }}>
        {data.eventEndDate ? `${data.eventDate} - ${data.eventEndDate}` : data.eventDate}
      </div>
    </div>
  </div>
))

ProfessionalBadgeVariant.displayName = 'ProfessionalBadgeVariant'

// Minimal Badge Variant
const MinimalBadgeVariant = forwardRef<HTMLDivElement, {
  data: BadgeData
  colors: BadgeTemplateColors
  config: any
  showQR: boolean
  className: string
}>(({ data, colors, config, showQR, className }, ref) => (
  <div
    ref={ref}
    className={`badge-minimal ${className}`}
    style={{
      width: config.width,
      minHeight: config.height,
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #E0E0E0',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxSizing: 'border-box'
    }}
  >
    {/* Event Logo */}
    {data.eventLogo && (
      <div style={{
        marginBottom: '12px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <img 
          src={data.eventLogo} 
          alt="Event Logo" 
          style={{
            maxHeight: '40px',
            maxWidth: '150px',
            objectFit: 'contain'
          }}
        />
      </div>
    )}
    
    {/* Event Name */}
    <div style={{
      fontSize: config.fontSize,
      color: '#888888',
      marginBottom: '20px',
      letterSpacing: '0.5px',
      textAlign: 'center'
    }}>
      {data.eventName}
    </div>

    {/* Name and QR Code Section */}
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: '20px'
    }}>
      {/* Name */}
      <div style={{
        fontSize: `calc(${config.fontSize} * 2.3)`,
        fontWeight: '300',
        color: '#1A1A1A',
        lineHeight: '1.1',
        flex: 1,
        marginRight: showQR ? '16px' : '0'
      }}>
        <div>{data.firstName}</div>
        <div style={{ fontWeight: '500' }}>{data.lastName}</div>
      </div>
      
      {/* QR Code Section - Positioned beside name */}
      {showQR && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#F8F8F8',
          borderRadius: '6px',
          padding: '8px'
        }}>
          <div style={{
            display: 'block',
            lineHeight: 0,
            overflow: 'hidden',
            backgroundColor: 'white',
            borderRadius: '4px'
          }}>
            <QRCode
              value={data.qrCodeData}
              size={Math.floor(config.qrSize * 0.85)}
              fgColor={colors.text}
              bgColor="white"
              style={{
                display: 'block',
                height: 'auto',
                maxWidth: '100%',
                width: '100%'
              }}
              viewBox={`0 0 ${Math.floor(config.qrSize * 0.85)} ${Math.floor(config.qrSize * 0.85)}`}
            />
          </div>
          <div style={{
            marginTop: '4px',
            fontSize: '7px',
            color: '#888888',
            textAlign: 'center',
            letterSpacing: '0.2px'
          }}>
            {data.registrationId}
          </div>
        </div>
      )}
    </div>

    {/* Title & Company */}
    {data.company && (
      <div style={{
        fontSize: config.fontSize,
        color: '#555555',
        marginBottom: '16px'
      }}>
        {data.title && <div>{data.title}</div>}
        <div style={{ fontWeight: '500' }}>{data.company}</div>
      </div>
    )}

    {/* Badge Type */}
    <div style={{
      display: 'inline-block',
      borderBottom: `2px solid ${colors.accent}`,
      color: colors.text,
      fontSize: '11px',
      fontWeight: '600',
      letterSpacing: '1px',
      paddingBottom: '4px',
      textTransform: 'uppercase',
      marginBottom: '20px'
    }}>
      {data.badgeType}
    </div>

    {/* Bottom */}
    <div style={{
      fontSize: '10px',
      color: '#888888',
      textAlign: 'center',
      paddingTop: '12px',
      marginTop: 'auto'
    }}>
      {data.eventEndDate ? `${data.eventDate} - ${data.eventEndDate}` : data.eventDate} • {data.eventVenue}
    </div>
  </div>
))

MinimalBadgeVariant.displayName = 'MinimalBadgeVariant'

// Compact Badge Variant
const CompactBadgeVariant = forwardRef<HTMLDivElement, {
  data: BadgeData
  colors: BadgeTemplateColors
  config: any
  showQR: boolean
  className: string
}>(({ data, colors, config, showQR, className }, ref) => (
  <div
    ref={ref}
    className={`badge-compact ${className}`}
    style={{
      width: config.width,
      minHeight: `calc(${config.height} * 0.8)`,
      backgroundColor: 'white',
      borderRadius: '6px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxSizing: 'border-box',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}
  >
    {/* Header */}
    <div style={{
      backgroundColor: colors.primary,
      color: 'white',
      padding: '8px 12px',
      margin: '-16px -16px 16px -16px',
      fontSize: '12px',
      fontWeight: '600',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px'
    }}>
      {data.eventLogo && (
        <img 
          src={data.eventLogo} 
          alt="Event Logo" 
          style={{
            maxHeight: '30px',
            maxWidth: '100px',
            objectFit: 'contain'
          }}
        />
      )}
      <div style={{ textAlign: 'center' }}>{data.eventName}</div>
    </div>

    {/* Name and QR Code */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: `calc(${config.fontSize} + 4px)`,
          fontWeight: '600',
          color: '#1A1A1A',
          lineHeight: '1.1'
        }}>
          {data.firstName} {data.lastName}
        </div>
        {data.company && (
          <div style={{
            fontSize: '12px',
            color: '#666666',
            marginTop: '2px'
          }}>
            {data.company}
          </div>
        )}
      </div>
      
      {showQR && (
        <div style={{ marginLeft: '12px' }}>
          <div style={{
            display: 'block',
            lineHeight: 0,
            overflow: 'hidden',
            backgroundColor: 'white',
            borderRadius: '4px'
          }}>
            <QRCode
              value={data.qrCodeData}
              size={Math.floor(config.qrSize * 0.6)}
              fgColor={colors.text}
              bgColor="white"
              style={{
                display: 'block',
                height: 'auto',
                maxWidth: '100%',
                width: '100%'
              }}
              viewBox={`0 0 ${Math.floor(config.qrSize * 0.6)} ${Math.floor(config.qrSize * 0.6)}`}
            />
          </div>
        </div>
      )}
    </div>

    {/* Badge Type */}
    <div style={{
      backgroundColor: colors.accent,
      color: colors.text,
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: '600',
      textTransform: 'uppercase',
      display: 'inline-block',
      marginBottom: '8px'
    }}>
      {data.badgeType}
    </div>

    {/* Footer */}
    <div style={{
      fontSize: '9px',
      color: '#888888',
      marginTop: 'auto',
      textAlign: 'center'
    }}>
      {data.registrationId}
    </div>
  </div>
))

CompactBadgeVariant.displayName = 'CompactBadgeVariant'

// Export everything for centralized access
export default CentralizedBadge
export {
  ProfessionalBadgeVariant,
  MinimalBadgeVariant,
  CompactBadgeVariant,
  BADGE_TEMPLATES,
  BADGE_TYPE_COLORS,
  getTemplateById,
  getTemplateColors,
  getBadgeTypeColors
}
