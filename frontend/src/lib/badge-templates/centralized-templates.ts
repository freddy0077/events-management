/**
 * Centralized Badge Template System
 * 
 * This file defines the actual badge layout structure and styling that should be used
 * consistently across both frontend previews and backend PDF generation.
 * 
 * Each template defines:
 * - Layout structure (header, sections, positioning)
 * - Typography (fonts, sizes, weights)
 * - Colors (primary, secondary, accent)
 * - Spacing and dimensions
 * - Visual elements (borders, backgrounds, etc.)
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
  
  // QR Code Section (positioned beside event name)
  qrSection: {
    position: 'beside-event' | 'separate-section'
    size: number
    frameColor: string
    frameWidth: number
    marginLeft: number
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
    position: 'beside-event',
    size: 52,      // Reduced from 60 to fit A6 width better
    frameColor: '#1e293b', // Will be overridden by template colors
    frameWidth: 2,
    marginLeft: 12, // Reduced from 15 to optimize spacing
    instruction: {
      marginTop: 4,  // Reduced from 5 to optimize spacing
      fontSize: 6,   // Reduced from 7 for better fit
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
      text: 'Present this badge for event entry and services',
      align: 'center'
    },
    branding: {
      marginTop: 10, // Reduced from 12 to optimize spacing
      fontSize: 5,   // Reduced from 6 for better fit
      color: '#94a3b8',
      text: 'Powered by EventReg Professional',
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

// Minimal Template
export const minimalTemplate: BadgeTemplateLayout = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Clean, minimal design with focus on essential information',
  category: 'Simple',
  
  dimensions: {
    width: 284,  // A6 width: 100mm = 284 points at 72 DPI
    height: 383, // A6 height: 135mm = 383 points at 72 DPI
    margin: 16   // Slightly reduced margin for A6
  },
  
  header: {
    height: 44,  // Reduced from 50 to fit A6 height better
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    branding: {
      fontSize: 18, // Reduced from 20 to fit A6 width better
      fontWeight: 'normal',
      color: '#334155',
      text: 'EventReg'
    },
    tagline: {
      fontSize: 6,  // Reduced from 7 for better fit
      color: '#64748b',
      text: 'EVENT MANAGEMENT'
    }
  },
  
  eventSection: {
    marginTop: 16, // Reduced from 20 to optimize vertical space
    eventName: {
      fontSize: 14, // Reduced from 16 to fit A6 width better
      fontWeight: 'bold',
      color: '#1e293b',
      align: 'center'
    },
    separator: {
      color: '#e2e8f0',
      width: 1,
      marginTop: 16, // Reduced from 20 to optimize spacing
      marginBottom: 12 // Reduced from 15 to optimize spacing
    },
    eventDetails: {
      date: {
        fontSize: 8,  // Reduced from 9 for better fit
        color: '#64748b',
        align: 'center'
      },
      venue: {
        fontSize: 7,  // Reduced from 8 for better fit
        color: '#94a3b8',
        align: 'center'
      }
    }
  },
  
  participantSection: {
    marginTop: 28, // Reduced from 35 to optimize vertical space
    label: {
      fontSize: 7,  // Reduced from 8 for better proportions
      fontWeight: 'normal',
      color: '#94a3b8',
      text: 'PARTICIPANT',
      align: 'center'
    },
    nameCard: {
      marginTop: 12, // Reduced from 15 to optimize spacing
      height: 36,    // Reduced from 40 to fit A6 better
      backgroundColor: '#ffffff',
      borderRadius: 4,
      name: {
        fontSize: 14, // Reduced from 16 to fit A6 width better
        fontWeight: 'bold',
        color: '#1e293b',
        align: 'center'
      }
    },
    categoryBadge: {
      marginTop: 8,  // Reduced from 10 to optimize spacing
      backgroundColor: '#f1f5f9',
      borderColor: '#cbd5e1',
      borderWidth: 1,
      borderRadius: 4,
      padding: 6,    // Reduced from 8 for better fit
      fontSize: 6,   // Reduced from 7 for better fit
      fontWeight: 'normal',
      color: '#475569',
      align: 'center'
    }
  },
  
  qrSection: {
    position: 'separate-section',
    marginTop: 20, // Reduced from 25 to optimize vertical space
    size: 52,      // Reduced from 60 to fit A6 width better
    frameColor: '#e2e8f0',
    frameWidth: 1,
    instruction: {
      marginTop: 6,  // Reduced from 8 to optimize spacing
      fontSize: 6,   // Reduced from 7 for better fit
      fontWeight: 'normal',
      color: '#64748b',
      text: 'SCAN TO CHECK-IN',
      align: 'center'
    }
  },
  
  footer: {
    marginTop: 20, // Reduced from 25 to optimize vertical space
    separator: {
      color: '#f1f5f9',
      width: 0.5,
      marginBottom: 5 // Reduced from 6 to optimize spacing
    },
    instruction: {
      fontSize: 5,   // Reduced from 6 for better fit
      color: '#94a3b8',
      text: 'Present this badge for event access',
      align: 'center'
    },
    branding: {
      marginTop: 6,  // Reduced from 8 to optimize spacing
      fontSize: 4,   // Reduced from 5 for better fit
      color: '#cbd5e1',
      text: 'EventReg',
      align: 'center'
    }
  },
  
  border: {
    color: '#e2e8f0',
    width: 1,
    borderRadius: 4
  },
  
  backgroundColor: '#ffffff'
}

// Template Registry
export const badgeTemplateLayouts: Record<string, BadgeTemplateLayout> = {
  professional: professionalTemplate,
  minimal: minimalTemplate
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
