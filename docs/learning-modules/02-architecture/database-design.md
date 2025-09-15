# Module 2.3: Database Design

## 🎯 Learning Objectives

By the end of this module, you will understand:
- Database design principles and normalization
- How to design efficient database schemas
- Performance optimization techniques
- Real-world database design from the Events Registration System

## 📚 Database Design Fundamentals

**Definition**: Database design is the process of producing a detailed data model of a database that includes all needed logical and physical design choices and physical storage parameters.

**Key Principles**:
- **Data Integrity**: Ensure data accuracy and consistency
- **Normalization**: Eliminate data redundancy
- **Performance**: Optimize for query efficiency
- **Scalability**: Design for growth
- **Security**: Protect sensitive data

## 🔧 Database Normalization

### First Normal Form (1NF)
**Rule**: Each table cell should contain a single value, and each record should be unique.

#### ❌ Violates 1NF:
```sql
-- Bad: Multiple values in single cell
CREATE TABLE events_bad (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  organizers VARCHAR(500), -- "John Doe, Jane Smith, Bob Johnson"
  categories VARCHAR(300)   -- "Conference, Workshop, Networking"
);
```

#### ✅ Follows 1NF:
```sql
-- Good: Atomic values only
CREATE TABLE events (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  venue VARCHAR(255) NOT NULL
);

CREATE TABLE event_organizers (
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(50) DEFAULT 'ORGANIZER',
  PRIMARY KEY (event_id, user_id)
);

CREATE TABLE event_categories (
  event_id UUID REFERENCES events(id),
  category_id UUID REFERENCES categories(id),
  PRIMARY KEY (event_id, category_id)
);
```

### Second Normal Form (2NF)
**Rule**: Must be in 1NF and all non-key attributes must be fully functionally dependent on the primary key.

#### ❌ Violates 2NF:
```sql
-- Bad: Partial dependency on composite key
CREATE TABLE registration_details (
  registration_id UUID,
  event_id UUID,
  participant_name VARCHAR(255),
  participant_email VARCHAR(255),
  event_name VARCHAR(255),        -- Depends only on event_id
  event_venue VARCHAR(255),       -- Depends only on event_id
  PRIMARY KEY (registration_id, event_id)
);
```

#### ✅ Follows 2NF:
```sql
-- Good: Separate tables eliminate partial dependencies
CREATE TABLE events (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  venue VARCHAR(255) NOT NULL,
  date TIMESTAMP NOT NULL
);

CREATE TABLE registrations (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id) NOT NULL,
  participant_name VARCHAR(255) NOT NULL,
  participant_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Third Normal Form (3NF)
**Rule**: Must be in 2NF and no transitive dependencies (non-key attributes should not depend on other non-key attributes).

#### ❌ Violates 3NF:
```sql
-- Bad: Transitive dependency
CREATE TABLE registrations_bad (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  participant_email VARCHAR(255),
  participant_country VARCHAR(100),
  country_tax_rate DECIMAL(5,2)  -- Depends on participant_country, not id
);
```

#### ✅ Follows 3NF:
```sql
-- Good: Eliminate transitive dependencies
CREATE TABLE countries (
  code VARCHAR(3) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  tax_rate DECIMAL(5,2) NOT NULL
);

CREATE TABLE registrations (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id),
  participant_email VARCHAR(255),
  country_code VARCHAR(3) REFERENCES countries(code)
);
```

## 🗃️ Real-World Schema Design

### Events Registration System Schema
```sql
-- ========================
-- CORE ENTITIES
-- ========================

-- Users table with role-based access
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'REGISTRATION_STAFF',
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  must_change_password BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Events with comprehensive metadata
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  venue VARCHAR(255) NOT NULL,
  address TEXT,
  max_capacity INTEGER,
  payment_required BOOLEAN DEFAULT false,
  registration_deadline TIMESTAMP,
  payment_deadline TIMESTAMP,
  deposit_allowed BOOLEAN DEFAULT false,
  deposit_percentage INTEGER,
  full_payment_deadline TIMESTAMP,
  late_payment_fee DECIMAL(10,2),
  refund_policy TEXT,
  badge_template_id VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (end_date IS NULL OR end_date >= date),
  CONSTRAINT valid_capacity CHECK (max_capacity IS NULL OR max_capacity > 0),
  CONSTRAINT valid_deposit CHECK (
    NOT deposit_allowed OR 
    (deposit_percentage IS NOT NULL AND deposit_percentage BETWEEN 1 AND 99)
  )
);

-- Event categories for pricing tiers
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_capacity INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_price CHECK (price >= 0),
  CONSTRAINT valid_category_capacity CHECK (max_capacity IS NULL OR max_capacity > 0),
  UNIQUE(event_id, name)
);

-- ========================
-- REGISTRATION SYSTEM
-- ========================

-- Main registrations table
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  qr_code VARCHAR(255) UNIQUE,
  staff_user_id UUID REFERENCES users(id), -- Who processed the registration
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Prevent duplicate registrations
  UNIQUE(event_id, email)
);

-- Transaction tracking for payments
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES registrations(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'PENDING',
  payment_date TIMESTAMP,
  receipt_number VARCHAR(100),
  processed_by UUID REFERENCES users(id),
  confirmed_by UUID REFERENCES users(id),
  refunded_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_amount CHECK (amount > 0)
);

-- ========================
-- STAFF MANAGEMENT
-- ========================

-- Event staff assignments
CREATE TABLE event_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id) NOT NULL,
  
  -- Prevent duplicate assignments
  UNIQUE(event_id, user_id)
);

-- ========================
-- MEAL MANAGEMENT
-- ========================

-- Meals associated with events
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  meal_time TIMESTAMP NOT NULL,
  location VARCHAR(255),
  max_capacity INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Meal attendance tracking
CREATE TABLE meal_attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES registrations(id) ON DELETE CASCADE,
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP DEFAULT NOW(),
  scanned_by UUID REFERENCES users(id),
  
  -- Prevent duplicate meal claims
  UNIQUE(registration_id, meal_id)
);

-- ========================
-- AUDIT SYSTEM
-- ========================

-- Comprehensive audit logging
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  event_id UUID REFERENCES events(id), -- For event-specific filtering
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- ========================
-- ENUMS
-- ========================

CREATE TYPE user_role AS ENUM (
  'ADMIN',
  'EVENT_ORGANIZER', 
  'REGISTRATION_STAFF',
  'FINANCE_TEAM',
  'CATERING_TEAM'
);

CREATE TYPE payment_method AS ENUM (
  'CASH',
  'MOBILE_MONEY',
  'BANK_TRANSFER',
  'CARD',
  'CHEQUE'
);

CREATE TYPE payment_status AS ENUM (
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED'
);
```

## 📈 Performance Optimization

### Indexing Strategy
```sql
-- ========================
-- PRIMARY INDEXES (Automatic)
-- ========================
-- All PRIMARY KEY constraints automatically create unique indexes

-- ========================
-- FOREIGN KEY INDEXES
-- ========================
-- Improve JOIN performance
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_categories_event_id ON categories(event_id);
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_category_id ON registrations(category_id);
CREATE INDEX idx_transactions_registration_id ON transactions(registration_id);
CREATE INDEX idx_event_staff_event_id ON event_staff(event_id);
CREATE INDEX idx_event_staff_user_id ON event_staff(user_id);

-- ========================
-- QUERY-SPECIFIC INDEXES
-- ========================
-- Frequently searched columns
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_venue ON events(venue);
CREATE INDEX idx_events_slug ON events(slug); -- Already unique, but explicit
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_registrations_qr_code ON registrations(qr_code);
CREATE INDEX idx_users_email ON users(email); -- Already unique, but explicit

-- Composite indexes for common query patterns
CREATE INDEX idx_events_active_date ON events(is_active, date) WHERE is_active = true;
CREATE INDEX idx_registrations_event_status ON registrations(event_id, created_at);
CREATE INDEX idx_transactions_status_date ON transactions(payment_status, created_at);

-- ========================
-- PARTIAL INDEXES
-- ========================
-- Index only relevant rows to save space
CREATE INDEX idx_active_events ON events(date, name) WHERE is_active = true;
CREATE INDEX idx_pending_payments ON transactions(created_at) WHERE payment_status = 'PENDING';
CREATE INDEX idx_active_users ON users(email, role) WHERE is_active = true;

-- ========================
-- FUNCTIONAL INDEXES
-- ========================
-- Support case-insensitive searches
CREATE INDEX idx_events_name_lower ON events(LOWER(name));
CREATE INDEX idx_registrations_email_lower ON registrations(LOWER(email));
```

### Query Optimization Examples
```sql
-- ========================
-- EFFICIENT QUERIES
-- ========================

-- Get upcoming events with registration counts
-- Uses indexes: idx_events_active_date, idx_registrations_event_id
SELECT 
  e.id,
  e.name,
  e.date,
  e.venue,
  e.max_capacity,
  COUNT(r.id) as registration_count,
  (e.max_capacity - COUNT(r.id)) as available_spots
FROM events e
LEFT JOIN registrations r ON e.id = r.event_id
WHERE e.is_active = true 
  AND e.date >= NOW()
GROUP BY e.id, e.name, e.date, e.venue, e.max_capacity
ORDER BY e.date ASC
LIMIT 10;

-- Get event registrations with payment status
-- Uses indexes: idx_registrations_event_id, idx_transactions_registration_id
SELECT 
  r.id,
  r.full_name,
  r.email,
  r.created_at,
  COALESCE(t.payment_status, 'PENDING') as payment_status,
  t.amount,
  t.payment_method
FROM registrations r
LEFT JOIN transactions t ON r.id = t.registration_id
WHERE r.event_id = $1
ORDER BY r.created_at DESC;

-- Search events by name (case-insensitive)
-- Uses index: idx_events_name_lower
SELECT id, name, date, venue
FROM events
WHERE LOWER(name) LIKE LOWER($1 || '%')
  AND is_active = true
  AND date >= NOW()
ORDER BY date ASC;
```

### Database Connection Optimization
```typescript
// Connection pooling configuration
interface DatabaseConfig {
  connectionPool: {
    min: 5;           // Minimum connections
    max: 20;          // Maximum connections
    idle: 10000;      // Idle timeout (10 seconds)
    acquire: 60000;   // Acquire timeout (60 seconds)
    evict: 1000;      // Eviction run interval (1 second)
  };
  
  // Read replica configuration
  readReplicas: [
    { host: 'replica-1.db.com', weight: 1 },
    { host: 'replica-2.db.com', weight: 1 }
  ];
  
  // Query optimization
  queryTimeout: 30000; // 30 seconds
  statementTimeout: 60000; // 60 seconds
}

// Service with optimized queries
@Injectable()
export class OptimizedEventsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService
  ) {}

  async getUpcomingEvents(limit: number = 10): Promise<Event[]> {
    const cacheKey = `upcoming-events:${limit}`;
    
    // Try cache first
    let events = await this.cacheService.get<Event[]>(cacheKey);
    
    if (!events) {
      // Optimized query with specific field selection
      events = await this.prisma.event.findMany({
        select: {
          id: true,
          name: true,
          date: true,
          venue: true,
          maxCapacity: true,
          _count: {
            select: { registrations: true }
          }
        },
        where: {
          isActive: true,
          date: { gte: new Date() }
        },
        orderBy: { date: 'asc' },
        take: limit
      });
      
      // Cache for 5 minutes
      await this.cacheService.set(cacheKey, events, 300);
    }
    
    return events;
  }

  async getEventRegistrations(eventId: string, page: number = 1, pageSize: number = 50) {
    const offset = (page - 1) * pageSize;
    
    // Use cursor-based pagination for better performance on large datasets
    return this.prisma.registration.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        transactions: {
          select: {
            paymentStatus: true,
            amount: true,
            paymentMethod: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: pageSize
    });
  }
}
```

## 🔒 Data Security and Privacy

### Sensitive Data Protection
```sql
-- ========================
-- DATA ENCRYPTION
-- ========================

-- Encrypt sensitive columns
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Store encrypted personal data
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  encrypted_phone BYTEA, -- pgp_sym_encrypt(phone, 'encryption_key')
  encrypted_address BYTEA,
  encrypted_id_number BYTEA,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Function to encrypt data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS BYTEA AS $$
BEGIN
  RETURN pgp_sym_encrypt(data, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt data
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data BYTEA)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_data, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Row-Level Security
```sql
-- ========================
-- ROW-LEVEL SECURITY
-- ========================

-- Enable RLS on sensitive tables
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see registrations for events they're assigned to
CREATE POLICY event_staff_registrations ON registrations
  FOR ALL TO authenticated_user
  USING (
    event_id IN (
      SELECT event_id 
      FROM event_staff 
      WHERE user_id = current_user_id()
    )
    OR 
    current_user_role() = 'ADMIN'
  );

-- Policy: Finance team can see all transactions, others only for their events
CREATE POLICY transaction_access ON transactions
  FOR ALL TO authenticated_user
  USING (
    current_user_role() IN ('ADMIN', 'FINANCE_TEAM')
    OR
    registration_id IN (
      SELECT r.id 
      FROM registrations r
      JOIN event_staff es ON r.event_id = es.event_id
      WHERE es.user_id = current_user_id()
    )
  );

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_user_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('app.current_user_role');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📊 Database Monitoring and Maintenance

### Performance Monitoring Queries
```sql
-- ========================
-- PERFORMANCE MONITORING
-- ========================

-- Find slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes 
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey';

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;
```

### Maintenance Tasks
```sql
-- ========================
-- REGULAR MAINTENANCE
-- ========================

-- Update table statistics
ANALYZE;

-- Rebuild indexes if needed
REINDEX INDEX CONCURRENTLY idx_events_date;

-- Clean up old audit logs (keep 1 year)
DELETE FROM audit_logs 
WHERE timestamp < NOW() - INTERVAL '1 year';

-- Vacuum tables to reclaim space
VACUUM ANALYZE registrations;
VACUUM ANALYZE transactions;
```

## 🏃‍♂️ Practical Exercises

### Exercise 1: Schema Design
Design a database schema for a "Library Management System" with:
- Books, Authors, Members, Loans
- Support for multiple authors per book
- Track loan history and due dates
- Handle fines and payments
- Ensure proper normalization

### Exercise 2: Query Optimization
Given this slow query, optimize it:
```sql
SELECT * FROM events e
JOIN registrations r ON e.id = r.event_id
JOIN transactions t ON r.id = t.registration_id
WHERE e.date >= '2024-01-01'
  AND t.payment_status = 'PAID'
  AND LOWER(e.name) LIKE '%conference%'
ORDER BY e.date, r.created_at;
```

### Exercise 3: Index Strategy
Design an indexing strategy for:
- Frequent searches by event name and date
- Registration lookups by email
- Payment status filtering
- Audit log queries by user and date range

## 📝 Summary

### Key Database Design Principles
1. **Normalization**: Eliminate redundancy while maintaining performance
2. **Indexing**: Strategic index placement for query optimization
3. **Constraints**: Ensure data integrity at the database level
4. **Security**: Protect sensitive data with encryption and RLS
5. **Monitoring**: Track performance and optimize continuously

### Performance Best Practices
- Use appropriate data types
- Create indexes for frequently queried columns
- Implement connection pooling
- Use read replicas for scaling reads
- Cache frequently accessed data
- Monitor and analyze query performance

### Next Steps
- Complete the exercises above
- Study the Events Registration System schema
- Practice query optimization techniques
- Proceed to [API Design](./api-design.md)

---

**Estimated Study Time**: 10-12 hours  
**Prerequisites**: System Design module  
**Next Module**: [API Design](./api-design.md)
