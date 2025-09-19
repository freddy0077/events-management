// Centralized Badge System Exports
// This is the single source of truth for all badge-related components and utilities

export {
  CentralizedBadge,
  ProfessionalBadgeVariant,
  MinimalBadgeVariant,
  CompactBadgeVariant,
  BADGE_TEMPLATES,
  BADGE_TYPE_COLORS,
  getTemplateById,
  getTemplateColors,
  getBadgeTypeColors
} from './CentralizedBadgeSystem'

export type {
  BadgeData,
  BadgeTemplateColors,
  BadgeTemplate,
  CentralizedBadgeProps
} from './CentralizedBadgeSystem'

// Legacy exports for backward compatibility (will be deprecated)
export { ProfessionalBadgeDesign, MinimalBadgeDesign } from './ProfessionalBadgeDesign'
export { BadgePreviewCustomizer } from './BadgePreviewCustomizer'
export { BadgePreviewModal } from './BadgePreviewModal'
export { BadgeSheetGenerator } from './BadgeSheetGenerator'

// Re-export from old badge directory for compatibility
export { BadgeTemplate as LegacyBadgeTemplate } from '../badge/badge-template'
