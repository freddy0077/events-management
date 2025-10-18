# Database Seeding Guide

This document explains how to use the database seeding scripts for the Events Management System.

## Available Seeding Scripts

### 1. Regular Seed (`prisma:seed`)
Creates default test users without deleting existing data.

**Usage:**
```bash
npm run prisma:seed
```

**What it creates:**
- System Admin: `admin@system.local` / `ChangeMe123!`
- Event Organizer: `organizer@test.local` / `TestPass123!`
- Registration Staff: `staff@test.local` / `TestPass123!`

**Use case:** Initial setup or adding test users to an existing database.

---

### 2. Reset & Seed (`db:reset-seed`)
**⚠️ WARNING: This will DELETE ALL DATA in the database!**

Interactive script that:
1. Asks for confirmation before proceeding
2. Deletes all data from the database
3. Creates a new admin user with custom credentials

**Usage:**
```bash
npm run db:reset-seed
```

**Interactive prompts:**
1. Confirmation: Type `YES` to proceed
2. Admin email (default: `admin@system.local`)
3. Admin password (default: `Admin123!`)

**Use case:** 
- Fresh start for development
- Resetting test environment
- Creating production admin with custom credentials

---

### 3. Database Reset (`db:reset`)
Resets the database and runs migrations, then automatically runs the regular seed.

**Usage:**
```bash
npm run db:reset
```

**Use case:** Complete database reset with default test users.

---

## Examples

### Example 1: Fresh Development Setup
```bash
# Reset database and create custom admin
npm run db:reset-seed

# When prompted:
# - Type "YES" to confirm
# - Enter email: dev@example.com
# - Enter password: DevPass123!
```

### Example 2: Production Setup
```bash
# Reset database and create production admin
npm run db:reset-seed

# When prompted:
# - Type "YES" to confirm
# - Enter email: admin@yourcompany.com
# - Enter password: [secure-password]
```

### Example 3: Add Test Users to Existing Database
```bash
# Just add default test users without deleting data
npm run prisma:seed
```

---

## Security Notes

1. **Change Default Passwords**: Always change default passwords in production
2. **Remove Test Users**: Delete test users (`organizer@test.local`, `staff@test.local`) in production
3. **Secure Credentials**: Store production admin credentials securely
4. **Environment Variables**: Consider using environment variables for production seeding

---

## Troubleshooting

### Error: "Cannot delete records due to foreign key constraints"
The reset script deletes records in the correct order. If you still see this error, check for custom constraints in your schema.

### Error: "User already exists"
The regular seed uses `upsert`, so it won't fail if users exist. The reset seed deletes all users first.

### Script hangs at confirmation
Make sure to type exactly `YES` (all caps) when confirming the reset operation.

---

## Database Summary After Seeding

After running any seed script, you'll see a summary:
```
📊 Database Summary:
- Users: X
- Events: X
- Registrations: X
```

This helps verify the seeding was successful.
