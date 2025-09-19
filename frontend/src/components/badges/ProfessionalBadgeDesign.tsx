'use client'

import React from 'react'
import { CentralizedBadge, BadgeData as CentralizedBadgeData, BadgeTemplateColors } from './CentralizedBadgeSystem'

// Re-export BadgeData from centralized system for backward compatibility
export type BadgeData = CentralizedBadgeData

export interface BadgeDesignProps {
  data: BadgeData
  variant?: 'standard' | 'minimal' | 'premium'
  size?: 'standard' | 'large'
  colorScheme?: 'default' | 'dark' | 'vibrant'
  templateId?: string
}

// Wrapper components for backward compatibility that use the centralized system
export const ProfessionalBadgeDesign: React.FC<BadgeDesignProps> = ({ data, templateId, size }) => {
  return (
    <CentralizedBadge 
      data={data} 
      variant="professional" 
      size={size === 'large' ? 'large' : 'medium'}
    />
  )
}

export const MinimalBadgeDesign: React.FC<BadgeDesignProps> = ({ data, templateId, size }) => {
  return (
    <CentralizedBadge 
      data={data} 
      variant="minimal" 
      size={size === 'large' ? 'large' : 'medium'}
    />
  )
}

// HTML rendering function for backward compatibility that uses centralized system
export const renderBadgeToHTML = (data: BadgeData, variant: 'standard' | 'minimal' = 'standard', templateId?: string): string => {
  // Map variant to centralized system variants
  const badgeVariant = variant === 'minimal' ? 'minimal' : 'professional'
  
  // Generate HTML structure that matches our centralized badge system
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Badge - ${data.firstName} ${data.lastName}</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f5f5;
    }
    .badge-container {
      width: 350px;
      height: 550px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 20px;
      box-sizing: border-box;
      margin: 0 auto;
    }
    .badge-header {
      background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%);
      color: white;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 20px;
    }
    .event-name {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .event-date {
      font-size: 12px;
      opacity: 0.9;
    }
    .participant-info {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .name-section {
      flex: 1;
    }
    .participant-name {
      font-size: 24px;
      font-weight: 700;
      color: #1976D2;
      margin-bottom: 8px;
      line-height: 1.2;
    }
    .participant-title {
      font-size: 14px;
      color: #666;
      margin-bottom: 4px;
    }
    .participant-company {
      font-size: 14px;
      color: #888;
      font-weight: 500;
    }
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: white;
      border-radius: 8px;
      border: 1px solid #E0E0E0;
      padding: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .qr-placeholder {
      width: 80px;
      height: 80px;
      background: #f0f0f0;
      border: 2px solid #ddd;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #666;
      text-align: center;
    }
    .registration-id {
      margin-top: 6px;
      font-size: 8px;
      color: #888;
      text-align: center;
      letter-spacing: 0.3px;
    }
    .badge-type {
      background: #E3F2FD;
      color: #1976D2;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-align: center;
      margin: 16px 0;
    }
    .access-info {
      background: #F8F9FA;
      border-radius: 8px;
      padding: 12px;
      margin-top: 16px;
    }
    .access-title {
      font-size: 12px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }
    .access-list {
      font-size: 10px;
      color: #666;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="badge-container">
    <div class="badge-header">
      <div class="event-name">${data.eventName || 'Event Name'}</div>
      <div class="event-date">${data.eventDate || 'Event Date'}</div>
    </div>
    
    <div class="participant-info">
      <div class="name-section">
        <div class="participant-name">${data.firstName} ${data.lastName}</div>
        ${data.title ? `<div class="participant-title">${data.title}</div>` : ''}
        ${data.company ? `<div class="participant-company">${data.company}</div>` : ''}
      </div>
      
      <div class="qr-section">
        <div class="qr-placeholder">
          QR Code\n${data.registrationId || 'ID'}
        </div>
        <div class="registration-id">ID: ${data.registrationId || 'N/A'}</div>
      </div>
    </div>
    
    <div class="badge-type">
      ${data.badgeType || 'ATTENDEE'} ${data.category ? `- ${data.category}` : ''}
    </div>
    
    ${data.accessLevel && data.accessLevel.length > 0 ? `
    <div class="access-info">
      <div class="access-title">Access Areas</div>
      <div class="access-list">${data.accessLevel.join(' • ')}</div>
    </div>` : ''}
    
    ${data.mealPreferences && data.mealPreferences.length > 0 ? `
    <div class="access-info">
      <div class="access-title">Meal Preferences</div>
      <div class="access-list">${data.mealPreferences.join(', ')}</div>
    </div>` : ''}
  </div>
</body>
</html>`
  
  return html
}

// All badge rendering is now handled by the CentralizedBadge component
// This file serves as a backward compatibility wrapper
