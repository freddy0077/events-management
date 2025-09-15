# Event Participant Registration, Payment & Food Attendance System

## 🚨 **SYSTEM STATUS: NOT PRODUCTION READY**

**⚠️ CRITICAL NOTICE**: This system requires significant development work before production deployment. The payment system is not functional and several security measures are missing. See [Comprehensive System Assessment](COMPREHENSIVE_SYSTEM_ASSESSMENT.md) for detailed analysis.

**Estimated Time to Production: 8-10 weeks**

## 📋 Project Overview

A comprehensive digital system for managing event registrations, payments, and meal attendance using QR code technology. Built with modern web technologies to streamline event operations and enhance participant experience.

### 🎯 Current System Maturity: 65% Production Ready

**✅ Completed Features:**
- Role-based access control with 5 user roles
- Event management and staff assignment
- QR code generation and badge printing
- Meal attendance tracking
- Professional UI/UX with modern design
- GraphQL API with real-time subscriptions

**❌ Critical Missing Features:**
- **Real payment processing** (currently manual receipt entry only)
- Transaction tracking and financial reconciliation
- Security hardening (rate limiting, input validation)
- Comprehensive testing suite
- Production monitoring and error tracking

### 🎯 Key Features

- **Event Setup & Configuration**: Define events with multiple participant categories (VIP, Regular, Student)
- **Dual Registration Modes**: Support for both on-site and online registration
- **Payment Processing**: Integrated payment gateway with receipt management
- **QR Code System**: Unique QR codes for participant identification and meal tracking
- **Meal Attendance**: Prevent duplicate meal claims with real-time verification
- **Comprehensive Reporting**: Registration stats, meal attendance, and audit logs
- **Offline Capability**: Continue operations during network outages with sync functionality

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │Registration │  │Event Manager │  │ Meal Attendance  │  │
│  │   Portal    │  │  Dashboard   │  │    Scanner       │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend (NestJS)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Auth    │  │  Events  │  │ Payment  │  │ Reports  │  │
│  │  Module  │  │  Module  │  │  Module  │  │  Module  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database (PostgreSQL)                      │
│                      with Prisma ORM                         │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **GraphQL Client**: Apollo Client with subscriptions
- **UI Library**: React 18+
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Apollo Client Cache + Zustand
- **QR Code**: react-qr-code, @zxing/library
- **Forms**: React Hook Form + Zod validation
- **PWA**: next-pwa for offline capabilities
- **Testing**: Jest + React Testing Library

### Backend
- **Framework**: NestJS 10+
- **API**: GraphQL with Apollo Server
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL 15+
- **Authentication**: JWT with Passport.js
- **Real-time**: GraphQL Subscriptions
- **Payment Gateway**: Stripe / PayStack integration
- **QR Generation**: qrcode library
- **Validation**: class-validator + GraphQL schema validation
- **Testing**: Jest + Supertest

### DevOps & Tools
- **Containerization**: Docker & Docker Compose
- **Version Control**: Git
- **Package Manager**: pnpm / npm
- **Testing**: Jest, Supertest
- **Linting**: ESLint, Prettier
- **CI/CD**: GitHub Actions

## 📁 Project Structure

```
events-registration/
├── frontend/                 # Next.js application
│   ├── app/                 # App router pages
│   │   ├── (auth)/         # Authentication pages
│   │   ├── (dashboard)/    # Admin dashboard
│   │   ├── registration/   # Registration flow
│   │   └── api/           # API routes (if needed)
│   ├── components/         # Reusable components
│   │   ├── ui/            # Base UI components
│   │   ├── forms/         # Form components
│   │   └── layouts/       # Layout components
│   ├── lib/               # Utilities and helpers
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API service layer
│   ├── store/             # State management
│   ├── types/             # TypeScript definitions
│   └── public/            # Static assets
│
├── backend/                # NestJS application
│   ├── src/
│   │   ├── modules/       # Feature modules
│   │   │   ├── auth/     # Authentication
│   │   │   ├── events/   # Event management
│   │   │   ├── registration/ # Registration logic
│   │   │   ├── payment/  # Payment processing
│   │   │   ├── meals/    # Meal attendance
│   │   │   └── reports/  # Reporting
│   │   ├── common/        # Shared resources
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   ├── guards/
│   │   │   └── interceptors/
│   │   ├── config/        # Configuration
│   │   └── main.ts        # Application entry
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── migrations/    # Database migrations
│   └── test/              # Test files
│
├── docker/                 # Docker configurations
├── docs/                   # Documentation
└── scripts/               # Utility scripts
```

## 🗄️ Database Schema

### Core Tables

```prisma
model Event {
  id            String   @id @default(cuid())
  name          String
  date          DateTime
  venue         String
  categories    Category[]
  registrations Registration[]
  meals         Meal[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Category {
  id        String   @id @default(cuid())
  eventId   String
  name      String   // VIP, Regular, Student
  price     Decimal
  event     Event    @relation(fields: [eventId], references: [id])
  registrations Registration[]
}

model Registration {
  id              String   @id @default(cuid())
  eventId         String
  categoryId      String
  fullName        String
  email           String
  phone           String
  address         String
  receiptNumber   String?  @unique
  paymentStatus   PaymentStatus
  qrCode          String   @unique
  checkedIn       Boolean  @default(false)
  event           Event    @relation(fields: [eventId], references: [id])
  category        Category @relation(fields: [categoryId], references: [id])
  mealAttendances MealAttendance[]
  createdAt       DateTime @default(now())
}

model Meal {
  id          String   @id @default(cuid())
  eventId     String
  sessionName String   // Breakfast, Lunch, Dinner
  startTime   DateTime
  endTime     DateTime
  event       Event    @relation(fields: [eventId], references: [id])
  attendances MealAttendance[]
}

model MealAttendance {
  id             String   @id @default(cuid())
  registrationId String
  mealId         String
  scannedAt      DateTime @default(now())
  registration   Registration @relation(fields: [registrationId], references: [id])
  meal           Meal     @relation(fields: [mealId], references: [id])
  
  @@unique([registrationId, mealId]) // Prevent duplicate meal claims
}

enum PaymentStatus {
  PENDING
  APPROVED
  DECLINED
}
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ and npm/pnpm
- PostgreSQL 15+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/events-registration.git
cd events-registration
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials and other configs

# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npx prisma db seed

# Start development server
npm run start:dev
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with API endpoints and other configs

# Start development server
npm run dev
```

### 4. Start Local Services

Ensure PostgreSQL and Redis are running on your macOS:

```bash
# Check and start PostgreSQL (if needed)
brew services start postgresql

# Check and start Redis (if needed)  
brew services start redis

# Verify services
pg_isready -h localhost
redis-cli ping
```

### 5. Docker Setup (Production Only)

For production deployment:

```bash
# Production build and deployment
docker-compose up --build

# Development with Docker (optional)
docker-compose -f docker-compose.dev.yml up
```

## 🔐 Environment Variables

### Backend (.env)
```env
# Local PostgreSQL Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/events_registration_db"

# Local Redis for subscriptions
REDIS_URL="redis://localhost:6379"

# JWT Configuration
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="7d"

# GraphQL Configuration
GRAPHQL_PLAYGROUND=true
GRAPHQL_INTROSPECTION=true

# Payment Gateway
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
PAYSTACK_SECRET_KEY="sk_test_..."

# Application
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)
```env
# GraphQL API Configuration
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3001/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=ws://localhost:3001/graphql

# Payment Gateway
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_..."

# PWA Features
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_OFFLINE=true
NEXT_PUBLIC_ENABLE_QR_SCANNER=true

# App Configuration
NEXT_PUBLIC_APP_NAME="Event Registration System"
NODE_ENV=development
```

## 📚 Documentation

### 🔍 System Assessment & Analysis
- **[📊 Comprehensive System Assessment](COMPREHENSIVE_SYSTEM_ASSESSMENT.md)** - Complete technical review, critical issues, and production readiness analysis
- **[🔧 System Improvements Plan](SYSTEM_ASSESSMENT_AND_IMPROVEMENTS.md)** - Detailed improvement recommendations and implementation roadmap

### 📖 Technical Documentation
This project is split into separate frontend and backend applications, each with their own detailed documentation:

- **[Backend Documentation](./backend/README.md)** - NestJS GraphQL API with detailed schema, resolvers, and setup instructions
- **[Frontend Documentation](./frontend/README.md)** - Next.js application with Apollo Client, components, and PWA configuration
- **[Setup Guides](./BACKEND_SETUP.md)** - Detailed setup instructions for development environment

### Quick Links
- **GraphQL Playground**: `http://localhost:3001/graphql` (development)
- **Frontend App**: `http://localhost:3000`
- **Database Schema**: See backend documentation for complete Prisma schema
- **API Operations**: GraphQL queries, mutations, and subscriptions documented in backend README

### 🚨 Critical Information
- **Payment System**: Currently non-functional - requires immediate attention before production
- **Security**: Multiple security measures need implementation
- **Testing**: Comprehensive test suite required
- **Monitoring**: Production monitoring and error tracking needed

## 🧪 Testing

### Backend Testing
```bash
cd backend

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Frontend Testing
```bash
cd frontend

# Run tests
npm run test

# Test coverage
npm run test:coverage
```

## 📊 Performance Optimization

- **Database Indexing**: Indexes on frequently queried fields
- **Caching**: Redis for session management and frequent queries
- **Image Optimization**: Next.js Image component for optimized loading
- **Code Splitting**: Dynamic imports for better initial load
- **PWA Support**: Offline functionality with service workers
- **Rate Limiting**: Prevent abuse on registration endpoints

## 🚢 Deployment

### Production Build

#### Backend
```bash
cd backend
npm run build
npm run start:prod
```

#### Frontend
```bash
cd frontend
npm run build
npm run start
```

### Deployment Platforms

- **Frontend**: Vercel, Netlify, AWS Amplify
- **Backend**: AWS EC2, DigitalOcean, Heroku, Railway
- **Database**: AWS RDS, DigitalOcean Managed Database, Supabase

## 🔒 Security Considerations

- JWT-based authentication with refresh tokens
- Input validation and sanitization
- SQL injection prevention via Prisma ORM
- Rate limiting on sensitive endpoints
- HTTPS enforcement in production
- Environment variable encryption
- Regular security audits

## 📝 License

This project is proprietary software owned by Elira Technologies.

## 👥 Team

- **Prepared by**: Kelvin Elikem Sedziafa
- **Company**: Elira Technologies
- **Contact**: comp@liselira.com
- **Website**: www.triselira.com

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📞 Support

For support, email comp@liselira.com or create an issue in the project repository.

---

© 2024 Elira Technologies. All rights reserved.
