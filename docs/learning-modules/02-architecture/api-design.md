# Module 2.4: API Design

## 🎯 Learning Objectives

By the end of this module, you will understand:
- REST and GraphQL API design principles
- API versioning and documentation strategies
- Authentication and authorization patterns
- Real-world API implementations from the Events Registration System

## 📚 API Design Fundamentals

**Definition**: API (Application Programming Interface) design is the process of creating interfaces that allow different software components to communicate effectively.

**Key Principles**:
- **Consistency**: Uniform patterns across endpoints
- **Simplicity**: Easy to understand and use
- **Flexibility**: Support various use cases
- **Security**: Protect against unauthorized access
- **Performance**: Efficient data transfer

## 🌐 RESTful API Design

### REST Principles
1. **Stateless**: Each request contains all necessary information
2. **Client-Server**: Clear separation of concerns
3. **Cacheable**: Responses should be cacheable when appropriate
4. **Uniform Interface**: Consistent resource identification
5. **Layered System**: Architecture can have multiple layers

### Resource Design
```typescript
// ========================
// RESOURCE NAMING CONVENTIONS
// ========================

interface RESTEndpoints {
  // Collection resources (plural nouns)
  events: {
    "GET /api/v1/events": "List all events";
    "POST /api/v1/events": "Create new event";
  };
  
  // Individual resources
  event: {
    "GET /api/v1/events/{id}": "Get specific event";
    "PUT /api/v1/events/{id}": "Update entire event";
    "PATCH /api/v1/events/{id}": "Partial update event";
    "DELETE /api/v1/events/{id}": "Delete event";
  };
  
  // Nested resources
  eventRegistrations: {
    "GET /api/v1/events/{id}/registrations": "List event registrations";
    "POST /api/v1/events/{id}/registrations": "Register for event";
  };
  
  // Actions on resources (use verbs sparingly)
  eventActions: {
    "POST /api/v1/events/{id}/publish": "Publish event";
    "POST /api/v1/events/{id}/cancel": "Cancel event";
    "POST /api/v1/registrations/{id}/check-in": "Check in participant";
  };
}
```

### HTTP Status Codes
```typescript
// ========================
// PROPER STATUS CODE USAGE
// ========================

enum HTTPStatus {
  // Success responses
  OK = 200,                    // Successful GET, PUT, PATCH
  CREATED = 201,              // Successful POST
  NO_CONTENT = 204,           // Successful DELETE
  
  // Client error responses
  BAD_REQUEST = 400,          // Invalid request data
  UNAUTHORIZED = 401,         // Authentication required
  FORBIDDEN = 403,            // Insufficient permissions
  NOT_FOUND = 404,            // Resource doesn't exist
  CONFLICT = 409,             // Resource conflict (duplicate)
  UNPROCESSABLE_ENTITY = 422, // Validation errors
  
  // Server error responses
  INTERNAL_SERVER_ERROR = 500, // Server error
  SERVICE_UNAVAILABLE = 503    // Temporary server issue
}

// Example controller with proper status codes
@Controller('api/v1/events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Get()
  async getEvents(@Query() query: GetEventsQuery): Promise<EventsResponse> {
    const events = await this.eventsService.findAll(query);
    return {
      data: events,
      meta: {
        total: events.length,
        page: query.page || 1,
        limit: query.limit || 10
      }
    }; // Returns 200 OK
  }

  @Post()
  @HttpCode(201)
  async createEvent(@Body() createEventDto: CreateEventDto): Promise<Event> {
    return this.eventsService.create(createEventDto); // Returns 201 Created
  }

  @Get(':id')
  async getEvent(@Param('id') id: string): Promise<Event> {
    const event = await this.eventsService.findById(id);
    if (!event) {
      throw new NotFoundException('Event not found'); // Returns 404
    }
    return event; // Returns 200 OK
  }

  @Put(':id')
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto
  ): Promise<Event> {
    try {
      return await this.eventsService.update(id, updateEventDto); // Returns 200 OK
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new UnprocessableEntityException(error.message); // Returns 422
      }
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteEvent(@Param('id') id: string): Promise<void> {
    await this.eventsService.delete(id); // Returns 204 No Content
  }
}
```

### Request/Response Design
```typescript
// ========================
// CONSISTENT DATA STRUCTURES
// ========================

// Standard response wrapper
interface APIResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
  links?: {
    self: string;
    next?: string;
    prev?: string;
  };
}

// Error response format
interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path: string;
  };
}

// Pagination parameters
interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Filtering parameters
interface EventsQuery extends PaginationQuery {
  search?: string;
  venue?: string;
  startDate?: string;
  endDate?: string;
  status?: 'active' | 'inactive';
}

// Example implementation
@Get()
async getEvents(@Query() query: EventsQuery): Promise<APIResponse<Event[]>> {
  const { page = 1, limit = 10, ...filters } = query;
  const offset = (page - 1) * limit;
  
  const [events, total] = await Promise.all([
    this.eventsService.findMany(filters, { offset, limit }),
    this.eventsService.count(filters)
  ]);
  
  const hasNext = offset + limit < total;
  const hasPrev = page > 1;
  
  return {
    data: events,
    meta: {
      total,
      page,
      limit,
      hasNext,
      hasPrev
    },
    links: {
      self: `/api/v1/events?page=${page}&limit=${limit}`,
      ...(hasNext && { next: `/api/v1/events?page=${page + 1}&limit=${limit}` }),
      ...(hasPrev && { prev: `/api/v1/events?page=${page - 1}&limit=${limit}` })
    }
  };
}
```

## 🔍 GraphQL API Design

### Schema Design
```graphql
# ========================
# TYPE DEFINITIONS
# ========================

# Scalar types
scalar DateTime
scalar Email
scalar URL

# Enums for type safety
enum UserRole {
  ADMIN
  EVENT_ORGANIZER
  REGISTRATION_STAFF
  FINANCE_TEAM
  CATERING_TEAM
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

# Core types
type User {
  id: ID!
  email: Email!
  role: UserRole!
  firstName: String
  lastName: String
  isActive: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  
  # Relationships
  createdEvents: [Event!]!
  assignedEvents: [Event!]!
}

type Event {
  id: ID!
  name: String!
  slug: String!
  description: String
  date: DateTime!
  endDate: DateTime
  venue: String!
  address: String
  maxCapacity: Int
  badgeTemplateId: String
  isActive: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  
  # Relationships
  creator: User!
  categories: [Category!]!
  registrations: [Registration!]!
  staff: [User!]!
  meals: [Meal!]!
  
  # Computed fields
  availableSpots: Int
  registrationCount: Int
  isUpcoming: Boolean!
}

type Registration {
  id: ID!
  fullName: String!
  email: Email!
  phone: String
  address: String
  qrCode: String
  createdAt: DateTime!
  
  # Relationships
  event: Event!
  category: Category!
  transactions: [Transaction!]!
  
  # Computed fields
  paymentStatus: PaymentStatus!
  totalAmount: Float!
}

# ========================
# QUERY DEFINITIONS
# ========================

type Query {
  # User queries
  me: User
  users(filter: UserFilter, pagination: PaginationInput): UserConnection!
  user(id: ID!): User
  
  # Event queries
  events(filter: EventFilter, pagination: PaginationInput): EventConnection!
  event(id: ID, slug: String): Event
  upcomingEvents(limit: Int = 10): [Event!]!
  
  # Registration queries
  registrations(eventId: ID, filter: RegistrationFilter): [Registration!]!
  registration(id: ID!): Registration
  
  # Search
  searchEvents(query: String!, limit: Int = 10): [Event!]!
}

# ========================
# MUTATION DEFINITIONS
# ========================

type Mutation {
  # Authentication
  login(input: LoginInput!): AuthPayload!
  logout: Boolean!
  refreshToken(token: String!): AuthPayload!
  
  # User management
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deactivateUser(id: ID!): User!
  
  # Event management
  createEvent(input: CreateEventInput!): Event!
  updateEvent(id: ID!, input: UpdateEventInput!): Event!
  publishEvent(id: ID!): Event!
  cancelEvent(id: ID!): Event!
  
  # Registration management
  createRegistration(input: CreateRegistrationInput!): RegistrationPayload!
  updateRegistration(id: ID!, input: UpdateRegistrationInput!): Registration!
  cancelRegistration(id: ID!): Boolean!
  
  # Payment processing
  processPayment(input: PaymentInput!): PaymentResult!
  refundPayment(transactionId: ID!): PaymentResult!
}

# ========================
# SUBSCRIPTION DEFINITIONS
# ========================

type Subscription {
  # Real-time updates
  registrationUpdated(eventId: ID!): Registration!
  eventCapacityUpdated(eventId: ID!): Event!
  paymentProcessed(registrationId: ID!): Transaction!
}

# ========================
# INPUT TYPES
# ========================

input CreateEventInput {
  name: String!
  description: String
  date: DateTime!
  endDate: DateTime
  venue: String!
  address: String
  maxCapacity: Int
  paymentRequired: Boolean = false
  categories: [CreateCategoryInput!]!
}

input EventFilter {
  search: String
  venue: String
  startDate: DateTime
  endDate: DateTime
  isActive: Boolean
  createdBy: ID
}

input PaginationInput {
  first: Int
  after: String
  last: Int
  before: String
}

# ========================
# CONNECTION TYPES (Relay-style pagination)
# ========================

type EventConnection {
  edges: [EventEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type EventEdge {
  node: Event!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

### Resolver Implementation
```typescript
// ========================
// RESOLVER IMPLEMENTATION
// ========================

@Resolver(() => Event)
export class EventResolver {
  constructor(
    private eventsService: EventsService,
    private registrationService: RegistrationService
  ) {}

  // Query resolvers
  @Query(() => [Event])
  async events(
    @Args('filter', { nullable: true }) filter?: EventFilter,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput
  ): Promise<Event[]> {
    return this.eventsService.findMany(filter, pagination);
  }

  @Query(() => Event, { nullable: true })
  async event(
    @Args('id', { nullable: true }) id?: string,
    @Args('slug', { nullable: true }) slug?: string
  ): Promise<Event | null> {
    if (id) return this.eventsService.findById(id);
    if (slug) return this.eventsService.findBySlug(slug);
    throw new Error('Either id or slug must be provided');
  }

  // Mutation resolvers
  @Mutation(() => Event)
  @UseGuards(GqlAuthGuard)
  async createEvent(
    @Args('input') input: CreateEventInput,
    @Context() context: any
  ): Promise<Event> {
    const userId = context.req.user.id;
    return this.eventsService.create(input, userId);
  }

  // Field resolvers (for computed fields and relationships)
  @ResolveField(() => Int)
  async registrationCount(@Parent() event: Event): Promise<number> {
    return this.registrationService.countByEventId(event.id);
  }

  @ResolveField(() => Int, { nullable: true })
  async availableSpots(@Parent() event: Event): Promise<number | null> {
    if (!event.maxCapacity) return null;
    const registrationCount = await this.registrationService.countByEventId(event.id);
    return Math.max(0, event.maxCapacity - registrationCount);
  }

  @ResolveField(() => Boolean)
  isUpcoming(@Parent() event: Event): boolean {
    return event.date > new Date();
  }

  @ResolveField(() => [Registration])
  async registrations(
    @Parent() event: Event,
    @Args('filter', { nullable: true }) filter?: RegistrationFilter
  ): Promise<Registration[]> {
    return this.registrationService.findByEventId(event.id, filter);
  }
}

// Subscription resolver
@Resolver()
export class SubscriptionResolver {
  constructor(@Inject('PUB_SUB') private pubSub: PubSubEngine) {}

  @Subscription(() => Registration, {
    filter: (payload, variables) => {
      return payload.registrationUpdated.eventId === variables.eventId;
    }
  })
  registrationUpdated(@Args('eventId') eventId: string) {
    return this.pubSub.asyncIterator('registrationUpdated');
  }
}
```

## 🔐 API Authentication & Authorization

### JWT Authentication
```typescript
// ========================
// JWT STRATEGY
// ========================

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions || []
    };
  }
}

// JWT payload structure
interface JwtPayload {
  sub: string;        // User ID
  email: string;      // User email
  role: UserRole;     // User role
  permissions: string[]; // Specific permissions
  iat: number;        // Issued at
  exp: number;        // Expires at
}

// Auth service
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: this.getUserPermissions(user.role),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  }

  private getUserPermissions(role: UserRole): string[] {
    const permissions: Record<UserRole, string[]> = {
      ADMIN: ['*'], // All permissions
      EVENT_ORGANIZER: [
        'events:create',
        'events:update',
        'events:read',
        'registrations:read',
        'registrations:create'
      ],
      REGISTRATION_STAFF: [
        'registrations:create',
        'registrations:read',
        'registrations:update',
        'qr-codes:scan'
      ],
      FINANCE_TEAM: [
        'transactions:read',
        'transactions:process',
        'reports:financial'
      ],
      CATERING_TEAM: [
        'meals:read',
        'meal-attendance:scan'
      ]
    };

    return permissions[role] || [];
  }
}
```

### Permission-Based Guards
```typescript
// ========================
// PERMISSION GUARDS
// ========================

// Permission decorator
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

// Permission guard
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler()
    );

    if (!requiredPermissions) {
      return true; // No permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Admin has all permissions
    if (user.permissions.includes('*')) {
      return true;
    }

    // Check if user has required permissions
    return requiredPermissions.every(permission =>
      user.permissions.includes(permission)
    );
  }
}

// Usage in controllers
@Controller('api/v1/events')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EventsController {
  @Post()
  @RequirePermissions('events:create')
  async createEvent(@Body() createEventDto: CreateEventDto): Promise<Event> {
    return this.eventsService.create(createEventDto);
  }

  @Get(':id/registrations')
  @RequirePermissions('registrations:read')
  async getEventRegistrations(@Param('id') eventId: string): Promise<Registration[]> {
    return this.registrationService.findByEventId(eventId);
  }
}
```

## 📚 API Documentation

### OpenAPI/Swagger Documentation
```typescript
// ========================
// SWAGGER CONFIGURATION
// ========================

// Main application setup
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Events Registration API')
    .setDescription('API for managing events and registrations')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'JWT-auth'
    )
    .addTag('events', 'Event management operations')
    .addTag('registrations', 'Registration management operations')
    .addTag('auth', 'Authentication operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
}

// DTO with Swagger decorators
export class CreateEventDto {
  @ApiProperty({
    description: 'Event name',
    example: 'Tech Conference 2024',
    minLength: 1,
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Event description',
    example: 'Annual technology conference featuring latest trends',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Event date and time',
    example: '2024-06-15T09:00:00Z'
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Event venue',
    example: 'Convention Center Hall A'
  })
  @IsString()
  @IsNotEmpty()
  venue: string;

  @ApiProperty({
    description: 'Maximum event capacity',
    example: 500,
    minimum: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxCapacity?: number;
}

// Controller with Swagger decorators
@ApiTags('events')
@Controller('api/v1/events')
export class EventsController {
  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
    type: Event
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized'
  })
  @ApiBearerAuth('JWT-auth')
  async createEvent(@Body() createEventDto: CreateEventDto): Promise<Event> {
    return this.eventsService.create(createEventDto);
  }
}
```

## 🔄 API Versioning

### URL Versioning Strategy
```typescript
// ========================
// VERSION MANAGEMENT
// ========================

// Version 1 controller
@Controller('api/v1/events')
export class EventsV1Controller {
  @Get()
  async getEvents(): Promise<EventV1[]> {
    // V1 implementation
    return this.eventsService.findAllV1();
  }
}

// Version 2 controller with enhanced features
@Controller('api/v2/events')
export class EventsV2Controller {
  @Get()
  async getEvents(
    @Query() query: EventsQueryV2
  ): Promise<APIResponseV2<EventV2[]>> {
    // V2 implementation with new features
    return this.eventsService.findAllV2(query);
  }
}

// Shared service with version-specific methods
@Injectable()
export class EventsService {
  async findAllV1(): Promise<EventV1[]> {
    const events = await this.prisma.event.findMany();
    return events.map(this.mapToV1Format);
  }

  async findAllV2(query: EventsQueryV2): Promise<EventV2[]> {
    const events = await this.prisma.event.findMany({
      where: this.buildV2Filters(query),
      include: { categories: true, registrations: true }
    });
    return events.map(this.mapToV2Format);
  }

  private mapToV1Format(event: any): EventV1 {
    return {
      id: event.id,
      name: event.name,
      date: event.date,
      venue: event.venue
    };
  }

  private mapToV2Format(event: any): EventV2 {
    return {
      id: event.id,
      name: event.name,
      description: event.description,
      date: event.date,
      endDate: event.endDate,
      venue: event.venue,
      maxCapacity: event.maxCapacity,
      categories: event.categories,
      registrationCount: event.registrations.length,
      availableSpots: event.maxCapacity ? 
        event.maxCapacity - event.registrations.length : null
    };
  }
}
```

## 🏃‍♂️ Practical Exercises

### Exercise 1: Design REST API
Design a RESTful API for a "Task Management System" with:
- Projects, Tasks, Users, Comments
- Proper HTTP methods and status codes
- Pagination and filtering
- Authentication and authorization

### Exercise 2: GraphQL Schema Design
Create a GraphQL schema for the same task management system:
- Define types and relationships
- Create queries, mutations, and subscriptions
- Implement field resolvers for computed data

### Exercise 3: API Security Implementation
Implement security for your API:
- JWT authentication
- Role-based authorization
- Rate limiting
- Input validation and sanitization

## 📝 Summary

### API Design Best Practices
1. **Consistency**: Use uniform patterns across all endpoints
2. **Documentation**: Provide comprehensive API documentation
3. **Versioning**: Plan for API evolution from the start
4. **Security**: Implement proper authentication and authorization
5. **Performance**: Design for efficiency and scalability

### REST vs GraphQL
- **REST**: Simple, cacheable, widely supported
- **GraphQL**: Flexible, efficient, real-time capabilities
- **Choice depends on**: Team expertise, client needs, caching requirements

### Next Steps
- Complete the exercises above
- Study the Events Registration System APIs
- Practice API design patterns
- Proceed to [Advanced Patterns](../03-advanced/advanced-patterns.md)

---

**Estimated Study Time**: 8-10 hours  
**Prerequisites**: Database Design module  
**Next Module**: [Advanced Patterns](../03-advanced/advanced-patterns.md)
