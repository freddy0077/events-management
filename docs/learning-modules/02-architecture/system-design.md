# Module 2.2: System Design

## 🎯 Learning Objectives

By the end of this module, you will understand:
- System design principles and methodologies
- How to design scalable and reliable systems
- Trade-offs in system design decisions
- Real-world system design examples

## 📚 What is System Design?

**Definition**: System design is the process of defining the architecture, components, modules, interfaces, and data for a system to satisfy specified requirements.

**Key Aspects**:
- **Scalability**: Handle increasing load
- **Reliability**: System continues to work correctly
- **Availability**: System remains operational
- **Consistency**: Data remains consistent across the system
- **Performance**: System responds quickly to requests

## 🎯 System Design Process

### 1. Requirements Gathering

#### Functional Requirements
What the system should do:

```typescript
// Example: Event Registration System Requirements
interface SystemRequirements {
  functionalRequirements: {
    userManagement: {
      - "Users can register and authenticate"
      - "Support multiple user roles (Admin, Organizer, Staff)"
      - "Password reset functionality"
    };
    eventManagement: {
      - "Create and manage events"
      - "Set event capacity and pricing"
      - "Generate event reports"
    };
    registrationManagement: {
      - "Users can register for events"
      - "Payment processing integration"
      - "QR code generation for tickets"
      - "Check-in functionality"
    };
  };
}
```

#### Non-Functional Requirements
How the system should perform:

```typescript
interface NonFunctionalRequirements {
  performance: {
    responseTime: "< 200ms for 95% of requests";
    throughput: "1000 concurrent users";
    availability: "99.9% uptime";
  };
  scalability: {
    users: "Support up to 100,000 registered users";
    events: "Handle 1,000 simultaneous events";
    registrations: "Process 10,000 registrations per hour";
  };
  security: {
    authentication: "JWT-based authentication";
    authorization: "Role-based access control";
    dataProtection: "Encrypt sensitive data";
  };
}
```

### 2. Capacity Estimation

#### Traffic Estimation
```typescript
// Example calculations for Events Registration System
interface TrafficEstimation {
  dailyActiveUsers: 10000;
  averageEventsPerUser: 2;
  peakTrafficMultiplier: 3;
  
  // Read operations
  eventViews: {
    daily: 50000; // 10k users * 5 events viewed
    peak: 150000; // 3x peak multiplier
    qps: 1.7; // 150k / 86400 seconds
  };
  
  // Write operations
  registrations: {
    daily: 5000; // 10k users * 0.5 conversion rate
    peak: 15000;
    qps: 0.17;
  };
}
```

#### Storage Estimation
```typescript
interface StorageEstimation {
  users: {
    count: 100000;
    sizePerRecord: 1; // KB
    totalSize: 100; // MB
  };
  
  events: {
    count: 10000;
    sizePerRecord: 2; // KB (including images)
    totalSize: 20; // MB
  };
  
  registrations: {
    count: 1000000; // 10k events * 100 avg registrations
    sizePerRecord: 0.5; // KB
    totalSize: 500; // MB
  };
  
  totalStorage: 620; // MB + indexes + backups = ~2GB
}
```

### 3. High-Level Design

#### System Architecture Diagram
```typescript
// High-level system components
interface SystemArchitecture {
  clientLayer: {
    webApp: "React/Next.js frontend";
    mobileApp: "React Native (future)";
    adminPanel: "Admin dashboard";
  };
  
  apiGateway: {
    loadBalancer: "Nginx/AWS ALB";
    rateLimiting: "Redis-based rate limiting";
    authentication: "JWT validation";
  };
  
  applicationLayer: {
    authService: "User authentication & authorization";
    eventService: "Event management";
    registrationService: "Registration processing";
    paymentService: "Payment processing";
    notificationService: "Email/SMS notifications";
  };
  
  dataLayer: {
    primaryDatabase: "PostgreSQL (ACID compliance)";
    cache: "Redis (session & frequently accessed data)";
    fileStorage: "AWS S3 (images, documents)";
    searchEngine: "Elasticsearch (event search)";
  };
  
  externalServices: {
    paymentGateway: "Stripe/PayPal";
    emailService: "SendGrid/AWS SES";
    smsService: "Twilio";
    analyticsService: "Google Analytics";
  };
}
```

### 4. Database Design

#### Entity Relationship Design
```sql
-- Core entities with relationships
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'REGISTRATION_STAFF',
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  venue VARCHAR(255) NOT NULL,
  max_capacity INTEGER,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  qr_code VARCHAR(255) UNIQUE,
  payment_status payment_status DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(event_id, user_email) -- Prevent duplicate registrations
);

-- Indexes for performance
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_venue ON events(venue);
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_email ON registrations(user_email);
CREATE INDEX idx_registrations_qr_code ON registrations(qr_code);
```

### 5. API Design

#### RESTful API Design
```typescript
// API endpoint design following REST principles
interface APIDesign {
  authentication: {
    "POST /auth/login": "User login";
    "POST /auth/logout": "User logout";
    "POST /auth/refresh": "Refresh JWT token";
  };
  
  events: {
    "GET /events": "List events with pagination";
    "GET /events/:id": "Get specific event";
    "POST /events": "Create new event (admin/organizer)";
    "PUT /events/:id": "Update event (admin/organizer)";
    "DELETE /events/:id": "Delete event (admin only)";
  };
  
  registrations: {
    "GET /events/:eventId/registrations": "List event registrations";
    "POST /events/:eventId/registrations": "Register for event";
    "GET /registrations/:id": "Get registration details";
    "PUT /registrations/:id": "Update registration";
    "DELETE /registrations/:id": "Cancel registration";
  };
}

// GraphQL Schema Design (Alternative)
const graphqlSchema = `
  type Query {
    events(limit: Int, offset: Int, filter: EventFilter): [Event!]!
    event(id: ID!): Event
    registrations(eventId: ID, status: PaymentStatus): [Registration!]!
  }
  
  type Mutation {
    createEvent(input: CreateEventInput!): Event!
    updateEvent(id: ID!, input: UpdateEventInput!): Event!
    createRegistration(input: CreateRegistrationInput!): Registration!
    processPayment(registrationId: ID!, paymentData: PaymentInput!): PaymentResult!
  }
  
  type Subscription {
    registrationUpdated(eventId: ID!): Registration!
    eventCapacityUpdated(eventId: ID!): Event!
  }
`;
```

## 🔧 Scalability Patterns

### 1. Horizontal Scaling

#### Load Balancing
```typescript
// Load balancer configuration
interface LoadBalancerConfig {
  algorithm: "round-robin" | "least-connections" | "ip-hash";
  healthCheck: {
    endpoint: "/health";
    interval: 30; // seconds
    timeout: 5; // seconds
    retries: 3;
  };
  servers: [
    { host: "app-server-1", port: 3000, weight: 1 },
    { host: "app-server-2", port: 3000, weight: 1 },
    { host: "app-server-3", port: 3000, weight: 2 } // More powerful server
  ];
}

// Application server health check
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async healthCheck(): Promise<HealthStatus> {
    try {
      // Check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      
      // Check memory usage
      const memoryUsage = process.memoryUsage();
      const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: memoryUsagePercent
        },
        database: 'connected'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}
```

#### Database Scaling
```typescript
// Read replicas configuration
interface DatabaseScaling {
  master: {
    host: "db-master.example.com";
    operations: ["INSERT", "UPDATE", "DELETE"];
  };
  
  readReplicas: [
    { host: "db-replica-1.example.com", region: "us-east-1" },
    { host: "db-replica-2.example.com", region: "us-west-2" }
  ];
  
  connectionPooling: {
    maxConnections: 20;
    idleTimeout: 30000; // 30 seconds
    connectionTimeout: 5000; // 5 seconds
  };
}

// Service implementation with read/write splitting
@Injectable()
export class EventsService {
  constructor(
    @Inject('MASTER_DB') private masterDb: PrismaService,
    @Inject('REPLICA_DB') private replicaDb: PrismaService
  ) {}

  // Write operations go to master
  async createEvent(data: CreateEventInput): Promise<Event> {
    return this.masterDb.event.create({ data });
  }

  // Read operations go to replica
  async getEvents(filter: EventFilter): Promise<Event[]> {
    return this.replicaDb.event.findMany({
      where: filter,
      include: { categories: true }
    });
  }
}
```

### 2. Caching Strategies

#### Multi-Level Caching
```typescript
// Caching layer implementation
@Injectable()
export class CacheService {
  constructor(
    @Inject('REDIS_CLIENT') private redis: Redis,
    private logger: Logger
  ) {}

  // L1: Application-level cache (in-memory)
  private memoryCache = new Map<string, { data: any; expiry: number }>();

  async get<T>(key: string): Promise<T | null> {
    // Check L1 cache first
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && memoryItem.expiry > Date.now()) {
      this.logger.debug(`Cache HIT (L1): ${key}`);
      return memoryItem.data;
    }

    // Check L2 cache (Redis)
    try {
      const redisValue = await this.redis.get(key);
      if (redisValue) {
        const data = JSON.parse(redisValue);
        
        // Populate L1 cache
        this.memoryCache.set(key, {
          data,
          expiry: Date.now() + 60000 // 1 minute
        });
        
        this.logger.debug(`Cache HIT (L2): ${key}`);
        return data;
      }
    } catch (error) {
      this.logger.warn(`Redis cache error: ${error.message}`);
    }

    this.logger.debug(`Cache MISS: ${key}`);
    return null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    // Set in L1 cache
    this.memoryCache.set(key, {
      data: value,
      expiry: Date.now() + Math.min(ttlSeconds * 1000, 300000) // Max 5 minutes in memory
    });

    // Set in L2 cache (Redis)
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      this.logger.warn(`Redis cache set error: ${error.message}`);
    }
  }
}

// Cache usage in service
@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService
  ) {}

  async getPopularEvents(): Promise<Event[]> {
    const cacheKey = 'popular-events';
    
    // Try cache first
    let events = await this.cacheService.get<Event[]>(cacheKey);
    
    if (!events) {
      // Cache miss - fetch from database
      events = await this.prisma.event.findMany({
        where: { isActive: true },
        orderBy: { registrations: { _count: 'desc' } },
        take: 10,
        include: { categories: true }
      });
      
      // Cache for 1 hour
      await this.cacheService.set(cacheKey, events, 3600);
    }
    
    return events;
  }
}
```

### 3. Asynchronous Processing

#### Message Queue Implementation
```typescript
// Job queue for background processing
interface JobQueue {
  addJob(jobType: string, data: any, options?: JobOptions): Promise<void>;
  processJob(jobType: string, processor: JobProcessor): void;
}

interface JobProcessor {
  (job: Job): Promise<void>;
}

interface Job {
  id: string;
  type: string;
  data: any;
  attempts: number;
  createdAt: Date;
}

@Injectable()
export class RedisJobQueue implements JobQueue {
  constructor(@Inject('REDIS_CLIENT') private redis: Redis) {}

  async addJob(jobType: string, data: any, options: JobOptions = {}): Promise<void> {
    const job: Job = {
      id: generateId(),
      type: jobType,
      data,
      attempts: 0,
      createdAt: new Date()
    };

    const delay = options.delay || 0;
    const queueName = `queue:${jobType}`;
    
    if (delay > 0) {
      // Delayed job
      const executeAt = Date.now() + delay;
      await this.redis.zadd('delayed-jobs', executeAt, JSON.stringify(job));
    } else {
      // Immediate job
      await this.redis.lpush(queueName, JSON.stringify(job));
    }
  }

  processJob(jobType: string, processor: JobProcessor): void {
    const queueName = `queue:${jobType}`;
    
    // Continuous processing loop
    setInterval(async () => {
      try {
        const jobData = await this.redis.brpop(queueName, 1);
        if (jobData) {
          const job: Job = JSON.parse(jobData[1]);
          await processor(job);
        }
      } catch (error) {
        console.error(`Job processing error: ${error.message}`);
      }
    }, 100);
  }
}

// Background job processors
@Injectable()
export class EmailJobProcessor {
  constructor(
    private emailService: EmailService,
    private jobQueue: JobQueue
  ) {
    // Register job processor
    this.jobQueue.processJob('send-email', this.processEmailJob.bind(this));
  }

  private async processEmailJob(job: Job): Promise<void> {
    const { to, subject, body, template } = job.data;
    
    try {
      await this.emailService.send({ to, subject, body, template });
      console.log(`Email sent successfully: ${job.id}`);
    } catch (error) {
      console.error(`Failed to send email: ${error.message}`);
      
      // Retry logic
      if (job.attempts < 3) {
        await this.jobQueue.addJob('send-email', job.data, { 
          delay: Math.pow(2, job.attempts) * 1000 // Exponential backoff
        });
      }
    }
  }
}

// Usage in service
@Injectable()
export class RegistrationService {
  constructor(private jobQueue: JobQueue) {}

  async createRegistration(data: CreateRegistrationInput): Promise<Registration> {
    const registration = await this.prisma.registration.create({ data });
    
    // Queue background tasks
    await this.jobQueue.addJob('send-email', {
      to: registration.email,
      template: 'registration-confirmation',
      data: { registration }
    });
    
    await this.jobQueue.addJob('generate-qr-code', {
      registrationId: registration.id
    });
    
    return registration;
  }
}
```

## 📊 Monitoring and Observability

### Application Metrics
```typescript
// Metrics collection service
@Injectable()
export class MetricsService {
  private metrics = new Map<string, number>();
  
  incrementCounter(name: string, value: number = 1): void {
    const current = this.metrics.get(name) || 0;
    this.metrics.set(name, current + value);
  }
  
  recordHistogram(name: string, value: number): void {
    // Implementation for histogram metrics
    const key = `${name}_histogram`;
    // Store histogram data...
  }
  
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
}

// Metrics middleware
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const endpoint = `${request.method} ${request.route?.path || request.url}`;
        
        this.metricsService.incrementCounter(`requests_total`);
        this.metricsService.incrementCounter(`requests_${request.method.toLowerCase()}`);
        this.metricsService.recordHistogram(`request_duration_ms`, duration);
      }),
      catchError((error) => {
        this.metricsService.incrementCounter(`requests_errors_total`);
        this.metricsService.incrementCounter(`requests_errors_${error.status || 500}`);
        throw error;
      })
    );
  }
}
```

## 🏃‍♂️ Practical Exercises

### Exercise 1: System Requirements Analysis
For a hypothetical "Online Learning Platform":
1. Define functional and non-functional requirements
2. Estimate traffic and storage needs
3. Identify potential bottlenecks

### Exercise 2: Design a Scalable Architecture
Design a system architecture for handling:
- 1 million concurrent users
- Real-time chat functionality
- Video streaming capabilities
- Global content delivery

### Exercise 3: Database Scaling Strategy
Design a database scaling strategy for:
- Read-heavy workload (90% reads, 10% writes)
- Geographic distribution requirements
- Strong consistency for financial transactions
- Eventual consistency acceptable for user profiles

## 📝 Summary

### Key System Design Principles
1. **Scalability**: Design for growth from day one
2. **Reliability**: Build fault-tolerant systems
3. **Performance**: Optimize for speed and efficiency
4. **Maintainability**: Keep systems easy to modify
5. **Security**: Design with security in mind

### Common Scaling Patterns
- **Horizontal scaling**: Add more servers
- **Vertical scaling**: Upgrade existing servers
- **Caching**: Reduce database load
- **Load balancing**: Distribute traffic
- **Asynchronous processing**: Handle tasks in background
- **Database sharding**: Distribute data across multiple databases

### Next Steps
- Complete the exercises above
- Study real-world system architectures
- Practice system design interviews
- Proceed to [Database Design](./database-design.md)

---

**Estimated Study Time**: 12-15 hours  
**Prerequisites**: Architectural Patterns module  
**Next Module**: [Database Design](./database-design.md)
