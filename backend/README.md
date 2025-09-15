# Event Registration System - Backend API

## 🚀 Overview

NestJS-powered GraphQL API for the Event Registration System with real-time capabilities, comprehensive event management, and secure payment processing.

## 🏗️ Architecture

```
Backend (NestJS + GraphQL)
├── GraphQL Gateway (Apollo Server)
├── Authentication & Authorization
├── Business Logic Modules
├── Prisma ORM Layer
└── PostgreSQL Database
```

## 🛠️ Tech Stack

- **Framework**: NestJS 10+
- **API**: GraphQL with Apollo Server
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 15+
- **Authentication**: JWT with Passport.js
- **Real-time**: GraphQL Subscriptions
- **Payment**: Stripe/PayStack integration
- **QR Generation**: qrcode library
- **Validation**: class-validator + GraphQL schema validation
- **Testing**: Jest + Supertest
- **Documentation**: GraphQL Playground/Apollo Studio

## 📁 Project Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.resolver.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── dto/
│   │   │   └── guards/
│   │   ├── events/
│   │   │   ├── events.module.ts
│   │   │   ├── events.resolver.ts
│   │   │   ├── events.service.ts
│   │   │   ├── dto/
│   │   │   └── entities/
│   │   ├── registration/
│   │   │   ├── registration.module.ts
│   │   │   ├── registration.resolver.ts
│   │   │   ├── registration.service.ts
│   │   │   └── dto/
│   │   ├── payment/
│   │   │   ├── payment.module.ts
│   │   │   ├── payment.resolver.ts
│   │   │   ├── payment.service.ts
│   │   │   └── webhooks/
│   │   ├── meals/
│   │   │   ├── meals.module.ts
│   │   │   ├── meals.resolver.ts
│   │   │   ├── meals.service.ts
│   │   │   └── dto/
│   │   └── reports/
│   │       ├── reports.module.ts
│   │       ├── reports.resolver.ts
│   │       └── reports.service.ts
│   ├── common/
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── scalars/
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── graphql.config.ts
│   ├── prisma/
│   │   └── prisma.service.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── test/
├── Dockerfile
└── package.json
```

## 📊 GraphQL Schema

### Core Types

```graphql
type Event {
  id: ID!
  name: String!
  date: DateTime!
  venue: String!
  description: String
  categories: [Category!]!
  registrations: [Registration!]!
  meals: [Meal!]!
  totalRegistrations: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Category {
  id: ID!
  eventId: ID!
  name: String!
  price: Float!
  maxCapacity: Int
  currentCount: Int!
  event: Event!
  registrations: [Registration!]!
}

type Registration {
  id: ID!
  eventId: ID!
  categoryId: ID!
  fullName: String!
  email: String!
  phone: String!
  address: String!
  receiptNumber: String
  paymentStatus: PaymentStatus!
  qrCode: String!
  checkedIn: Boolean!
  event: Event!
  category: Category!
  mealAttendances: [MealAttendance!]!
  createdAt: DateTime!
}

type Meal {
  id: ID!
  eventId: ID!
  sessionName: String!
  startTime: DateTime!
  endTime: DateTime!
  maxCapacity: Int
  currentAttendance: Int!
  event: Event!
  attendances: [MealAttendance!]!
}

type MealAttendance {
  id: ID!
  registrationId: ID!
  mealId: ID!
  scannedAt: DateTime!
  registration: Registration!
  meal: Meal!
}

enum PaymentStatus {
  PENDING
  APPROVED
  DECLINED
}

scalar DateTime
```

### Queries

```graphql
type Query {
  # Events
  events: [Event!]!
  event(id: ID!): Event
  eventBySlug(slug: String!): Event
  
  # Registrations
  registrations(eventId: ID!): [Registration!]!
  registration(id: ID!): Registration
  registrationByQR(qrCode: String!): Registration
  
  # Meals
  mealSessions(eventId: ID!): [Meal!]!
  mealAttendance(mealId: ID!): [MealAttendance!]!
  
  # Reports
  registrationReport(eventId: ID!): RegistrationReport!
  mealReport(eventId: ID!): MealReport!
  auditLogs(eventId: ID!): [AuditLog!]!
  
  # Dashboard
  dashboardStats(eventId: ID!): DashboardStats!
}
```

### Mutations

```graphql
type Mutation {
  # Authentication
  login(input: LoginInput!): AuthPayload!
  refreshToken(token: String!): AuthPayload!
  
  # Events
  createEvent(input: CreateEventInput!): Event!
  updateEvent(id: ID!, input: UpdateEventInput!): Event!
  deleteEvent(id: ID!): Boolean!
  
  # Categories
  createCategory(input: CreateCategoryInput!): Category!
  updateCategory(id: ID!, input: UpdateCategoryInput!): Category!
  deleteCategory(id: ID!): Boolean!
  
  # Registration
  registerOnline(input: OnlineRegistrationInput!): Registration!
  registerOnsite(input: OnsiteRegistrationInput!): Registration!
  approvePayment(registrationId: ID!): Registration!
  declinePayment(registrationId: ID!, reason: String!): Registration!
  
  # Meal Attendance
  scanMealQR(qrCode: String!, mealId: ID!): MealScanResult!
  manualMealOverride(registrationId: ID!, mealId: ID!, reason: String!): MealAttendance!
  
  # Meals
  createMealSession(input: CreateMealInput!): Meal!
  updateMealSession(id: ID!, input: UpdateMealInput!): Meal!
  deleteMealSession(id: ID!): Boolean!
}
```

### Subscriptions

```graphql
type Subscription {
  # Real-time registration updates
  registrationUpdated(eventId: ID!): Registration!
  newRegistration(eventId: ID!): Registration!
  
  # Real-time meal attendance
  mealScanned(eventId: ID!): MealAttendance!
  mealSessionUpdated(mealId: ID!): Meal!
  
  # Dashboard updates
  dashboardStatsUpdated(eventId: ID!): DashboardStats!
}
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis (for subscriptions)

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/events_db"

# JWT
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRATION="7d"

# GraphQL
GRAPHQL_PLAYGROUND=true
GRAPHQL_INTROSPECTION=true

# Payment Gateway
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
PAYSTACK_SECRET_KEY="sk_test_..."

# Redis (for subscriptions)
REDIS_URL="redis://localhost:6379"

# Application
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed
```

### 4. Start Development Server
```bash
npm run start:dev
```

The GraphQL Playground will be available at: `http://localhost:3001/graphql`

## 🗄️ Database Schema (Prisma)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      Role     @default(ADMIN)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Event {
  id            String   @id @default(cuid())
  name          String
  slug          String   @unique
  date          DateTime
  venue         String
  description   String?
  isActive      Boolean  @default(true)
  categories    Category[]
  registrations Registration[]
  meals         Meal[]
  auditLogs     AuditLog[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Category {
  id            String   @id @default(cuid())
  eventId       String
  name          String
  price         Decimal
  maxCapacity   Int?
  event         Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  registrations Registration[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([eventId, name])
}

model Registration {
  id              String   @id @default(cuid())
  eventId         String
  categoryId      String
  fullName        String
  email           String
  phone           String
  address         String
  receiptNumber   String?  @unique
  paymentStatus   PaymentStatus @default(PENDING)
  qrCode          String   @unique
  checkedIn       Boolean  @default(false)
  checkedInAt     DateTime?
  event           Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  category        Category @relation(fields: [categoryId], references: [id])
  mealAttendances MealAttendance[]
  auditLogs       AuditLog[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Meal {
  id            String   @id @default(cuid())
  eventId       String
  sessionName   String
  startTime     DateTime
  endTime       DateTime
  maxCapacity   Int?
  isActive      Boolean  @default(true)
  event         Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  attendances   MealAttendance[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([eventId, sessionName])
}

model MealAttendance {
  id             String   @id @default(cuid())
  registrationId String
  mealId         String
  scannedAt      DateTime @default(now())
  scannedBy      String?
  registration   Registration @relation(fields: [registrationId], references: [id], onDelete: Cascade)
  meal           Meal     @relation(fields: [mealId], references: [id], onDelete: Cascade)
  
  @@unique([registrationId, mealId])
}

model AuditLog {
  id             String   @id @default(cuid())
  eventId        String?
  registrationId String?
  action         String
  details        Json
  performedBy    String
  ipAddress      String?
  userAgent      String?
  event          Event?   @relation(fields: [eventId], references: [id])
  registration   Registration? @relation(fields: [registrationId], references: [id])
  createdAt      DateTime @default(now())
}

enum PaymentStatus {
  PENDING
  APPROVED
  DECLINED
}

enum Role {
  ADMIN
  STAFF
}
```

## 🔐 Authentication & Authorization

### JWT Strategy
```typescript
// src/modules/auth/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
```

### GraphQL Guards
```typescript
// src/common/guards/gql-auth.guard.ts
@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
```

### Usage in Resolvers
```typescript
@Resolver(() => Event)
export class EventsResolver {
  @Query(() => [Event])
  @UseGuards(GqlAuthGuard)
  async events() {
    return this.eventsService.findAll();
  }

  @Mutation(() => Event)
  @UseGuards(GqlAuthGuard)
  @Roles('ADMIN')
  async createEvent(@Args('input') input: CreateEventInput) {
    return this.eventsService.create(input);
  }
}
```

## 🔄 Real-time Subscriptions

### Setup
```typescript
// src/app.module.ts
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': true,
      },
      context: ({ req, connection }) => {
        if (connection) {
          return { req: connection.context };
        }
        return { req };
      },
    }),
  ],
})
export class AppModule {}
```

### Subscription Resolvers
```typescript
@Resolver()
export class RegistrationResolver {
  constructor(private pubSub: PubSub) {}

  @Subscription(() => Registration)
  registrationUpdated(@Args('eventId') eventId: string) {
    return this.pubSub.asyncIterator(`registrationUpdated.${eventId}`);
  }

  @Mutation(() => Registration)
  async approvePayment(@Args('registrationId') id: string) {
    const registration = await this.registrationService.approve(id);
    
    // Publish update
    this.pubSub.publish(`registrationUpdated.${registration.eventId}`, {
      registrationUpdated: registration,
    });
    
    return registration;
  }
}
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### GraphQL Testing Example
```typescript
describe('EventsResolver', () => {
  it('should create event', async () => {
    const mutation = `
      mutation {
        createEvent(input: {
          name: "Test Event"
          date: "2024-12-01T10:00:00Z"
          venue: "Test Venue"
        }) {
          id
          name
          date
          venue
        }
      }
    `;

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: mutation })
      .expect(200);

    expect(response.body.data.createEvent).toBeDefined();
  });
});
```

## 📊 Performance & Optimization

### Database Optimization
- Indexes on frequently queried fields
- Connection pooling with Prisma
- Query optimization with DataLoader

### GraphQL Optimization
- Query complexity analysis
- Rate limiting
- Caching with Redis
- Batch loading for N+1 prevention

### Example DataLoader
```typescript
@Injectable()
export class EventsLoader {
  constructor(private eventsService: EventsService) {}

  @Loader(() => Event)
  async getEventsByIds(ids: string[]): Promise<Event[]> {
    const events = await this.eventsService.findByIds(ids);
    return ids.map(id => events.find(event => event.id === id));
  }
}
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start:prod
```

### Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
```

### Environment Variables (Production)
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="production-secret"
REDIS_URL="redis://redis-host:6379"
GRAPHQL_PLAYGROUND=false
GRAPHQL_INTROSPECTION=false
```

## 📚 API Documentation

- **GraphQL Playground**: `http://localhost:3001/graphql` (development)
- **Schema Documentation**: Auto-generated from GraphQL schema
- **Postman Collection**: Available in `/docs/postman/`

## 🔒 Security

- Input validation with class-validator
- SQL injection prevention via Prisma
- Rate limiting on mutations
- CORS configuration
- Helmet for security headers
- JWT token expiration and refresh

## 🤝 Contributing

1. Follow NestJS conventions
2. Write tests for new features
3. Update GraphQL schema documentation
4. Run linting before commits

## 📞 Support

For backend-specific issues, contact the development team or create an issue in the repository.

---

© 2024 Elira Technologies. All rights reserved.
