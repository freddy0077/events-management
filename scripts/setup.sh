#!/bin/bash

# Event Registration System - Development Setup Script
# This script sets up the development environment for the Event Registration System

set -e

echo "🚀 Setting up Event Registration System..."
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if PostgreSQL is running locally
if command -v psql &> /dev/null && pg_isready -h localhost &> /dev/null; then
    echo "✅ PostgreSQL is running locally"
    POSTGRES_AVAILABLE=true
else
    echo "❌ PostgreSQL is not running locally. Please start PostgreSQL service."
    echo "   On macOS with Homebrew: brew services start postgresql"
    POSTGRES_AVAILABLE=false
fi

# Check if Redis is running locally
if command -v redis-cli &> /dev/null && redis-cli ping &> /dev/null; then
    echo "✅ Redis is running locally"
    REDIS_AVAILABLE=true
else
    echo "❌ Redis is not running locally. Please start Redis service."
    echo "   On macOS with Homebrew: brew services start redis"
    REDIS_AVAILABLE=false
fi

# Check if Docker is available (for production builds)
if command -v docker &> /dev/null; then
    echo "✅ Docker is available for production builds"
    DOCKER_AVAILABLE=true
else
    echo "⚠️  Docker is not available. Install Docker for production deployment."
    DOCKER_AVAILABLE=false
fi

# Setup Backend
echo ""
echo "📦 Setting up Backend (NestJS + GraphQL)..."
cd backend

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created backend .env file from example"
    echo "⚠️  Please update the .env file with your actual configuration"
else
    echo "✅ Backend .env file already exists"
fi

# Install dependencies
echo "📥 Installing backend dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "✅ Backend setup completed"

# Setup Frontend
echo ""
echo "🎨 Setting up Frontend (Next.js + Apollo Client)..."
cd ../frontend

# Copy environment file
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    echo "✅ Created frontend .env.local file from example"
    echo "⚠️  Please update the .env.local file with your actual configuration"
else
    echo "✅ Frontend .env.local file already exists"
fi

# Install dependencies
echo "📥 Installing frontend dependencies..."
npm install

echo "✅ Frontend setup completed"

# Go back to root
cd ..

# Database setup with local PostgreSQL
if [ "$POSTGRES_AVAILABLE" = true ] && [ "$REDIS_AVAILABLE" = true ]; then
    echo ""
    echo "🗄️  Setting up database with local PostgreSQL..."
    
    # Create database if it doesn't exist
    echo "📝 Creating database 'events_registration_db'..."
    createdb events_registration_db 2>/dev/null || echo "   Database may already exist, continuing..."
    
    # Run database migrations
    echo "🔄 Running database migrations..."
    cd backend
    npx prisma migrate dev --name init
    
    # Seed database
    echo "🌱 Seeding database with sample data..."
    npx prisma db seed
    
    cd ..
    
    echo "✅ Database setup completed"
else
    echo ""
    echo "📋 Local Services Setup Required:"
    if [ "$POSTGRES_AVAILABLE" = false ]; then
        echo "1. Start PostgreSQL service:"
        echo "   brew services start postgresql"
        echo "   # OR if using PostgreSQL.app, start it from Applications"
    fi
    if [ "$REDIS_AVAILABLE" = false ]; then
        echo "2. Start Redis service:"
        echo "   brew services start redis"
    fi
    echo ""
    echo "After starting services, run this script again."
    exit 1
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📚 Next Steps:"
echo "=============="
echo ""
echo "1. Update configuration files:"
echo "   - backend/.env (database, JWT secret, payment keys)"
echo "   - frontend/.env.local (API URLs, payment keys)"
echo ""
echo "2. Start the development servers:"
echo "   # Terminal 1 - Backend (NestJS + GraphQL)"
echo "   cd backend && npm run start:dev"
echo ""
echo "   # Terminal 2 - Frontend (Next.js + Apollo Client)"
echo "   cd frontend && npm run dev"
echo ""
echo "   # Optional: Using Docker for development"
echo "   docker-compose -f docker-compose.dev.yml up"
echo ""
echo "3. Access the applications:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend GraphQL Playground: http://localhost:3001/graphql"
echo ""
echo "4. Default admin credentials:"
echo "   - Email: admin@elira.com"
echo "   - Password: admin123"
echo ""
echo "📖 For detailed documentation, see:"
echo "   - Main README: ./README.md"
echo "   - Backend README: ./backend/README.md"
echo "   - Frontend README: ./frontend/README.md"
echo ""
echo "🆘 Need help? Contact: comp@liselira.com"
