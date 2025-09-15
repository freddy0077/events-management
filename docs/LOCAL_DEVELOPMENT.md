# Local Development Setup Guide

## 🖥️ macOS Development Environment

This guide is specifically for setting up the Event Registration System on macOS with local PostgreSQL and Redis services.

## 📋 Prerequisites

### Required Software
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 15+** - Already installed ✅
- **Redis** - Already installed ✅
- **Git** - [Download](https://git-scm.com/)

### Optional (for production builds)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)

## 🚀 Quick Start

### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd events-registration

# Run automated setup
./scripts/setup.sh
```

### 2. Start Local Services
Ensure your local PostgreSQL and Redis services are running:

```bash
# Check PostgreSQL status
brew services list | grep postgresql
# If not running: brew services start postgresql

# Check Redis status
brew services list | grep redis
# If not running: brew services start redis

# Verify services are accessible
pg_isready -h localhost
redis-cli ping
```

### 3. Start Development Servers

**Option A: Manual (Recommended for development)**
```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

**Option B: Using Docker (Optional)**
```bash
# Uses local PostgreSQL/Redis but runs apps in containers
docker-compose -f docker-compose.dev.yml up
```

## 🔧 Configuration

### Backend Environment (.env)
```env
# Local PostgreSQL connection
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/events_registration_db"

# Local Redis connection
REDIS_URL="redis://localhost:6379"

# Development settings
NODE_ENV=development
PORT=3001
GRAPHQL_PLAYGROUND=true
GRAPHQL_INTROSPECTION=true
CORS_ORIGIN=http://localhost:3000

# JWT Configuration
JWT_SECRET="your-development-jwt-secret"
JWT_EXPIRATION="7d"

# Payment Gateway (Test Keys)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_stripe_webhook_secret"
PAYSTACK_SECRET_KEY="sk_test_your_paystack_secret_key"
```

### Frontend Environment (.env.local)
```env
# GraphQL API endpoints
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3001/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=ws://localhost:3001/graphql

# Payment Gateway (Test Keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key

# Development features
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_OFFLINE=true
NEXT_PUBLIC_ENABLE_QR_SCANNER=true

# App Configuration
NEXT_PUBLIC_APP_NAME="Event Registration System"
NODE_ENV=development
```

## 🗄️ Database Management

### Initial Setup
```bash
# Create database
createdb events_registration_db

# Run migrations
cd backend
npx prisma migrate dev --name init

# Seed with sample data
npx prisma db seed
```

### Common Database Commands
```bash
# View database in Prisma Studio
npx prisma studio

# Reset database (careful!)
npx prisma migrate reset

# Generate Prisma client after schema changes
npx prisma generate

# Create new migration
npx prisma migrate dev --name your_migration_name
```

### Database Connection Troubleshooting
```bash
# Test PostgreSQL connection
psql -h localhost -U postgres -d events_registration_db

# Check PostgreSQL status
brew services list | grep postgresql

# Restart PostgreSQL if needed
brew services restart postgresql

# Check PostgreSQL logs
tail -f /usr/local/var/log/postgresql@15.log
```

## 🔄 Redis Management

### Redis Commands
```bash
# Test Redis connection
redis-cli ping

# Monitor Redis activity
redis-cli monitor

# Check Redis info
redis-cli info

# Clear Redis cache (if needed)
redis-cli flushall
```

### Redis Troubleshooting
```bash
# Check Redis status
brew services list | grep redis

# Restart Redis if needed
brew services restart redis

# Check Redis logs
tail -f /usr/local/var/log/redis.log
```

## 🧪 Development Workflow

### 1. Backend Development (NestJS + GraphQL)
```bash
cd backend

# Start with hot reload
npm run start:dev

# Run tests
npm run test
npm run test:watch
npm run test:e2e

# Lint and format
npm run lint
npm run format

# Generate GraphQL schema
# Schema is auto-generated when server starts
```

### 2. Frontend Development (Next.js + Apollo Client)
```bash
cd frontend

# Start development server
npm run dev

# Generate GraphQL types from backend
npm run codegen

# Run tests
npm run test
npm run test:watch

# Type checking
npm run type-check

# Lint and format
npm run lint
npm run lint:fix
```

### 3. Full Stack Development
```bash
# Terminal 1: Backend
cd backend && npm run start:dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: GraphQL Code Generation (watch mode)
cd frontend && npm run codegen:watch

# Terminal 4: Database Studio (optional)
cd backend && npx prisma studio
```

## 🔍 Development URLs

- **Frontend Application**: http://localhost:3000
- **GraphQL Playground**: http://localhost:3001/graphql
- **Prisma Studio**: http://localhost:5555
- **GraphQL Schema**: http://localhost:3001/graphql (introspection)

## 🐛 Debugging

### Backend Debugging
```bash
# Debug mode with inspector
npm run start:debug

# Then attach debugger to localhost:9229
```

### Frontend Debugging
- Use browser DevTools
- React DevTools extension
- Apollo Client DevTools extension

### Database Debugging
```bash
# Check database connections
npx prisma db pull

# Validate schema
npx prisma validate

# Check migration status
npx prisma migrate status
```

## 📊 Monitoring Development

### Backend Health Check
```bash
curl http://localhost:3001/health
```

### GraphQL Introspection
```bash
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __schema { types { name } } }"}'
```

### Redis Monitoring
```bash
# Monitor Redis commands
redis-cli monitor

# Check memory usage
redis-cli info memory
```

## 🚀 Production Builds (Local Testing)

### Backend Production Build
```bash
cd backend
npm run build
npm run start:prod
```

### Frontend Production Build
```bash
cd frontend
npm run build
npm run start
```

### Docker Production Build (Local Testing)
```bash
# Build and run production containers
docker-compose up --build

# Or build individual services
docker build -f backend/Dockerfile -t events-backend ./backend
docker build -f frontend/Dockerfile -t events-frontend ./frontend
```

## 🔧 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

**PostgreSQL Connection Issues**
```bash
# Check if PostgreSQL is running
pg_isready -h localhost

# Check PostgreSQL configuration
psql -h localhost -U postgres -c "SHOW config_file;"
```

**Redis Connection Issues**
```bash
# Test Redis connection
redis-cli ping

# Check Redis configuration
redis-cli config get "*"
```

**Node Modules Issues**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [GraphQL Documentation](https://graphql.org/learn/)

## 🆘 Getting Help

If you encounter issues:

1. Check the logs in your terminal
2. Verify all services are running
3. Check the configuration files
4. Review this troubleshooting guide
5. Contact: comp@liselira.com

---

**Happy Coding! 🎉**
