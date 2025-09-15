# Sidebar Menu Role-Based Access Control (RBAC)

This document outlines the role-based access control system for the Event Registration System's admin sidebar navigation. The sidebar dynamically displays menu items based on the authenticated user's role.

## User Roles

The system supports five distinct user roles, each with specific permissions and access levels:

- **ADMIN** - Full system access and administrative privileges
- **EVENT_ORGANIZER** - Event management and oversight capabilities
- **REGISTRATION_STAFF** - Participant registration and check-in operations
- **FINANCE_TEAM** - Financial tracking and payment management
- **CATERING_TEAM** - Meal service and catering operations

## Menu Structure Overview

The sidebar is organized into five main sections:

1. **Main** - Core dashboard and overview
2. **Event Management** - Event creation and management
3. **Operations** - Day-to-day operational tasks
4. **Management** - Administrative and team management
5. **Analytics** - Reports, insights, and audit logs

## Role-Based Menu Access Matrix

### 📊 Complete Access Matrix

| Menu Item | Section | ADMIN | EVENT_ORGANIZER | REGISTRATION_STAFF | FINANCE_TEAM | CATERING_TEAM |
|-----------|---------|-------|-----------------|-------------------|--------------|---------------|
| Dashboard | Main | ✅ | ✅ | ✅ | ✅ | ✅ |
| Events | Event Management | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Event | Event Management | ✅ | ✅ | ❌ | ❌ | ❌ |
| Registrations | Operations | ✅ | ✅ | ✅ | ❌ | ❌ |
| Catering | Operations | ✅ | ✅ | ❌ | ❌ | ✅ |
| QR Scanner | Operations | ❌ | ✅ | ✅ | ✅ | ✅ |
| Staff | Management | ✅ | ✅ | ❌ | ❌ | ❌ |
| Finance | Management | ✅ | ✅ | ❌ | ✅ | ❌ |
| Reports | Analytics | ✅ | ✅ | ❌ | ✅ | ❌ |
| Audit Logs | Analytics | ✅ | ✅ | ❌ | ❌ | ❌ |

## Role-Specific Menu Views

### 🔑 ADMIN Role
**Full Access - All Menu Items**
```
📱 Main
├── 🏠 Dashboard - Overview & analytics

📅 Event Management
├── 📅 Events - Manage all events
└── ➕ Create Event - Add new event [New]

⚙️ Operations
├── ✅ Registrations - Participant management
├── 👨‍🍳 Catering - Meal service management
└── 📱 QR Scanner - Scan participant codes

👥 Management
├── 👥 Staff - Team management
└── 💰 Finance - Payment tracking

📊 Analytics
├── 📈 Reports - Analytics & insights
└── 📋 Audit Logs - System activity
```

### 🎯 EVENT_ORGANIZER Role
**Event Management & Operations Focus**
```
📱 Main
├── 🏠 Dashboard - Overview & analytics

📅 Event Management
├── 📅 Events - Manage all events
└── ➕ Create Event - Add new event [New]

⚙️ Operations
├── ✅ Registrations - Participant management
├── 👨‍🍳 Catering - Meal service management
└── 📱 QR Scanner - Scan participant codes

👥 Management
├── 👥 Staff - Team management
└── 💰 Finance - Payment tracking

📊 Analytics
├── 📈 Reports - Analytics & insights
└── 📋 Audit Logs - System activity
```

### 👤 REGISTRATION_STAFF Role
**Registration & Check-in Operations**
```
📱 Main
├── 🏠 Dashboard - Overview & analytics

⚙️ Operations
├── ✅ Registrations - Participant management
└── 📱 QR Scanner - Scan participant codes
```

### 💰 FINANCE_TEAM Role
**Financial Management & Reporting**
```
📱 Main
├── 🏠 Dashboard - Overview & analytics

⚙️ Operations
└── 📱 QR Scanner - Scan participant codes

👥 Management
└── 💰 Finance - Payment tracking

📊 Analytics
└── 📈 Reports - Analytics & insights
```

### 👨‍🍳 CATERING_TEAM Role
**Meal Service Operations**
```
📱 Main
├── 🏠 Dashboard - Overview & analytics

⚙️ Operations
├── 👨‍🍳 Catering - Meal service management
└── 📱 QR Scanner - Scan participant codes
```

## Access Control Logic

### Section Visibility Rules

1. **Main Section**: Always visible to all authenticated users
2. **Event Management**: Only visible to ADMIN and EVENT_ORGANIZER
3. **Operations**: Dynamically populated based on role permissions
4. **Management**: Only visible to users with administrative privileges
5. **Analytics**: Visible to users who need reporting capabilities

### Menu Item Filtering

The sidebar implements a two-level filtering system:

1. **Section Level**: Entire sections are hidden if no menu items are accessible
2. **Item Level**: Individual menu items are filtered based on role permissions

```typescript
// Filtering logic example
const filteredSections = sections
  .map(section => ({
    ...section,
    items: section.items.filter(item => item.roles.includes(userRole))
  }))
  .filter(section => section.items.length > 0)
```

## Visual Hierarchy & Design

### Role-Based Branding
Each role has a distinct color scheme and badge:

- **ADMIN**: Blue (`bg-blue-100 text-blue-800`)
- **EVENT_ORGANIZER**: Green (`bg-green-100 text-green-800`)
- **REGISTRATION_STAFF**: Orange (`bg-orange-100 text-orange-800`)
- **FINANCE_TEAM**: Yellow (`bg-yellow-100 text-yellow-800`)
- **CATERING_TEAM**: Purple (`bg-purple-100 text-purple-800`)

### Menu Item Features
- **Icons**: Each menu item has a descriptive Lucide React icon
- **Descriptions**: Helpful descriptions explain the purpose of each section
- **Badges**: Special badges highlight new or important features
- **Active States**: Visual indicators show the current page/section

## Security Considerations

### Frontend Protection
- Menu items are hidden based on role, but this is **UI-only protection**
- Routes should implement server-side authorization guards
- GraphQL resolvers must validate user permissions

### Backend Validation
All API endpoints should implement role-based guards:
```typescript
@UseGuards(GqlAuthGuard, RoleGuard(['ADMIN', 'EVENT_ORGANIZER']))
```

## Implementation Details

### Menu Configuration
The menu structure is defined in `/frontend/src/app/admin/layout.tsx` using a dynamic configuration system that:

1. Checks user role from authentication context
2. Builds menu sections based on role permissions
3. Filters items and sections dynamically
4. Renders responsive sidebar with proper styling

### State Management
- **Sidebar State**: Managed with React useState for mobile responsiveness
- **Profile Menu**: Dropdown state for user profile actions
- **Active Routes**: Automatic detection using Next.js usePathname

## Future Enhancements

### Planned Improvements
1. **Granular Permissions**: Move from role-based to permission-based access
2. **Custom Roles**: Allow creation of custom roles with specific permissions
3. **Menu Customization**: User-configurable menu layouts
4. **Contextual Menus**: Dynamic menus based on current event or context

### Additional Features
- **Quick Actions**: Floating action buttons for common tasks
- **Search**: Global search across all accessible features
- **Notifications**: In-sidebar notification center
- **Shortcuts**: Keyboard shortcuts for power users

---

## Summary

The Event Registration System implements a comprehensive role-based access control system for the admin sidebar, ensuring users only see relevant functionality while maintaining a clean, organized interface. The system balances security, usability, and scalability to support various user types in event management workflows.
