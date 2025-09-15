# Module 1.3: Basic Design Patterns

## 🎯 Learning Objectives

By the end of this module, you will understand:
- What design patterns are and why they matter
- Common creational, structural, and behavioral patterns
- How to implement basic patterns in TypeScript
- Real-world examples from the Events Registration System

## 📚 What Are Design Patterns?

**Definition**: Design patterns are reusable solutions to commonly occurring problems in software design. They represent best practices and provide a shared vocabulary for developers.

**Benefits**:
- Proven solutions to common problems
- Improved code communication between developers
- Faster development through reusable templates
- Better code organization and structure

## 🏗️ Creational Patterns

### 1. Singleton Pattern

**Purpose**: Ensure a class has only one instance and provide global access to it.

**When to Use**:
- Database connections
- Configuration managers
- Logging services
- Cache managers

#### Implementation:
```typescript
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connection: any;

  private constructor() {
    // Private constructor prevents direct instantiation
    this.connection = this.createConnection();
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  private createConnection(): any {
    console.log('Creating database connection...');
    return { connected: true };
  }

  public query(sql: string): Promise<any[]> {
    console.log(`Executing query: ${sql}`);
    return Promise.resolve([]);
  }
}

// Usage
const db1 = DatabaseConnection.getInstance();
const db2 = DatabaseConnection.getInstance();
console.log(db1 === db2); // true - same instance
```

#### Real-World Example from Events Registration System:
```typescript
// Configuration service as singleton
class ConfigService {
  private static instance: ConfigService;
  private config: Record<string, any>;

  private constructor() {
    this.config = {
      databaseUrl: process.env.DATABASE_URL,
      jwtSecret: process.env.JWT_SECRET,
      emailApiKey: process.env.EMAIL_API_KEY
    };
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public get(key: string): any {
    return this.config[key];
  }
}
```

### 2. Factory Pattern

**Purpose**: Create objects without specifying their exact classes.

**When to Use**:
- Object creation logic is complex
- Need to create different types based on input
- Want to centralize object creation

#### Implementation:
```typescript
// Product interface
interface NotificationSender {
  send(message: string, recipient: string): Promise<boolean>;
}

// Concrete products
class EmailSender implements NotificationSender {
  async send(message: string, recipient: string): Promise<boolean> {
    console.log(`Sending email to ${recipient}: ${message}`);
    return true;
  }
}

class SMSSender implements NotificationSender {
  async send(message: string, recipient: string): Promise<boolean> {
    console.log(`Sending SMS to ${recipient}: ${message}`);
    return true;
  }
}

class PushSender implements NotificationSender {
  async send(message: string, recipient: string): Promise<boolean> {
    console.log(`Sending push notification to ${recipient}: ${message}`);
    return true;
  }
}

// Factory
class NotificationFactory {
  static createSender(type: string): NotificationSender {
    switch (type.toLowerCase()) {
      case 'email':
        return new EmailSender();
      case 'sms':
        return new SMSSender();
      case 'push':
        return new PushSender();
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  }
}

// Usage
const emailSender = NotificationFactory.createSender('email');
const smsSender = NotificationFactory.createSender('sms');
```

#### Real-World Example from Events Registration System:
```typescript
// Dashboard factory based on user role
export function createDashboard(role: UserRole): DashboardConfig {
  switch (role) {
    case 'ADMIN':
      return {
        path: '/admin',
        components: ['UserManagement', 'EventManagement', 'Analytics'],
        permissions: ['ALL']
      };
    case 'EVENT_ORGANIZER':
      return {
        path: '/organizer/dashboard',
        components: ['MyEvents', 'Registrations', 'Reports'],
        permissions: ['CREATE_EVENT', 'MANAGE_REGISTRATIONS']
      };
    case 'REGISTRATION_STAFF':
      return {
        path: '/staff/dashboard',
        components: ['Registration', 'QRScanner', 'CheckIn'],
        permissions: ['SCAN_QR_CODES', 'CREATE_REGISTRATION']
      };
    default:
      throw new Error(`Unknown role: ${role}`);
  }
}
```

## 🔧 Structural Patterns

### 3. Repository Pattern

**Purpose**: Encapsulate data access logic and provide a uniform interface for accessing data.

**When to Use**:
- Need to abstract database operations
- Want to make data access testable
- Multiple data sources for the same entity

#### Implementation:
```typescript
// Entity
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// Repository interface
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  findAll(): Promise<User[]>;
}

// Concrete repository implementation
class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async save(user: User): Promise<User> {
    return this.prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }
}

// Service using repository
class UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const user: User = {
      id: generateId(),
      ...userData,
      createdAt: new Date()
    };
    return this.userRepository.save(user);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }
}
```

#### Real-World Example from Events Registration System:
```typescript
// Events service using repository pattern via Prisma
@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Event[]> {
    return this.prisma.event.findMany({
      include: { 
        categories: true, 
        registrations: true,
        staff: true 
      }
    });
  }

  async findById(id: string): Promise<Event | null> {
    return this.prisma.event.findUnique({
      where: { id },
      include: { categories: true, registrations: true }
    });
  }

  async create(data: CreateEventInput): Promise<Event> {
    return this.prisma.event.create({
      data: {
        ...data,
        slug: this.generateSlug(data.name)
      }
    });
  }
}
```

### 4. Adapter Pattern

**Purpose**: Allow incompatible interfaces to work together.

**When to Use**:
- Integrating third-party libraries
- Legacy system integration
- Different data formats need to work together

#### Implementation:
```typescript
// Third-party payment service (incompatible interface)
class StripePaymentService {
  chargeCard(cardToken: string, amountInCents: number): { id: string; status: string } {
    console.log(`Charging ${amountInCents} cents via Stripe`);
    return { id: 'stripe_123', status: 'succeeded' };
  }
}

// Our application's payment interface
interface PaymentProcessor {
  processPayment(amount: number, paymentMethod: string): Promise<PaymentResult>;
}

interface PaymentResult {
  success: boolean;
  transactionId: string;
  message: string;
}

// Adapter to make Stripe compatible with our interface
class StripeAdapter implements PaymentProcessor {
  constructor(private stripeService: StripePaymentService) {}

  async processPayment(amount: number, paymentMethod: string): Promise<PaymentResult> {
    try {
      // Convert dollars to cents (Stripe requirement)
      const amountInCents = Math.round(amount * 100);
      
      // Call Stripe with adapted parameters
      const result = this.stripeService.chargeCard(paymentMethod, amountInCents);
      
      // Convert Stripe response to our format
      return {
        success: result.status === 'succeeded',
        transactionId: result.id,
        message: result.status === 'succeeded' ? 'Payment successful' : 'Payment failed'
      };
    } catch (error) {
      return {
        success: false,
        transactionId: '',
        message: error.message
      };
    }
  }
}

// Usage
const stripeService = new StripePaymentService();
const paymentProcessor: PaymentProcessor = new StripeAdapter(stripeService);
const result = await paymentProcessor.processPayment(29.99, 'card_token_123');
```

## 🎭 Behavioral Patterns

### 5. Observer Pattern

**Purpose**: Define a one-to-many dependency between objects so that when one object changes state, all dependents are notified.

**When to Use**:
- Event handling systems
- Model-View architectures
- Real-time notifications

#### Implementation:
```typescript
// Observer interface
interface Observer {
  update(data: any): void;
}

// Subject interface
interface Subject {
  attach(observer: Observer): void;
  detach(observer: Observer): void;
  notify(data: any): void;
}

// Concrete subject
class EventManager implements Subject {
  private observers: Observer[] = [];
  private events: Event[] = [];

  attach(observer: Observer): void {
    this.observers.push(observer);
  }

  detach(observer: Observer): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  notify(data: any): void {
    this.observers.forEach(observer => observer.update(data));
  }

  addEvent(event: Event): void {
    this.events.push(event);
    this.notify({ type: 'EVENT_ADDED', event });
  }

  updateEvent(eventId: string, updates: Partial<Event>): void {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      Object.assign(event, updates);
      this.notify({ type: 'EVENT_UPDATED', event });
    }
  }
}

// Concrete observers
class EmailNotificationObserver implements Observer {
  update(data: any): void {
    if (data.type === 'EVENT_ADDED') {
      console.log(`Sending email notification for new event: ${data.event.name}`);
    }
  }
}

class AnalyticsObserver implements Observer {
  update(data: any): void {
    console.log(`Recording analytics event: ${data.type}`);
  }
}

// Usage
const eventManager = new EventManager();
const emailNotifier = new EmailNotificationObserver();
const analytics = new AnalyticsObserver();

eventManager.attach(emailNotifier);
eventManager.attach(analytics);

eventManager.addEvent({ id: '1', name: 'Tech Conference', date: new Date() });
```

#### Real-World Example from Events Registration System:
```typescript
// GraphQL subscriptions implement observer pattern
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
    
    // Notify all subscribers (observers)
    await this.pubSub.publish(`registration.${registration.eventId}`, {
      registrationUpdated: registration
    });
    
    return registration;
  }
}
```

### 6. Strategy Pattern

**Purpose**: Define a family of algorithms, encapsulate each one, and make them interchangeable.

**When to Use**:
- Multiple ways to perform a task
- Algorithm selection at runtime
- Avoiding conditional statements

#### Implementation:
```typescript
// Strategy interface
interface PricingStrategy {
  calculatePrice(basePrice: number, quantity: number): number;
}

// Concrete strategies
class RegularPricing implements PricingStrategy {
  calculatePrice(basePrice: number, quantity: number): number {
    return basePrice * quantity;
  }
}

class BulkDiscountPricing implements PricingStrategy {
  calculatePrice(basePrice: number, quantity: number): number {
    const total = basePrice * quantity;
    if (quantity >= 10) {
      return total * 0.9; // 10% discount
    }
    return total;
  }
}

class VIPPricing implements PricingStrategy {
  calculatePrice(basePrice: number, quantity: number): number {
    return basePrice * quantity * 0.8; // 20% discount
  }
}

// Context
class PriceCalculator {
  constructor(private strategy: PricingStrategy) {}

  setStrategy(strategy: PricingStrategy): void {
    this.strategy = strategy;
  }

  calculatePrice(basePrice: number, quantity: number): number {
    return this.strategy.calculatePrice(basePrice, quantity);
  }
}

// Usage
const calculator = new PriceCalculator(new RegularPricing());
console.log(calculator.calculatePrice(10, 5)); // 50

calculator.setStrategy(new BulkDiscountPricing());
console.log(calculator.calculatePrice(10, 15)); // 135 (10% discount)

calculator.setStrategy(new VIPPricing());
console.log(calculator.calculatePrice(10, 5)); // 40 (20% discount)
```

## 🏃‍♂️ Practical Exercises

### Exercise 1: Implement a Logger Singleton
Create a Logger class that:
- Follows the Singleton pattern
- Has methods for different log levels (info, warn, error)
- Includes timestamps in log messages

### Exercise 2: Create a Notification Factory
Build a notification system that:
- Uses Factory pattern to create different notification types
- Supports Email, SMS, and Push notifications
- Each type has different configuration requirements

### Exercise 3: Build an Event System
Implement an event system using Observer pattern that:
- Manages user registrations for events
- Notifies multiple observers when registrations change
- Includes email notifications and analytics tracking

## 📝 Summary

### Patterns Covered
1. **Singleton**: One instance, global access
2. **Factory**: Create objects without specifying exact classes
3. **Repository**: Abstract data access logic
4. **Adapter**: Make incompatible interfaces work together
5. **Observer**: One-to-many dependency notifications
6. **Strategy**: Interchangeable algorithms

### When to Use Each Pattern
- **Singleton**: Configuration, database connections, caches
- **Factory**: Object creation based on conditions
- **Repository**: Data access abstraction
- **Adapter**: Third-party integration
- **Observer**: Event systems, real-time updates
- **Strategy**: Multiple algorithms for same problem

### Next Steps
- Complete the exercises above
- Identify patterns in existing codebases
- Practice implementing patterns in your projects
- Proceed to [Code Quality Basics](./code-quality.md)

---

**Estimated Study Time**: 8-10 hours  
**Prerequisites**: SOLID Principles module  
**Next Module**: [Code Quality Basics](./code-quality.md)
