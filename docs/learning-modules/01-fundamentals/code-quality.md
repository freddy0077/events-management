# Module 1.4: Code Quality & Best Practices

## 🎯 Learning Objectives

By the end of this module, you will understand:
- What constitutes high-quality code
- Code quality metrics and how to measure them
- Best practices for writing maintainable code
- Tools and techniques for ensuring code quality

## 📚 What is Code Quality?

**Definition**: Code quality refers to how well-written, maintainable, readable, and reliable code is. High-quality code is easy to understand, modify, test, and debug.

**Key Characteristics of Quality Code**:
- **Readable**: Easy to understand by other developers
- **Maintainable**: Easy to modify and extend
- **Testable**: Easy to write tests for
- **Reliable**: Works correctly and handles errors gracefully
- **Performant**: Executes efficiently
- **Secure**: Protects against vulnerabilities

## 🔍 Code Quality Metrics

### 1. Type Safety

**Definition**: The extent to which a programming language prevents type errors, ensuring operations are performed on appropriate data types.

**Benefits**:
- Catches errors at compile time
- Improves IDE support and autocomplete
- Makes code more self-documenting
- Reduces runtime errors

#### ❌ Poor Type Safety:
```typescript
// Bad: Using 'any' everywhere
function processUser(user: any): any {
  return {
    name: user.name.toUpperCase(), // Could crash if name is undefined
    age: user.age + 1, // Could result in string concatenation
    email: user.email.toLowerCase() // Could crash if email is undefined
  };
}

// Usage - no compile-time safety
const result = processUser({ name: "John", age: "25" }); // age is string, not number
```

#### ✅ Strong Type Safety:
```typescript
// Good: Proper type definitions
interface User {
  id: string;
  name: string;
  age: number;
  email: string;
  isActive: boolean;
}

interface ProcessedUser {
  name: string;
  age: number;
  email: string;
  displayName: string;
}

function processUser(user: User): ProcessedUser {
  return {
    name: user.name.toUpperCase(),
    age: user.age + 1,
    email: user.email.toLowerCase(),
    displayName: `${user.name} (${user.age})`
  };
}

// Usage - compile-time safety
const user: User = {
  id: "123",
  name: "John",
  age: 25, // Must be number
  email: "john@example.com",
  isActive: true
};

const result = processUser(user); // Type-safe
```

### 2. Coupling and Cohesion

**Coupling**: The degree of interdependence between software modules. **Low coupling is desirable**.

**Cohesion**: The degree to which elements within a module work together toward a single purpose. **High cohesion is desirable**.

#### ❌ High Coupling, Low Cohesion:
```typescript
// Bad: Tightly coupled, mixed responsibilities
class OrderProcessor {
  private database = new MySQL(); // Direct dependency
  private emailService = new SMTPEmailService(); // Direct dependency
  private paymentGateway = new StripeGateway(); // Direct dependency

  processOrder(order: Order): void {
    // Validation logic (different concern)
    if (!order.items || order.items.length === 0) {
      throw new Error('No items');
    }

    // Payment processing (different concern)
    this.paymentGateway.charge(order.total, order.paymentMethod);

    // Database operations (different concern)
    this.database.query('INSERT INTO orders...', order);

    // Email notifications (different concern)
    this.emailService.send(order.customerEmail, 'Order confirmed');

    // Logging (different concern)
    console.log(`Order ${order.id} processed`);
  }
}
```

#### ✅ Low Coupling, High Cohesion:
```typescript
// Good: Loosely coupled, single responsibilities
interface OrderValidator {
  validate(order: Order): void;
}

interface PaymentProcessor {
  processPayment(amount: number, method: string): Promise<PaymentResult>;
}

interface OrderRepository {
  save(order: Order): Promise<void>;
}

interface NotificationService {
  sendOrderConfirmation(email: string, order: Order): Promise<void>;
}

interface Logger {
  log(message: string, context?: any): void;
}

class OrderService {
  constructor(
    private validator: OrderValidator,
    private paymentProcessor: PaymentProcessor,
    private repository: OrderRepository,
    private notificationService: NotificationService,
    private logger: Logger
  ) {}

  async processOrder(order: Order): Promise<void> {
    this.validator.validate(order);
    
    const paymentResult = await this.paymentProcessor.processPayment(
      order.total, 
      order.paymentMethod
    );
    
    if (paymentResult.success) {
      await this.repository.save(order);
      await this.notificationService.sendOrderConfirmation(order.customerEmail, order);
      this.logger.log('Order processed successfully', { orderId: order.id });
    }
  }
}
```

### 3. Cyclomatic Complexity

**Definition**: A software metric that measures the number of linearly independent paths through a program's source code.

**Guidelines**:
- **1-10**: Simple, low risk
- **11-20**: Moderate complexity, medium risk
- **21-50**: Complex, high risk
- **>50**: Very complex, very high risk

#### ❌ High Complexity:
```typescript
// Bad: High cyclomatic complexity (many branches)
function calculateDiscount(user: User, order: Order): number {
  let discount = 0;
  
  if (user.type === 'premium') {
    if (user.yearsActive > 5) {
      if (order.total > 1000) {
        if (user.lastOrderDays < 30) {
          discount = 0.25;
        } else if (user.lastOrderDays < 90) {
          discount = 0.20;
        } else {
          discount = 0.15;
        }
      } else if (order.total > 500) {
        if (user.lastOrderDays < 30) {
          discount = 0.15;
        } else {
          discount = 0.10;
        }
      } else {
        discount = 0.05;
      }
    } else if (user.yearsActive > 2) {
      if (order.total > 500) {
        discount = 0.10;
      } else {
        discount = 0.05;
      }
    }
  } else if (user.type === 'regular') {
    if (order.total > 1000) {
      discount = 0.05;
    }
  }
  
  return discount;
}
```

#### ✅ Low Complexity:
```typescript
// Good: Lower complexity through strategy pattern
interface DiscountStrategy {
  calculate(user: User, order: Order): number;
}

class PremiumLongTermStrategy implements DiscountStrategy {
  calculate(user: User, order: Order): number {
    const baseDiscount = this.getBaseDiscount(order.total);
    const loyaltyBonus = this.getLoyaltyBonus(user.lastOrderDays);
    return Math.min(baseDiscount + loyaltyBonus, 0.25);
  }

  private getBaseDiscount(total: number): number {
    if (total > 1000) return 0.15;
    if (total > 500) return 0.10;
    return 0.05;
  }

  private getLoyaltyBonus(daysSinceLastOrder: number): number {
    if (daysSinceLastOrder < 30) return 0.10;
    if (daysSinceLastOrder < 90) return 0.05;
    return 0;
  }
}

class PremiumNewStrategy implements DiscountStrategy {
  calculate(user: User, order: Order): number {
    return order.total > 500 ? 0.10 : 0.05;
  }
}

class RegularUserStrategy implements DiscountStrategy {
  calculate(user: User, order: Order): number {
    return order.total > 1000 ? 0.05 : 0;
  }
}

class DiscountCalculator {
  private strategies = new Map<string, DiscountStrategy>([
    ['premium-long-term', new PremiumLongTermStrategy()],
    ['premium-new', new PremiumNewStrategy()],
    ['regular', new RegularUserStrategy()]
  ]);

  calculateDiscount(user: User, order: Order): number {
    const strategyKey = this.getStrategyKey(user);
    const strategy = this.strategies.get(strategyKey);
    return strategy ? strategy.calculate(user, order) : 0;
  }

  private getStrategyKey(user: User): string {
    if (user.type === 'premium') {
      return user.yearsActive > 5 ? 'premium-long-term' : 'premium-new';
    }
    return 'regular';
  }
}
```

## 🛠️ Code Quality Tools

### 1. Linting (ESLint)

**Purpose**: Automatically identify and fix code quality issues.

#### Configuration Example:
```json
// .eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-var": "error",
    "complexity": ["warn", 10],
    "max-lines-per-function": ["warn", 50]
  }
}
```

### 2. Code Formatting (Prettier)

**Purpose**: Automatically format code for consistency.

#### Configuration Example:
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### 3. Type Checking (TypeScript)

**Purpose**: Catch type-related errors at compile time.

#### Configuration Example:
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## 📝 Best Practices

### 1. Naming Conventions

#### ✅ Good Naming:
```typescript
// Clear, descriptive names
class UserRegistrationService {
  async registerNewUser(userData: CreateUserRequest): Promise<User> {
    const hashedPassword = await this.hashPassword(userData.password);
    const newUser = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
      createdAt: new Date()
    });
    
    await this.emailService.sendWelcomeEmail(newUser.email);
    return newUser;
  }

  private async hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, 12);
  }
}

// Clear variable names
const activeUsersCount = await this.userRepository.countActiveUsers();
const isEmailVerified = user.emailVerifiedAt !== null;
const shouldSendReminder = daysSinceLastLogin > 30;
```

### 2. Function Design

#### ✅ Good Function Design:
```typescript
// Single responsibility, clear purpose
function validateEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Pure function - no side effects
function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

// Clear error handling
async function fetchUserById(id: string): Promise<User> {
  if (!id) {
    throw new Error('User ID is required');
  }

  try {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    return user;
  } catch (error) {
    this.logger.error('Failed to fetch user', { id, error: error.message });
    throw error;
  }
}
```

### 3. Error Handling

#### ✅ Proper Error Handling:
```typescript
// Custom error types
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`);
    this.name = 'NotFoundError';
  }
}

// Service with proper error handling
class UserService {
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      // Validation
      this.validateUserData(userData);
      
      // Check for existing user
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new ValidationError('Email already exists', 'email');
      }

      // Create user
      const user = await this.userRepository.create(userData);
      
      // Send welcome email (non-critical, don't fail if it fails)
      try {
        await this.emailService.sendWelcomeEmail(user.email);
      } catch (emailError) {
        this.logger.warn('Failed to send welcome email', { 
          userId: user.id, 
          error: emailError.message 
        });
      }

      return user;
    } catch (error) {
      this.logger.error('Failed to create user', { 
        userData: { email: userData.email }, 
        error: error.message 
      });
      throw error;
    }
  }

  private validateUserData(userData: CreateUserRequest): void {
    if (!userData.email) {
      throw new ValidationError('Email is required', 'email');
    }
    if (!validateEmailFormat(userData.email)) {
      throw new ValidationError('Invalid email format', 'email');
    }
    if (!userData.password || userData.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters', 'password');
    }
  }
}
```

## 🔍 Real-World Examples from Events Registration System

### Type Safety Implementation:
```typescript
// Strong typing throughout the system
interface CreateRegistrationInput {
  eventId: string;
  categoryId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  paymentMethod?: PaymentMethod;
}

enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

// Type-safe service methods
@Injectable()
export class RegistrationService {
  async createRegistration(
    staffUserId: string, 
    input: CreateRegistrationInput
  ): Promise<Registration> {
    // Type safety ensures correct parameter types
    return this.prisma.registration.create({
      data: {
        ...input,
        staffUserId,
        createdAt: new Date()
      }
    });
  }
}
```

### Error Handling Implementation:
```typescript
// Comprehensive error handling with custom exceptions
export class RegistrationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'RegistrationError';
  }
}

@Resolver(() => Registration)
export class RegistrationResolver {
  @Mutation(() => RegistrationPayload)
  async createStaffRegistration(
    @Args('input') input: CreateStaffRegistrationInput,
    @Context() context: any,
  ): Promise<RegistrationPayload> {
    try {
      const staffUserId = context.req.user.id;
      const registration = await this.registrationService.createStaffRegistration(
        staffUserId, 
        input
      );
      
      return {
        registration,
        qrCodeData: '',
        paymentUrl: null,
      };
    } catch (error) {
      this.logger.error('Failed to create staff registration', {
        input,
        userId: context.req.user?.id,
        error: error.message
      });
      
      if (error instanceof ValidationError) {
        throw new GraphQLError(error.message, {
          extensions: { code: 'VALIDATION_ERROR' }
        });
      }
      
      throw new GraphQLError('Failed to create registration', {
        extensions: { code: 'INTERNAL_ERROR' }
      });
    }
  }
}
```

## 🏃‍♂️ Practical Exercises

### Exercise 1: Code Quality Assessment
Review this code and identify quality issues:

```typescript
function proc(d: any): any {
  let r = {};
  if (d.t == 'u') {
    r.n = d.fn + ' ' + d.ln;
    r.e = d.em;
    if (d.a > 18) {
      r.ad = true;
    }
  } else if (d.t == 'o') {
    r.n = d.on;
    r.ty = 'org';
  }
  return r;
}
```

### Exercise 2: Refactor for Quality
Refactor the above code to improve:
- Type safety
- Readability
- Maintainability
- Error handling

### Exercise 3: Complexity Reduction
Simplify this complex function using appropriate patterns:

```typescript
function calculateShipping(order: any): number {
  if (order.country === 'US') {
    if (order.state === 'CA' || order.state === 'NY') {
      if (order.weight < 5) {
        return order.total > 100 ? 0 : 15;
      } else if (order.weight < 10) {
        return order.total > 150 ? 5 : 25;
      } else {
        return order.total > 200 ? 10 : 35;
      }
    } else {
      if (order.weight < 5) {
        return order.total > 75 ? 0 : 12;
      } else {
        return order.total > 125 ? 8 : 22;
      }
    }
  } else if (order.country === 'CA') {
    return order.weight < 5 ? 20 : 30;
  } else {
    return order.weight < 2 ? 25 : 45;
  }
}
```

## 📝 Summary

### Key Quality Principles
1. **Type Safety**: Use strong typing to catch errors early
2. **Low Coupling**: Minimize dependencies between modules
3. **High Cohesion**: Keep related functionality together
4. **Low Complexity**: Keep functions and classes simple
5. **Clear Naming**: Use descriptive, meaningful names
6. **Error Handling**: Handle errors gracefully and informatively

### Quality Tools
- **ESLint**: Code linting and style checking
- **Prettier**: Automatic code formatting
- **TypeScript**: Static type checking
- **SonarQube**: Code quality analysis
- **Jest**: Testing framework

### Next Steps
- Complete the exercises above
- Set up quality tools in your projects
- Practice refactoring existing code
- Proceed to [Module 2: Architecture](../02-architecture/architectural-patterns.md)

---

**Estimated Study Time**: 6-8 hours  
**Prerequisites**: Basic Design Patterns module  
**Next Module**: [Architectural Patterns](../02-architecture/architectural-patterns.md)
