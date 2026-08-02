import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user, ip, body, params } = req;

    // Only audit mutating actions (POST, PUT, PATCH, DELETE)
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: async (resData) => {
          try {
            const userId = user?.id || null;
            const targetEntity = this.extractEntityName(url);
            const targetId = resData?.id || params?.id || body?.id || null;
            const action = `${method} ${url}`;

            await this.prisma.auditLog.create({
              data: {
                userId,
                action,
                targetEntity,
                targetId: targetId ? String(targetId) : null,
                ipAddress: ip || req.connection?.remoteAddress || null,
              },
            });
          } catch (err) {
            this.logger.error(`Failed to record audit log: ${err.message}`, err.stack);
          }
        },
      }),
    );
  }

  private extractEntityName(url: string): string {
    const parts = url.split('?')[0].split('/').filter(Boolean);
    if (parts.length > 1 && parts[0] === 'api') {
      return parts[1].toUpperCase();
    }
    return parts[0]?.toUpperCase() || 'UNKNOWN';
  }
}
