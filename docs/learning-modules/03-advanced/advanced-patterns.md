# Module 3.1: Advanced Design Patterns

## 🎯 Learning Objectives

By the end of this module, you will understand:
- Advanced design patterns beyond the basics
- When and how to apply complex patterns
- Real-world implementations from the Events Registration System
- Anti-patterns to avoid

## 📚 Advanced Creational Patterns

### Builder Pattern (Advanced)
**Use Case**: Complex object construction with many optional parameters

```typescript
// ========================
// ADVANCED BUILDER PATTERN
// ========================

interface EventConfiguration {
  name: string;
  description?: string;
  date: Date;
  venue: string;
  maxCapacity?: number;
  paymentRequired?: boolean;
  categories?: CategoryConfig[];
  meals?: MealConfig[];
  badgeTemplate?: string;
  notifications?: NotificationConfig;
}

class EventBuilder {
  private config: Partial<EventConfiguration> = {};

  setBasicInfo(name: string, date: Date, venue: string): EventBuilder {
    this.config.name = name;
    this.config.date = date;
    this.config.venue = venue;
    return this;
  }

  setDescription(description: string): EventBuilder {
    this.config.description = description;
    return this;
  }

  setCapacity(maxCapacity: number): EventBuilder {
    this.config.maxCapacity = maxCapacity;
    return this;
  }

  enablePayments(required: boolean = true): EventBuilder {
    this.config.paymentRequired = required;
    return this;
  }

  addCategory(name: string, price: number, capacity?: number): EventBuilder {
    if (!this.config.categories) this.config.categories = [];
    this.config.categories.push({ name, price, capacity });
    return this;
  }

  addMeal(name: string, time: Date, location?: string): EventBuilder {
    if (!this.config.meals) this.config.meals = [];
    this.config.meals.push({ name, time, location });
    return this;
  }

  setBadgeTemplate(template: string): EventBuilder {
    this.config.badgeTemplate = template;
    return this;
  }

  configureNotifications(config: NotificationConfig): EventBuilder {
    this.config.notifications = config;
    return this;
  }

  build(): EventConfiguration {
    if (!this.config.name || !this.config.date || !this.config.venue) {
      throw new Error('Missing required fields: name, date, venue');
    }
    return this.config as EventConfiguration;
  }

  // Fluent interface for common configurations
  static conference(): EventBuilder {
    return new EventBuilder()
      .enablePayments(true)
      .setBadgeTemplate('conference')
      .configureNotifications({
        reminder: true,
        confirmations: true,
        updates: true
      });
  }

  static workshop(): EventBuilder {
    return new EventBuilder()
      .enablePayments(true)
      .setBadgeTemplate('workshop')
      .setCapacity(50);
  }
}

// Usage
const techConference = EventBuilder
  .conference()
  .setBasicInfo('Tech Summit 2024', new Date('2024-06-15'), 'Convention Center')
  .setDescription('Annual technology conference')
  .setCapacity(500)
  .addCategory('Standard', 299)
  .addCategory('VIP', 599, 50)
  .addMeal('Welcome Lunch', new Date('2024-06-15T12:00'))
  .build();
```

### Abstract Factory Pattern
**Use Case**: Creating families of related objects

```typescript
// ========================
// ABSTRACT FACTORY PATTERN
// ========================

// Abstract factory interface
interface NotificationFactory {
  createEmailNotification(): EmailNotification;
  createSMSNotification(): SMSNotification;
  createPushNotification(): PushNotification;
}

// Concrete factories for different environments
class ProductionNotificationFactory implements NotificationFactory {
  createEmailNotification(): EmailNotification {
    return new SendGridEmailNotification();
  }

  createSMSNotification(): SMSNotification {
    return new TwilioSMSNotification();
  }

  createPushNotification(): PushNotification {
    return new FirebasePushNotification();
  }
}

class DevelopmentNotificationFactory implements NotificationFactory {
  createEmailNotification(): EmailNotification {
    return new ConsoleEmailNotification();
  }

  createSMSNotification(): SMSNotification {
    return new ConsoleSMSNotification();
  }

  createPushNotification(): PushNotification {
    return new ConsolePushNotification();
  }
}

// Notification service using factory
@Injectable()
export class NotificationService {
  constructor(private factory: NotificationFactory) {}

  async sendRegistrationConfirmation(registration: Registration): Promise<void> {
    const emailNotification = this.factory.createEmailNotification();
    const smsNotification = this.factory.createSMSNotification();

    await Promise.all([
      emailNotification.send({
        to: registration.email,
        subject: 'Registration Confirmed',
        template: 'registration-confirmation',
        data: { registration }
      }),
      smsNotification.send({
        to: registration.phone,
        message: `Registration confirmed for ${registration.event.name}`
      })
    ]);
  }
}
```

## 🏗️ Advanced Structural Patterns

### Decorator Pattern (Advanced)
**Use Case**: Adding behavior to objects dynamically

```typescript
// ========================
// DECORATOR PATTERN
// ========================

interface RegistrationProcessor {
  process(registration: RegistrationData): Promise<ProcessingResult>;
}

// Base processor
class BasicRegistrationProcessor implements RegistrationProcessor {
  async process(registration: RegistrationData): Promise<ProcessingResult> {
    // Basic registration logic
    const result = await this.saveRegistration(registration);
    return { success: true, registration: result };
  }

  private async saveRegistration(data: RegistrationData) {
    // Implementation
  }
}

// Abstract decorator
abstract class RegistrationProcessorDecorator implements RegistrationProcessor {
  constructor(protected processor: RegistrationProcessor) {}

  async process(registration: RegistrationData): Promise<ProcessingResult> {
    return this.processor.process(registration);
  }
}

// Concrete decorators
class ValidationDecorator extends RegistrationProcessorDecorator {
  async process(registration: RegistrationData): Promise<ProcessingResult> {
    // Add validation
    const validationResult = await this.validateRegistration(registration);
    if (!validationResult.isValid) {
      return { success: false, errors: validationResult.errors };
    }

    return super.process(registration);
  }

  private async validateRegistration(registration: RegistrationData) {
    // Validation logic
  }
}

class PaymentDecorator extends RegistrationProcessorDecorator {
  async process(registration: RegistrationData): Promise<ProcessingResult> {
    const result = await super.process(registration);
    
    if (result.success && registration.paymentRequired) {
      const paymentResult = await this.processPayment(registration);
      return { ...result, payment: paymentResult };
    }

    return result;
  }

  private async processPayment(registration: RegistrationData) {
    // Payment processing logic
  }
}

class NotificationDecorator extends RegistrationProcessorDecorator {
  constructor(
    processor: RegistrationProcessor,
    private notificationService: NotificationService
  ) {
    super(processor);
  }

  async process(registration: RegistrationData): Promise<ProcessingResult> {
    const result = await super.process(registration);
    
    if (result.success) {
      await this.notificationService.sendRegistrationConfirmation(result.registration);
    }

    return result;
  }
}

// Usage - composing decorators
const processor = new NotificationDecorator(
  new PaymentDecorator(
    new ValidationDecorator(
      new BasicRegistrationProcessor()
    )
  ),
  notificationService
);

const result = await processor.process(registrationData);
```

### Adapter Pattern (Advanced)
**Use Case**: Integrating with multiple payment providers

```typescript
// ========================
// ADAPTER PATTERN
// ========================

// Target interface our application expects
interface PaymentGateway {
  processPayment(amount: number, currency: string, card: CardDetails): Promise<PaymentResult>;
  refundPayment(transactionId: string, amount?: number): Promise<RefundResult>;
}

// Stripe adapter
class StripeAdapter implements PaymentGateway {
  constructor(private stripe: Stripe) {}

  async processPayment(amount: number, currency: string, card: CardDetails): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount * 100, // Stripe uses cents
        currency: currency.toLowerCase(),
        payment_method_data: {
          type: 'card',
          card: {
            number: card.number,
            exp_month: card.expiryMonth,
            exp_year: card.expiryYear,
            cvc: card.cvv
          }
        },
        confirm: true
      });

      return {
        success: true,
        transactionId: paymentIntent.id,
        amount,
        currency
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async refundPayment(transactionId: string, amount?: number): Promise<RefundResult> {
    // Stripe refund implementation
  }
}

// PayPal adapter
class PayPalAdapter implements PaymentGateway {
  constructor(private paypal: PayPalAPI) {}

  async processPayment(amount: number, currency: string, card: CardDetails): Promise<PaymentResult> {
    try {
      const payment = await this.paypal.payments.create({
        intent: 'sale',
        payer: {
          payment_method: 'credit_card',
          funding_instruments: [{
            credit_card: {
              number: card.number,
              type: this.detectCardType(card.number),
              expire_month: card.expiryMonth,
              expire_year: card.expiryYear,
              cvv2: card.cvv
            }
          }]
        },
        transactions: [{
          amount: {
            total: amount.toString(),
            currency
          }
        }]
      });

      return {
        success: true,
        transactionId: payment.id,
        amount,
        currency
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private detectCardType(number: string): string {
    // Card type detection logic
  }
}

// Payment service using adapters
@Injectable()
export class PaymentService {
  private gateways: Map<string, PaymentGateway> = new Map();

  constructor() {
    this.gateways.set('stripe', new StripeAdapter(new Stripe(process.env.STRIPE_SECRET_KEY)));
    this.gateways.set('paypal', new PayPalAdapter(new PayPalAPI()));
  }

  async processPayment(
    provider: string,
    amount: number,
    currency: string,
    card: CardDetails
  ): Promise<PaymentResult> {
    const gateway = this.gateways.get(provider);
    if (!gateway) {
      throw new Error(`Unsupported payment provider: ${provider}`);
    }

    return gateway.processPayment(amount, currency, card);
  }
}
```

## 🎭 Advanced Behavioral Patterns

### Command Pattern with Undo/Redo
**Use Case**: Event management operations with history

```typescript
// ========================
// COMMAND PATTERN WITH UNDO
// ========================

interface Command {
  execute(): Promise<void>;
  undo(): Promise<void>;
  getDescription(): string;
}

// Concrete commands
class CreateEventCommand implements Command {
  private createdEventId?: string;

  constructor(
    private eventService: EventsService,
    private eventData: CreateEventDto
  ) {}

  async execute(): Promise<void> {
    const event = await this.eventService.create(this.eventData);
    this.createdEventId = event.id;
  }

  async undo(): Promise<void> {
    if (this.createdEventId) {
      await this.eventService.delete(this.createdEventId);
    }
  }

  getDescription(): string {
    return `Create event: ${this.eventData.name}`;
  }
}

class UpdateEventCommand implements Command {
  private previousData?: Event;

  constructor(
    private eventService: EventsService,
    private eventId: string,
    private newData: UpdateEventDto
  ) {}

  async execute(): Promise<void> {
    this.previousData = await this.eventService.findById(this.eventId);
    await this.eventService.update(this.eventId, this.newData);
  }

  async undo(): Promise<void> {
    if (this.previousData) {
      await this.eventService.update(this.eventId, this.previousData);
    }
  }

  getDescription(): string {
    return `Update event: ${this.eventId}`;
  }
}

// Command manager with history
class CommandManager {
  private history: Command[] = [];
  private currentIndex = -1;

  async executeCommand(command: Command): Promise<void> {
    try {
      await command.execute();
      
      // Remove any commands after current index (for redo functionality)
      this.history = this.history.slice(0, this.currentIndex + 1);
      
      // Add new command
      this.history.push(command);
      this.currentIndex++;
      
      console.log(`Executed: ${command.getDescription()}`);
    } catch (error) {
      console.error(`Failed to execute command: ${error.message}`);
      throw error;
    }
  }

  async undo(): Promise<void> {
    if (this.currentIndex >= 0) {
      const command = this.history[this.currentIndex];
      await command.undo();
      this.currentIndex--;
      console.log(`Undid: ${command.getDescription()}`);
    }
  }

  async redo(): Promise<void> {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      const command = this.history[this.currentIndex];
      await command.execute();
      console.log(`Redid: ${command.getDescription()}`);
    }
  }

  getHistory(): string[] {
    return this.history.map(cmd => cmd.getDescription());
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }
}
```

### State Pattern
**Use Case**: Registration state management

```typescript
// ========================
// STATE PATTERN
// ========================

interface RegistrationState {
  register(context: RegistrationContext): Promise<void>;
  cancel(context: RegistrationContext): Promise<void>;
  checkIn(context: RegistrationContext): Promise<void>;
  processPayment(context: RegistrationContext): Promise<void>;
}

class RegistrationContext {
  private state: RegistrationState;
  
  constructor(
    public registration: Registration,
    private registrationService: RegistrationService
  ) {
    this.state = new PendingState();
  }

  setState(state: RegistrationState): void {
    this.state = state;
  }

  async register(): Promise<void> {
    await this.state.register(this);
  }

  async cancel(): Promise<void> {
    await this.state.cancel(this);
  }

  async checkIn(): Promise<void> {
    await this.state.checkIn(this);
  }

  async processPayment(): Promise<void> {
    await this.state.processPayment(this);
  }
}

// State implementations
class PendingState implements RegistrationState {
  async register(context: RegistrationContext): Promise<void> {
    // Registration logic
    context.registration.status = 'REGISTERED';
    await context.registrationService.update(context.registration);
    
    if (context.registration.paymentRequired) {
      context.setState(new AwaitingPaymentState());
    } else {
      context.setState(new ConfirmedState());
    }
  }

  async cancel(context: RegistrationContext): Promise<void> {
    context.registration.status = 'CANCELLED';
    await context.registrationService.update(context.registration);
    context.setState(new CancelledState());
  }

  async checkIn(context: RegistrationContext): Promise<void> {
    throw new Error('Cannot check in pending registration');
  }

  async processPayment(context: RegistrationContext): Promise<void> {
    throw new Error('Cannot process payment for pending registration');
  }
}

class AwaitingPaymentState implements RegistrationState {
  async register(context: RegistrationContext): Promise<void> {
    throw new Error('Registration already exists');
  }

  async cancel(context: RegistrationContext): Promise<void> {
    context.registration.status = 'CANCELLED';
    await context.registrationService.update(context.registration);
    context.setState(new CancelledState());
  }

  async checkIn(context: RegistrationContext): Promise<void> {
    throw new Error('Cannot check in without payment');
  }

  async processPayment(context: RegistrationContext): Promise<void> {
    // Process payment
    context.registration.paymentStatus = 'PAID';
    context.registration.status = 'CONFIRMED';
    await context.registrationService.update(context.registration);
    context.setState(new ConfirmedState());
  }
}

class ConfirmedState implements RegistrationState {
  async register(context: RegistrationContext): Promise<void> {
    throw new Error('Registration already confirmed');
  }

  async cancel(context: RegistrationContext): Promise<void> {
    // Handle refund if needed
    context.registration.status = 'CANCELLED';
    await context.registrationService.update(context.registration);
    context.setState(new CancelledState());
  }

  async checkIn(context: RegistrationContext): Promise<void> {
    context.registration.checkedIn = true;
    context.registration.checkInTime = new Date();
    await context.registrationService.update(context.registration);
    context.setState(new CheckedInState());
  }

  async processPayment(context: RegistrationContext): Promise<void> {
    throw new Error('Payment already processed');
  }
}
```

## 🏃‍♂️ Practical Exercises

### Exercise 1: Chain of Responsibility
Implement a validation chain for event creation with:
- Basic data validation
- Capacity validation
- Date validation
- Venue availability check

### Exercise 2: Visitor Pattern
Create a visitor pattern for generating different reports:
- Registration summary
- Financial report
- Attendance report

### Exercise 3: Memento Pattern
Implement event versioning with memento pattern to:
- Save event snapshots
- Restore previous versions
- Track change history

## 📝 Summary

### When to Use Advanced Patterns
- **Builder**: Complex object construction
- **Abstract Factory**: Family of related objects
- **Decorator**: Dynamic behavior addition
- **Command**: Operations with undo/redo
- **State**: Object behavior based on state

### Anti-Patterns to Avoid
- **God Object**: Classes doing too much
- **Spaghetti Code**: Unstructured control flow
- **Copy-Paste Programming**: Code duplication
- **Magic Numbers**: Unexplained constants

### Next Steps
- Complete the exercises above
- Study pattern combinations
- Proceed to [Security Engineering](./security-engineering.md)

---

**Estimated Study Time**: 12-15 hours  
**Prerequisites**: Basic design patterns, API Design  
**Next Module**: [Security Engineering](./security-engineering.md)
