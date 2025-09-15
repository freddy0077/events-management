# Database Seeder - Production Setup

This document describes the minimal database seeder for production deployment of the Event Registration System.

## Production Seeder Purpose

The seeder creates only essential system data required for initial deployment:
- Single system administrator account
- No mock/test data
- Clean production-ready database

## System Administrator Account

The seeder creates one default admin user for initial system setup:

- **Email**: `admin@system.local`
- **Password**: `ChangeMe123!`
- **Role**: ADMIN
- **Must Change Password**: Yes (forced on first login)

⚠️ **IMPORTANT SECURITY NOTES:**
- Change the default password immediately after first login
- Create your own admin users with proper email addresses
- Disable or remove the default admin account after setup
- Use strong passwords for all production accounts

## Running the Seeder

```bash
# Navigate to backend directory
cd backend

# Generate Prisma client
npx prisma generate

# Apply database migrations
npx prisma migrate deploy

# Run the production seeder
npx prisma db seed
```

## Post-Setup Steps

After running the seeder:

1. **Login with default credentials**:
   - Email: `admin@system.local`
   - Password: `ChangeMe123!`

2. **Change default password immediately**:
   - System will force password change on first login
   - Use a strong password with mixed case, numbers, and symbols

3. **Create production admin users**:
   - Use real email addresses for your organization
   - Assign appropriate roles (ADMIN, EVENT_ORGANIZER, etc.)
   - Remove or disable the default admin account

4. **Configure system settings**:
   - Set up email notifications
   - Configure payment gateways
   - Customize branding and themes

## Security Best Practices

- **Password Policy**: Enforce strong passwords (8+ characters, mixed case, numbers, symbols)
- **Account Management**: Regular review of user accounts and permissions
- **Access Control**: Use principle of least privilege for role assignments
- **Audit Logging**: Monitor system access and changes through audit logs
- **Environment Variables**: Secure all sensitive configuration in environment variables

## Production Deployment

For production deployment:

```bash
# Set NODE_ENV to production
export NODE_ENV=production

# Ensure all environment variables are set
# - DATABASE_URL
# - JWT_SECRET
# - QR_ENCRYPTION_KEY
# - Email service configuration

# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed

# Start application
npm run start:prod
```

## Troubleshooting

### Database Issues
```bash
# Check database connection
npx prisma db pull

# Regenerate Prisma client
npx prisma generate
```

### Seeder Issues
- Ensure database is accessible
- Check environment variables are set
- Verify Prisma schema is up to date
