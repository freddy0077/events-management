# Module 1.1: Core Software Engineering Concepts

## 🎯 Learning Objectives

By the end of this module, you will understand:
- Fundamental software engineering principles
- Key terminology and definitions
- How concepts apply to real-world projects
- Basic software engineering mindset

## 📚 Core Concepts

### 1. Software Engineering
**Definition**: The systematic application of engineering approaches to the development, operation, and maintenance of software systems.

**Why It Matters**: Software engineering provides structured approaches to building reliable, maintainable, and scalable software systems.

**Real-World Example** (from Events Registration System):
```typescript
// ✅ Systematic approach with clear structure
export class RegistrationService {
  constructor(
    private prisma: PrismaService,
    private qrCodeService: QRCodeService,
    private auditService: AuditService
  ) {}

  async createRegistration(data: CreateRegistrationInput): Promise<Registration> {
    // 1. Validate input
    await this.validateRegistrationData(data);
    
    // 2. Check business rules
    await this.checkEventCapacity(data.eventId);
    
    // 3. Create registration
    const registration = await this.prisma.registration.create({ data });
    
    // 4. Generate QR code
    await this.qrCodeService.generateQRCode(registration.id);
    
    // 5. Audit logging
    await this.auditService.log('REGISTRATION_CREATED', registration.id);
    
    return registration;
  }
}
```

### 2. Abstraction
**Definition**: The process of hiding complex implementation details while showing only essential features of an object or system.

**Benefits**:
- Reduces complexity
- Improves code reusability
- Makes systems easier to understand

**Example**:
```typescript
// ✅ Abstract interface hides implementation details
interface PaymentProcessor {
  processPayment(amount: number, paymentMethod: string): Promise<PaymentResult>;
}

// Concrete implementations
class StripePaymentProcessor implements PaymentProcessor {
  async processPayment(amount: number, paymentMethod: string): Promise<PaymentResult> {
    // Stripe-specific implementation hidden from users
    return this.stripeClient.charges.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      source: paymentMethod
    });
  }
}

class PayPalPaymentProcessor implements PaymentProcessor {
  async processPayment(amount: number, paymentMethod: string): Promise<PaymentResult> {
    // PayPal-specific implementation hidden from users
    return this.paypalClient.payment.create({
      intent: 'sale',
      transactions: [{ amount: { total: amount.toString(), currency: 'USD' } }]
    });
  }
}
```

### 3. Encapsulation
**Definition**: The bundling of data and methods that operate on that data within a single unit (class), restricting direct access to some components.

**Benefits**:
- Data protection
- Controlled access
- Easier maintenance

**Example**:
```typescript
// ✅ Proper encapsulation
export class User {
  private _id: string;
  private _email: string;
  private _passwordHash: string;
  private _isActive: boolean;

  constructor(email: string, password: string) {
    this._id = generateId();
    this._email = this.validateEmail(email);
    this._passwordHash = this.hashPassword(password);
    this._isActive = true;
  }

  // Controlled access through methods
  get email(): string {
    return this._email;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  // Business logic encapsulated within the class
  changeEmail(newEmail: string): void {
    const validatedEmail = this.validateEmail(newEmail);
    this._email = validatedEmail;
    // Could trigger email verification process
  }

  deactivate(): void {
    this._isActive = false;
    // Could trigger cleanup processes
  }

  private validateEmail(email: string): string {
    if (!email.includes('@')) {
      throw new Error('Invalid email format');
    }
    return email.toLowerCase();
  }

  private hashPassword(password: string): string {
    // Password hashing logic
    return bcrypt.hashSync(password, 10);
  }
}
```

### 4. Inheritance
**Definition**: A mechanism where a new class derives properties and behaviors from an existing class.

**When to Use**:
- "Is-a" relationships
- Code reuse
- Polymorphic behavior

**Example**:
```typescript
// Base class
abstract class BaseEntity {
  protected id: string;
  protected createdAt: Date;
  protected updatedAt: Date;

  constructor() {
    this.id = generateId();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  getId(): string {
    return this.id;
  }

  touch(): void {
    this.updatedAt = new Date();
  }

  abstract validate(): boolean;
}

// Derived classes
class Event extends BaseEntity {
  private name: string;
  private date: Date;
  private venue: string;

  constructor(name: string, date: Date, venue: string) {
    super(); // Call parent constructor
    this.name = name;
    this.date = date;
    this.venue = venue;
  }

  validate(): boolean {
    return this.name.length > 0 && this.date > new Date() && this.venue.length > 0;
  }

  // Event-specific methods
  isUpcoming(): boolean {
    return this.date > new Date();
  }
}

class Registration extends BaseEntity {
  private eventId: string;
  private participantEmail: string;
  private status: RegistrationStatus;

  constructor(eventId: string, email: string) {
    super();
    this.eventId = eventId;
    this.participantEmail = email;
    this.status = RegistrationStatus.PENDING;
  }

  validate(): boolean {
    return this.eventId.length > 0 && this.participantEmail.includes('@');
  }

  // Registration-specific methods
  confirm(): void {
    this.status = RegistrationStatus.CONFIRMED;
    this.touch(); // Inherited method
  }
}
```

### 5. Polymorphism
**Definition**: The ability of different classes to be treated as instances of the same type through a common interface.

**Benefits**:
- Code flexibility
- Extensibility
- Reduced coupling

**Example**:
```typescript
// Common interface
interface NotificationSender {
  send(message: string, recipient: string): Promise<boolean>;
}

// Different implementations
class EmailNotificationSender implements NotificationSender {
  async send(message: string, recipient: string): Promise<boolean> {
    console.log(`Sending email to ${recipient}: ${message}`);
    // Email sending logic
    return true;
  }
}

class SMSNotificationSender implements NotificationSender {
  async send(message: string, recipient: string): Promise<boolean> {
    console.log(`Sending SMS to ${recipient}: ${message}`);
    // SMS sending logic
    return true;
  }
}

class PushNotificationSender implements NotificationSender {
  async send(message: string, recipient: string): Promise<boolean> {
    console.log(`Sending push notification to ${recipient}: ${message}`);
    // Push notification logic
    return true;
  }
}

// Polymorphic usage
class NotificationService {
  private senders: NotificationSender[] = [
    new EmailNotificationSender(),
    new SMSNotificationSender(),
    new PushNotificationSender()
  ];

  async notifyUser(message: string, recipient: string, methods: string[]): Promise<void> {
    // Same interface, different implementations
    for (const sender of this.senders) {
      await sender.send(message, recipient);
    }
  }
}
```

## 🔍 Key Principles

### 1. Separation of Concerns
**Definition**: A design principle for separating a computer program into distinct sections, each addressing a separate concern.

**Example from Events Registration System**:
```typescript
// ✅ Each class has a single concern
class AuthenticationService {
  // Only handles authentication
  async login(email: string, password: string): Promise<AuthResult> { }
  async logout(token: string): Promise<void> { }
  async validateToken(token: string): Promise<User> { }
}

class EventService {
  // Only handles event operations
  async createEvent(data: CreateEventInput): Promise<Event> { }
  async updateEvent(id: string, data: UpdateEventInput): Promise<Event> { }
  async deleteEvent(id: string): Promise<void> { }
}

class RegistrationService {
  // Only handles registration operations
  async createRegistration(data: CreateRegistrationInput): Promise<Registration> { }
  async cancelRegistration(id: string): Promise<void> { }
}
```

### 2. DRY (Don't Repeat Yourself)
**Definition**: Every piece of knowledge must have a single, unambiguous, authoritative representation within a system.

**Example**:
```typescript
// ❌ Bad: Repeated validation logic
class UserService {
  async createUser(email: string): Promise<User> {
    if (!email.includes('@') || email.length < 5) {
      throw new Error('Invalid email');
    }
    // Create user logic
  }

  async updateUserEmail(userId: string, email: string): Promise<User> {
    if (!email.includes('@') || email.length < 5) {
      throw new Error('Invalid email');
    }
    // Update email logic
  }
}

// ✅ Good: Centralized validation
class EmailValidator {
  static validate(email: string): boolean {
    return email.includes('@') && email.length >= 5;
  }

  static validateOrThrow(email: string): void {
    if (!this.validate(email)) {
      throw new Error('Invalid email format');
    }
  }
}

class UserService {
  async createUser(email: string): Promise<User> {
    EmailValidator.validateOrThrow(email);
    // Create user logic
  }

  async updateUserEmail(userId: string, email: string): Promise<User> {
    EmailValidator.validateOrThrow(email);
    // Update email logic
  }
}
```

## 🏃‍♂️ Practical Exercises

### Exercise 1: Identify Concepts
Look at this code and identify which software engineering concepts are being used:

```typescript
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connection: any;

  private constructor() {
    this.connection = this.createConnection();
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  private createConnection(): any {
    // Database connection logic
    return {};
  }

  public query(sql: string): Promise<any[]> {
    return this.connection.query(sql);
  }
}
```

**Answer**: 
- Encapsulation (private constructor, private connection)
- Singleton Pattern (static instance management)
- Abstraction (hiding connection details)

### Exercise 2: Apply Separation of Concerns
Refactor this code to better separate concerns:

```typescript
// ❌ Mixed concerns
class OrderProcessor {
  processOrder(order: Order): void {
    // Validation
    if (!order.items || order.items.length === 0) {
      throw new Error('Order must have items');
    }

    // Calculate total
    let total = 0;
    for (const item of order.items) {
      total += item.price * item.quantity;
    }

    // Send email
    const emailContent = `Your order total is $${total}`;
    this.sendEmail(order.customerEmail, emailContent);

    // Save to database
    this.database.save(order);
  }

  private sendEmail(email: string, content: string): void {
    // Email logic
  }
}
```

**Your Task**: Separate this into multiple classes with single responsibilities.

## 📝 Summary

### Key Takeaways
1. **Software Engineering** is about systematic approaches to building software
2. **Abstraction** hides complexity and shows only essential features
3. **Encapsulation** bundles data and methods while controlling access
4. **Inheritance** enables code reuse through "is-a" relationships
5. **Polymorphism** allows different classes to be treated uniformly
6. **Separation of Concerns** keeps different responsibilities in different modules
7. **DRY Principle** eliminates code duplication

### Next Steps
- Complete the exercises above
- Review the Events Registration System codebase for examples
- Proceed to [SOLID Principles](./solid-principles.md)
- Practice implementing these concepts in your own projects

### Assessment Questions
1. What is the difference between abstraction and encapsulation?
2. When should you use inheritance vs composition?
3. How does polymorphism improve code flexibility?
4. Give an example of violating separation of concerns
5. How can you identify code that violates the DRY principle?

---

**Estimated Study Time**: 4-6 hours  
**Prerequisites**: Basic programming knowledge  
**Next Module**: [SOLID Principles](./solid-principles.md)
