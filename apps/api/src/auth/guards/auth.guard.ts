import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { AuthService } from "@/auth/auth.service"
import { IS_PUBLIC_KEY } from "@/common/decorators/public.decorator"

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    ) {
      return true
    }
    const request = context.switchToHttp().getRequest()
    const session = await this.authService.getSession(request.headers)
    if (!session) throw new UnauthorizedException("Invalid or expired session")
    request.user = session.user
    return true
  }
}
