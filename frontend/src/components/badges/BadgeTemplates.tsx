'use client'

import { BadgeData } from './ProfessionalBadgeDesign'

export interface BadgeTemplate {
  id: string
  name: string
  description: string
  category: 'tech' | 'corporate' | 'academic' | 'medical' | 'government' | 'nonprofit' | 'sports' | 'community' | 'social' | 'entertainment'
  preview: string
  defaultData: Partial<BadgeData>
  features: string[]
  recommendedFor: string[]
  colors?: {
    primary: string
    secondary: string
    accent: string
    text: string
    background: string
  }
  styling: {
    primaryColor: string
    secondaryColor: string
    accentColor: string
    textColor: string
    backgroundColor: string
    headerGradient: string
    fontFamily?: string
    borderRadius?: string
  }
}

export const badgeTemplates: BadgeTemplate[] = [
  {
    id: 'festival-fun',
    name: 'Festival Fun',
    description: 'Vibrant, colorful design perfect for music festivals, food festivals, and outdoor events.',
    category: 'entertainment',
    preview: '🎪',
    defaultData: {
      badgeType: 'ATTENDEE',
      accessLevel: ['Main Stage', 'Food Court', 'VIP Area', 'Merchandise'],
      mealPreferences: ['V', 'GF']
    },
    features: [
      'Bright, festive colors',
      'Large readable text',
      'Weather-resistant design',
      'Easy-scan QR code',
      'Fun visual elements'
    ],
    recommendedFor: [
      'Music festivals',
      'Food festivals',
      'Art fairs',
      'Community celebrations'
    ],
    colors: {
      primary: '#FF6B35',
      secondary: '#F7931E',
      accent: '#FFD23F',
      text: '#2C1810',
      background: '#FFF8F0'
    },
    styling: {
      primaryColor: '#FF6B35',
      secondaryColor: '#F7931E',
      accentColor: '#FFD23F',
      textColor: '#FFFFFF',
      backgroundColor: '#FFF8F0',
      headerGradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD23F 100%)',
      fontFamily: 'Arial, sans-serif',
      borderRadius: '12px'
    }
  },
  {
    id: 'wedding-elegant',
    name: 'Wedding Elegant',
    description: 'Sophisticated and romantic design for weddings, receptions, and formal celebrations.',
    category: 'social',
    preview: '💒',
    defaultData: {
      badgeType: 'ATTENDEE',
      accessLevel: ['Ceremony', 'Reception', 'Cocktail Hour', 'Dance Floor'],
      mealPreferences: ['V', 'GF', 'K']
    },
    features: [
      'Elegant typography',
      'Soft color palette',
      'Romantic styling',
      'Guest table assignments',
      'Dietary preference indicators'
    ],
    recommendedFor: [
      'Weddings',
      'Anniversary parties',
      'Formal receptions',
      'Engagement parties'
    ],
    colors: {
      primary: '#D4A574',
      secondary: '#E8C5A0',
      accent: '#F4E4C1',
      text: '#5D4E37',
      background: '#FDF8F3'
    },
    styling: {
      primaryColor: '#D4A574',
      secondaryColor: '#E8C5A0',
      accentColor: '#F4E4C1',
      textColor: '#5D4E37',
      backgroundColor: '#FDF8F3',
      headerGradient: 'linear-gradient(135deg, #D4A574 0%, #E8C5A0 100%)',
      fontFamily: 'Georgia, serif',
      borderRadius: '8px'
    }
  },
  {
    id: 'sports-event',
    name: 'Sports Event',
    description: 'Dynamic, energetic design for sports events, tournaments, and athletic competitions.',
    category: 'sports',
    preview: '⚽',
    defaultData: {
      badgeType: 'ATTENDEE',
      accessLevel: ['Stadium', 'Concessions', 'Team Store', 'VIP Lounge'],
      mealPreferences: []
    },
    features: [
      'Bold, athletic styling',
      'Team color support',
      'Durable design',
      'Clear visibility',
      'Quick identification'
    ],
    recommendedFor: [
      'Sports tournaments',
      'Athletic events',
      'Team competitions',
      'Sports festivals'
    ],
    colors: {
      primary: '#1E88E5',
      secondary: '#42A5F5',
      accent: '#90CAF9',
      text: '#FFFFFF',
      background: '#F3F9FF'
    },
    styling: {
      primaryColor: '#1E88E5',
      secondaryColor: '#42A5F5',
      accentColor: '#90CAF9',
      textColor: '#FFFFFF',
      backgroundColor: '#E3F2FD',
      headerGradient: 'linear-gradient(135deg, #1E88E5 0%, #42A5F5 100%)',
      fontFamily: 'Arial Black, sans-serif',
      borderRadius: '6px'
    }
  },
  {
    id: 'community-gathering',
    name: 'Community Gathering',
    description: 'Warm, welcoming design for community events, meetups, and local gatherings.',
    category: 'community',
    preview: '🤝',
    defaultData: {
      badgeType: 'ATTENDEE',
      accessLevel: ['Main Hall', 'Refreshments', 'Activities', 'Information'],
      mealPreferences: ['V']
    },
    features: [
      'Friendly, approachable design',
      'Clear contact information',
      'Community branding',
      'Accessibility focused',
      'Multi-language support'
    ],
    recommendedFor: [
      'Community meetings',
      'Local events',
      'Neighborhood gatherings',
      'Volunteer events'
    ],
    colors: {
      primary: '#4CAF50',
      secondary: '#66BB6A',
      accent: '#A5D6A7',
      text: '#FFFFFF',
      background: '#E8F5E8'
    },
    styling: {
      primaryColor: '#4CAF50',
      secondaryColor: '#66BB6A',
      accentColor: '#A5D6A7',
      textColor: '#FFFFFF',
      backgroundColor: '#E8F5E9',
      headerGradient: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
      fontFamily: 'Open Sans, sans-serif',
      borderRadius: '8px'
    }
  },
  {
    id: 'birthday-party',
    name: 'Birthday Party',
    description: 'Fun, celebratory design perfect for birthday parties and personal celebrations.',
    category: 'social',
    preview: '🎂',
    defaultData: {
      badgeType: 'ATTENDEE',
      accessLevel: ['Party Area', 'Games', 'Cake Time', 'Photo Booth'],
      mealPreferences: ['V', 'GF']
    },
    features: [
      'Playful, colorful design',
      'Age-appropriate styling',
      'Party theme integration',
      'Fun visual elements',
      'Easy identification'
    ],
    recommendedFor: [
      'Birthday parties',
      'Kids parties',
      'Celebration events',
      'Family gatherings'
    ],
    colors: {
      primary: '#E91E63',
      secondary: '#F06292',
      accent: '#F8BBD9',
      text: '#FFFFFF',
      background: '#FCE4EC'
    },
    styling: {
      primaryColor: '#E91E63',
      secondaryColor: '#F06292',
      accentColor: '#F8BBD9',
      textColor: '#FFFFFF',
      backgroundColor: '#FCE4EC',
      headerGradient: 'linear-gradient(135deg, #E91E63 0%, #F06292 100%)',
      fontFamily: 'Comic Sans MS, cursive',
      borderRadius: '15px'
    }
  },
  {
    id: 'charity-fundraiser',
    name: 'Charity Fundraiser',
    description: 'Professional yet warm design for charity events, fundraisers, and nonprofit gatherings.',
    category: 'nonprofit',
    preview: '❤️',
    defaultData: {
      badgeType: 'ATTENDEE',
      accessLevel: ['Main Event', 'Silent Auction', 'Dinner', 'Networking'],
      mealPreferences: ['V', 'GF']
    },
    features: [
      'Inspiring, hopeful design',
      'Cause-focused branding',
      'Donor recognition levels',
      'Professional appearance',
      'Heart-centered messaging'
    ],
    recommendedFor: [
      'Charity galas',
      'Fundraising events',
      'Nonprofit conferences',
      'Awareness campaigns'
    ],
    styling: {
      primaryColor: '#9C27B0',
      secondaryColor: '#BA68C8',
      accentColor: '#E1BEE7',
      textColor: '#FFFFFF',
      backgroundColor: '#F3E5F5',
      headerGradient: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
      fontFamily: 'Roboto, sans-serif',
      borderRadius: '8px'
    }
  },
  {
    id: 'conference-modern',
    name: 'Modern Conference',
    description: 'Clean, professional design suitable for any type of conference or seminar.',
    category: 'corporate',
    preview: '📋',
    defaultData: {
      badgeType: 'ATTENDEE',
      accessLevel: ['Main Sessions', 'Networking', 'Refreshments', 'Exhibition'],
      mealPreferences: ['V']
    },
    features: [
      'Clean, readable design',
      'Professional appearance',
      'Versatile color scheme',
      'Clear information hierarchy',
      'Universal appeal'
    ],
    recommendedFor: [
      'Business conferences',
      'Professional seminars',
      'Training workshops',
      'Corporate events'
    ],
    colors: {
      primary: '#2C3E50',
      secondary: '#34495E',
      accent: '#3498DB',
      text: '#FFFFFF',
      background: '#ECF0F1'
    },
    styling: {
      primaryColor: '#2C3E50',
      secondaryColor: '#34495E',
      accentColor: '#3498DB',
      textColor: '#FFFFFF',
      backgroundColor: '#ECF0F1',
      headerGradient: 'linear-gradient(135deg, #2C3E50 0%, #34495E 100%)',
      fontFamily: 'Helvetica, Arial, sans-serif',
      borderRadius: '8px'
    }
  },
  {
    id: 'workshop-creative',
    name: 'Creative Workshop',
    description: 'Artistic, inspiring design perfect for workshops, art classes, and creative events.',
    category: 'entertainment',
    preview: '🎨',
    defaultData: {
      badgeType: 'ATTENDEE',
      accessLevel: ['Workshop Space', 'Materials', 'Gallery', 'Lounge'],
      mealPreferences: ['V', 'GF']
    },
    features: [
      'Creative, artistic styling',
      'Inspiring color palette',
      'Flexible design elements',
      'Workshop-focused layout',
      'Artistic flair'
    ],
    recommendedFor: [
      'Art workshops',
      'Creative classes',
      'Design events',
      'Maker spaces'
    ],
    colors: {
      primary: '#8E44AD',
      secondary: '#9B59B6',
      accent: '#F39C12',
      text: '#FFFFFF',
      background: '#F8F9FA'
    },
    styling: {
      primaryColor: '#8E44AD',
      secondaryColor: '#9B59B6',
      accentColor: '#F39C12',
      textColor: '#FFFFFF',
      backgroundColor: '#F8F9FA',
      headerGradient: 'linear-gradient(135deg, #8E44AD 0%, #9B59B6 50%, #F39C12 100%)',
      fontFamily: 'Trebuchet MS, sans-serif',
      borderRadius: '12px'
    }
  },
  {
    id: 'google-io',
    name: 'Google I/O Style',
    description: 'Minimalist design with bold typography and playful colors. Signature Google event style.',
    category: 'tech',
    preview: '🌈',
    defaultData: {
      badgeType: 'ATTENDEE',
      accessLevel: ['Keynote', 'Sessions', 'Sandbox', 'After Hours'],
      mealPreferences: ['V', 'VG']
    },
    features: [
      'Minimal, clean layout',
      'Bold sans-serif typography',
      'Vibrant accent colors',
      'Large QR code',
      'Simple iconography'
    ],
    recommendedFor: [
      'Developer conferences',
      'Innovation summits',
      'Tech workshops',
      'Hackathons'
    ],
    colors: {
      primary: '#4285F4',
      secondary: '#EA4335',
      accent: '#FBBC04',
      text: '#202124',
      background: '#FFFFFF'
    },
    styling: {
      primaryColor: '#4285F4',
      secondaryColor: '#EA4335',
      accentColor: '#FBBC04',
      textColor: '#202124',
      backgroundColor: '#FFFFFF',
      headerGradient: 'linear-gradient(135deg, #4285F4 0%, #EA4335 25%, #FBBC04 50%, #34A853 100%)',
      fontFamily: 'Product Sans, Arial, sans-serif',
      borderRadius: '8px'
    }
  },
  {
    id: 'aws-reinvent',
    name: 'AWS re:Invent Style',
    description: 'Professional design with clear categorization and comprehensive access information.',
    category: 'tech',
    preview: '☁️',
    defaultData: {
      badgeType: 'ATTENDEE',
      accessLevel: ['Keynotes', 'Breakout Sessions', 'Expo', 'Certification Lounge', 'Jam Lounge'],
      mealPreferences: []
    },
    features: [
      'Track-based color coding',
      'Certification indicators',
      'Session access levels',
      'Partner status display',
      'Networking preferences'
    ],
    recommendedFor: [
      'Cloud conferences',
      'Technical training',
      'Certification events',
      'Enterprise summits'
    ],
    colors: {
      primary: '#FF9900',
      secondary: '#232F3E',
      accent: '#146EB4',
      text: '#FFFFFF',
      background: '#F2F3F3'
    },
    styling: {
      primaryColor: '#FF9900',
      secondaryColor: '#232F3E',
      accentColor: '#146EB4',
      textColor: '#FFFFFF',
      backgroundColor: '#F2F3F3',
      headerGradient: 'linear-gradient(135deg, #FF9900 0%, #232F3E 100%)',
      fontFamily: 'Amazon Ember, Arial, sans-serif',
      borderRadius: '6px'
    }
  },
  {
    id: 'salesforce-dreamforce',
    name: 'Dreamforce Style',
    description: 'Vibrant, energetic design with trail-based categorization and community focus.',
    category: 'corporate',
    preview: '☁️',
    defaultData: {
      badgeType: 'ATTENDEE',
      accessLevel: ['Main Keynote', 'Trailblazer Community', 'Demo Stations', 'Customer Success'],
      mealPreferences: ['V']
    },
    features: [
      'Trail/track identification',
      'Community role badges',
      'Certification levels',
      'Sponsor recognition',
      'Social handles display'
    ],
    recommendedFor: [
      'CRM conferences',
      'Sales events',
      'Customer success summits',
      'Community gatherings'
    ],
    colors: {
      primary: '#00A1E0',
      secondary: '#0176D3',
      accent: '#FFB75D',
      text: '#FFFFFF',
      background: '#F3F2F2'
    },
    styling: {
      primaryColor: '#00A1E0',
      secondaryColor: '#0176D3',
      accentColor: '#FFB75D',
      textColor: '#FFFFFF',
      backgroundColor: '#F3F2F2',
      headerGradient: 'linear-gradient(135deg, #00A1E0 0%, #0176D3 100%)',
      fontFamily: 'Salesforce Sans, Arial, sans-serif',
      borderRadius: '8px'
    }
  },
  {
    id: 'apple-wwdc',
    name: 'WWDC Style',
    description: 'Ultra-minimalist design with premium feel. Focus on name and essential information only.',
    category: 'tech',
    preview: '🍎',
    defaultData: {
      badgeType: 'ATTENDEE',
      accessLevel: ['Keynote', 'Sessions', 'Labs', 'Lounges'],
      mealPreferences: []
    },
    features: [
      'Ultra-minimal design',
      'Premium materials look',
      'Subtle gradients',
      'Hidden QR code',
      'Typography focus'
    ],
    recommendedFor: [
      'Product launches',
      'Developer conferences',
      'Design events',
      'Premium experiences'
    ],
    colors: {
      primary: '#000000',
      secondary: '#1D1D1F',
      accent: '#007AFF',
      text: '#FFFFFF',
      background: '#F5F5F7'
    },
    styling: {
      primaryColor: '#000000',
      secondaryColor: '#1D1D1F',
      accentColor: '#007AFF',
      textColor: '#FFFFFF',
      backgroundColor: '#F5F5F7',
      headerGradient: 'linear-gradient(135deg, #000000 0%, #1D1D1F 100%)',
      fontFamily: 'SF Pro Display, -apple-system, sans-serif',
      borderRadius: '12px'
    }
  },
  {
    id: 'ted-talks',
    name: 'TED Conference Style',
    description: 'Bold, inspiring design with speaker-focused layout and thought leadership emphasis.',
    category: 'academic',
    preview: '💡',
    defaultData: {
      badgeType: 'SPEAKER',
      accessLevel: ['Main Stage', 'Speaker Lounge', 'VIP Reception', 'Workshop Rooms'],
      mealPreferences: ['V', 'GF']
    },
    features: [
      'Speaker prominence',
      'Talk title display',
      'Session schedule',
      'Networking QR code',
      'Inspiration quotes'
    ],
    recommendedFor: [
      'Speaking events',
      'Thought leadership',
      'Academic conferences',
      'Innovation forums'
    ],
    colors: {
      primary: '#E62B1E',
      secondary: '#000000',
      accent: '#FFFFFF',
      text: '#FFFFFF',
      background: '#F8F8F8'
    },
    styling: {
      primaryColor: '#E62B1E',
      secondaryColor: '#000000',
      accentColor: '#FFFFFF',
      textColor: '#FFFFFF',
      backgroundColor: '#F8F8F8',
      headerGradient: 'linear-gradient(135deg, #E62B1E 0%, #000000 100%)',
      fontFamily: 'Helvetica Neue, Arial, sans-serif',
      borderRadius: '4px'
    }
  },
  {
    id: 'medical-conference',
    name: 'Medical Conference Style',
    description: 'Professional healthcare design with credential display and CME tracking.',
    category: 'medical',
    preview: '⚕️',
    defaultData: {
      badgeType: 'ATTENDEE',
      accessLevel: ['Clinical Sessions', 'Research Presentations', 'Exhibit Hall', 'CME Activities'],
      mealPreferences: []
    },
    features: [
      'Credential display (MD, PhD, RN)',
      'Specialty identification',
      'CME credit tracking',
      'Institution affiliation',
      'Research interests'
    ],
    recommendedFor: [
      'Medical conferences',
      'Healthcare summits',
      'Research symposiums',
      'Clinical training'
    ],
    colors: {
      primary: '#0066CC',
      secondary: '#004499',
      accent: '#00AA44',
      text: '#FFFFFF',
      background: '#F0F8FF'
    },
    styling: {
      primaryColor: '#0066CC',
      secondaryColor: '#004499',
      accentColor: '#00AA44',
      textColor: '#FFFFFF',
      backgroundColor: '#F0F8FF',
      headerGradient: 'linear-gradient(135deg, #0066CC 0%, #004499 100%)',
      fontFamily: 'Times New Roman, serif',
      borderRadius: '6px'
    }
  },
  {
    id: 'government-summit',
    name: 'Government Summit Style',
    description: 'Formal, secure design with clearance levels and official identification.',
    category: 'government',
    preview: '🏛️',
    defaultData: {
      badgeType: 'ATTENDEE',
      accessLevel: ['Plenary Sessions', 'Classified Briefings', 'Networking Reception'],
      mealPreferences: []
    },
    features: [
      'Security clearance level',
      'Agency affiliation',
      'Access restrictions',
      'Photo ID integration',
      'Barcode tracking'
    ],
    recommendedFor: [
      'Government conferences',
      'Policy summits',
      'Security briefings',
      'Agency meetings'
    ],
    colors: {
      primary: '#002868',
      secondary: '#BF0A30',
      accent: '#FFFFFF',
      text: '#FFFFFF',
      background: '#F5F5F5'
    },
    styling: {
      primaryColor: '#002868',
      secondaryColor: '#BF0A30',
      accentColor: '#FFFFFF',
      textColor: '#FFFFFF',
      backgroundColor: '#F5F5F5',
      headerGradient: 'linear-gradient(135deg, #002868 0%, #BF0A30 100%)',
      fontFamily: 'Arial, sans-serif',
      borderRadius: '4px'
    }
  },
  {
    id: 'startup-summit',
    name: 'Startup Summit Style',
    description: 'Dynamic, modern design perfect for startup events and pitch competitions.',
    category: 'corporate',
    preview: '🚀',
    defaultData: {
      badgeType: 'ATTENDEE',
      accessLevel: ['Pitch Stage', 'Investor Lounge', 'Startup Expo', 'Networking'],
      mealPreferences: ['V']
    },
    features: [
      'Role identification (Founder, Investor, Mentor)',
      'Company stage display',
      'Investment interests',
      'LinkedIn QR code',
      'Meeting scheduler integration'
    ],
    recommendedFor: [
      'Startup events',
      'Pitch competitions',
      'Investor meetings',
      'Accelerator programs'
    ],
    colors: {
      primary: '#FF6B35',
      secondary: '#F7931E',
      accent: '#4ECDC4',
      text: '#FFFFFF',
      background: '#FAFAFA'
    },
    styling: {
      primaryColor: '#FF6B35',
      secondaryColor: '#F7931E',
      accentColor: '#4ECDC4',
      textColor: '#FFFFFF',
      backgroundColor: '#FAFAFA',
      headerGradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #4ECDC4 100%)',
      fontFamily: 'Montserrat, Arial, sans-serif',
      borderRadius: '10px'
    }
  },
  {
    id: 'academic-research',
    name: 'Academic Research Style',
    description: 'Scholarly design with research focus and academic credentials.',
    category: 'academic',
    preview: '🎓',
    defaultData: {
      badgeType: 'SPEAKER',
      accessLevel: ['Keynotes', 'Paper Sessions', 'Poster Hall', 'Faculty Reception'],
      mealPreferences: ['V']
    },
    features: [
      'Academic title display',
      'Research area tags',
      'Paper/poster number',
      'Institution logo',
      'ORCID integration'
    ],
    recommendedFor: [
      'Academic conferences',
      'Research symposiums',
      'University events',
      'Scientific meetings'
    ],
    colors: {
      primary: '#8B4513',
      secondary: '#A0522D',
      accent: '#DAA520',
      text: '#FFFFFF',
      background: '#FDF5E6'
    },
    styling: {
      primaryColor: '#8B4513',
      secondaryColor: '#A0522D',
      accentColor: '#DAA520',
      textColor: '#FFFFFF',
      backgroundColor: '#FDF5E6',
      headerGradient: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
      fontFamily: 'Georgia, serif',
      borderRadius: '8px'
    }
  },
  {
    id: 'nonprofit-gala',
    name: 'Nonprofit Gala Style',
    description: 'Elegant design for fundraising events and charity galas.',
    category: 'nonprofit',
    preview: '❤️',
    defaultData: {
      badgeType: 'VIP',
      accessLevel: ['Cocktail Reception', 'Dinner', 'Auction', 'VIP Lounge'],
      mealPreferences: ['V', 'GF', 'K']
    },
    features: [
      'Donor level recognition',
      'Table assignment',
      'Auction paddle number',
      'Dietary preferences',
      'Special recognition badges'
    ],
    recommendedFor: [
      'Fundraising galas',
      'Charity events',
      'Donor appreciation',
      'Award ceremonies'
    ],
    colors: {
      primary: '#DC143C',
      secondary: '#B22222',
      accent: '#FFD700',
      text: '#FFFFFF',
      background: '#FFF8DC'
    },
    styling: {
      primaryColor: '#DC143C',
      secondaryColor: '#B22222',
      accentColor: '#FFD700',
      textColor: '#FFFFFF',
      backgroundColor: '#FFF8DC',
      headerGradient: 'linear-gradient(135deg, #DC143C 0%, #B22222 100%)',
      fontFamily: 'Playfair Display, serif',
      borderRadius: '12px'
    }
  },
  {
    id: 'trade-show',
    name: 'Trade Show Style',
    description: 'Bold, scannable design optimized for exhibitor and attendee interaction.',
    category: 'corporate',
    preview: '🏢',
    defaultData: {
      badgeType: 'ATTENDEE',
      accessLevel: ['Exhibit Hall', 'Conference Sessions', 'Networking Events'],
      mealPreferences: []
    },
    features: [
      'Large company name',
      'Buyer/Exhibitor status',
      'Product interests',
      'Lead scanning QR',
      'Appointment scheduler'
    ],
    recommendedFor: [
      'Trade shows',
      'Industry expos',
      'B2B events',
      'Product showcases'
    ],
    colors: {
      primary: '#2E86AB',
      secondary: '#A23B72',
      accent: '#F18F01',
      text: '#FFFFFF',
      background: '#F5F5F5'
    },
    styling: {
      primaryColor: '#2E86AB',
      secondaryColor: '#A23B72',
      accentColor: '#F18F01',
      textColor: '#FFFFFF',
      backgroundColor: '#F5F5F5',
      headerGradient: 'linear-gradient(135deg, #2E86AB 0%, #A23B72 100%)',
      fontFamily: 'Roboto, Arial, sans-serif',
      borderRadius: '6px'
    }
  }
]

// Template categories with descriptions
export const templateCategories = {
  entertainment: {
    name: 'Entertainment',
    description: 'Vibrant designs for festivals, concerts, and entertainment events',
    icon: '🎪'
  },
  social: {
    name: 'Social Events',
    description: 'Elegant designs for weddings, parties, and personal celebrations',
    icon: '🎉'
  },
  sports: {
    name: 'Sports & Recreation',
    description: 'Dynamic designs for sports events, tournaments, and athletic competitions',
    icon: '⚽'
  },
  community: {
    name: 'Community',
    description: 'Welcoming designs for local gatherings, meetups, and community events',
    icon: '🤝'
  },
  nonprofit: {
    name: 'Nonprofit',
    description: 'Professional designs for charity events, fundraisers, and awareness campaigns',
    icon: '❤️'
  },
  tech: {
    name: 'Technology',
    description: 'Modern designs for tech conferences, developer events, and product launches',
    icon: '💻'
  },
  corporate: {
    name: 'Corporate',
    description: 'Professional designs for business events, trade shows, and corporate summits',
    icon: '🏢'
  },
  academic: {
    name: 'Academic',
    description: 'Scholarly designs for research conferences, university events, and symposiums',
    icon: '🎓'
  }
}

// Helper function to get template by ID
export const getTemplateById = (id: string): BadgeTemplate | undefined => {
  return badgeTemplates.find(template => template.id === id)
}

// Helper function to get templates by category
export const getTemplatesByCategory = (category: string): BadgeTemplate[] => {
  return badgeTemplates.filter(template => template.category === category)
}

// Helper function to apply template to badge data
export const applyTemplate = (templateId: string, currentData: Partial<BadgeData>): Partial<BadgeData> => {
  const template = getTemplateById(templateId)
  if (!template) return currentData
  
  return {
    ...currentData,
    ...template.defaultData,
    // Preserve personal information
    firstName: currentData.firstName,
    lastName: currentData.lastName,
    email: currentData.email,
    title: currentData.title,
    company: currentData.company,
    registrationId: currentData.registrationId,
    qrCodeData: currentData.qrCodeData
  }
}

// Color schemes for different badge types
export const badgeColorSchemes = {
  ATTENDEE: {
    primary: '#2196F3',
    secondary: '#E3F2FD',
    accent: '#1565C0'
  },
  SPEAKER: {
    primary: '#9C27B0',
    secondary: '#F3E5F5',
    accent: '#6A1B9A'
  },
  VIP: {
    primary: '#FF9800',
    secondary: '#FFF3E0',
    accent: '#E65100'
  },
  STAFF: {
    primary: '#4CAF50',
    secondary: '#E8F5E9',
    accent: '#2E7D32'
  },
  ORGANIZER: {
    primary: '#E91E63',
    secondary: '#FCE4EC',
    accent: '#C2185B'
  },
  SPONSOR: {
    primary: '#FFC107',
    secondary: '#FFFDE7',
    accent: '#F57C00'
  },
  MEDIA: {
    primary: '#673AB7',
    secondary: '#F3E5F5',
    accent: '#4527A0'
  }
}

// Badge size specifications
export const badgeSizes = {
  standard: {
    width: 3.5,
    height: 5.5,
    unit: 'in',
    pixels: { width: 336, height: 528 }
  },
  large: {
    width: 4,
    height: 6,
    unit: 'in',
    pixels: { width: 384, height: 576 }
  },
  compact: {
    width: 3,
    height: 4,
    unit: 'in',
    pixels: { width: 288, height: 384 }
  },
  square: {
    width: 4,
    height: 4,
    unit: 'in',
    pixels: { width: 384, height: 384 }
  }
}
