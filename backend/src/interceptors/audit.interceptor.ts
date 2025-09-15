import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditService } from '../services/audit.service';
import { AUDIT_KEY, AuditOptions } from '../decorators/audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.get<AuditOptions>(
      AUDIT_KEY,
      context.getHandler(),
    );

    if (!auditOptions) {
      return next.handle();
    }

    // Get GraphQL context
    const gqlContext = GqlExecutionContext.create(context);
    const { req } = gqlContext.getContext();
    const user = req.user;

    if (!user) {
      return next.handle();
    }

    const startTime = Date.now();
    const args = gqlContext.getArgs();
    
    // Extract common identifiers from arguments
    const eventId = this.extractEventId(args);
    const registrationId = this.extractRegistrationId(args);
    
    // Get client information
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.get('User-Agent');

    return next.handle().pipe(
      tap((result) => {
        // Log successful action
        this.logAuditEvent(
          auditOptions,
          user.id,
          eventId,
          registrationId,
          {
            success: true,
            duration: Date.now() - startTime,
            args: auditOptions.includeRequest ? args : undefined,
            result: auditOptions.includeResponse ? result : undefined,
            description: auditOptions.description,
          },
          ipAddress,
          userAgent,
        );
      }),
      catchError((error) => {
        // Log failed action
        this.logAuditEvent(
          auditOptions,
          user.id,
          eventId,
          registrationId,
          {
            success: false,
            duration: Date.now() - startTime,
            error: error.message,
            args: auditOptions.includeRequest ? args : undefined,
            description: auditOptions.description,
          },
          ipAddress,
          userAgent,
        );
        throw error;
      }),
    );
  }

  private async logAuditEvent(
    options: AuditOptions,
    userId: string,
    eventId?: string,
    registrationId?: string,
    details: any = {},
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      await this.auditService.createAuditLog({
        action: options.action,
        eventId,
        registrationId,
        details,
        performedBy: userId,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  private extractEventId(args: any): string | undefined {
    // Try to extract eventId from various argument structures
    if (args.eventId) return args.eventId;
    if (args.input?.eventId) return args.input.eventId;
    if (args.id && this.looksLikeEventId(args.id)) return args.id;
    return undefined;
  }

  private extractRegistrationId(args: any): string | undefined {
    // Try to extract registrationId from various argument structures
    if (args.registrationId) return args.registrationId;
    if (args.input?.registrationId) return args.input.registrationId;
    if (args.id && this.looksLikeRegistrationId(args.id)) return args.id;
    return undefined;
  }

  private looksLikeEventId(id: string): boolean {
    // Simple heuristic - in a real app you might have more sophisticated logic
    return typeof id === 'string' && id.length > 10;
  }

  private looksLikeRegistrationId(id: string): boolean {
    // Simple heuristic - in a real app you might have more sophisticated logic
    return typeof id === 'string' && id.length > 10;
  }
}
