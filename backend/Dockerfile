# Multi-stage build for NestJS backend
FROM node:18-alpine AS deps
WORKDIR /app

# Install system dependencies for Prisma
RUN apk add --no-cache openssl openssl-dev

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --prod --shamefully-hoist

# Generate Prisma client
RUN pnpm exec prisma generate

# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install system dependencies for Prisma
RUN apk add --no-cache openssl openssl-dev

# Install pnpm
RUN npm install -g pnpm

# Copy package files and source code
COPY package.json pnpm-lock.yaml* ./
COPY . .

# Install all dependencies (including dev)
RUN pnpm install --shamefully-hoist

# Generate Prisma client
RUN pnpm exec prisma generate

# Build the application
RUN pnpm run build

# Production stage
FROM node:18-alpine AS runner
WORKDIR /app

# Install system dependencies for Prisma
RUN apk add --no-cache openssl openssl-dev curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Switch to non-root user
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "dist/main"]
