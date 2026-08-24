import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private reflector?: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector?.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    
    // Extract from Cookie first, then fallback to Authorization header
    let token = request.cookies?.access_token;
    
    if (!token && request.headers.authorization) {
      const [type, credentials] = request.headers.authorization.split(' ');
      if (type === 'Bearer') {
        token = credentials;
      }
    }

    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }

    const payload = await this.authService.verifyAccessToken(token);
    if (!payload) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    // Attach user payload to request
    request.user = {
      id: payload.sub,
      email: payload.email,
    };

    return true;
  }
}
