# Module 3.3: Performance Engineering

## 🎯 Learning Objectives

By the end of this module, you will understand:
- Performance optimization principles and techniques
- Profiling and monitoring strategies
- Caching and scaling patterns
- Real-world performance optimizations from the Events Registration System

## 📊 Performance Fundamentals

### Performance Metrics
**Response Time**: Time to complete a single request
**Throughput**: Number of requests processed per unit time
**Latency**: Time between request initiation and first response
**Availability**: Percentage of time system is operational
**Scalability**: Ability to handle increased load

### Performance Goals
- **Sub-200ms**: Database queries
- **Sub-500ms**: API responses
- **Sub-2s**: Page load times
- **99.9%**: Availability target
- **Linear**: Scalability with resources

## 🚀 Database Performance Optimization

### Query Optimization
```typescript
// ========================
// OPTIMIZED DATABASE QUERIES
// ========================

@Injectable()
export class OptimizedEventsService {
  constructor(private prisma: PrismaService) {}

  // ❌ Inefficient: N+1 query problem
  async getEventsWithRegistrationsBad(): Promise<any[]> {
    const events = await this.prisma.event.findMany();
    
    const eventsWithCounts = [];
    for (const event of events) {
      const registrationCount = await this.prisma.registration.count({
        where: { eventId: event.id }
      });
      eventsWithCounts.push({ ...event, registrationCount });
    }
    
    return eventsWithCounts;
  }

  // ✅ Optimized: Single query with aggregation
  async getEventsWithRegistrationsGood(): Promise<any[]> {
    return this.prisma.event.findMany({
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
      where: { isActive: true },
      orderBy: { date: 'asc' }
    });
  }

  // ✅ Advanced: Complex aggregation with raw SQL for performance
  async getEventStatistics(): Promise<EventStatistics[]> {
    return this.prisma.$queryRaw<EventStatistics[]>`
      SELECT 
        e.id,
        e.name,
        e.date,
        e.max_capacity,
        COUNT(r.id) as registration_count,
        COUNT(CASE WHEN r.checked_in = true THEN 1 END) as checked_in_count,
        COALESCE(SUM(t.amount), 0) as total_revenue,
        AVG(CASE WHEN t.payment_status = 'PAID' THEN t.amount END) as avg_payment
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      LEFT JOIN transactions t ON r.id = t.registration_id AND t.payment_status = 'PAID'
      WHERE e.is_active = true
      GROUP BY e.id, e.name, e.date, e.max_capacity
      ORDER BY e.date ASC
    `;
  }

  // ✅ Pagination with cursor-based approach for large datasets
  async getRegistrationsPaginated(
    eventId: string,
    cursor?: string,
    limit: number = 50
  ): Promise<PaginatedRegistrations> {
    const registrations = await this.prisma.registration.findMany({
      where: { eventId },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        checkedIn: true,
        transactions: {
          select: {
            paymentStatus: true,
            amount: true
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Take one extra to check if there's a next page
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1
      })
    });

    const hasNextPage = registrations.length > limit;
    const items = hasNextPage ? registrations.slice(0, -1) : registrations;
    
    return {
      items,
      hasNextPage,
      nextCursor: hasNextPage ? items[items.length - 1].id : null
    };
  }

  // ✅ Batch operations for bulk inserts
  async createRegistrationsBatch(registrations: CreateRegistrationDto[]): Promise<void> {
    const batchSize = 100;
    const batches = [];
    
    for (let i = 0; i < registrations.length; i += batchSize) {
      batches.push(registrations.slice(i, i + batchSize));
    }

    await Promise.all(
      batches.map(batch =>
        this.prisma.registration.createMany({
          data: batch,
          skipDuplicates: true
        })
      )
    );
  }
}

// Database connection optimization
interface DatabaseConfig {
  connectionPool: {
    min: 5;
    max: 20;
    idle: 10000;
    acquire: 60000;
    evict: 1000;
  };
  queryTimeout: 30000;
  statementTimeout: 60000;
}
```

### Caching Strategies
```typescript
// ========================
// MULTI-LEVEL CACHING SYSTEM
// ========================

interface CacheConfig {
  ttl: number;
  maxSize?: number;
  strategy: 'lru' | 'lfu' | 'ttl';
}

@Injectable()
export class CacheService {
  private memoryCache = new Map<string, { value: any; expiry: number }>();
  
  constructor(
    private redisService: RedisService,
    private configService: ConfigService
  ) {}

  // L1 Cache: Memory (fastest, smallest)
  private getFromMemory<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.memoryCache.delete(key);
      return null;
    }
    
    return item.value;
  }

  private setInMemory<T>(key: string, value: T, ttlSeconds: number): void {
    // Implement LRU eviction if cache is full
    if (this.memoryCache.size >= 1000) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
    }
    
    this.memoryCache.set(key, {
      value,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
  }

  // L2 Cache: Redis (fast, larger)
  private async getFromRedis<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisService.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  private async setInRedis<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.redisService.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  // Multi-level cache get
  async get<T>(key: string): Promise<T | null> {
    // Try L1 cache first
    let value = this.getFromMemory<T>(key);
    if (value !== null) {
      return value;
    }

    // Try L2 cache
    value = await this.getFromRedis<T>(key);
    if (value !== null) {
      // Populate L1 cache
      this.setInMemory(key, value, 300); // 5 minutes in memory
      return value;
    }

    return null;
  }

  // Multi-level cache set
  async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    // Set in both caches
    this.setInMemory(key, value, Math.min(ttlSeconds, 300));
    await this.setInRedis(key, value, ttlSeconds);
  }

  // Cache invalidation
  async invalidate(pattern: string): Promise<void> {
    // Clear memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear Redis cache
    const keys = await this.redisService.keys(`*${pattern}*`);
    if (keys.length > 0) {
      await this.redisService.del(...keys);
    }
  }
}

// Cache decorator
export function Cacheable(keyPrefix: string, ttl: number = 3600) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;
      
      // Try to get from cache
      let result = await this.cacheService.get(cacheKey);
      
      if (result === null) {
        // Execute method and cache result
        result = await method.apply(this, args);
        await this.cacheService.set(cacheKey, result, ttl);
      }

      return result;
    };
  };
}

// Usage
@Injectable()
export class CachedEventsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService
  ) {}

  @Cacheable('events:upcoming', 300) // 5 minutes
  async getUpcomingEvents(limit: number = 10): Promise<Event[]> {
    return this.prisma.event.findMany({
      where: {
        isActive: true,
        date: { gte: new Date() }
      },
      orderBy: { date: 'asc' },
      take: limit
    });
  }

  @Cacheable('events:stats', 1800) // 30 minutes
  async getEventStatistics(eventId: string): Promise<EventStats> {
    // Expensive aggregation query
    return this.calculateEventStatistics(eventId);
  }

  // Cache invalidation on updates
  async updateEvent(id: string, data: UpdateEventDto): Promise<Event> {
    const event = await this.prisma.event.update({
      where: { id },
      data
    });

    // Invalidate related caches
    await this.cacheService.invalidate(`events:${id}`);
    await this.cacheService.invalidate('events:upcoming');

    return event;
  }
}
```

## ⚡ Application Performance Optimization

### Asynchronous Processing
```typescript
// ========================
// ASYNC PROCESSING & QUEUES
// ========================

interface JobData {
  type: string;
  payload: any;
  priority?: number;
  delay?: number;
  attempts?: number;
}

@Injectable()
export class QueueService {
  private queues = new Map<string, Queue>();

  constructor() {
    this.setupQueues();
  }

  private setupQueues(): void {
    // Email queue
    const emailQueue = new Queue('email', {
      redis: { host: 'localhost', port: 6379 },
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: 'exponential'
      }
    });

    // Badge generation queue
    const badgeQueue = new Queue('badge-generation', {
      redis: { host: 'localhost', port: 6379 },
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 25,
        attempts: 2
      }
    });

    // Report generation queue (low priority, high resource)
    const reportQueue = new Queue('report-generation', {
      redis: { host: 'localhost', port: 6379 },
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 10,
        attempts: 1
      }
    });

    this.queues.set('email', emailQueue);
    this.queues.set('badge-generation', badgeQueue);
    this.queues.set('report-generation', reportQueue);

    this.setupProcessors();
  }

  private setupProcessors(): void {
    // Email processor
    this.queues.get('email')?.process('send-registration-confirmation', 5, async (job) => {
      const { registration, template } = job.data;
      await this.processEmailJob(registration, template);
    });

    // Badge processor
    this.queues.get('badge-generation')?.process('generate-badge', 3, async (job) => {
      const { registrationId, options } = job.data;
      await this.processBadgeGeneration(registrationId, options);
    });

    // Report processor (single worker for resource-intensive tasks)
    this.queues.get('report-generation')?.process('generate-report', 1, async (job) => {
      const { eventId, reportType, userId } = job.data;
      await this.processReportGeneration(eventId, reportType, userId);
    });
  }

  async addJob(queueName: string, jobType: string, data: any, options?: any): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.add(jobType, data, options);
  }

  // High-level methods
  async sendRegistrationConfirmation(registration: Registration): Promise<void> {
    await this.addJob('email', 'send-registration-confirmation', {
      registration,
      template: 'registration-confirmation'
    }, {
      priority: 1, // High priority
      delay: 0
    });
  }

  async generateBadgeAsync(registrationId: string, options: any = {}): Promise<void> {
    await this.addJob('badge-generation', 'generate-badge', {
      registrationId,
      options
    }, {
      priority: 2 // Medium priority
    });
  }

  async generateReportAsync(eventId: string, reportType: string, userId: string): Promise<void> {
    await this.addJob('report-generation', 'generate-report', {
      eventId,
      reportType,
      userId
    }, {
      priority: 3, // Low priority
      delay: 5000 // 5 second delay
    });
  }
}

// Optimized registration service
@Injectable()
export class OptimizedRegistrationService {
  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
    private cacheService: CacheService
  ) {}

  async createRegistration(data: CreateRegistrationDto): Promise<Registration> {
    // Start database transaction
    return this.prisma.$transaction(async (tx) => {
      // Create registration
      const registration = await tx.registration.create({
        data: {
          ...data,
          qrCode: this.generateQRCode()
        }
      });

      // Update event capacity cache
      await this.updateEventCapacityCache(data.eventId);

      // Queue asynchronous tasks (don't wait)
      setImmediate(async () => {
        await Promise.all([
          this.queueService.sendRegistrationConfirmation(registration),
          this.queueService.generateBadgeAsync(registration.id),
          this.invalidateEventCaches(data.eventId)
        ]);
      });

      return registration;
    });
  }

  private async updateEventCapacityCache(eventId: string): Promise<void> {
    const count = await this.prisma.registration.count({
      where: { eventId }
    });
    
    await this.cacheService.set(`event:${eventId}:registration_count`, count, 300);
  }

  private async invalidateEventCaches(eventId: string): Promise<void> {
    await this.cacheService.invalidate(`event:${eventId}`);
    await this.cacheService.invalidate('events:upcoming');
  }
}
```

### Memory Management & Resource Optimization
```typescript
// ========================
// MEMORY & RESOURCE OPTIMIZATION
// ========================

// Streaming for large datasets
@Injectable()
export class StreamingService {
  constructor(private prisma: PrismaService) {}

  // Stream large CSV export
  async exportRegistrationsStream(eventId: string): Promise<Readable> {
    const stream = new Readable({
      objectMode: true,
      read() {} // No-op, we'll push data manually
    });

    // Add CSV header
    stream.push('Name,Email,Registration Date,Payment Status\n');

    // Process in batches to avoid memory issues
    const batchSize = 1000;
    let offset = 0;
    let hasMore = true;

    const processBatch = async () => {
      try {
        const registrations = await this.prisma.registration.findMany({
          where: { eventId },
          select: {
            fullName: true,
            email: true,
            createdAt: true,
            transactions: {
              select: { paymentStatus: true },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          },
          skip: offset,
          take: batchSize,
          orderBy: { createdAt: 'asc' }
        });

        if (registrations.length === 0) {
          hasMore = false;
          stream.push(null); // End stream
          return;
        }

        // Convert to CSV and push
        for (const reg of registrations) {
          const paymentStatus = reg.transactions[0]?.paymentStatus || 'PENDING';
          const csvRow = `"${reg.fullName}","${reg.email}","${reg.createdAt.toISOString()}","${paymentStatus}"\n`;
          stream.push(csvRow);
        }

        offset += batchSize;

        // Process next batch asynchronously
        if (hasMore) {
          setImmediate(processBatch);
        }
      } catch (error) {
        stream.destroy(error);
      }
    };

    // Start processing
    setImmediate(processBatch);

    return stream;
  }

  // Memory-efficient image processing
  async processEventImages(eventId: string): Promise<void> {
    const images = await this.prisma.eventImage.findMany({
      where: { eventId },
      select: { id: true, originalPath: true }
    });

    // Process images in parallel but limit concurrency
    const concurrency = 3;
    const semaphore = new Semaphore(concurrency);

    await Promise.all(
      images.map(async (image) => {
        await semaphore.acquire();
        try {
          await this.processImage(image);
        } finally {
          semaphore.release();
        }
      })
    );
  }

  private async processImage(image: any): Promise<void> {
    // Use streams for memory-efficient image processing
    const inputStream = fs.createReadStream(image.originalPath);
    const outputPath = `processed/${image.id}.webp`;
    const outputStream = fs.createWriteStream(outputPath);

    await pipeline(
      inputStream,
      sharp()
        .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 }),
      outputStream
    );
  }
}

// Resource pooling
class ResourcePool<T> {
  private available: T[] = [];
  private inUse = new Set<T>();
  private waitingQueue: Array<(resource: T) => void> = [];

  constructor(
    private factory: () => T,
    private destroyer: (resource: T) => void,
    private maxSize: number = 10
  ) {
    // Pre-populate pool
    for (let i = 0; i < Math.min(3, maxSize); i++) {
      this.available.push(this.factory());
    }
  }

  async acquire(): Promise<T> {
    return new Promise((resolve) => {
      if (this.available.length > 0) {
        const resource = this.available.pop()!;
        this.inUse.add(resource);
        resolve(resource);
        return;
      }

      if (this.inUse.size < this.maxSize) {
        const resource = this.factory();
        this.inUse.add(resource);
        resolve(resource);
        return;
      }

      // Wait for resource to become available
      this.waitingQueue.push(resolve);
    });
  }

  release(resource: T): void {
    if (!this.inUse.has(resource)) return;

    this.inUse.delete(resource);

    if (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift()!;
      this.inUse.add(resource);
      waiter(resource);
    } else {
      this.available.push(resource);
    }
  }

  destroy(): void {
    [...this.available, ...this.inUse].forEach(this.destroyer);
    this.available = [];
    this.inUse.clear();
  }
}

// Usage: PDF generation pool
const pdfPool = new ResourcePool(
  () => new PDFDocument(),
  (doc) => doc.end(),
  5
);
```

## 📈 Performance Monitoring

### Application Performance Monitoring
```typescript
// ========================
// PERFORMANCE MONITORING
// ========================

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

@Injectable()
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  
  constructor(
    private metricsService: MetricsService,
    private alertService: AlertService
  ) {}

  // Method execution time tracking
  trackExecutionTime(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = process.hrtime.bigint();
      
      try {
        const result = await originalMethod.apply(this, args);
        
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds

        this.performanceMonitor?.recordMetric({
          name: 'method_execution_time',
          value: duration,
          unit: 'ms',
          timestamp: new Date(),
          tags: {
            method: propertyName,
            class: target.constructor.name
          }
        });

        // Alert on slow operations
        if (duration > 5000) { // 5 seconds
          this.performanceMonitor?.alertService.sendAlert({
            level: 'warning',
            message: `Slow operation detected: ${propertyName} took ${duration}ms`
          });
        }

        return result;
      } catch (error) {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1_000_000;

        this.performanceMonitor?.recordMetric({
          name: 'method_execution_time',
          value: duration,
          unit: 'ms',
          timestamp: new Date(),
          tags: {
            method: propertyName,
            class: target.constructor.name,
            error: 'true'
          }
        });

        throw error;
      }
    };

    return descriptor;
  }

  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Send to monitoring service
    this.metricsService.send(metric);

    // Keep only recent metrics in memory
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  // Database query performance tracking
  async trackDatabaseQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = process.hrtime.bigint();
    
    try {
      const result = await queryFn();
      
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1_000_000;

      this.recordMetric({
        name: 'database_query_time',
        value: duration,
        unit: 'ms',
        timestamp: new Date(),
        tags: { query: queryName }
      });

      return result;
    } catch (error) {
      this.recordMetric({
        name: 'database_query_error',
        value: 1,
        unit: 'count',
        timestamp: new Date(),
        tags: { query: queryName, error: error.message }
      });

      throw error;
    }
  }

  // Memory usage tracking
  trackMemoryUsage(): void {
    const memUsage = process.memoryUsage();
    
    Object.entries(memUsage).forEach(([key, value]) => {
      this.recordMetric({
        name: `memory_${key}`,
        value: value / 1024 / 1024, // Convert to MB
        unit: 'MB',
        timestamp: new Date()
      });
    });
  }

  // Custom performance decorator
  static Monitor(metricName?: string) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const monitor = new PerformanceMonitor(null as any, null as any);
      return monitor.trackExecutionTime(target, propertyName, descriptor);
    };
  }
}

// Usage
@Injectable()
export class MonitoredEventsService {
  constructor(
    private prisma: PrismaService,
    private performanceMonitor: PerformanceMonitor
  ) {}

  @PerformanceMonitor.Monitor('get_events')
  async getEvents(query: EventsQuery): Promise<Event[]> {
    return this.performanceMonitor.trackDatabaseQuery(
      'events_find_many',
      () => this.prisma.event.findMany({
        where: this.buildWhereClause(query),
        include: {
          _count: { select: { registrations: true } }
        }
      })
    );
  }

  @PerformanceMonitor.Monitor('create_event')
  async createEvent(data: CreateEventDto): Promise<Event> {
    return this.performanceMonitor.trackDatabaseQuery(
      'event_create',
      () => this.prisma.event.create({ data })
    );
  }
}
```

## 🏃‍♂️ Practical Exercises

### Exercise 1: Database Optimization
Optimize these queries:
- Find events with registration counts
- Get user's registration history
- Generate financial reports
- Search events by multiple criteria

### Exercise 2: Caching Strategy
Implement caching for:
- User session data
- Event listings
- Registration statistics
- Search results

### Exercise 3: Performance Testing
Create performance tests for:
- API endpoint load testing
- Database query performance
- Memory usage under load
- Cache hit/miss ratios

## 📝 Summary

### Performance Optimization Strategies
1. **Database**: Indexing, query optimization, connection pooling
2. **Caching**: Multi-level caching, cache invalidation
3. **Async Processing**: Queues, background jobs
4. **Resource Management**: Pooling, streaming, memory optimization
5. **Monitoring**: Metrics, alerting, profiling

### Common Performance Issues
- **N+1 Queries**: Use eager loading or batch queries
- **Memory Leaks**: Proper resource cleanup
- **Blocking Operations**: Use async processing
- **Cache Misses**: Optimize cache strategies
- **Inefficient Algorithms**: Use appropriate data structures

### Next Steps
- Complete the exercises above
- Implement monitoring in your applications
- Proceed to [Testing Strategies](../04-specialized/testing-strategies.md)

---

**Estimated Study Time**: 12-15 hours  
**Prerequisites**: Security Engineering, Database Design  
**Next Module**: [Testing Strategies](../04-specialized/testing-strategies.md)
