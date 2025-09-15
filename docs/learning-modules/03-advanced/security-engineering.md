# Module 3.2: Security Engineering

## 🎯 Learning Objectives

By the end of this module, you will understand:
- Security principles and threat modeling
- Authentication and authorization best practices
- Common vulnerabilities and how to prevent them
- Security implementation in the Events Registration System

## 🔒 Security Fundamentals

### CIA Triad
**Confidentiality**: Ensuring data is accessible only to authorized users
**Integrity**: Maintaining data accuracy and preventing unauthorized modification
**Availability**: Ensuring systems and data are accessible when needed

### Security Principles
1. **Defense in Depth**: Multiple layers of security controls
2. **Principle of Least Privilege**: Minimum necessary access rights
3. **Fail Secure**: Systems should fail to a secure state
4. **Security by Design**: Built-in security from the start
5. **Zero Trust**: Never trust, always verify

## 🛡️ Authentication & Authorization

### JWT Implementation (Secure)
```typescript
// ========================
// SECURE JWT IMPLEMENTATION
// ========================

interface JwtConfig {
  secret: string;
  issuer: string;
  audience: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
}

@Injectable()
export class AuthService {
  private readonly jwtConfig: JwtConfig;

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private configService: ConfigService,
    private redisService: RedisService
  ) {
    this.jwtConfig = {
      secret: this.configService.get('JWT_SECRET'),
      issuer: this.configService.get('JWT_ISSUER'),
      audience: this.configService.get('JWT_AUDIENCE'),
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d'
    };
  }

  async login(email: string, password: string, ipAddress: string): Promise<AuthResult> {
    // Rate limiting check
    await this.checkRateLimit(email, ipAddress);

    // Validate credentials
    const user = await this.validateCredentials(email, password);
    if (!user) {
      await this.logFailedAttempt(email, ipAddress);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account status
    if (!user.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Store refresh token securely
    await this.storeRefreshToken(user.id, tokens.refreshToken, ipAddress);

    // Log successful login
    await this.logSuccessfulLogin(user.id, ipAddress);

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900 // 15 minutes
    };
  }

  private async generateTokens(user: User): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: this.getUserPermissions(user.role),
      iss: this.jwtConfig.issuer,
      aud: this.jwtConfig.audience,
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID() // Unique token ID
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.jwtConfig.accessTokenExpiry,
      secret: this.jwtConfig.secret
    });

    const refreshPayload = {
      sub: user.id,
      type: 'refresh',
      iss: this.jwtConfig.issuer,
      aud: this.jwtConfig.audience,
      jti: crypto.randomUUID()
    };

    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: this.jwtConfig.refreshTokenExpiry,
      secret: this.jwtConfig.secret
    });

    return { accessToken, refreshToken };
  }

  private async validateCredentials(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    // Use secure password comparison
    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : null;
  }

  private async checkRateLimit(email: string, ipAddress: string): Promise<void> {
    const emailKey = `login_attempts:email:${email}`;
    const ipKey = `login_attempts:ip:${ipAddress}`;

    const [emailAttempts, ipAttempts] = await Promise.all([
      this.redisService.get(emailKey),
      this.redisService.get(ipKey)
    ]);

    if (parseInt(emailAttempts || '0') > 5) {
      throw new TooManyRequestsException('Too many login attempts for this email');
    }

    if (parseInt(ipAttempts || '0') > 20) {
      throw new TooManyRequestsException('Too many login attempts from this IP');
    }
  }

  private async storeRefreshToken(userId: string, token: string, ipAddress: string): Promise<void> {
    const hashedToken = await bcrypt.hash(token, 10);
    
    await this.redisService.setex(
      `refresh_token:${userId}:${ipAddress}`,
      7 * 24 * 60 * 60, // 7 days
      hashedToken
    );
  }
}
```

### Role-Based Access Control (RBAC)
```typescript
// ========================
// ADVANCED RBAC SYSTEM
// ========================

interface Permission {
  id: string;
  resource: string;
  action: string;
  conditions?: PermissionCondition[];
}

interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'in' | 'nin' | 'gt' | 'lt';
  value: any;
}

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  inherits?: string[]; // Role hierarchy
}

@Injectable()
export class RBACService {
  private roles: Map<string, Role> = new Map();
  private userRoles: Map<string, string[]> = new Map();

  constructor() {
    this.initializeRoles();
  }

  private initializeRoles(): void {
    // Define base roles
    const adminRole: Role = {
      id: 'admin',
      name: 'Administrator',
      permissions: [
        { id: 'all', resource: '*', action: '*' }
      ]
    };

    const organizerRole: Role = {
      id: 'organizer',
      name: 'Event Organizer',
      permissions: [
        { id: 'events_manage', resource: 'events', action: 'create' },
        { 
          id: 'events_update_own', 
          resource: 'events', 
          action: 'update',
          conditions: [{ field: 'createdBy', operator: 'eq', value: '{{user.id}}' }]
        },
        { id: 'registrations_read', resource: 'registrations', action: 'read' },
        { id: 'reports_view', resource: 'reports', action: 'read' }
      ]
    };

    const staffRole: Role = {
      id: 'staff',
      name: 'Registration Staff',
      permissions: [
        { 
          id: 'registrations_manage', 
          resource: 'registrations', 
          action: 'create',
          conditions: [{ field: 'eventId', operator: 'in', value: '{{user.assignedEvents}}' }]
        },
        { id: 'qr_scan', resource: 'qr-codes', action: 'scan' }
      ]
    };

    this.roles.set('admin', adminRole);
    this.roles.set('organizer', organizerRole);
    this.roles.set('staff', staffRole);
  }

  async checkPermission(
    userId: string, 
    resource: string, 
    action: string, 
    context?: any
  ): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);
    
    for (const roleId of userRoles) {
      const role = this.roles.get(roleId);
      if (!role) continue;

      for (const permission of role.permissions) {
        if (this.matchesPermission(permission, resource, action)) {
          if (await this.evaluateConditions(permission.conditions, userId, context)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private matchesPermission(permission: Permission, resource: string, action: string): boolean {
    const resourceMatch = permission.resource === '*' || permission.resource === resource;
    const actionMatch = permission.action === '*' || permission.action === action;
    return resourceMatch && actionMatch;
  }

  private async evaluateConditions(
    conditions: PermissionCondition[] | undefined,
    userId: string,
    context: any
  ): Promise<boolean> {
    if (!conditions || conditions.length === 0) return true;

    const user = await this.getUserContext(userId);
    
    for (const condition of conditions) {
      const contextValue = this.resolveValue(condition.value, { user, context });
      const fieldValue = context?.[condition.field];

      if (!this.evaluateCondition(fieldValue, condition.operator, contextValue)) {
        return false;
      }
    }

    return true;
  }

  private resolveValue(value: any, variables: any): any {
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      const path = value.slice(2, -2);
      return this.getNestedValue(variables, path);
    }
    return value;
  }

  private evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'eq': return fieldValue === expectedValue;
      case 'ne': return fieldValue !== expectedValue;
      case 'in': return Array.isArray(expectedValue) && expectedValue.includes(fieldValue);
      case 'nin': return Array.isArray(expectedValue) && !expectedValue.includes(fieldValue);
      case 'gt': return fieldValue > expectedValue;
      case 'lt': return fieldValue < expectedValue;
      default: return false;
    }
  }
}

// Permission guard decorator
export const RequirePermission = (resource: string, action: string) =>
  SetMetadata('permission', { resource, action });

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RBACService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.get<{resource: string, action: string}>(
      'permission',
      context.getHandler()
    );

    if (!permission) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    return this.rbacService.checkPermission(
      user.id,
      permission.resource,
      permission.action,
      { ...request.params, ...request.body }
    );
  }
}
```

## 🔐 Input Validation & Sanitization

### Comprehensive Validation
```typescript
// ========================
// INPUT VALIDATION & SANITIZATION
// ========================

import { Transform } from 'class-transformer';
import { IsEmail, IsString, IsOptional, Length, Matches, ValidateNested } from 'class-validator';
import DOMPurify from 'isomorphic-dompurify';

// Custom validation decorators
export function IsSecurePassword() {
  return Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
    { message: 'Password must be at least 12 characters with uppercase, lowercase, number, and special character' }
  );
}

export function IsSanitizedHTML() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return DOMPurify.sanitize(value, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: []
      });
    }
    return value;
  });
}

export function IsSecureSlug() {
  return Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens'
  });
}

// DTO with comprehensive validation
export class CreateEventDto {
  @IsString()
  @Length(1, 255)
  @Transform(({ value }) => value.trim())
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 5000)
  @IsSanitizedHTML()
  description?: string;

  @IsString()
  @IsSecureSlug()
  slug: string;

  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  contactEmail: string;

  @IsString()
  @Length(1, 255)
  @Transform(({ value }) => value.trim())
  venue: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  @Transform(({ value }) => value.trim())
  address?: string;

  @ValidateNested({ each: true })
  @Type(() => CreateCategoryDto)
  categories: CreateCategoryDto[];
}

// SQL injection prevention
@Injectable()
export class SecureQueryService {
  constructor(private prisma: PrismaService) {}

  // Always use parameterized queries
  async searchEvents(searchTerm: string, userId: string): Promise<Event[]> {
    // Sanitize search term
    const sanitizedTerm = searchTerm.replace(/[%_]/g, '\\$&');
    
    return this.prisma.event.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: sanitizedTerm, mode: 'insensitive' } },
              { description: { contains: sanitizedTerm, mode: 'insensitive' } }
            ]
          },
          { isActive: true },
          {
            OR: [
              { createdBy: userId },
              { 
                staff: {
                  some: { userId }
                }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        date: true,
        venue: true
      }
    });
  }

  // Raw query with proper escaping (when absolutely necessary)
  async getEventStatistics(eventId: string): Promise<any> {
    // Validate UUID format first
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId)) {
      throw new BadRequestException('Invalid event ID format');
    }

    return this.prisma.$queryRaw`
      SELECT 
        COUNT(r.id) as total_registrations,
        COUNT(CASE WHEN r.checked_in = true THEN 1 END) as checked_in_count,
        SUM(t.amount) as total_revenue
      FROM registrations r
      LEFT JOIN transactions t ON r.id = t.registration_id AND t.payment_status = 'PAID'
      WHERE r.event_id = ${eventId}
    `;
  }
}
```

## 🛡️ Security Headers & Middleware

### Security Middleware
```typescript
// ========================
// SECURITY MIDDLEWARE
// ========================

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // CSP header
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Be more restrictive in production
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "font-src 'self'",
      "object-src 'none'",
      "media-src 'self'",
      "frame-src 'none'"
    ].join('; '));

    // Remove server information
    res.removeHeader('X-Powered-By');

    next();
  }
}

// Rate limiting middleware
@Injectable()
export class RateLimitingMiddleware implements NestMiddleware {
  constructor(private redisService: RedisService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const key = `rate_limit:${req.ip}:${req.path}`;
    const limit = this.getLimit(req.path);
    const window = 60; // 1 minute window

    const current = await this.redisService.incr(key);
    
    if (current === 1) {
      await this.redisService.expire(key, window);
    }

    if (current > limit) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: await this.redisService.ttl(key)
      });
      return;
    }

    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current).toString());

    next();
  }

  private getLimit(path: string): number {
    // Different limits for different endpoints
    if (path.includes('/auth/login')) return 5;
    if (path.includes('/auth/register')) return 3;
    if (path.includes('/api/')) return 100;
    return 60;
  }
}
```

## 🔍 Security Monitoring & Logging

### Audit Logging
```typescript
// ========================
// SECURITY AUDIT LOGGING
// ========================

interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

@Injectable()
export class AuditService {
  constructor(
    private prisma: PrismaService,
    private alertService: AlertService
  ) {}

  async logSecurityEvent(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date()
    };

    // Store in database
    await this.prisma.auditLog.create({
      data: auditEntry
    });

    // Check for suspicious patterns
    await this.detectSuspiciousActivity(auditEntry);

    // Send alerts for high-risk events
    if (entry.riskLevel === 'high' || entry.riskLevel === 'critical') {
      await this.alertService.sendSecurityAlert(auditEntry);
    }
  }

  private async detectSuspiciousActivity(entry: AuditLogEntry): Promise<void> {
    // Check for multiple failed logins
    if (entry.action === 'login' && !entry.success) {
      const recentFailures = await this.prisma.auditLog.count({
        where: {
          action: 'login',
          success: false,
          ipAddress: entry.ipAddress,
          timestamp: {
            gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
          }
        }
      });

      if (recentFailures >= 5) {
        await this.alertService.sendSecurityAlert({
          ...entry,
          riskLevel: 'high',
          details: { failedAttempts: recentFailures }
        });
      }
    }

    // Check for unusual access patterns
    if (entry.userId) {
      const userActivity = await this.analyzeUserActivity(entry.userId);
      if (userActivity.isUnusual) {
        await this.alertService.sendSecurityAlert({
          ...entry,
          riskLevel: 'medium',
          details: userActivity
        });
      }
    }
  }

  private async analyzeUserActivity(userId: string): Promise<any> {
    // Analyze user's typical behavior patterns
    const recentActivity = await this.prisma.auditLog.findMany({
      where: {
        userId,
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    // Check for unusual patterns (simplified example)
    const uniqueIPs = new Set(recentActivity.map(a => a.ipAddress));
    const isUnusual = uniqueIPs.size > 5; // More than 5 different IPs

    return {
      isUnusual,
      uniqueIPCount: uniqueIPs.size,
      recentActivityCount: recentActivity.length
    };
  }
}

// Audit decorator
export function Audit(action: string, resource: string, riskLevel: AuditLogEntry['riskLevel'] = 'low') {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const request = this.request || args.find(arg => arg?.ip);
      const user = this.user || request?.user;

      try {
        const result = await method.apply(this, args);
        
        await this.auditService?.logSecurityEvent({
          userId: user?.id,
          action,
          resource,
          details: { args: args.slice(0, 2) }, // Limit logged data
          ipAddress: request?.ip || 'unknown',
          userAgent: request?.get('user-agent') || 'unknown',
          success: true,
          riskLevel
        });

        return result;
      } catch (error) {
        await this.auditService?.logSecurityEvent({
          userId: user?.id,
          action,
          resource,
          details: { error: error.message },
          ipAddress: request?.ip || 'unknown',
          userAgent: request?.get('user-agent') || 'unknown',
          success: false,
          riskLevel: 'medium'
        });

        throw error;
      }
    };
  };
}

// Usage
@Controller('api/v1/events')
export class EventsController {
  constructor(
    private eventsService: EventsService,
    private auditService: AuditService
  ) {}

  @Post()
  @Audit('create', 'event', 'medium')
  async createEvent(@Body() createEventDto: CreateEventDto): Promise<Event> {
    return this.eventsService.create(createEventDto);
  }

  @Delete(':id')
  @Audit('delete', 'event', 'high')
  async deleteEvent(@Param('id') id: string): Promise<void> {
    return this.eventsService.delete(id);
  }
}
```

## 🏃‍♂️ Practical Exercises

### Exercise 1: Implement OWASP Top 10 Protection
Create protection mechanisms for:
- Injection attacks
- Broken authentication
- Sensitive data exposure
- XML external entities (XXE)
- Broken access control

### Exercise 2: Security Testing
Write security tests for:
- Authentication bypass attempts
- Authorization escalation
- Input validation bypasses
- Rate limiting effectiveness

### Exercise 3: Incident Response Plan
Create a security incident response plan including:
- Detection procedures
- Containment strategies
- Recovery processes
- Post-incident analysis

## 📝 Summary

### Security Best Practices
1. **Authentication**: Strong passwords, MFA, secure sessions
2. **Authorization**: Principle of least privilege, RBAC
3. **Input Validation**: Sanitize all inputs, prevent injection
4. **Monitoring**: Comprehensive logging and alerting
5. **Infrastructure**: Security headers, rate limiting, encryption

### Common Vulnerabilities
- **Injection**: SQL, NoSQL, Command injection
- **XSS**: Reflected, stored, DOM-based
- **CSRF**: Cross-site request forgery
- **Authentication Issues**: Weak passwords, session management
- **Authorization Issues**: Privilege escalation, IDOR

### Next Steps
- Complete the exercises above
- Study OWASP guidelines
- Proceed to [Performance Engineering](./performance-engineering.md)

---

**Estimated Study Time**: 15-18 hours  
**Prerequisites**: Advanced Patterns, API Design  
**Next Module**: [Performance Engineering](./performance-engineering.md)
