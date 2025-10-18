import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRegistrationInput, CreateStaffRegistrationInput, UpdateRegistrationInput } from './dto/registration.dto';
import { Registration, PaymentStatus } from '@prisma/client';
import { DistributedLockService } from '../../services/distributed-lock.service';
import { CapacityCounterService } from '../../services/capacity-counter.service';

@Injectable()
export class RegistrationService {
  constructor(
    private prisma: PrismaService,
    private distributedLock: DistributedLockService,
    private capacityCounter: CapacityCounterService,
  ) {}

  /**
   * Helper method to check capacity constraints atomically within a transaction
   * Uses SELECT FOR UPDATE to lock rows and prevent race conditions in high-concurrency scenarios
   */
  private async checkCapacityConstraints(
    tx: any,
    eventId: string,
    categoryId: string,
    event: any,
    category: any,
    willCreatePaidTransaction: boolean = false
  ): Promise<void> {
    // Lock the category row to prevent concurrent modifications
    // This ensures accurate capacity counting even with 6+ simultaneous registrations
    if (category.maxCapacity) {
      // Use raw query with SELECT FOR UPDATE to lock the category row
      await tx.$queryRaw`
        SELECT id FROM "categories" WHERE id = ${categoryId} FOR UPDATE
      `;

      const currentCategoryCount = await tx.registration.count({
        where: {
          categoryId,
          transactions: {
            some: {
              paymentStatus: 'PAID'
            }
          }
        }
      });

      const effectiveCount = currentCategoryCount + (willCreatePaidTransaction ? 1 : 0);
      
      console.log(`🔒 Category capacity check (locked): ${effectiveCount}/${category.maxCapacity} for category "${category.name}"`);
      
      if (effectiveCount > category.maxCapacity) {
        throw new BadRequestException(`Category "${category.name}" is at full capacity (${category.maxCapacity}/${category.maxCapacity})`);
      }
    }

    // Lock the event row to prevent concurrent modifications
    if (event.maxCapacity) {
      // Use raw query with SELECT FOR UPDATE to lock the event row
      await tx.$queryRaw`
        SELECT id FROM "events" WHERE id = ${eventId} FOR UPDATE
      `;

      const currentEventCount = await tx.registration.count({
        where: {
          eventId,
          transactions: {
            some: {
              paymentStatus: 'PAID'
            }
          }
        }
      });

      const effectiveCount = currentEventCount + (willCreatePaidTransaction ? 1 : 0);
      
      console.log(`🔒 Event capacity check (locked): ${effectiveCount}/${event.maxCapacity} for event "${event.name}"`);
      
      if (effectiveCount > event.maxCapacity) {
        throw new BadRequestException(`Event "${event.name}" is at full capacity (${event.maxCapacity}/${event.maxCapacity})`);
      }
    }
  }

  async createRegistration(
    userId: string,
    createRegistrationInput: CreateRegistrationInput,
  ): Promise<Registration> {
    const { eventId, categoryId, specialRequests, paymentMethod } = createRegistrationInput;

    // Get user details for registration
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify event and category exist and are active
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { categories: true },
    });

    if (!event || !event.isActive) {
      throw new NotFoundException('Event not found or inactive');
    }

    const category = event.categories.find(cat => cat.id === categoryId);
    if (!category || !category.isActive) {
      throw new NotFoundException('Category not found or inactive');
    }

    // Check if user already registered for this event
    const existingRegistration = await this.prisma.registration.findFirst({
      where: {
        email: user.email,
        eventId,
      },
    });

    if (existingRegistration) {
      throw new BadRequestException('User already registered for this event');
    }

    // Use atomic transaction with Serializable isolation to prevent race conditions
    const registration = await this.prisma.$transaction(
      async (tx) => {
        // Check capacity constraints atomically
        await this.checkCapacityConstraints(tx, eventId, categoryId, event, category, false);

        // Create registration atomically within the same transaction
        return await tx.registration.create({
          data: {
            eventId,
            categoryId,
            fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            email: user.email,
            phone: '', // Will be updated when user profile is enhanced
            address: '', // Will be updated when user profile is enhanced
            // Payment status is now handled by transactions
            notes: specialRequests,
          },
          include: {
            event: true,
            category: true,
          },
        });
      },
      {
        isolationLevel: 'Serializable',
        maxWait: 5000,
        timeout: 10000,
      }
    );


    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        eventId,
        registrationId: registration.id,
        action: 'REGISTRATION_CREATED',
        details: { message: `Registration created for event: ${event.name}`, userId },
        performedBy: userId,
      },
    });

    return registration;
  }

  async createStaffRegistration(
    staffUserId: string,
    createStaffRegistrationInput: CreateStaffRegistrationInput,
  ): Promise<Registration> {
    // Use Redis-based locking if enabled, otherwise fall back to database locking
    const useRedisLocks = process.env.USE_REDIS_LOCKS === 'true';
    
    if (useRedisLocks) {
      return this.createStaffRegistrationWithRedisLocks(staffUserId, createStaffRegistrationInput);
    } else {
      return this.createStaffRegistrationWithDatabaseLocks(staffUserId, createStaffRegistrationInput);
    }
  }

  /**
   * Create staff registration using Redis distributed locks (Phase 1 implementation)
   * Provides better performance and scalability for high-concurrency scenarios
   */
  private async createStaffRegistrationWithRedisLocks(
    staffUserId: string,
    createStaffRegistrationInput: CreateStaffRegistrationInput,
  ): Promise<Registration> {
    console.log('=== CreateStaffRegistration (Redis Locks) ===');
    console.log('Staff User ID:', staffUserId);
    console.log('Input:', JSON.stringify(createStaffRegistrationInput, null, 2));
    
    const { 
      eventId, 
      categoryId, 
      fullName, 
      email, 
      phone, 
      address, 
      zone,
      receiptNumber, 
      specialRequests, 
      paymentMethod 
    } = createStaffRegistrationInput;

    // Verify event and category exist and are active
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { categories: true },
    });

    if (!event || !event.isActive) {
      throw new NotFoundException('Event not found or inactive');
    }
    
    const category = event.categories.find(cat => cat.id === categoryId);
    if (!category || !category.isActive) {
      throw new NotFoundException('Category not found or inactive');
    }

    // Check if participant already registered for this event
    const existingRegistration = await this.prisma.registration.findFirst({
      where: { email, eventId },
    });

    if (existingRegistration) {
      throw new BadRequestException('Participant already registered for this event');
    }

    // Acquire distributed locks for event and category
    const eventLockKey = `event:${eventId}`;
    const categoryLockKey = `category:${categoryId}`;
    
    console.log('🔒 Acquiring locks...');
    const eventLock = await this.distributedLock.acquireLock(eventLockKey, 10000, 5, 100);
    if (!eventLock) {
      throw new BadRequestException('Unable to acquire event lock - high traffic, please retry');
    }

    let categoryLock: string | null = null;
    let registration: Registration | null = null;

    try {
      categoryLock = await this.distributedLock.acquireLock(categoryLockKey, 10000, 5, 100);
      if (!categoryLock) {
        throw new BadRequestException('Unable to acquire category lock - high traffic, please retry');
      }

      console.log('✅ Locks acquired successfully');

      // Get or initialize capacity counters from Redis
      let categoryCount = await this.capacityCounter.getCapacityCount('category', categoryId);
      let eventCount = await this.capacityCounter.getCapacityCount('event', eventId);

      // If not in cache, sync from database
      if (categoryCount === null) {
        categoryCount = await this.prisma.registration.count({
          where: {
            categoryId,
            transactions: { some: { paymentStatus: 'PAID' } }
          }
        });
        await this.capacityCounter.setCapacityCount('category', categoryId, categoryCount);
      }

      if (eventCount === null) {
        eventCount = await this.prisma.registration.count({
          where: {
            eventId,
            transactions: { some: { paymentStatus: 'PAID' } }
          }
        });
        await this.capacityCounter.setCapacityCount('event', eventId, eventCount);
      }

      // Check capacity constraints
      const willCreatePaidTransaction = !!paymentMethod;
      const effectiveCategoryCount = categoryCount + (willCreatePaidTransaction ? 1 : 0);
      const effectiveEventCount = eventCount + (willCreatePaidTransaction ? 1 : 0);

      console.log(`📊 Category capacity: ${effectiveCategoryCount}/${category.maxCapacity || 'unlimited'}`);
      console.log(`📊 Event capacity: ${effectiveEventCount}/${event.maxCapacity || 'unlimited'}`);

      if (category.maxCapacity && effectiveCategoryCount > category.maxCapacity) {
        throw new BadRequestException(
          `Category "${category.name}" is at full capacity (${category.maxCapacity}/${category.maxCapacity})`
        );
      }

      if (event.maxCapacity && effectiveEventCount > event.maxCapacity) {
        throw new BadRequestException(
          `Event "${event.name}" is at full capacity (${event.maxCapacity}/${event.maxCapacity})`
        );
      }

      // Create registration in database (lighter transaction, no SELECT FOR UPDATE needed)
      const { registration: newRegistration, transaction: newTransaction } = await this.prisma.$transaction(
        async (tx) => {
          const reg = await tx.registration.create({
            data: {
              eventId,
              categoryId,
              fullName,
              email,
              phone: phone || '',
              address: address || '',
              zone: zone || null,
              notes: specialRequests || '',
              registeredBy: staffUserId,
            },
            include: {
              event: true,
              category: true,
              transactions: true,
            },
          });

          // Create initial transaction if payment method is provided
          let trans = null;
          if (paymentMethod) {
            trans = await tx.transaction.create({
              data: {
                registrationId: reg.id,
                amount: category.price,
                paymentMethod,
                paymentStatus: PaymentStatus.PAID,
                receiptNumber: receiptNumber || null,
                processedBy: staffUserId,
                paymentDate: new Date(),
              },
            });
          }

          return { registration: reg, transaction: trans };
        }
      );

      registration = newRegistration;

      // Increment Redis counters only if payment was made
      if (willCreatePaidTransaction) {
        await this.capacityCounter.incrementCapacity('category', categoryId);
        await this.capacityCounter.incrementCapacity('event', eventId);
        console.log('📈 Capacity counters incremented');
      }

      console.log('✅ Registration created successfully');

    } finally {
      // Always release locks
      if (categoryLock) {
        await this.distributedLock.releaseLock(categoryLockKey, categoryLock);
      }
      await this.distributedLock.releaseLock(eventLockKey, eventLock);
      console.log('🔓 Locks released');
    }

    // Fetch updated registration with transactions
    const updatedRegistration = await this.prisma.registration.findUnique({
      where: { id: registration.id },
      include: {
        event: true,
        category: true,
        transactions: true,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        eventId,
        registrationId: registration.id,
        action: 'STAFF_REGISTRATION_CREATED',
        details: { 
          message: `Staff registration created for participant: ${fullName}`, 
          staffUserId,
          participantEmail: email,
          usedRedisLocks: true,
        },
        performedBy: staffUserId,
      },
    });

    return updatedRegistration;
  }

  /**
   * Create staff registration using database-level locks (original implementation)
   * Fallback method when Redis is not available
   */
  private async createStaffRegistrationWithDatabaseLocks(
    staffUserId: string,
    createStaffRegistrationInput: CreateStaffRegistrationInput,
  ): Promise<Registration> {
    console.log('=== CreateStaffRegistration (Database Locks) ===');
    console.log('Staff User ID:', staffUserId);
    console.log('Input:', JSON.stringify(createStaffRegistrationInput, null, 2));
    
    const { 
      eventId, 
      categoryId, 
      fullName, 
      email, 
      phone, 
      address, 
      zone,
      receiptNumber, 
      specialRequests, 
      paymentMethod 
    } = createStaffRegistrationInput;

    console.log('Extracted eventId:', eventId);
    console.log('Extracted categoryId:', categoryId);

    // Verify event and category exist and are active
    console.log('Fetching event with ID:', eventId);
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { categories: true },
    });

    console.log('Event found:', event ? `${event.name} (active: ${event.isActive})` : 'null');

    if (!event || !event.isActive) {
      console.log('Event validation failed - event not found or inactive');
      throw new NotFoundException('Event not found or inactive');
    }

    console.log('Event categories:', event.categories.map(cat => `${cat.id} (${cat.name}, active: ${cat.isActive})`));
    
    const category = event.categories.find(cat => cat.id === categoryId);
    console.log('Category found:', category ? `${category.name} (active: ${category.isActive})` : 'null');
    
    if (!category || !category.isActive) {
      console.log('Category validation failed - category not found or inactive');
      throw new NotFoundException('Category not found or inactive');
    }

    // Check if participant already registered for this event
    console.log('Checking for existing registration with email:', email, 'eventId:', eventId);
    const existingRegistration = await this.prisma.registration.findFirst({
      where: {
        email,
        eventId,
      },
    });

    console.log('Existing registration found:', existingRegistration ? existingRegistration.id : 'none');

    if (existingRegistration) {
      console.log('Registration validation failed - participant already registered');
      throw new BadRequestException('Participant already registered for this event');
    }

    // Use atomic transaction with Serializable isolation to prevent race conditions
    // This ensures that even with 6+ concurrent staff members, capacity limits are respected
    const { registration, transaction } = await this.prisma.$transaction(
      async (tx) => {
        // Check capacity constraints atomically (accounting for immediate payment if provided)
        const willCreatePaidTransaction = !!paymentMethod;
        await this.checkCapacityConstraints(tx, eventId, categoryId, event, category, willCreatePaidTransaction);

        // Create registration atomically within the same transaction
        const newRegistration = await tx.registration.create({
          data: {
            eventId,
            categoryId,
            fullName,
            email,
            phone: phone || '',
            address: address || '',
            zone: zone || null,
            notes: specialRequests || '',
            registeredBy: staffUserId,
          },
          include: {
            event: true,
            category: true,
            transactions: true,
          },
        });

        // Create initial transaction if payment method is provided (within same transaction)
        let newTransaction = null;
        if (paymentMethod) {
          newTransaction = await tx.transaction.create({
            data: {
              registrationId: newRegistration.id,
              amount: newRegistration.category.price,
              paymentMethod,
              paymentStatus: PaymentStatus.PAID, // Staff registration means payment is confirmed
              receiptNumber: receiptNumber || null,
              processedBy: staffUserId,
              paymentDate: new Date(),
            },
          });
        }

        return { registration: newRegistration, transaction: newTransaction };
      },
      {
        isolationLevel: 'Serializable', // Highest isolation level for concurrent safety
        maxWait: 5000, // Wait up to 5 seconds for lock
        timeout: 10000, // Transaction timeout of 10 seconds
      }
    );

    // Fetch updated registration with transactions
    const updatedRegistration = await this.prisma.registration.findUnique({
      where: { id: registration.id },
      include: {
        event: true,
        category: true,
        transactions: true,
      },
    });


    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        eventId,
        registrationId: registration.id,
        action: 'STAFF_REGISTRATION_CREATED',
        details: { 
          message: `Staff registration created for participant: ${fullName}`, 
          staffUserId,
          participantEmail: email 
        },
        performedBy: staffUserId,
      },
    });

    return updatedRegistration;
  }

  async findAllRegistrations(eventId?: string, limit?: number, offset?: number): Promise<Registration[]> {
    const whereClause = eventId ? { eventId } : {};
    
    return this.prisma.registration.findMany({
      where: whereClause,
      include: {
        event: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async findRegistrations(eventId?: string, eventIds?: string[], limit?: number, offset?: number): Promise<Registration[]> {
    let whereClause = {};
    
    // Support both single eventId and multiple eventIds for event-scoped access
    if (eventIds && eventIds.length > 0) {
      whereClause = { eventId: { in: eventIds } };
    } else if (eventId) {
      whereClause = { eventId };
    }
    
    return this.prisma.registration.findMany({
      where: whereClause,
      include: {
        event: true,
        category: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get latest transaction for payment status
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async findRegistrationsByUser(userId: string): Promise<Registration[]> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return this.prisma.registration.findMany({
      where: { email: user.email },
      include: {
        event: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRegistrationsByEvent(eventId: string): Promise<Registration[]> {
    return this.prisma.registration.findMany({
      where: { eventId },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRegistrationById(id: string): Promise<Registration> {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        event: true,
        category: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    return registration;
  }

  async findRegistrationByQRCode(qrCode: string): Promise<Registration> {
    const registration = await this.prisma.registration.findUnique({
      where: { qrCode },
      include: {
        event: true,
        category: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    return registration;
  }

  async searchRegistrations(searchTerm: string, eventId?: string): Promise<Registration[]> {
    if (!searchTerm || searchTerm.trim() === '') {
      return [];
    }

    const where: any = {
      OR: [
        { fullName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
        { id: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

    if (eventId) {
      where.eventId = eventId;
    }

    return this.prisma.registration.findMany({
      where,
      include: {
        event: true,
        category: true,
        transactions: true,
      },
      take: 50, // Limit results
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async searchRegistrationByReceipt(receiptNumber: string): Promise<Registration | null> {
    if (!receiptNumber || receiptNumber.trim() === '') {
      return null;
    }

    // Search for registration via transaction receipt number
    const transaction = await this.prisma.transaction.findFirst({
      where: { receiptNumber: receiptNumber.trim() },
      include: {
        registration: {
          include: {
            event: true,
            category: true,
          }
        }
      },
    });

    return transaction?.registration || null;
  }

  async updateRegistration(
    id: string,
    updateRegistrationInput: UpdateRegistrationInput,
  ): Promise<Registration> {
    const registration = await this.findRegistrationById(id);

    const updateData: any = { ...updateRegistrationInput };

    const updatedRegistration = await this.prisma.registration.update({
      where: { id },
      data: updateData,
      include: {
        event: true,
        category: true,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        eventId: registration.eventId,
        registrationId: registration.id,
        action: 'REGISTRATION_UPDATED',
        details: { message: 'Registration updated' },
        performedBy: 'system', // Will be updated when we have proper user context
      },
    });

    return updatedRegistration;
  }

  async confirmPayment(registrationId: string, paymentReference: string): Promise<Registration> {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: true,
        category: true,
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    // Check if payment is already confirmed via transactions
    const existingPaidTransaction = await this.prisma.transaction.findFirst({
      where: {
        registrationId,
        paymentStatus: PaymentStatus.PAID
      }
    });

    if (existingPaidTransaction) {
      throw new BadRequestException('Payment already confirmed');
    }

    // Create a new paid transaction
    await this.prisma.transaction.create({
      data: {
        registrationId,
        amount: registration.category.price,
        paymentMethod: 'CASH', // Default method, can be updated later
        paymentStatus: PaymentStatus.PAID,
        receiptNumber: paymentReference,
        processedBy: registration.registeredBy || 'system',
        paymentDate: new Date()
      }
    });

    return registration;
  }

  async cancelRegistration(id: string): Promise<boolean> {
    const registration = await this.findRegistrationById(id);

    // Check if registration has paid transactions
    const paidTransaction = await this.prisma.transaction.findFirst({
      where: {
        registrationId: id,
        paymentStatus: PaymentStatus.PAID
      }
    });

    if (paidTransaction) {
      throw new BadRequestException('Cannot cancel paid registration');
    }

    await this.prisma.registration.delete({
      where: { id },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        eventId: registration.eventId,
        registrationId: registration.id,
        action: 'REGISTRATION_CANCELLED',
        details: { message: `Registration cancelled for event ID: ${registration.eventId}` },
        performedBy: 'system',
      },
    });

    return true;
  }



  async getRegistrationStats(eventId?: string) {
    const whereClause = eventId ? { eventId } : {};

    const totalRegistrations = await this.prisma.registration.count({
      where: whereClause,
    });

    // Count registrations with paid transactions
    const registrationsWithPaidTransactions = await this.prisma.registration.findMany({
      where: whereClause,
      include: {
        transactions: {
          where: { paymentStatus: PaymentStatus.PAID }
        }
      }
    });

    const paidRegistrations = registrationsWithPaidTransactions.filter(r => r.transactions.length > 0).length;
    const pendingRegistrations = totalRegistrations - paidRegistrations;

    // Get category breakdown for paid registrations
    const categoryBreakdown = await this.prisma.registration.findMany({
      where: whereClause,
      include: {
        transactions: {
          where: { paymentStatus: PaymentStatus.PAID }
        }
      }
    });

    const categoryStats = categoryBreakdown
      .filter(r => r.transactions.length > 0)
      .reduce((acc, reg) => {
        const categoryId = reg.categoryId;
        acc[categoryId] = (acc[categoryId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalRegistrations,
      paidRegistrations,
      pendingRegistrations,
      categoryBreakdown: Object.entries(categoryStats).map(([categoryId, count]) => ({
        categoryId,
        _count: count
      })),
    };
  }

  async getEventByRegistration(registrationId: string): Promise<any> {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });
    return registration?.event;
  }

  async getCategoryById(categoryId: string): Promise<any> {
    return this.prisma.category.findUnique({
      where: { id: categoryId },
    });
  }

  async getMealAttendancesByRegistration(registrationId: string): Promise<any[]> {
    return this.prisma.mealAttendance.findMany({
      where: { registrationId },
      include: {
        meal: true,
      },
      orderBy: { scannedAt: 'desc' },
    });
  }
}
