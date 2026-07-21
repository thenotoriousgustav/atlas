import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BudgetShareGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) return false;

    // Resolve target budgetId safely from query, headers, or body
    const budgetId = request.query?.budgetId || request.headers?.['x-budget-id'] || request.body?.budgetId;

    if (!budgetId || budgetId === user.id) {
      return true; // Accessing their own budget
    }

    // Verify budget share mapping exists in database
    const share = await this.prisma.budgetShare.findUnique({
      where: {
        ownerId_grantedToId: {
          ownerId: budgetId,
          grantedToId: user.id,
        },
      },
    });

    if (!share) {
      throw new ForbiddenException('Anda tidak memiliki akses ke anggaran ini.');
    }

    // Hijack req.user.id so downstream controllers act on the target shared budget
    user.id = budgetId;
    return true;
  }
}
