import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as readline from 'readline';

const prisma = new PrismaClient();

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function resetDatabase() {
  console.log('🗑️  Deleting all data from database...\n');

  // Delete in correct order to respect foreign key constraints
  await prisma.mealAttendance.deleteMany({});
  console.log('  ✓ Deleted meal attendances');

  await prisma.transaction.deleteMany({});
  console.log('  ✓ Deleted transactions');

  await prisma.registration.deleteMany({});
  console.log('  ✓ Deleted registrations');

  await prisma.auditLog.deleteMany({});
  console.log('  ✓ Deleted audit logs');

  await prisma.eventStaff.deleteMany({});
  console.log('  ✓ Deleted event staff assignments');

  await prisma.meal.deleteMany({});
  console.log('  ✓ Deleted meals');

  await prisma.category.deleteMany({});
  console.log('  ✓ Deleted categories');

  await prisma.eventDraft.deleteMany({});
  console.log('  ✓ Deleted event drafts');

  await prisma.event.deleteMany({});
  console.log('  ✓ Deleted events');

  await prisma.user.deleteMany({});
  console.log('  ✓ Deleted users');

  console.log('\n✅ Database reset complete!\n');
}

async function createAdminUser(email: string, password: string) {
  console.log('👤 Creating admin user...\n');

  const hashedPassword = await bcrypt.hash(password, 10);

  const adminUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: Role.ADMIN,
      firstName: 'System',
      lastName: 'Administrator',
      isActive: true,
      mustChangePassword: false,
    },
  });

  console.log('✅ Admin user created successfully!\n');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│                    ADMIN CREDENTIALS                        │');
  console.log('├─────────────────────────────────────────────────────────────┤');
  console.log(`│ Email: ${email.padEnd(52)}│`);
  console.log(`│ Password: ${password.padEnd(49)}│`);
  console.log('│                                                             │');
  console.log('│ ⚠️  IMPORTANT: Save these credentials securely!             │');
  console.log('└─────────────────────────────────────────────────────────────┘');

  return adminUser;
}

async function main() {
  console.log('\n🔄 DATABASE RESET & ADMIN CREATION TOOL\n');
  console.log('⚠️  WARNING: This will DELETE ALL DATA in the database!\n');

  // Ask for confirmation
  const confirmation = await askQuestion(
    'Are you sure you want to reset the database? Type "YES" to confirm: '
  );

  if (confirmation !== 'YES') {
    console.log('\n❌ Operation cancelled. Database was not modified.');
    rl.close();
    return;
  }

  console.log('\n');

  // Get admin email
  const defaultEmail = 'admin@system.local';
  const emailInput = await askQuestion(
    `Enter admin email (press Enter for default: ${defaultEmail}): `
  );
  const email = emailInput.trim() || defaultEmail;

  // Get admin password
  const defaultPassword = 'Admin123!';
  const passwordInput = await askQuestion(
    `Enter admin password (press Enter for default: ${defaultPassword}): `
  );
  const password = passwordInput.trim() || defaultPassword;

  console.log('\n');

  // Reset database
  await resetDatabase();

  // Create admin user
  await createAdminUser(email, password);

  // Show summary
  console.log('\n📊 Database Summary:');
  console.log(`- Users: ${await prisma.user.count()}`);
  console.log(`- Events: ${await prisma.event.count()}`);
  console.log(`- Registrations: ${await prisma.registration.count()}`);

  console.log('\n🎉 Reset complete! You can now login with the admin credentials.\n');

  rl.close();
}

main()
  .catch((e) => {
    console.error('\n❌ Error during reset:', e);
    rl.close();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
