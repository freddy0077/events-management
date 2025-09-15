/**
 * Role-based routing utilities for the internal staff management system
 * Updated to match stakeholder requirements
 */

export type UserRole = 'EVENT_ORGANIZER' | 'REGISTRATION_STAFF' | 'FINANCE_TEAM' | 'CATERING_TEAM' | 'ADMIN'

export interface RoleDashboard {
  path: string
  name: string
  description: string
}

/**
 * Get the appropriate dashboard path based on user role
 */
export function getRoleDashboardPath(role: UserRole): string {
  switch (role) {
    case 'EVENT_ORGANIZER':
      return '/organizer/dashboard'
    case 'REGISTRATION_STAFF':
      return '/staff/dashboard'
    case 'FINANCE_TEAM':
      return '/admin/finance'
    case 'CATERING_TEAM':
      return '/admin/catering'
    case 'ADMIN':
      return '/admin'
    default:
      return '/admin/registration'
  }
}

/**
 * Get dashboard information for a specific role
 */
export function getRoleDashboard(role: UserRole): RoleDashboard {
  switch (role) {
    case 'ADMIN':
      return {
        path: '/admin',
        name: 'System Administrator Dashboard',
        description: 'Full system control, event creation, and event manager assignments'
      }
    case 'EVENT_ORGANIZER':
      return {
        path: '/organizer/dashboard',
        name: 'Event Organizer Portal',
        description: 'Manage assigned events, oversee operations, and coordinate event staff'
      }
    case 'REGISTRATION_STAFF':
      return {
        path: '/staff/dashboard',
        name: 'Registration Staff Portal',
        description: 'Register participants, process payments, and print QR name tags'
      }
    case 'FINANCE_TEAM':
      return {
        path: '/admin/finance',
        name: 'Finance Team Dashboard',
        description: 'Monitor and reconcile payments, financial reporting'
      }
    case 'CATERING_TEAM':
      return {
        path: '/admin/catering',
        name: 'Catering Team Portal',
        description: 'Verify meal eligibility via QR scans and manage food service'
      }
    default:
      return {
        path: '/admin/registration',
        name: 'Staff Portal',
        description: 'Basic staff access'
      }
  }
}

/**
 * Check if a user has access to a specific path based on their role
 */
export function hasAccessToPath(userRole: UserRole, path: string): boolean {
  const rolePermissions = {
    ADMIN: [
      '/admin',
      '/admin/events',
      '/admin/organizer',
      '/admin/registration',
      '/admin/finance',
      '/admin/catering',
      '/admin/staff',
      '/admin/reports',
      '/admin/audit-logs',
      '/admin/settings'
    ],
    EVENT_ORGANIZER: [
      '/organizer',
      '/organizer/dashboard',
      '/organizer/events',
      '/organizer/registrations',
      '/organizer/staff',
      '/organizer/reports',
      '/organizer/scanner'
    ],
    REGISTRATION_STAFF: [
      '/staff',
      '/staff/dashboard',
      '/staff/events',
      '/staff/registrations',
      '/staff/payments',
      '/staff/scanner',
      '/staff/badges'
    ],
    FINANCE_TEAM: [
      '/admin/finance',
      '/admin/reports'
    ],
    CATERING_TEAM: [
      '/admin/catering'
    ]
  }

  const allowedPaths = rolePermissions[userRole] || []
  
  // Check exact match or if the path starts with an allowed path
  return allowedPaths.some(allowedPath => 
    path === allowedPath || path.startsWith(allowedPath + '/')
  )
}

/**
 * Get welcome message based on user role
 */
export function getRoleWelcomeMessage(role: UserRole, firstName?: string): string {
  const name = firstName ? ` ${firstName}` : ''
  
  switch (role) {
    case 'ADMIN':
      return `Welcome back${name}! You have full system administrator access to create events and manage all operations.`
    case 'EVENT_ORGANIZER':
      return `Welcome back${name}! You can manage your assigned events and coordinate all event staff activities.`
    case 'REGISTRATION_STAFF':
      return `Welcome back${name}! You can register participants, process payments, and print QR name tags.`
    case 'FINANCE_TEAM':
      return `Welcome back${name}! You can monitor payments and reconcile financial transactions.`
    case 'CATERING_TEAM':
      return `Welcome back${name}! You can verify meal eligibility and manage food service operations.`
    default:
      return `Welcome back${name}! Access your staff portal to manage event operations.`
  }
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return 'System Administrator'
    case 'EVENT_ORGANIZER':
      return 'Event Manager'
    case 'REGISTRATION_STAFF':
      return 'Registration Staff'
    case 'FINANCE_TEAM':
      return 'Finance Team'
    case 'CATERING_TEAM':
      return 'Catering Team'
    default:
      return 'Staff Member'
  }
}
