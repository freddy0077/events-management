# Module 2.1: Architectural Patterns

## 🎯 Learning Objectives

By the end of this module, you will understand:
- Different architectural patterns and their trade-offs
- How to choose the right architecture for your project
- Implementation strategies for common patterns
- Real-world architectural decisions from the Events Registration System

## 📚 What is Software Architecture?

**Definition**: Software architecture is the fundamental organization of a software system, including its components, their relationships, and the principles governing its design and evolution.

**Key Responsibilities**:
- **Structure**: How components are organized and interact
- **Behavior**: How the system responds to requests and events
- **Quality Attributes**: Performance, scalability, maintainability, security
- **Constraints**: Technology choices, business requirements, resources

## 🏗️ Layered Architecture

**Definition**: An architectural pattern that organizes code into horizontal layers, each with specific responsibilities.

**Benefits**:
- Clear separation of concerns
- Easy to understand and maintain
- Testable in isolation
- Technology independence

**Drawbacks**:
- Can become rigid
- Performance overhead from layer traversal
- Risk of becoming a "big ball of mud"

### Implementation Example:

```typescript
// ========================
// PRESENTATION LAYER
// ========================
@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Get()
  async getEvents(@Query() query: GetEventsQuery): Promise<Event[]> {
    return this.eventsService.findAll(query);
  }

  @Post()
  async createEvent(@Body() createEventDto: CreateEventDto): Promise<Event> {
    return this.eventsService.create(createEventDto);
  }
}

// ========================
// BUSINESS LOGIC LAYER
// ========================
@Injectable()
export class EventsService {
  constructor(
    private eventsRepository: EventsRepository,
    private notificationService: NotificationService,
    private auditService: AuditService
  ) {}

  async create(data: CreateEventDto): Promise<Event> {
    // Business logic and validation
    this.validateEventData(data);
    await this.checkEventConflicts(data);
    
    // Delegate to data layer
    const event = await this.eventsRepository.create(data);
    
    // Business operations
    await this.notificationService.notifyEventCreated(event);
    await this.auditService.logEventCreation(event.id);
    
    return event;
  }

  private validateEventData(data: CreateEventDto): void {
    if (data.date <= new Date()) {
      throw new BusinessLogicError('Event date must be in the future');
    }
    if (data.maxCapacity && data.maxCapacity < 1) {
      throw new BusinessLogicError('Max capacity must be positive');
    }
  }

  private async checkEventConflicts(data: CreateEventDto): Promise<void> {
    const conflictingEvents = await this.eventsRepository.findByVenueAndDate(
      data.venue, 
      data.date
    );
    if (conflictingEvents.length > 0) {
      throw new BusinessLogicError('Venue already booked for this date');
    }
  }
}

// ========================
// DATA ACCESS LAYER
// ========================
@Injectable()
export class EventsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateEventDto): Promise<Event> {
    return this.prisma.event.create({
      data: {
        ...data,
        slug: this.generateSlug(data.name),
        createdAt: new Date()
      }
    });
  }

  async findByVenueAndDate(venue: string, date: Date): Promise<Event[]> {
    return this.prisma.event.findMany({
      where: {
        venue,
        date: {
          gte: startOfDay(date),
          lte: endOfDay(date)
        }
      }
    });
  }

  private generateSlug(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  }
}
```

### Real-World Example from Events Registration System:

```typescript
// The system follows a clean 3-tier layered architecture:

// 1. PRESENTATION LAYER (GraphQL Resolvers)
@Resolver(() => Registration)
export class RegistrationResolver {
  constructor(private registrationService: RegistrationService) {}

  @Mutation(() => RegistrationPayload)
  async createRegistration(@Args('input') input: CreateRegistrationInput) {
    return this.registrationService.createRegistration(input);
  }
}

// 2. BUSINESS LOGIC LAYER (Services)
@Injectable()
export class RegistrationService {
  constructor(
    private prisma: PrismaService,
    private qrCodeService: QRCodeService,
    private auditService: AuditService
  ) {}

  async createRegistration(data: CreateRegistrationInput): Promise<Registration> {
    // Business logic here
    await this.validateRegistration(data);
    const registration = await this.prisma.registration.create({ data });
    await this.qrCodeService.generateQRCode(registration.id);
    return registration;
  }
}

// 3. DATA ACCESS LAYER (Prisma ORM)
// Handled by Prisma which abstracts database operations
```

## 🔄 Event-Driven Architecture

**Definition**: An architectural pattern where components communicate through events, promoting loose coupling and scalability.

**Benefits**:
- Loose coupling between components
- High scalability and flexibility
- Easy to add new features
- Natural fit for distributed systems

**Drawbacks**:
- Complexity in debugging and tracing
- Eventual consistency challenges
- Event ordering and replay concerns

### Implementation Example:

```typescript
// ========================
// EVENT DEFINITIONS
// ========================
interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  timestamp: Date;
  version: number;
  data: any;
}

class UserRegisteredEvent implements DomainEvent {
  constructor(
    public id: string,
    public aggregateId: string,
    public timestamp: Date,
    public version: number,
    public data: {
      userId: string;
      email: string;
      eventId: string;
    }
  ) {}

  type = 'USER_REGISTERED';
}

class PaymentProcessedEvent implements DomainEvent {
  constructor(
    public id: string,
    public aggregateId: string,
    public timestamp: Date,
    public version: number,
    public data: {
      registrationId: string;
      amount: number;
      paymentMethod: string;
    }
  ) {}

  type = 'PAYMENT_PROCESSED';
}

// ========================
// EVENT BUS
// ========================
interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, handler: EventHandler): void;
}

interface EventHandler {
  handle(event: DomainEvent): Promise<void>;
}

@Injectable()
export class InMemoryEventBus implements EventBus {
  private handlers = new Map<string, EventHandler[]>();

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    await Promise.all(handlers.map(handler => handler.handle(event)));
  }

  subscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }
}

// ========================
// EVENT HANDLERS
// ========================
@Injectable()
export class EmailNotificationHandler implements EventHandler {
  constructor(private emailService: EmailService) {}

  async handle(event: DomainEvent): Promise<void> {
    if (event.type === 'USER_REGISTERED') {
      const { email, eventId } = event.data;
      await this.emailService.sendRegistrationConfirmation(email, eventId);
    }
  }
}

@Injectable()
export class AnalyticsHandler implements EventHandler {
  constructor(private analyticsService: AnalyticsService) {}

  async handle(event: DomainEvent): Promise<void> {
    await this.analyticsService.trackEvent(event.type, event.data);
  }
}

@Injectable()
export class BadgeGenerationHandler implements EventHandler {
  constructor(private badgeService: BadgeService) {}

  async handle(event: DomainEvent): Promise<void> {
    if (event.type === 'PAYMENT_PROCESSED') {
      const { registrationId } = event.data;
      await this.badgeService.generateBadge(registrationId);
    }
  }
}

// ========================
// AGGREGATE ROOT
// ========================
export abstract class AggregateRoot {
  private events: DomainEvent[] = [];

  protected raise(event: DomainEvent): void {
    this.events.push(event);
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

export class Registration extends AggregateRoot {
  constructor(
    private id: string,
    private eventId: string,
    private userId: string,
    private status: RegistrationStatus
  ) {
    super();
  }

  static create(eventId: string, userId: string, email: string): Registration {
    const registration = new Registration(
      generateId(),
      eventId,
      userId,
      RegistrationStatus.PENDING
    );

    registration.raise(new UserRegisteredEvent(
      generateId(),
      registration.id,
      new Date(),
      1,
      { userId, email, eventId }
    ));

    return registration;
  }

  processPayment(amount: number, paymentMethod: string): void {
    if (this.status !== RegistrationStatus.PENDING) {
      throw new Error('Registration is not in pending status');
    }

    this.status = RegistrationStatus.CONFIRMED;
    
    this.raise(new PaymentProcessedEvent(
      generateId(),
      this.id,
      new Date(),
      2,
      { registrationId: this.id, amount, paymentMethod }
    ));
  }
}
```

### Real-World Example from Events Registration System:

```typescript
// GraphQL Subscriptions implement event-driven pattern
@Resolver(() => Registration)
export class RegistrationResolver {
  constructor(private pubSub: PubSubEngine) {}

  @Subscription(() => Registration)
  registrationUpdated(@Args('eventId') eventId: string) {
    return this.pubSub.asyncIterator(`registration.${eventId}`);
  }

  @Mutation(() => Registration)
  async createRegistration(@Args('input') input: CreateRegistrationInput) {
    const registration = await this.registrationService.create(input);
    
    // Publish event to subscribers
    await this.pubSub.publish(`registration.${registration.eventId}`, {
      registrationUpdated: registration
    });
    
    return registration;
  }
}
```

## 🏢 Microservices Architecture

**Definition**: An architectural style that structures an application as a collection of loosely coupled, independently deployable services.

**Benefits**:
- Independent deployment and scaling
- Technology diversity
- Team autonomy
- Fault isolation

**Drawbacks**:
- Distributed system complexity
- Network latency and reliability
- Data consistency challenges
- Operational overhead

### Implementation Strategy:

```typescript
// ========================
// SERVICE BOUNDARIES
// ========================

// User Service
@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(data: CreateUserDto): Promise<User> {
    const user = await this.userRepository.create(data);
    await this.publishEvent('USER_CREATED', { userId: user.id });
    return user;
  }

  async getUserById(id: string): Promise<User> {
    return this.userRepository.findById(id);
  }
}

// Event Service
@Injectable()
export class EventService {
  constructor(
    private eventRepository: EventRepository,
    private userServiceClient: UserServiceClient
  ) {}

  async createEvent(data: CreateEventDto, organizerId: string): Promise<Event> {
    // Verify organizer exists (cross-service call)
    const organizer = await this.userServiceClient.getUserById(organizerId);
    if (!organizer) {
      throw new Error('Organizer not found');
    }

    const event = await this.eventRepository.create({
      ...data,
      organizerId
    });

    await this.publishEvent('EVENT_CREATED', { eventId: event.id });
    return event;
  }
}

// Registration Service
@Injectable()
export class RegistrationService {
  constructor(
    private registrationRepository: RegistrationRepository,
    private eventServiceClient: EventServiceClient,
    private userServiceClient: UserServiceClient
  ) {}

  async createRegistration(data: CreateRegistrationDto): Promise<Registration> {
    // Verify event exists and has capacity
    const event = await this.eventServiceClient.getEventById(data.eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // Verify user exists
    const user = await this.userServiceClient.getUserById(data.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const registration = await this.registrationRepository.create(data);
    await this.publishEvent('REGISTRATION_CREATED', { 
      registrationId: registration.id 
    });
    
    return registration;
  }
}

// ========================
// SERVICE COMMUNICATION
// ========================
interface ServiceClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, data: any): Promise<T>;
}

@Injectable()
export class HttpServiceClient implements ServiceClient {
  constructor(private httpService: HttpService) {}

  async get<T>(path: string): Promise<T> {
    const response = await this.httpService.get(path).toPromise();
    return response.data;
  }

  async post<T>(path: string, data: any): Promise<T> {
    const response = await this.httpService.post(path, data).toPromise();
    return response.data;
  }
}

@Injectable()
export class UserServiceClient {
  constructor(
    private serviceClient: ServiceClient,
    @Inject('USER_SERVICE_URL') private baseUrl: string
  ) {}

  async getUserById(id: string): Promise<User> {
    return this.serviceClient.get<User>(`${this.baseUrl}/users/${id}`);
  }

  async createUser(data: CreateUserDto): Promise<User> {
    return this.serviceClient.post<User>(`${this.baseUrl}/users`, data);
  }
}
```

## 🧅 Hexagonal Architecture (Ports and Adapters)

**Definition**: An architectural pattern that isolates the core business logic from external concerns through ports and adapters.

**Benefits**:
- Business logic independence
- Easy testing with mock adapters
- Technology flexibility
- Clear separation of concerns

### Implementation Example:

```typescript
// ========================
// CORE DOMAIN (CENTER)
// ========================
export class Event {
  constructor(
    private id: string,
    private name: string,
    private date: Date,
    private maxCapacity: number,
    private currentRegistrations: number = 0
  ) {}

  register(): void {
    if (this.isFull()) {
      throw new Error('Event is at full capacity');
    }
    this.currentRegistrations++;
  }

  isFull(): boolean {
    return this.currentRegistrations >= this.maxCapacity;
  }

  getAvailableSpots(): number {
    return this.maxCapacity - this.currentRegistrations;
  }
}

// ========================
// PORTS (INTERFACES)
// ========================
export interface EventRepository {
  save(event: Event): Promise<void>;
  findById(id: string): Promise<Event | null>;
  findByDate(date: Date): Promise<Event[]>;
}

export interface NotificationService {
  sendEventCreated(event: Event): Promise<void>;
  sendRegistrationConfirmation(email: string, event: Event): Promise<void>;
}

export interface PaymentProcessor {
  processPayment(amount: number, method: string): Promise<PaymentResult>;
}

// ========================
// USE CASES (APPLICATION LAYER)
// ========================
export class CreateEventUseCase {
  constructor(
    private eventRepository: EventRepository,
    private notificationService: NotificationService
  ) {}

  async execute(command: CreateEventCommand): Promise<Event> {
    const event = new Event(
      generateId(),
      command.name,
      command.date,
      command.maxCapacity
    );

    await this.eventRepository.save(event);
    await this.notificationService.sendEventCreated(event);

    return event;
  }
}

export class RegisterForEventUseCase {
  constructor(
    private eventRepository: EventRepository,
    private paymentProcessor: PaymentProcessor,
    private notificationService: NotificationService
  ) {}

  async execute(command: RegisterForEventCommand): Promise<void> {
    const event = await this.eventRepository.findById(command.eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    event.register();

    const paymentResult = await this.paymentProcessor.processPayment(
      command.amount,
      command.paymentMethod
    );

    if (!paymentResult.success) {
      throw new Error('Payment failed');
    }

    await this.eventRepository.save(event);
    await this.notificationService.sendRegistrationConfirmation(
      command.email,
      event
    );
  }
}

// ========================
// ADAPTERS (INFRASTRUCTURE)
// ========================
@Injectable()
export class PrismaEventRepository implements EventRepository {
  constructor(private prisma: PrismaService) {}

  async save(event: Event): Promise<void> {
    await this.prisma.event.upsert({
      where: { id: event.getId() },
      update: {
        name: event.getName(),
        date: event.getDate(),
        maxCapacity: event.getMaxCapacity(),
        currentRegistrations: event.getCurrentRegistrations()
      },
      create: {
        id: event.getId(),
        name: event.getName(),
        date: event.getDate(),
        maxCapacity: event.getMaxCapacity(),
        currentRegistrations: event.getCurrentRegistrations()
      }
    });
  }

  async findById(id: string): Promise<Event | null> {
    const eventData = await this.prisma.event.findUnique({ where: { id } });
    if (!eventData) return null;

    return new Event(
      eventData.id,
      eventData.name,
      eventData.date,
      eventData.maxCapacity,
      eventData.currentRegistrations
    );
  }
}

@Injectable()
export class EmailNotificationAdapter implements NotificationService {
  constructor(private emailService: EmailService) {}

  async sendEventCreated(event: Event): Promise<void> {
    await this.emailService.send({
      to: 'admin@example.com',
      subject: 'New Event Created',
      body: `Event "${event.getName()}" has been created.`
    });
  }

  async sendRegistrationConfirmation(email: string, event: Event): Promise<void> {
    await this.emailService.send({
      to: email,
      subject: 'Registration Confirmed',
      body: `You are registered for "${event.getName()}".`
    });
  }
}
```

## 🏃‍♂️ Practical Exercises

### Exercise 1: Architecture Analysis
Analyze the Events Registration System and identify:
1. Which architectural patterns are used?
2. How are the layers/components separated?
3. What are the benefits and drawbacks of the chosen architecture?

### Exercise 2: Design a Microservice
Design a notification microservice that:
- Handles email, SMS, and push notifications
- Integrates with the main events system
- Maintains its own database for notification history
- Provides REST and GraphQL APIs

### Exercise 3: Implement Hexagonal Architecture
Refactor a simple CRUD service to follow hexagonal architecture:
- Define clear ports (interfaces)
- Implement adapters for different data sources
- Create use cases for business logic
- Ensure the core domain is independent of infrastructure

## 📝 Summary

### Architecture Patterns Covered
1. **Layered Architecture**: Horizontal separation of concerns
2. **Event-Driven Architecture**: Loose coupling through events
3. **Microservices**: Independent, deployable services
4. **Hexagonal Architecture**: Core business logic isolation

### Choosing the Right Architecture
- **Layered**: Good for traditional web applications, clear team structure
- **Event-Driven**: Ideal for real-time systems, high scalability needs
- **Microservices**: Large teams, independent deployment requirements
- **Hexagonal**: Complex business logic, multiple integration points

### Next Steps
- Complete the exercises above
- Study the Events Registration System architecture
- Practice implementing different patterns
- Proceed to [System Design](./system-design.md)

---

**Estimated Study Time**: 10-12 hours  
**Prerequisites**: Fundamentals modules completed  
**Next Module**: [System Design](./system-design.md)
