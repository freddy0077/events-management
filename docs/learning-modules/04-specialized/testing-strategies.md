# Module 4.1: Testing Strategies

## 🎯 Learning Objectives

By the end of this module, you will understand:
- Comprehensive testing strategies and methodologies
- Unit, integration, and end-to-end testing approaches
- Test-driven development (TDD) and behavior-driven development (BDD)
- Testing implementation in the Events Registration System

## 🧪 Testing Fundamentals

### Testing Pyramid
**Unit Tests (70%)**: Fast, isolated, test individual components
**Integration Tests (20%)**: Test component interactions
**End-to-End Tests (10%)**: Test complete user workflows

### Testing Principles
1. **Fast**: Tests should run quickly
2. **Independent**: Tests shouldn't depend on each other
3. **Repeatable**: Same results every time
4. **Self-Validating**: Clear pass/fail results
5. **Timely**: Written at the right time

## 🔬 Unit Testing

### Jest Configuration & Setup
```typescript
// ========================
// JEST CONFIGURATION
// ========================

// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/**/*.module.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts']
};

// src/test/setup.ts
import { PrismaClient } from '@prisma/client';

// Global test setup
beforeAll(async () => {
  // Setup test database
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5433/events_test';
});

afterEach(async () => {
  // Clean up after each test
  const prisma = new PrismaClient();
  await prisma.$executeRaw`TRUNCATE TABLE registrations CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE events CASCADE`;
  await prisma.$disconnect();
});
```

### Service Unit Tests
```typescript
// ========================
// SERVICE UNIT TESTS
// ========================

describe('EventsService', () => {
  let service: EventsService;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheService: jest.Mocked<CacheService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: {
            event: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn()
            }
          }
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            invalidate: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<EventsService>(EventsService);
    prismaService = module.get(PrismaService);
    cacheService = module.get(CacheService);
  });

  describe('createEvent', () => {
    it('should create an event successfully', async () => {
      // Arrange
      const createEventDto: CreateEventDto = {
        name: 'Test Event',
        slug: 'test-event',
        date: new Date('2024-06-15'),
        venue: 'Test Venue',
        maxCapacity: 100
      };

      const expectedEvent = {
        id: 'event-id',
        ...createEventDto,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      prismaService.event.create.mockResolvedValue(expectedEvent);

      // Act
      const result = await service.createEvent(createEventDto, 'user-id');

      // Assert
      expect(prismaService.event.create).toHaveBeenCalledWith({
        data: {
          ...createEventDto,
          createdBy: 'user-id'
        }
      });
      expect(result).toEqual(expectedEvent);
      expect(cacheService.invalidate).toHaveBeenCalledWith('events:upcoming');
    });

    it('should throw error for duplicate slug', async () => {
      // Arrange
      const createEventDto: CreateEventDto = {
        name: 'Test Event',
        slug: 'existing-slug',
        date: new Date('2024-06-15'),
        venue: 'Test Venue'
      };

      prismaService.event.create.mockRejectedValue(
        new Error('Unique constraint violation')
      );

      // Act & Assert
      await expect(
        service.createEvent(createEventDto, 'user-id')
      ).rejects.toThrow('Unique constraint violation');
    });
  });

  describe('getUpcomingEvents', () => {
    it('should return cached events if available', async () => {
      // Arrange
      const cachedEvents = [
        { id: '1', name: 'Event 1', date: new Date() },
        { id: '2', name: 'Event 2', date: new Date() }
      ];

      cacheService.get.mockResolvedValue(cachedEvents);

      // Act
      const result = await service.getUpcomingEvents(10);

      // Assert
      expect(cacheService.get).toHaveBeenCalledWith('events:upcoming:10');
      expect(result).toEqual(cachedEvents);
      expect(prismaService.event.findMany).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache if not cached', async () => {
      // Arrange
      const dbEvents = [
        { id: '1', name: 'Event 1', date: new Date() }
      ];

      cacheService.get.mockResolvedValue(null);
      prismaService.event.findMany.mockResolvedValue(dbEvents);

      // Act
      const result = await service.getUpcomingEvents(5);

      // Assert
      expect(cacheService.get).toHaveBeenCalledWith('events:upcoming:5');
      expect(prismaService.event.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          date: { gte: expect.any(Date) }
        },
        orderBy: { date: 'asc' },
        take: 5
      });
      expect(cacheService.set).toHaveBeenCalledWith(
        'events:upcoming:5',
        dbEvents,
        300
      );
      expect(result).toEqual(dbEvents);
    });
  });
});
```

### Controller Unit Tests
```typescript
// ========================
// CONTROLLER UNIT TESTS
// ========================

describe('EventsController', () => {
  let controller: EventsController;
  let eventsService: jest.Mocked<EventsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: {
            createEvent: jest.fn(),
            getUpcomingEvents: jest.fn(),
            findById: jest.fn(),
            updateEvent: jest.fn(),
            deleteEvent: jest.fn()
          }
        }
      ]
    }).compile();

    controller = module.get<EventsController>(EventsController);
    eventsService = module.get(EventsService);
  });

  describe('POST /events', () => {
    it('should create event and return 201', async () => {
      // Arrange
      const createEventDto: CreateEventDto = {
        name: 'Test Event',
        slug: 'test-event',
        date: new Date('2024-06-15'),
        venue: 'Test Venue'
      };

      const createdEvent = {
        id: 'event-id',
        ...createEventDto,
        isActive: true
      };

      eventsService.createEvent.mockResolvedValue(createdEvent);

      const mockRequest = {
        user: { id: 'user-id', role: 'EVENT_ORGANIZER' }
      } as any;

      // Act
      const result = await controller.createEvent(createEventDto, mockRequest);

      // Assert
      expect(eventsService.createEvent).toHaveBeenCalledWith(
        createEventDto,
        'user-id'
      );
      expect(result).toEqual(createdEvent);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidDto = {
        name: '', // Invalid: empty name
        slug: 'test-event',
        date: new Date('2024-06-15'),
        venue: 'Test Venue'
      } as CreateEventDto;

      // This would be caught by validation pipe in real scenario
      // Here we test the service error handling
      eventsService.createEvent.mockRejectedValue(
        new BadRequestException('Validation failed')
      );

      const mockRequest = {
        user: { id: 'user-id', role: 'EVENT_ORGANIZER' }
      } as any;

      // Act & Assert
      await expect(
        controller.createEvent(invalidDto, mockRequest)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('GET /events/:id', () => {
    it('should return event if found', async () => {
      // Arrange
      const eventId = 'event-id';
      const event = {
        id: eventId,
        name: 'Test Event',
        date: new Date(),
        venue: 'Test Venue'
      };

      eventsService.findById.mockResolvedValue(event);

      // Act
      const result = await controller.getEvent(eventId);

      // Assert
      expect(eventsService.findById).toHaveBeenCalledWith(eventId);
      expect(result).toEqual(event);
    });

    it('should throw 404 if event not found', async () => {
      // Arrange
      const eventId = 'non-existent-id';
      eventsService.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        controller.getEvent(eventId)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
```

## 🔗 Integration Testing

### Database Integration Tests
```typescript
// ========================
// DATABASE INTEGRATION TESTS
// ========================

describe('EventsService Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let eventsService: EventsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    eventsService = app.get<EventsService>(EventsService);

    await app.init();
  });

  beforeEach(async () => {
    // Clean database before each test
    await prisma.registration.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('Event CRUD Operations', () => {
    it('should create, read, update, and delete event', async () => {
      // Create user first
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed-password',
          role: 'EVENT_ORGANIZER',
          firstName: 'Test',
          lastName: 'User'
        }
      });

      // Create event
      const createEventDto: CreateEventDto = {
        name: 'Integration Test Event',
        slug: 'integration-test-event',
        date: new Date('2024-06-15T10:00:00Z'),
        venue: 'Test Venue',
        maxCapacity: 100
      };

      const createdEvent = await eventsService.createEvent(createEventDto, user.id);

      expect(createdEvent).toMatchObject({
        name: createEventDto.name,
        slug: createEventDto.slug,
        venue: createEventDto.venue,
        maxCapacity: createEventDto.maxCapacity,
        createdBy: user.id
      });

      // Read event
      const foundEvent = await eventsService.findById(createdEvent.id);
      expect(foundEvent).toMatchObject(createdEvent);

      // Update event
      const updateDto = { name: 'Updated Event Name' };
      const updatedEvent = await eventsService.updateEvent(createdEvent.id, updateDto);
      expect(updatedEvent.name).toBe('Updated Event Name');

      // Delete event
      await eventsService.deleteEvent(createdEvent.id);
      const deletedEvent = await eventsService.findById(createdEvent.id);
      expect(deletedEvent).toBeNull();
    });

    it('should handle event with registrations', async () => {
      // Create user and event
      const user = await prisma.user.create({
        data: {
          email: 'organizer@example.com',
          passwordHash: 'hashed-password',
          role: 'EVENT_ORGANIZER',
          firstName: 'Event',
          lastName: 'Organizer'
        }
      });

      const event = await eventsService.createEvent({
        name: 'Event with Registrations',
        slug: 'event-with-registrations',
        date: new Date('2024-06-15T10:00:00Z'),
        venue: 'Test Venue'
      }, user.id);

      // Create category
      const category = await prisma.category.create({
        data: {
          eventId: event.id,
          name: 'Standard',
          price: 99.99
        }
      });

      // Create registrations
      const registrations = await Promise.all([
        prisma.registration.create({
          data: {
            eventId: event.id,
            categoryId: category.id,
            fullName: 'John Doe',
            email: 'john@example.com',
            qrCode: 'qr-code-1'
          }
        }),
        prisma.registration.create({
          data: {
            eventId: event.id,
            categoryId: category.id,
            fullName: 'Jane Smith',
            email: 'jane@example.com',
            qrCode: 'qr-code-2'
          }
        })
      ]);

      // Test event with registration count
      const eventWithStats = await eventsService.getEventStatistics(event.id);
      expect(eventWithStats.registrationCount).toBe(2);
    });
  });
});
```

### API Integration Tests
```typescript
// ========================
// API INTEGRATION TESTS
// ========================

describe('Events API Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);

    // Apply validation pipes and guards like in production
    app.useGlobalPipes(new ValidationPipe());
    
    await app.init();

    // Create test user and get auth token
    authToken = await createTestUserAndGetToken();
  });

  async function createTestUserAndGetToken(): Promise<string> {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'EVENT_ORGANIZER',
        firstName: 'Test',
        lastName: 'User'
      }
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      })
      .expect(200);

    return response.body.accessToken;
  }

  beforeEach(async () => {
    // Clean up before each test
    await prisma.registration.deleteMany();
    await prisma.category.deleteMany();
    await prisma.event.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /api/v1/events', () => {
    it('should create event with valid data', async () => {
      const createEventDto = {
        name: 'API Test Event',
        slug: 'api-test-event',
        date: '2024-06-15T10:00:00Z',
        venue: 'API Test Venue',
        maxCapacity: 100,
        categories: [
          { name: 'Standard', price: 99.99 },
          { name: 'VIP', price: 199.99 }
        ]
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createEventDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: createEventDto.name,
        slug: createEventDto.slug,
        venue: createEventDto.venue,
        maxCapacity: createEventDto.maxCapacity
      });

      // Verify in database
      const eventInDb = await prisma.event.findUnique({
        where: { id: response.body.id },
        include: { categories: true }
      });

      expect(eventInDb).toBeTruthy();
      expect(eventInDb.categories).toHaveLength(2);
    });

    it('should return 400 for invalid data', async () => {
      const invalidDto = {
        name: '', // Invalid: empty name
        slug: 'invalid-event',
        date: 'invalid-date', // Invalid: not a valid date
        venue: 'Test Venue'
      };

      await request(app.getHttpServer())
        .post('/api/v1/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      const createEventDto = {
        name: 'Unauthorized Event',
        slug: 'unauthorized-event',
        date: '2024-06-15T10:00:00Z',
        venue: 'Test Venue'
      };

      await request(app.getHttpServer())
        .post('/api/v1/events')
        .send(createEventDto)
        .expect(401);
    });
  });

  describe('GET /api/v1/events', () => {
    beforeEach(async () => {
      // Create test events
      const user = await prisma.user.findFirst();
      
      await Promise.all([
        prisma.event.create({
          data: {
            name: 'Past Event',
            slug: 'past-event',
            date: new Date('2023-01-01'),
            venue: 'Past Venue',
            createdBy: user.id
          }
        }),
        prisma.event.create({
          data: {
            name: 'Future Event',
            slug: 'future-event',
            date: new Date('2025-01-01'),
            venue: 'Future Venue',
            createdBy: user.id
          }
        })
      ]);
    });

    it('should return paginated events', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/events?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toMatchObject({
        page: 1,
        limit: 10
      });
    });

    it('should filter upcoming events', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/events?upcoming=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Future Event');
    });
  });
});
```

## 🎭 End-to-End Testing

### E2E Test Setup with Playwright
```typescript
// ========================
// E2E TESTING WITH PLAYWRIGHT
// ========================

// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run start:e2e',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});

// e2e/fixtures/test-data.ts
export class TestDataManager {
  constructor(private apiContext: APIRequestContext) {}

  async createTestUser(role: string = 'EVENT_ORGANIZER') {
    const response = await this.apiContext.post('/api/test/users', {
      data: {
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        role,
        firstName: 'Test',
        lastName: 'User'
      }
    });

    return response.json();
  }

  async createTestEvent(userId: string) {
    const response = await this.apiContext.post('/api/test/events', {
      data: {
        name: `Test Event ${Date.now()}`,
        slug: `test-event-${Date.now()}`,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        venue: 'Test Venue',
        maxCapacity: 100,
        createdBy: userId
      }
    });

    return response.json();
  }

  async cleanup() {
    await this.apiContext.delete('/api/test/cleanup');
  }
}
```

### E2E Test Implementation
```typescript
// ========================
// E2E TEST SCENARIOS
// ========================

// e2e/event-management.spec.ts
import { test, expect } from '@playwright/test';
import { TestDataManager } from './fixtures/test-data';

test.describe('Event Management', () => {
  let testData: TestDataManager;
  let user: any;
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    testData = new TestDataManager(request);
    user = await testData.createTestUser('EVENT_ORGANIZER');
    
    // Login to get auth token
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: user.email,
        password: 'password123'
      }
    });
    
    const loginData = await loginResponse.json();
    authToken = loginData.accessToken;
  });

  test.afterAll(async () => {
    await testData.cleanup();
  });

  test('should create event end-to-end', async ({ page, request }) => {
    // Set auth token in browser
    await page.addInitScript((token) => {
      localStorage.setItem('authToken', token);
    }, authToken);

    // Navigate to create event page
    await page.goto('/admin/events/new');

    // Fill event form
    await page.fill('[data-testid="event-name"]', 'E2E Test Event');
    await page.fill('[data-testid="event-slug"]', 'e2e-test-event');
    await page.fill('[data-testid="event-venue"]', 'E2E Test Venue');
    await page.fill('[data-testid="event-date"]', '2024-06-15');
    await page.fill('[data-testid="event-time"]', '10:00');
    await page.fill('[data-testid="event-capacity"]', '100');

    // Add category
    await page.click('[data-testid="add-category"]');
    await page.fill('[data-testid="category-name-0"]', 'Standard');
    await page.fill('[data-testid="category-price-0"]', '99.99');

    // Submit form
    await page.click('[data-testid="create-event"]');

    // Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Verify event appears in list
    await page.goto('/admin/events');
    await expect(page.locator('text=E2E Test Event')).toBeVisible();

    // Verify event details page
    await page.click('text=E2E Test Event');
    await expect(page.locator('h1')).toContainText('E2E Test Event');
    await expect(page.locator('[data-testid="event-venue"]')).toContainText('E2E Test Venue');
  });

  test('should handle registration workflow', async ({ page, request }) => {
    // Create test event first
    const event = await testData.createTestEvent(user.id);

    // Navigate to registration page
    await page.goto(`/register/${event.slug}`);

    // Fill registration form
    await page.fill('[data-testid="full-name"]', 'John Doe');
    await page.fill('[data-testid="email"]', 'john.doe@example.com');
    await page.fill('[data-testid="phone"]', '+1234567890');

    // Select category
    await page.click('[data-testid="category-standard"]');

    // Submit registration
    await page.click('[data-testid="submit-registration"]');

    // Handle payment (if required)
    if (await page.locator('[data-testid="payment-form"]').isVisible()) {
      await page.fill('[data-testid="card-number"]', '4242424242424242');
      await page.fill('[data-testid="card-expiry"]', '12/25');
      await page.fill('[data-testid="card-cvc"]', '123');
      await page.click('[data-testid="pay-now"]');
    }

    // Verify success
    await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();

    // Verify registration in admin panel
    await page.addInitScript((token) => {
      localStorage.setItem('authToken', token);
    }, authToken);

    await page.goto(`/admin/events/${event.id}/registrations`);
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=john.doe@example.com')).toBeVisible();
  });

  test('should handle check-in process', async ({ page, request }) => {
    // Create event and registration
    const event = await testData.createTestEvent(user.id);
    
    const registrationResponse = await request.post(`/api/events/${event.id}/registrations`, {
      data: {
        fullName: 'Jane Smith',
        email: 'jane.smith@example.com',
        categoryId: event.categories[0].id
      }
    });
    
    const registration = await registrationResponse.json();

    // Set auth token
    await page.addInitScript((token) => {
      localStorage.setItem('authToken', token);
    }, authToken);

    // Navigate to check-in page
    await page.goto(`/staff/check-in`);

    // Scan QR code (simulate by entering QR code)
    await page.fill('[data-testid="qr-input"]', registration.qrCode);
    await page.press('[data-testid="qr-input"]', 'Enter');

    // Verify check-in success
    await expect(page.locator('[data-testid="checkin-success"]')).toBeVisible();
    await expect(page.locator('text=Jane Smith')).toBeVisible();

    // Verify badge generation
    await expect(page.locator('[data-testid="badge-preview"]')).toBeVisible();
    
    // Print badge
    await page.click('[data-testid="print-badge"]');
    
    // Verify print dialog or success message
    await expect(page.locator('[data-testid="print-success"]')).toBeVisible();
  });
});
```

## 🏃‍♂️ Practical Exercises

### Exercise 1: TDD Implementation
Implement a new feature using TDD:
- Write failing tests first
- Implement minimum code to pass
- Refactor while keeping tests green

### Exercise 2: Test Coverage Analysis
Analyze and improve test coverage:
- Identify untested code paths
- Add missing unit tests
- Optimize test performance

### Exercise 3: E2E Test Suite
Create comprehensive E2E tests for:
- User authentication flow
- Event creation and management
- Registration and payment process
- Staff check-in workflow

## 📝 Summary

### Testing Best Practices
1. **Test Pyramid**: More unit tests, fewer E2E tests
2. **Fast Feedback**: Quick test execution
3. **Isolation**: Independent, repeatable tests
4. **Coverage**: Aim for 80%+ code coverage
5. **Maintainability**: Keep tests simple and focused

### Testing Tools
- **Unit Testing**: Jest, Vitest
- **Integration Testing**: Supertest, Test containers
- **E2E Testing**: Playwright, Cypress
- **Mocking**: Jest mocks, MSW
- **Coverage**: Istanbul, c8

### Next Steps
- Complete the exercises above
- Implement comprehensive test suites
- Proceed to [DevOps & Deployment](./devops-deployment.md)

---

**Estimated Study Time**: 15-18 hours  
**Prerequisites**: Performance Engineering  
**Next Module**: [DevOps & Deployment](./devops-deployment.md)
