'use client'

import React from 'react'
import { BadgeTemplateLayout, getTemplateLayout, applyTemplateColors } from '@/lib/badge-templates/centralized-templates'
import { getTemplateById } from './BadgeTemplates'

export interface BadgeData {
  firstName: string
  lastName: string
  title?: string
  company?: string
  email?: string
  eventName: string
  eventDate: string
  eventVenue?: string
  registrationId: string
  category: string
  badgeType: 'VIP' | 'ATTENDEE' | 'STAFF' | 'SPEAKER' | 'SPONSOR'
  qrCodeData?: string
  accessLevel?: string[]
  mealPreferences?: string[]
  badgeTemplateId?: string
}

export interface CentralizedBadgeRendererProps {
  data: BadgeData
  templateId?: string
  size?: 'small' | 'medium' | 'large'
  showQR?: boolean
}

export const CentralizedBadgeRenderer: React.FC<CentralizedBadgeRendererProps> = ({
  data,
  templateId,
  size = 'medium',
  showQR = true
}) => {
  // Get the layout template (defaults to professional)
  const layoutTemplate = getTemplateLayout(templateId || 'professional')

  // Get template colors from the existing BadgeTemplates system
  const colorTemplate = data.badgeTemplateId ? getTemplateById(data.badgeTemplateId) : null
  const templateColors = colorTemplate?.styling ? {
    primary: colorTemplate.styling.primaryColor || '#1e293b',
    secondary: colorTemplate.styling.secondaryColor || '#334155',
    accent: colorTemplate.styling.accentColor || '#475569'
  } : {
    primary: '#1e293b',
    secondary: '#334155',
    accent: '#475569'
  }

  // Apply template colors to layout
  const styledLayout = applyTemplateColors(layoutTemplate, templateColors)

  // Calculate scale based on size
  const scale = size === 'small' ? 0.6 : size === 'large' ? 1.2 : 1
  const scaledWidth = styledLayout.dimensions.width * scale
  const scaledHeight = styledLayout.dimensions.height * scale

  // Dynamic font size for participant name based on length
  const getNameFontSize = (name: string) => {
    const fullName = `${data.firstName} ${data.lastName}`
    if (fullName.length > 25) return styledLayout.participantSection.nameCard.name.fontSize * 0.8
    if (fullName.length > 18) return styledLayout.participantSection.nameCard.name.fontSize * 0.9
    return styledLayout.participantSection.nameCard.name.fontSize
  }

  return (
    <div
      className="badge-container relative bg-white shadow-lg"
      style={{
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        backgroundColor: styledLayout.backgroundColor,
        borderRadius: `${styledLayout.border.borderRadius * scale}px`,
        border: `${styledLayout.border.width * scale}px solid ${styledLayout.border.color}`,
        padding: `${styledLayout.dimensions.margin * scale}px`,
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      {/* Header Section */}
      <div
        className="badge-header"
        style={{
          height: `${styledLayout.header.height * scale}px`,
          backgroundColor: styledLayout.header.backgroundColor,
          borderRadius: `${styledLayout.header.borderRadius * scale}px`,
          padding: `${12 * scale}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        {/* Branding */}
        <div
          style={{
            fontSize: `${styledLayout.header.branding.fontSize * scale}px`,
            fontWeight: styledLayout.header.branding.fontWeight,
            color: styledLayout.header.branding.color,
            lineHeight: 1
          }}
        >
          {/*{styledLayout.header.branding.text}*/}
            {data.eventName}

        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: `${styledLayout.header.tagline.fontSize * scale}px`,
            color: styledLayout.header.tagline.color,
            marginTop: `${4 * scale}px`,
            lineHeight: 1
          }}
        >
          {/*{styledLayout.header.tagline.text}*/}
        </div>

        {/* Registration ID Box */}
        {data.registrationId && (
          <div
            className="registration-id-box"
            style={{
              position: 'absolute',
              right: `${8 * scale}px`,
              top: `${8 * scale}px`,
              width: `${60 * scale}px`,
              height: `${30 * scale}px`,
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: `${4 * scale}px`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: `${2 * scale}px`
            }}
          >
            <div
              style={{
                fontSize: `${6 * scale}px`,
                color: '#64748b',
                lineHeight: 1
              }}
            >
              REG ID
            </div>
            <div
              style={{
                fontSize: `${8 * scale}px`,
                fontWeight: 'bold',
                color: styledLayout.border.color,
                lineHeight: 1,
                marginTop: `${2 * scale}px`
              }}
            >
              {data.registrationId.slice(-8).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Event Section */}
      <div
        className="event-section"
        style={{
          marginTop: `${styledLayout.eventSection.marginTop * scale}px`,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between'
        }}
      >
        {/* Event Name and Details */}
        <div
          style={{
            flex: 1,
            paddingRight: showQR && data.qrCodeData ? `${styledLayout.qrSection.marginLeft * scale}px` : '0'
          }}
        >
          {/* Event Name */}
          <div
            style={{
              fontSize: `${styledLayout.eventSection.eventName.fontSize * scale}px`,
              fontWeight: styledLayout.eventSection.eventName.fontWeight,
              color: styledLayout.eventSection.eventName.color,
              lineHeight: 1.2,
              marginBottom: `${8 * scale}px`,
              textAlign: styledLayout.eventSection.eventName.align
            }}
          >
            {data.eventName}
          </div>
        </div>

        {/* QR Code beside Event Name */}
        {showQR && data.qrCodeData && styledLayout.qrSection.position === 'beside-event' && (
          <div
            className="qr-section-beside"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            {/* QR Code Frame */}
            <div
              style={{
                width: `${(styledLayout.qrSection.size + 10) * scale}px`,
                height: `${(styledLayout.qrSection.size + 10) * scale}px`,
                border: `${styledLayout.qrSection.frameWidth * scale}px solid ${styledLayout.qrSection.frameColor}`,
                borderRadius: `${4 * scale}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff'
              }}
            >
              {/* QR Code Placeholder */}
              <div
                style={{
                  width: `${styledLayout.qrSection.size * scale}px`,
                  height: `${styledLayout.qrSection.size * scale}px`,
                  backgroundColor: '#f0f0f0',
                  border: '2px solid #ddd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: `${6 * scale}px`,
                  color: '#666',
                  textAlign: 'center',
                  lineHeight: 1.2
                }}
              >
                QR Code<br/>{data.registrationId?.slice(-4) || 'ID'}
              </div>
            </div>

            {/* QR Instruction */}
            <div
              style={{
                marginTop: `${styledLayout.qrSection.instruction.marginTop * scale}px`,
                fontSize: `${styledLayout.qrSection.instruction.fontSize * scale}px`,
                fontWeight: styledLayout.qrSection.instruction.fontWeight,
                color: styledLayout.qrSection.instruction.color,
                textAlign: styledLayout.qrSection.instruction.align
              }}
            >
              {styledLayout.qrSection.instruction.text}
            </div>
          </div>
        )}
      </div>

      <div style={{ clear: 'both' }}>
        {/* Event Details below event name */}
        <div
          style={{
            textAlign: styledLayout.eventSection.eventName.align
          }}
        >
          {/* Separator Line - REMOVED to fix horizontal line issue */}

          {/* Event Details */}
          <div
            style={{
              fontSize: `${styledLayout.eventSection.eventDetails.date.fontSize * scale}px`,
              color: styledLayout.eventSection.eventDetails.date.color,
              textAlign: styledLayout.eventSection.eventDetails.date.align,
              lineHeight: 1.2,
              marginBottom: `${4 * scale}px`
            }}
          >
            {data.eventDate}
          </div>

          {data.eventVenue && (
            <div
              style={{
                fontSize: `${styledLayout.eventSection.eventDetails.venue.fontSize * scale}px`,
                color: styledLayout.eventSection.eventDetails.venue.color,
                textAlign: styledLayout.eventSection.eventDetails.venue.align,
                lineHeight: 1.2
              }}
            >
              {data.eventVenue}
            </div>
          )}
        </div>
      </div>

      {/* Participant Section */}
      <div
        className="participant-section"
        style={{
          marginTop: `${styledLayout.participantSection.marginTop * scale}px`
        }}
      >
        {/* Participant Label */}
        <div
          style={{
            fontSize: `${styledLayout.participantSection.label.fontSize * scale}px`,
            fontWeight: styledLayout.participantSection.label.fontWeight,
            color: styledLayout.participantSection.label.color,
            textAlign: styledLayout.participantSection.label.align,
            marginBottom: `${styledLayout.participantSection.nameCard.marginTop * scale}px`
          }}
        >
          {styledLayout.participantSection.label.text}
        </div>

        {/* Name Card */}
        <div
          className="name-card"
          style={{
            height: `${styledLayout.participantSection.nameCard.height * scale}px`,
            backgroundColor: styledLayout.participantSection.nameCard.backgroundColor,
            borderRadius: `${styledLayout.participantSection.nameCard.borderRadius * scale}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: `${styledLayout.participantSection.categoryBadge.marginTop * scale}px`
          }}
        >
          <div
            style={{
              fontSize: `${getNameFontSize(`${data.firstName} ${data.lastName}`) * scale}px`,
              fontWeight: styledLayout.participantSection.nameCard.name.fontWeight,
              color: styledLayout.participantSection.nameCard.name.color,
              textAlign: styledLayout.participantSection.nameCard.name.align,
              lineHeight: 1.2
            }}
          >
            {data.firstName} {data.lastName}
          </div>
        </div>

      </div>


      {/* Footer Section */}
      <div
        className="footer-section"
        style={{
          position: 'absolute',
          bottom: `${styledLayout.dimensions.margin * scale}px`,
          left: `${styledLayout.dimensions.margin * scale}px`,
          right: `${styledLayout.dimensions.margin * scale}px`,
          textAlign: 'center'
        }}
      >
        {/* Separator Line - REMOVED to fix horizontal line issue */}

        {/* Footer Instruction */}
        <div
          style={{
            fontSize: `${styledLayout.footer.instruction.fontSize * scale}px`,
            color: styledLayout.footer.instruction.color,
            textAlign: styledLayout.footer.instruction.align,
            lineHeight: 1.2,
            marginBottom: `${styledLayout.footer.branding.marginTop * scale}px`
          }}
        >
          {styledLayout.footer.instruction.text}
        </div>

        {/* Footer Branding */}
        <div
          style={{
            fontSize: `${styledLayout.footer.branding.fontSize * scale}px`,
            color: styledLayout.footer.branding.color,
            textAlign: styledLayout.footer.branding.align,
            lineHeight: 1
          }}
        >
          {styledLayout.footer.branding.text}
        </div>
      </div>
    </div>
  )
}
