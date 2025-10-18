import { gql } from '@apollo/client'

// QR Code Queries
export const GET_QR_CODE_IMAGE = gql`
  query GetQRCodeImage($registrationId: ID!) {
    getQRCodeImage(registrationId: $registrationId)
  }
`

// Export draft queries
export * from './queries/draft-queries'

// Catering Queries
export const GET_CATERING_METRICS = gql`
  query GetCateringMetrics($eventId: ID) {
    getCateringMetrics(eventId: $eventId) {
      totalParticipants
      checkedInToday
      pendingMeals
      completedMeals
      totalMealSessions
      activeMealSessions
    }
  }
`

export const GET_CATERING_REGISTRATIONS = gql`
  query GetCateringRegistrations($eventId: ID, $mealFilter: String, $statusFilter: String) {
    getCateringRegistrations(eventId: $eventId, mealFilter: $mealFilter, statusFilter: $statusFilter) {
      id
      firstName
      lastName
      email
      phone
      paymentStatus
      createdAt
      event {
        id
        name
        date
      }
      category {
        id
        name
        price
      }
      mealAttendances {
        id
        scannedAt
        meal {
          id
          sessionName
          startTime
          endTime
        }
      }
      qrCode
    }
  }
`

export const GET_MEAL_SESSIONS = gql`
  query GetMealSessions($eventId: ID) {
    getMealSessions(eventId: $eventId) {
      id
      sessionName
      name
      sessionTime
      startTime
      endTime
      maxCapacity
      totalAttendees
      status
      description
      location
      eventId
      isActive
      event {
        id
        name
        date
      }
    }
  }
`


// Authentication Queries
export const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    me {
      id
      email
      firstName
      lastName
      role
    }
  }
`

// Get events assigned to current user as staff
// Updated: Fixed transaction.status -> transaction.paymentStatus
export const GET_MY_ASSIGNED_EVENTS = gql`
  query GetMyAssignedEvents {
    myAssignedEvents {
      id
      name
      slug
      date
      endDate
      venue
      address
      maxCapacity
      isActive
      badgeTemplateId
      totalRegistrations
      approvedRegistrations
      pendingRegistrations
      paidRegistrations
      categories {
        id
        name
        price
        maxCapacity
        description
      }
      staff {
        id
        role
        permissions
        isActive
        assignedAt
      }
      registrations {
        id
        firstName
        lastName
        email
        phone
        address
        status
        paymentStatus
        qrCode
        qrCodeScanned
        checkedIn
        checkedInAt
        createdAt
        category {
          id
          name
          price
        }
        transactions {
          id
          amount
          paymentStatus
          receiptNumber
          createdAt
        }
      }
    }
  }
`

// Get registrations for a specific event (staff can access their assigned events)
export const GET_EVENT_REGISTRATIONS = gql`
  query GetEventRegistrations($eventId: ID!) {
    eventRegistrations(eventId: $eventId) {
      id
      firstName
      lastName
      email
      phone
      address
      zone
      paymentStatus
      qrCode
      badgePrinted
      badgePrintedAt
      badgePrintCount
      checkedIn
      checkedInAt
      createdAt
      event {
        id
        name
        slug
      }
      category {
        id
        name
        price
      }
      transactions {
        id
        amount
        paymentMethod
        paymentStatus
        receiptNumber
        paymentDate
        createdAt
      }
    }
  }
`

// Get registrations for events assigned to current user (using multiple eventRegistrations calls)
export const GET_MY_EVENT_REGISTRATIONS = gql`
  query GetMyEventRegistrations($eventIds: [String!]) {
    registrations(eventIds: $eventIds) {
      id
      firstName
      lastName
      fullName
      email
      phone
      address
      zone
      status
      paymentStatus
      qrCode
      qrCodeScanned
      badgePrinted
      badgePrintedAt
      badgePrintCount
      checkedIn
      checkedInAt
      createdAt
      event {
        id
        name
        slug
      }
      category {
        id
        name
        price
      }
      transactions {
        id
        amount
        paymentMethod
        paymentStatus
        receiptNumber
        paymentDate
        createdAt
      }
    }
  }
`

// Search registrations
export const SEARCH_REGISTRATIONS = gql`
  query SearchRegistrations($searchTerm: String!, $eventId: ID) {
    searchRegistrations(searchTerm: $searchTerm, eventId: $eventId) {
      id
      firstName
      lastName
      fullName
      email
      phone
      address
      zone
      paymentStatus
      qrCode
      badgePrinted
      badgePrintedAt
      badgePrintCount
      checkedIn
      checkedInAt
      createdAt
      event {
        id
        name
        slug
        date
        venue
      }
      category {
        id
        name
        price
      }
      transactions {
        id
        amount
        paymentMethod
        paymentStatus
        receiptNumber
        paymentDate
        createdAt
      }
    }
  }
`

export const VERIFY_TOKEN = gql`
  query VerifyToken {
    verifyToken {
      valid
      user {
        id
        email
        firstName
        lastName
        role
      }
    }
  }
`

export const GET_USER_PROFILE = gql`
  query GetUserProfile($id: ID!) {
    user(id: $id) {
      id
      email
      firstName
      lastName
      role
    }
  }
`

// Event Queries
export const GET_EVENTS = gql`
  query GetEvents {
    events {
      id
      name
      slug
      date
      venue
      description
      maxCapacity
      logoUrl
      isActive
      status
      totalRegistrations
      approvedRegistrations
      createdAt
      updatedAt
      categories {
        id
        name
        price
        maxCapacity
        currentCount
        description
        isActive
      }
    }
  }
`

export const GET_EVENT_BY_ID = gql`
  query GetEventById($id: ID!) {
    event(id: $id) {
      id
      name
      slug
      date
      endDate
      venue
      address
      description
      maxCapacity
      logoUrl
      paymentRequired
      registrationDeadline
      paymentDeadline
      depositAllowed
      depositPercentage
      fullPaymentDeadline
      latePaymentFee
      refundPolicy
      isActive
      status
      totalRegistrations
      approvedRegistrations
      paidRegistrations
      pendingRegistrations
      failedRegistrations
      createdAt
      updatedAt
      categories {
        id
        name
        price
        maxCapacity
        description
      }
      meals {
        id
        sessionName
        startTime
        endTime
        description
      }
      staff {
        id
        userId
        role
        isActive
        assignedAt
        assignedBy
        permissions
        user {
          id
          firstName
          lastName
          email
          role
        }
      }
    }
    eventManagers(eventId: $id) {
      id
      userId
      role
      isActive
      assignedAt
      assignedBy
      permissions
      user {
        id
        firstName
        lastName
        email
        role
        isActive
        createdAt
      }
    }
  }
`

export const GET_EVENT_BY_SLUG = gql`
  query GetEventBySlug($slug: String!) {
    eventBySlug(slug: $slug) {
      id
      name
      slug
      description
      date
      endDate
      venue
      address
      maxCapacity
      logoUrl
      paymentRequired
      registrationDeadline
      paymentDeadline
      depositAllowed
      depositPercentage
      fullPaymentDeadline
      latePaymentFee
      refundPolicy
      isActive
      status
      totalRegistrations
      approvedRegistrations
      createdAt
      updatedAt
      categories {
        id
        name
        price
        maxCapacity
        description
      }
      meals {
        id
        sessionName
        startTime
        endTime
        description
      }
    }
  }
`

// Registration Queries
export const GET_REGISTRATIONS = gql`
  query GetRegistrations($eventId: String, $eventIds: [String!], $limit: Int, $offset: Int) {
    registrations(eventId: $eventId, eventIds: $eventIds, limit: $limit, offset: $offset) {
      id
      firstName
      lastName
      email
      phone
      address
      paymentStatus
      qrCode
      createdAt
      updatedAt
      event {
        id
        name
        date
        venue
      }
      category {
        id
        name
        price
      }
      transactions {
        id
        amount
        paymentMethod
        paymentStatus
        receiptNumber
        paymentDate
      }
      mealAttendances {
        id
        scannedAt
        meal {
          id
          name
          sessionTime
        }
      }
    }
  }
`

export const GET_REGISTRATION_BY_ID = gql`
  query GetRegistrationById($id: ID!) {
    registration(id: $id) {
      id
      firstName
      lastName
      email
      phone
      address
      paymentStatus
      receiptNumber
      qrCode
      createdAt
      updatedAt
      event {
        id
        name
        slug
        date
        venue
        address
      }
      category {
        id
        name
        price
      }
      mealAttendances {
        id
        scannedAt
        meal {
          id
          name
          sessionTime
        }
      }
    }
  }
`

export const SEARCH_REGISTRATION_BY_RECEIPT = gql`
  query SearchRegistrationByReceipt($receiptNumber: String!) {
    searchRegistrationByReceipt(receiptNumber: $receiptNumber) {
      id
      firstName
      lastName
      email
      phone
      address
      paymentStatus
      receiptNumber
      qrCode
      event {
        id
        name
        date
        venue
      }
      category {
        id
        name
        price
      }
    }
  }
`

// Meal Attendance Queries
export const GET_MEAL_ATTENDANCES = gql`
  query GetMealAttendances($mealId: ID!) {
    mealAttendance(mealId: $mealId) {
      id
      scannedAt
      scannedBy
      notes
      mealId
      registrationId
      meal {
        id
        name
        sessionTime
        eventId
      }
    }
  }
`

export const GET_RECENT_MEAL_ATTENDANCES = gql`
  query GetRecentMealAttendances($eventId: ID, $limit: Int) {
    recentMealAttendances(eventId: $eventId, limit: $limit) {
      id
      scannedAt
      scannedBy
      notes
      mealId
      registrationId
      meal {
        id
        name
        sessionTime
        eventId
      }
      registration {
        id
        firstName
        lastName
        email
        qrCode
        event {
          id
          name
        }
        category {
          id
          name
        }
      }
    }
  }
`

export const VALIDATE_QR_CODE = gql`
  query ValidateQrCode($qrCode: String!, $mealId: String!) {
    validateQrCode(qrCode: $qrCode, mealId: $mealId) {
      isValid
      registration {
        id
        firstName
        lastName
        email
        paymentStatus
        category {
          id
          name
        }
      }
      alreadyScanned
      error
    }
  }
`

// Authentication Queries
export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      role
      firstName
      lastName
      mustChangePassword
    }
  }
`

// User Registration Queries
export const GET_USER_REGISTRATIONS = gql`
  query GetUserRegistrations {
    myRegistrations {
      id
      firstName
      lastName
      email
      phone
      address
      paymentStatus
      receiptNumber
      qrCode
      createdAt
      updatedAt
      event {
        id
        name
        slug
        description
        date
        endDate
        venue
        address
        status
      }
      category {
        id
        name
        price
        description
      }
      mealAttendances {
        id
        scannedAt
        meal {
          id
          name
          sessionTime
        }
      }
    }
  }
`

// Dashboard Stats Queries
export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      totalEvents
      totalRegistrations
      totalRevenue
      activeEvents
      recentRegistrations {
        id
        firstName
        lastName
        email
        paymentStatus
        createdAt
        event {
          name
        }
        category {
          name
          price
        }
      }
      recentEvents {
        id
        name
        date
        totalRegistrations
        approvedRegistrations
        status
      }
    }
  }
`

// Event Manager Assignment Queries
export const GET_AVAILABLE_EVENT_MANAGERS = gql`
  query GetAvailableEventManagers($searchQuery: String) {
    availableEventManagers(searchQuery: $searchQuery) {
      id
      email
      firstName
      lastName
      role
    }
  }
`

export const GET_EVENT_MANAGERS = gql`
  query GetEventManagers($eventId: ID!) {
    eventManagers(eventId: $eventId) {
      id
      role
      isActive
      assignedAt
      user {
        id
        email
        firstName
        lastName
        role
        isActive
        createdAt
        updatedAt
      }
    }
  }
`

// Event Staff Queries
export const GET_EVENT_STAFF = gql`
  query GetEventStaff($eventId: ID!) {
    eventStaff(eventId: $eventId) {
      total
      staff {
        id
        role
        isActive
        assignedAt
        permissions
        user {
          id
          email
          firstName
          lastName
          role
          isActive
        }
      }
    }
  }
`

export const GET_CATERING_REPORTS = gql`
  query GetCateringReports($filter: CateringReportsFilter) {
    getCateringReports(filter: $filter) {
      summary {
        totalEvents
        totalMealSessions
        totalParticipants
        totalMealsServed
        averageAttendanceRate
      }
      mealSessionReports {
        id
        eventName
        mealName
        date
        expectedAttendees
        actualAttendees
        attendanceRate
        status
      }
      attendanceAnalytics {
        byCategory {
          category
          expected
          actual
          rate
        }
        byTimeSlot {
          timeSlot
          sessions
          avgAttendance
        }
      }
    }
  }
`

// Categories Queries
export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      eventId
      name
      description
      price
      maxCapacity
      isActive
      createdAt
      updatedAt
      currentCount
    }
  }
`

export const GET_CATEGORIES_BY_EVENT = gql`
  query GetCategoriesByEvent($eventId: ID!) {
    categoriesByEvent(eventId: $eventId) {
      id
      eventId
      name
      description
      price
      maxCapacity
      isActive
      createdAt
      updatedAt
      currentCount
    }
  }
`

export const GET_ACTIVE_CATEGORIES_BY_EVENT = gql`
  query GetActiveCategoriesByEvent($eventId: ID!) {
    activeCategoriesByEvent(eventId: $eventId) {
      id
      eventId
      name
      description
      price
      maxCapacity
      isActive
      createdAt
      updatedAt
      currentCount
    }
  }
`

export const GET_CATEGORY = gql`
  query GetCategory($id: ID!) {
    category(id: $id) {
      id
      eventId
      name
      description
      price
      maxCapacity
      isActive
      createdAt
      updatedAt
      currentCount
    }
  }
`
