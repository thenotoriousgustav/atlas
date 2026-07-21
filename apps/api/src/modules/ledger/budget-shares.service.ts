import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBudgetShareDto } from './dto/create-budget-share.dto';

@Injectable()
export class BudgetSharesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateBudgetShareDto) {
    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!targetUser) {
      throw new NotFoundException(`User dengan email ${dto.email} tidak ditemukan.`);
    }

    if (targetUser.id === userId) {
      throw new ConflictException('Anda tidak dapat membagikan anggaran ke diri Anda sendiri.');
    }

    const existing = await this.prisma.budgetShare.findUnique({
      where: {
        ownerId_grantedToId: {
          ownerId: userId,
          grantedToId: targetUser.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Anggaran sudah dibagikan dengan pengguna ini.');
    }

    return this.prisma.budgetShare.create({
      data: {
        ownerId: userId,
        grantedToId: targetUser.id,
      },
      include: {
        grantedTo: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  async findAll(userId: string) {
    const ownedShares = await this.prisma.budgetShare.findMany({
      where: { ownerId: userId },
      include: {
        grantedTo: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    const receivedShares = await this.prisma.budgetShare.findMany({
      where: { grantedToId: userId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return {
      ownedShares,
      receivedShares,
    };
  }

  async remove(userId: string, id: string) {
    const share = await this.prisma.budgetShare.findUnique({
      where: { id },
    });

    if (!share) {
      throw new NotFoundException('Data berbagi anggaran tidak ditemukan.');
    }

    if (share.ownerId !== userId && share.grantedToId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menghapus berbagi anggaran ini.');
    }

    return this.prisma.budgetShare.delete({
      where: { id },
    });
  }

  async validateAccess(ownerId: string, callingUserId: string) {
    if (ownerId === callingUserId) return true;

    const share = await this.prisma.budgetShare.findUnique({
      where: {
        ownerId_grantedToId: {
          ownerId,
          grantedToId: callingUserId,
        },
      },
    });

    if (!share) {
      throw new ForbiddenException('Anda tidak memiliki akses ke anggaran ini.');
    }

    return true;
  }
}
