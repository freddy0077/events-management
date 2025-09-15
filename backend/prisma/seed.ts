import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create essential system admin user for production setup
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@system.local' },
    update: {},
    create: {
      email: 'admin@system.local',
      password: await bcrypt.hash('ChangeMe123!', 10),
      role: Role.ADMIN,
      firstName: 'System',
      lastName: 'Administrator',
      isActive: true,
    },
  });

  // Create test event organizer user for testing
  const organizerUser = await prisma.user.upsert({
    where: { email: 'organizer@test.local' },
    update: {},
    create: {
      email: 'organizer@test.local',
      password: await bcrypt.hash('TestPass123!', 10),
      role: Role.EVENT_ORGANIZER,
      firstName: 'Test',
      lastName: 'Organizer',
      isActive: true,
    },
  });

  // Create test registration staff user for testing
  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@test.local' },
    update: {},
    create: {
      email: 'staff@test.local',
      password: await bcrypt.hash('TestPass123!', 10),
      role: Role.REGISTRATION_STAFF,
      firstName: 'Test',
      lastName: 'Staff',
      isActive: true,
    },
  });

  console.log('✅ Created system administrator user');
  console.log('✅ Created test event organizer user');
  console.log('✅ Created test registration staff user');
  console.log('🎉 Database seeding completed successfully!');
  
  console.log('\n📊 Summary:');
  console.log(`- Users: ${await prisma.user.count()}`);
  console.log(`- Events: ${await prisma.event.count()}`);
  console.log(`- Categories: ${await prisma.category.count()}`);
  console.log(`- Registrations: ${await prisma.registration.count()}`);

  console.log('\n🔐 Test User Credentials:');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│                    SYSTEM SETUP                            │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log('│ System Admin:                                               │');
  console.log('│   Email: admin@system.local                                 │');
  console.log('│   Password: ChangeMe123!                                    │');
  console.log('│                                                             │');
  console.log('│ Event Organizer (TEST):                                     │');
  console.log('│   Email: organizer@test.local                               │');
  console.log('│   Password: TestPass123!                                    │');
  console.log('│                                                             │');
  console.log('│ Registration Staff (TEST):                                  │');
  console.log('│   Email: staff@test.local                                   │');
  console.log('│   Password: TestPass123!                                    │');
  console.log('│                                                             │');
  console.log('│ ⚠️  IMPORTANT: Change admin password on first login!        │');
  console.log('│ ⚠️  Remove test users in production!                        │');
  console.log('└─────────────────────────────────────────────────────────────┘');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
