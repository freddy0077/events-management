# Module 1.2: SOLID Principles

## 🎯 Learning Objectives

By the end of this module, you will understand:
- All five SOLID principles in detail
- How to identify SOLID violations in code
- How to refactor code to follow SOLID principles
- Real-world applications from the Events Registration System

## 📚 The SOLID Principles

SOLID is an acronym for five design principles that make software designs more understandable, flexible, and maintainable. These principles were introduced by Robert C. Martin (Uncle Bob).

### 1. Single Responsibility Principle (SRP)

**Definition**: A class should have only one reason to change, meaning it should have only one job or responsibility.

**Why It Matters**:
- Easier to understand and maintain
- Reduces coupling between different concerns
- Makes testing simpler
- Improves code reusability

#### ❌ SRP Violation Example:
```typescript
// Bad: Multiple responsibilities in one class
class UserManager {
  saveUser(user: User): void {
    // Responsibility 1: Data validation
    if (!user.email.includes('@')) {
      throw new Error('Invalid email');
    }

    // Responsibility 2: Database operations
    const db = new Database();
    db.save(user);

    // Responsibility 3: Email notifications
    const emailService = new EmailService();
    emailService.send(`Welcome ${user.name}!`, user.email);

    // Responsibility 4: Logging
    console.log(`User ${user.name} saved at ${new Date()}`);
  }
}
```

#### ✅ SRP Compliant Example:
```typescript
// Good: Each class has a single responsibility
class UserValidator {
  validate(user: User): void {
    if (!user.email.includes('@')) {
      throw new Error('Invalid email');
    }
    if (!user.name || user.name.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
  }
}

class UserRepository {
  async save(user: User): Promise<void> {
    // Only handles data persistence
    await this.database.users.create(user);
  }
}

class NotificationService {
  async sendWelcomeEmail(user: User): Promise<void> {
    // Only handles notifications
    await this.emailService.send({
      to: user.email,
      subject: 'Welcome!',
      body: `Welcome ${user.name}!`
    });
  }
}

class AuditLogger {
  log(action: string, details: any): void {
    // Only handles logging
    console.log(`${action}: ${JSON.stringify(details)} at ${new Date()}`);
  }
}

// Orchestrator that uses all services
class UserService {
  constructor(
    private validator: UserValidator,
    private repository: UserRepository,
    private notificationService: NotificationService,
    private logger: AuditLogger
  ) {}

  async createUser(user: User): Promise<void> {
    this.validator.validate(user);
    await this.repository.save(user);
    await this.notificationService.sendWelcomeEmail(user);
    this.logger.log('USER_CREATED', { userId: user.id, email: user.email });
  }
}
```

### 2. Open/Closed Principle (OCP)

**Definition**: Software entities should be open for extension but closed for modification.

**Why It Matters**:
- Prevents breaking existing code when adding new features
- Promotes code reusability
- Enables polymorphism

#### ❌ OCP Violation Example:
```typescript
// Bad: Must modify existing code to add new payment methods
class PaymentProcessor {
  processPayment(amount: number, method: string): void {
    if (method === 'credit_card') {
      // Credit card processing logic
      console.log(`Processing $${amount} via credit card`);
    } else if (method === 'paypal') {
      // PayPal processing logic
      console.log(`Processing $${amount} via PayPal`);
    } else if (method === 'bitcoin') { // New method requires modification
      // Bitcoin processing logic
      console.log(`Processing $${amount} via Bitcoin`);
    }
  }
}
```

#### ✅ OCP Compliant Example:
```typescript
// Good: Extensible without modification
interface PaymentMethod {
  process(amount: number): Promise<PaymentResult>;
}

class CreditCardPayment implements PaymentMethod {
  async process(amount: number): Promise<PaymentResult> {
    console.log(`Processing $${amount} via credit card`);
    return { success: true, transactionId: 'cc_123' };
  }
}

class PayPalPayment implements PaymentMethod {
  async process(amount: number): Promise<PaymentResult> {
    console.log(`Processing $${amount} via PayPal`);
    return { success: true, transactionId: 'pp_456' };
  }
}

// New payment method - no modification to existing code needed
class BitcoinPayment implements PaymentMethod {
  async process(amount: number): Promise<PaymentResult> {
    console.log(`Processing $${amount} via Bitcoin`);
    return { success: true, transactionId: 'btc_789' };
  }
}

class PaymentProcessor {
  private paymentMethods: Map<string, PaymentMethod> = new Map();

  registerPaymentMethod(name: string, method: PaymentMethod): void {
    this.paymentMethods.set(name, method);
  }

  async processPayment(amount: number, methodName: string): Promise<PaymentResult> {
    const method = this.paymentMethods.get(methodName);
    if (!method) {
      throw new Error(`Payment method ${methodName} not supported`);
    }
    return method.process(amount);
  }
}

// Usage - easily extensible
const processor = new PaymentProcessor();
processor.registerPaymentMethod('credit_card', new CreditCardPayment());
processor.registerPaymentMethod('paypal', new PayPalPayment());
processor.registerPaymentMethod('bitcoin', new BitcoinPayment()); // Easy to add
```

### 3. Liskov Substitution Principle (LSP)

**Definition**: Objects of a superclass should be replaceable with objects of a subclass without breaking the application.

**Why It Matters**:
- Ensures proper inheritance hierarchies
- Maintains behavioral consistency
- Enables true polymorphism

#### ❌ LSP Violation Example:
```typescript
// Bad: Subclass changes expected behavior
class Bird {
  fly(): void {
    console.log('Flying...');
  }
}

class Penguin extends Bird {
  fly(): void {
    throw new Error('Penguins cannot fly!'); // Violates LSP
  }
}

// This will break when using Penguin
function makeBirdFly(bird: Bird): void {
  bird.fly(); // Will throw error if bird is a Penguin
}
```

#### ✅ LSP Compliant Example:
```typescript
// Good: Proper abstraction that doesn't violate expectations
abstract class Bird {
  abstract move(): void;
  eat(): void {
    console.log('Eating...');
  }
}

class FlyingBird extends Bird {
  move(): void {
    console.log('Flying...');
  }
}

class SwimmingBird extends Bird {
  move(): void {
    console.log('Swimming...');
  }
}

class Eagle extends FlyingBird {
  // Inherits flying behavior - LSP compliant
}

class Penguin extends SwimmingBird {
  // Inherits swimming behavior - LSP compliant
}

// This works with any Bird subclass
function makeBirdMove(bird: Bird): void {
  bird.move(); // Always works as expected
}
```

### 4. Interface Segregation Principle (ISP)

**Definition**: Clients should not be forced to depend on interfaces they do not use.

**Why It Matters**:
- Reduces coupling
- Makes interfaces more focused
- Easier to implement and test

#### ❌ ISP Violation Example:
```typescript
// Bad: Fat interface forces unnecessary dependencies
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
  code(): void;
  design(): void;
  test(): void;
}

// Robot doesn't need eat() or sleep()
class Robot implements Worker {
  work(): void { console.log('Working...'); }
  eat(): void { throw new Error('Robots don\'t eat'); } // Forced to implement
  sleep(): void { throw new Error('Robots don\'t sleep'); } // Forced to implement
  code(): void { console.log('Coding...'); }
  design(): void { console.log('Designing...'); }
  test(): void { console.log('Testing...'); }
}
```

#### ✅ ISP Compliant Example:
```typescript
// Good: Segregated interfaces
interface Workable {
  work(): void;
}

interface Eatable {
  eat(): void;
}

interface Sleepable {
  sleep(): void;
}

interface Programmable {
  code(): void;
  test(): void;
}

interface Designable {
  design(): void;
}

// Human implements all relevant interfaces
class Human implements Workable, Eatable, Sleepable, Programmable, Designable {
  work(): void { console.log('Working...'); }
  eat(): void { console.log('Eating...'); }
  sleep(): void { console.log('Sleeping...'); }
  code(): void { console.log('Coding...'); }
  design(): void { console.log('Designing...'); }
  test(): void { console.log('Testing...'); }
}

// Robot only implements what it needs
class Robot implements Workable, Programmable {
  work(): void { console.log('Working...'); }
  code(): void { console.log('Coding...'); }
  test(): void { console.log('Testing...'); }
}
```

### 5. Dependency Inversion Principle (DIP)

**Definition**: High-level modules should not depend on low-level modules. Both should depend on abstractions.

**Why It Matters**:
- Reduces coupling between modules
- Makes code more testable
- Enables dependency injection

#### ❌ DIP Violation Example:
```typescript
// Bad: High-level module depends on low-level module
class EmailService {
  send(message: string, recipient: string): void {
    console.log(`Sending email to ${recipient}: ${message}`);
  }
}

class UserService {
  private emailService = new EmailService(); // Direct dependency

  createUser(user: User): void {
    // User creation logic
    this.emailService.send('Welcome!', user.email); // Tightly coupled
  }
}
```

#### ✅ DIP Compliant Example:
```typescript
// Good: Both depend on abstraction
interface NotificationService {
  send(message: string, recipient: string): Promise<void>;
}

class EmailService implements NotificationService {
  async send(message: string, recipient: string): Promise<void> {
    console.log(`Sending email to ${recipient}: ${message}`);
  }
}

class SMSService implements NotificationService {
  async send(message: string, recipient: string): Promise<void> {
    console.log(`Sending SMS to ${recipient}: ${message}`);
  }
}

class UserService {
  constructor(private notificationService: NotificationService) {} // Depends on abstraction

  async createUser(user: User): Promise<void> {
    // User creation logic
    await this.notificationService.send('Welcome!', user.email);
  }
}

// Usage with dependency injection
const emailService = new EmailService();
const userService = new UserService(emailService); // Injected dependency
```

## 🔍 Real-World Examples from Events Registration System

### SRP in Action:
```typescript
// Each service has a single responsibility
export class AuthService {
  // Only handles authentication
  async validateUser(email: string, password: string): Promise<User | null> { }
  async generateToken(user: User): Promise<string> { }
}

export class EventsService {
  // Only handles event operations
  async createEvent(data: CreateEventInput): Promise<Event> { }
  async getEvents(): Promise<Event[]> { }
}

export class RegistrationService {
  // Only handles registration operations
  async createRegistration(data: CreateRegistrationInput): Promise<Registration> { }
  async getRegistrations(eventId: string): Promise<Registration[]> { }
}
```

### OCP in Action:
```typescript
// Extensible role system
export type UserRole = 'ADMIN' | 'EVENT_ORGANIZER' | 'REGISTRATION_STAFF' | 'FINANCE_TEAM';

// New roles can be added without modifying existing code
export function getRoleDashboard(role: UserRole): string {
  const dashboards: Record<UserRole, string> = {
    'ADMIN': '/admin',
    'EVENT_ORGANIZER': '/organizer/dashboard',
    'REGISTRATION_STAFF': '/staff/dashboard',
    'FINANCE_TEAM': '/finance/dashboard'
  };
  return dashboards[role] || '/dashboard';
}
```

### DIP in Action:
```typescript
// High-level module depends on abstraction
@Injectable()
export class RegistrationService {
  constructor(
    private prisma: PrismaService, // Abstraction
    private qrCodeService: QRCodeService, // Abstraction
    private auditService: AuditService // Abstraction
  ) {}
}
```

## 🏃‍♂️ Practical Exercises

### Exercise 1: Identify SOLID Violations
Review this code and identify which SOLID principles are violated:

```typescript
class OrderService {
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

    // Different payment processing based on type
    if (order.paymentMethod === 'credit_card') {
      console.log('Processing credit card payment');
    } else if (order.paymentMethod === 'paypal') {
      console.log('Processing PayPal payment');
    }

    // Send email directly
    const smtp = require('nodemailer');
    const transporter = smtp.createTransporter({
      host: 'smtp.gmail.com',
      auth: { user: 'user@gmail.com', pass: 'password' }
    });
    transporter.sendMail({
      to: order.customerEmail,
      subject: 'Order Confirmation',
      text: `Your order total is $${total}`
    });

    // Save to database directly
    const mysql = require('mysql');
    const connection = mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'orders'
    });
    connection.query('INSERT INTO orders SET ?', order);
  }
}
```

### Exercise 2: Refactor to Follow SOLID
Refactor the above code to follow all SOLID principles.

## 📝 Summary

### Key Takeaways
1. **SRP**: One class, one responsibility
2. **OCP**: Open for extension, closed for modification
3. **LSP**: Subtypes must be substitutable for their base types
4. **ISP**: Many specific interfaces are better than one general-purpose interface
5. **DIP**: Depend on abstractions, not concretions

### Benefits of Following SOLID
- **Maintainability**: Easier to modify and extend code
- **Testability**: Easier to write unit tests
- **Flexibility**: Code adapts to changing requirements
- **Reusability**: Components can be reused in different contexts
- **Readability**: Code is easier to understand

### Next Steps
- Complete the exercises above
- Review your existing code for SOLID violations
- Practice refactoring code to follow SOLID principles
- Proceed to [Basic Design Patterns](./basic-patterns.md)

---

**Estimated Study Time**: 6-8 hours  
**Prerequisites**: Core Concepts module  
**Next Module**: [Basic Design Patterns](./basic-patterns.md)
