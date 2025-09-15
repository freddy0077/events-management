# Backend Setup Guide

## 1. Create Environment File

Copy the `.env.example` to `.env` in the backend directory:

```bash
cd backend
cp .env.example .env
```

## 2. Update Environment Variables

Edit the `.env` file with these required values:

```env
# Database Configuration (Local PostgreSQL)
DATABASE_URL="postgresql://frederickankamah@localhost:5432/events_registration_db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production-2024-events-reg"
JWT_EXPIRATION="7d"

# GraphQL Configuration
GRAPHQL_PLAYGROUND=true
GRAPHQL_INTROSPECTION=true

# Redis Configuration (Local Redis for subscriptions)
REDIS_URL="redis://localhost:6379"

# Payment Gateway Configuration (Optional for now)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_stripe_webhook_secret"
PAYSTACK_SECRET_KEY="sk_test_your_paystack_secret_key"

# Application Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DEST="./uploads"

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-email-password

# Logging
LOG_LEVEL=debug

# QR Code Configuration (CRITICAL - Must be exactly 32 characters)
QR_ENCRYPTION_KEY="abcdef1234567890abcdef1234567890"
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Database Setup

Ensure PostgreSQL is running and create the database:

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE events_registration_db;

# Exit PostgreSQL
\q
```

## 5. Run Prisma Migrations

```bash
npx prisma migrate dev
```

## 6. Seed Database

```bash
npx prisma db seed
```

## 7. Start Development Server

```bash
npm run start:dev
```

## 8. Verify Setup

- Backend should start on http://localhost:3001
- GraphQL Playground available at http://localhost:3001/graphql
- Test authentication with seeded users:
  - admin@elira.com / admin123
  - moderator@elira.com / moderator123
  - user@elira.com / user123

## Troubleshooting

### QR_ENCRYPTION_KEY Error
If you get "QR_ENCRYPTION_KEY must be exactly 32 characters", ensure the key in `.env` is exactly 32 characters long.

### Database Connection Error
- Verify PostgreSQL is running: `brew services start postgresql`
- Check database exists: `psql -l | grep events_registration_db`
- Verify connection string in DATABASE_URL

### Port Already in Use
If port 3001 is in use, change PORT in `.env` to another port like 3002.
