/**
 * Application configuration utilities
 * Centralizes access to environment variables and app settings
 */

export const APP_CONFIG = {
  // Application Identity
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Event Registration System',
  shortName: process.env.NEXT_PUBLIC_APP_SHORT_NAME || 'EventReg',
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Comprehensive event registration and meal attendance system',
  
  // API Configuration
  graphqlUrl: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3001/graphql',
  graphqlWsUrl: process.env.NEXT_PUBLIC_GRAPHQL_WS_URL || 'ws://localhost:3001/graphql',
  
  // Features
  enablePWA: process.env.NEXT_PUBLIC_ENABLE_PWA === 'true',
  enableOffline: process.env.NEXT_PUBLIC_ENABLE_OFFLINE === 'true',
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableQRScanner: process.env.NEXT_PUBLIC_ENABLE_QR_SCANNER === 'true',
} as const

/**
 * Get the application name
 */
export const getAppName = () => APP_CONFIG.name

/**
 * Get the application short name (for display in limited space)
 */
export const getAppShortName = () => APP_CONFIG.shortName

/**
 * Get the application description
 */
export const getAppDescription = () => APP_CONFIG.description

/**
 * Get the application version
 */
export const getAppVersion = () => APP_CONFIG.version
