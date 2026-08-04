import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // 1. If req.user is already populated by Passport / JwtAuthGuard
    if (req.user && (req.user.id || req.user.email || req.user.sub)) {
      return `user:${req.user.id || req.user.sub || req.user.email}`;
    }

    // 2. Parse Bearer JWT payload from Authorization header if present
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payloadBuffer = Buffer.from(parts[1], 'base64');
          const payload = JSON.parse(payloadBuffer.toString('utf-8'));
          const userId = payload.sub || payload.id || payload.email;
          if (userId) {
            return `user:${userId}`;
          }
        }
      } catch (err) {
        // Fall back to IP tracking on malformed JWT payload
      }
    }

    // 3. Fallback to per-IP rate limiting for unauthenticated visitors
    const clientIp =
      req.ip ||
      req.headers?.['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket?.remoteAddress ||
      '127.0.0.1';

    return `ip:${clientIp}`;
  }
}
