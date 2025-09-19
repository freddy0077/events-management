/**
 * Centralized Badge Template System - Backend
 * 
 * This file mirrors the frontend centralized template system to ensure
 * consistent badge rendering between frontend previews and backend PDF generation.
 */

export interface BadgeTemplateLayout {
  id: string
  name: string
  description: string
  category: string
  
  // Layout Structure
  dimensions: {
    width: number
    height: number
    margin: number
  }
  
  // Header Section
  header: {
    height: number
    backgroundColor: string
    borderRadius: number
    branding: {
      fontSize: number
      fontWeight: string
      color: string
      text: string
    }
    tagline: {
      fontSize: number
      color: string
      text: string
    }
  }
  
  // Event Section
  eventSection: {
    marginTop: number
    eventName: {
      fontSize: number
      fontWeight: string
      color: string
      align: 'left' | 'center' | 'right'
    }
    separator: {
      color: string
      width: number
      marginTop: number
      marginBottom: number
    }
    eventDetails: {
      date: {
        fontSize: number
        color: string
        align: 'left' | 'center' | 'right'
      }
      venue: {
        fontSize: number
        color: string
        align: 'left' | 'center' | 'right'
      }
    }
  }
  
  // Participant Section
  participantSection: {
    marginTop: number
    label: {
      fontSize: number
      fontWeight: string
      color: string
      text: string
      align: 'left' | 'center' | 'right'
    }
    nameCard: {
      marginTop: number
      height: number
      backgroundColor: string
      borderRadius: number
      name: {
        fontSize: number
        fontWeight: string
        color: string
        align: 'left' | 'center' | 'right'
      }
    }
    categoryBadge: {
      marginTop: number
      backgroundColor: string
      borderColor: string
      borderWidth: number
      borderRadius: number
      padding: number
      fontSize: number
      fontWeight: string
      color: string
      align: 'left' | 'center' | 'right'
    }
  }
  
  // QR Code Section (positioned beside event name or as separate section)
  qrSection: {
    position: 'beside-event' | 'separate-section'
    size: number
    frameColor: string
    frameWidth: number
    marginLeft: number
    marginTop?: number // For separate-section positioning
    instruction: {
      marginTop: number
      fontSize: number
      fontWeight: string
      color: string
      text: string
      align: 'left' | 'center' | 'right'
    }
  }
  
  // Footer Section
  footer: {
    marginTop: number
    separator: {
      color: string
      width: number
      marginBottom: number
    }
    instruction: {
      fontSize: number
      color: string
      text: string
      align: 'left' | 'center' | 'right'
    }
    branding: {
      marginTop: number
      fontSize: number
      color: string
      text: string
      align: 'left' | 'center' | 'right'
    }
  }
  
  // Border and Background
  border: {
    color: string
    width: number
    borderRadius: number
  }
  
  backgroundColor: string
}

// Professional Template (matches current backend implementation)
export const professionalTemplate: BadgeTemplateLayout = {
  id: 'professional',
  name: 'Professional',
  description: 'Clean, professional design suitable for corporate events',
  category: 'Business',
  
  dimensions: {
    width: 284,  // A6 width: 100mm = 284 points at 72 DPI
    height: 383, // A6 height: 135mm = 383 points at 72 DPI
    margin: 16   // Slightly reduced margin for A6
  },
  
  header: {
    height: 60,  // Reduced from 70 to fit A6 height better
    backgroundColor: '#1e293b', // Will be overridden by template colors
    borderRadius: 6,
    branding: {
      fontSize: 22, // Reduced from 26 to fit A6 width better
      fontWeight: 'bold',
      color: '#ffffff',
      text: 'EventReg'
    },
    tagline: {
      fontSize: 7,  // Reduced from 8 for better fit
      color: '#cbd5e1',
      text: 'PROFESSIONAL EVENT MANAGEMENT'
    }
  },
  
  eventSection: {
    marginTop: 12, // Reduced from 15 to optimize vertical space
    eventName: {
      fontSize: 16, // Reduced from 18 to fit A6 width better
      fontWeight: 'bold',
      color: '#334155', // Will be overridden by template colors
      align: 'center'
    },
    separator: {
      color: '#475569', // Will be overridden by template colors
      width: 2,
      marginTop: 25, // Reduced from 30 to optimize spacing
      marginBottom: 12 // Reduced from 15 to optimize spacing
    },
    eventDetails: {
      date: {
        fontSize: 9,  // Reduced from 10 for better fit
        color: '#475569',
        align: 'center'
      },
      venue: {
        fontSize: 8,  // Reduced from 9 for better fit
        color: '#64748b',
        align: 'center'
      }
    }
  },
  
  participantSection: {
    marginTop: 32, // Reduced from 40 to optimize vertical space
    label: {
      fontSize: 8,  // Reduced from 9 for better proportions
      fontWeight: 'bold',
      color: '#94a3b8',
      text: 'PARTICIPANT',
      align: 'center'
    },
    nameCard: {
      marginTop: 16, // Reduced from 20 to optimize spacing
      height: 44,    // Reduced from 50 to fit A6 better
      backgroundColor: '#334155', // Will be overridden by template colors
      borderRadius: 6,
      name: {
        fontSize: 16, // Reduced from 18 to fit A6 width better
        fontWeight: 'bold',
        color: '#ffffff',
        align: 'center'
      }
    },
    categoryBadge: {
      marginTop: 7,  // Reduced from 8 to optimize spacing
      backgroundColor: '#ffffff',
      borderColor: '#475569', // Will be overridden by template colors
      borderWidth: 1,
      borderRadius: 6, // Reduced from 8 for better proportions
      padding: 8,      // Reduced from 10 for better fit
      fontSize: 7,     // Reduced from 8 for better fit
      fontWeight: 'bold',
      color: '#475569', // Will be overridden by template colors
      align: 'center'
    }
  },
  
  qrSection: {
    position: 'separate-section',
    size: 60,      // Increased back to 60 for better visibility in separate section
    frameColor: '#1e293b', // Will be overridden by template colors
    frameWidth: 2,
    marginLeft: 0,  // No margin needed for separate section
    marginTop: 16,  // Add margin for separate section positioning
    instruction: {
      marginTop: 6,  // Increased for better spacing in separate section
      fontSize: 7,   // Increased back to 7 for better readability
      fontWeight: 'bold',
      color: '#64748b',
      text: 'SCAN TO CHECK-IN',
      align: 'center'
    }
  },
  
  footer: {
    marginTop: 24, // Reduced from 30 to optimize vertical space
    separator: {
      color: '#cbd5e1',
      width: 0.5,
      marginBottom: 6 // Reduced from 8 to optimize spacing
    },
    instruction: {
      fontSize: 6,   // Reduced from 7 for better fit
      color: '#64748b',
      text: '',
      align: 'center'
    },
    branding: {
      marginTop: 10, // Reduced from 12 to optimize spacing
      fontSize: 5,   // Reduced from 6 for better fit
      color: '#94a3b8',
      text: '',
      align: 'center'
    }
  },
  
  border: {
    color: '#1e293b', // Will be overridden by template colors
    width: 2,
    borderRadius: 8
  },
  
  backgroundColor: '#ffffff'
}

// Template Registry
export const badgeTemplateLayouts: Record<string, BadgeTemplateLayout> = {
  professional: professionalTemplate
}

// Helper function to get template layout by ID
export function getTemplateLayout(templateId: string): BadgeTemplateLayout {
  return badgeTemplateLayouts[templateId] || professionalTemplate
}

// Helper function to apply template colors to layout
export function applyTemplateColors(
  layout: BadgeTemplateLayout, 
  colors: { primary: string; secondary: string; accent: string }
): BadgeTemplateLayout {
  return {
    ...layout,
    header: {
      ...layout.header,
      backgroundColor: colors.primary
    },
    eventSection: {
      ...layout.eventSection,
      eventName: {
        ...layout.eventSection.eventName,
        color: colors.secondary
      },
      separator: {
        ...layout.eventSection.separator,
        color: colors.accent
      }
    },
    participantSection: {
      ...layout.participantSection,
      nameCard: {
        ...layout.participantSection.nameCard,
        backgroundColor: colors.secondary
      },
      categoryBadge: {
        ...layout.participantSection.categoryBadge,
        borderColor: colors.accent,
        color: colors.accent
      }
    },
    qrSection: {
      ...layout.qrSection,
      frameColor: colors.primary
    },
    border: {
      ...layout.border,
      color: colors.primary
    }
  }
}

// Helper function to get text alignment for PDFKit
export function getPDFAlignment(align: 'left' | 'center' | 'right'): 'left' | 'center' | 'right' {
  return align
}

// Helper function to get font weight for PDFKit
export function getPDFFont(fontWeight: string): string {
  switch (fontWeight) {
    case 'bold':
      return 'Helvetica-Bold'
    case 'normal':
    default:
      return 'Helvetica'
  }
}
