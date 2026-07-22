import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto) {
    // Check account ownership
    const account = await this.prisma.account.findFirst({
      where: { id: dto.accountId, userId, deletedAt: null },
    });
    if (!account) {
      throw new NotFoundException(`Account not found`);
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, userId, deletedAt: null },
      });
      if (!category) throw new NotFoundException(`Category not found`);
    }

    // ponytail: handle TRANSFER
    if (dto.type === 'TRANSFER') {
      if (!dto.transferAccountId) {
        throw new BadRequestException('transferAccountId is required for transfer transactions');
      }
      const destAccount = await this.prisma.account.findFirst({
        where: { id: dto.transferAccountId, userId, deletedAt: null },
      });
      if (!destAccount) {
        throw new NotFoundException(`Destination account not found`);
      }

      // Create paired transactions in a db transaction
      return this.prisma.$transaction(async (tx) => {
        const date = dto.date ? new Date(dto.date) : new Date();

        // Source transaction (Outflow)
        const sourceTx = await tx.transaction.create({
          data: {
            type: 'TRANSFER',
            amount: dto.amount,
            title: dto.title || `Transfer to ${destAccount.name}`,
            description: dto.description,
            accountId: dto.accountId,
            transferAccountId: dto.transferAccountId,
            date,
            userId,
          },
        });

        // Destination transaction (Inflow)
        const destTx = await tx.transaction.create({
          data: {
            type: 'TRANSFER',
            amount: dto.amount,
            title: dto.title || `Transfer from ${account.name}`,
            description: dto.description,
            accountId: dto.transferAccountId,
            transferAccountId: dto.accountId,
            transferPairId: sourceTx.id,
            date,
            userId,
          },
        });

        // Link source to destination
        const updatedSourceTx = await tx.transaction.update({
          where: { id: sourceTx.id },
          data: { transferPairId: destTx.id },
        });

        // Update balances
        await tx.account.update({
          where: { id: dto.accountId },
          data: { balance: { decrement: dto.amount } },
        });
        await tx.account.update({
          where: { id: dto.transferAccountId },
          data: { balance: { increment: dto.amount } },
        });

        return updatedSourceTx;
      });
    }

    // Handle standard INCOME / EXPENSE
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          type: dto.type,
          amount: dto.amount,
          title: dto.title,
          description: dto.description,
          accountId: dto.accountId,
          categoryId: dto.categoryId,
          category: dto.category, // keep legacy field for safety
          date: dto.date ? new Date(dto.date) : new Date(),
          userId,
        },
      });

      // Update account balance
      if (dto.type === 'EXPENSE') {
        await tx.account.update({
          where: { id: dto.accountId },
          data: { balance: { decrement: dto.amount } },
        });
      } else if (dto.type === 'INCOME') {
        await tx.account.update({
          where: { id: dto.accountId },
          data: { balance: { increment: dto.amount } },
        });
      }

      return transaction;
    });
  }

  async findAll(
    userId: string,
    filters: {
      type?: 'EXPENSE' | 'INCOME' | 'TRANSFER';
      accountId?: string;
      categoryId?: string;
      search?: string;
      month?: number;
      year?: number;
    },
  ) {
    const where: any = {
      userId,
      deletedAt: null,
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.accountId) {
      where.accountId = filters.accountId;
    }

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.month && filters.year) {
      const start = new Date(filters.year, filters.month - 1, 1);
      const end = new Date(filters.year, filters.month, 0, 23, 59, 59, 999);
      where.date = {
        gte: start,
        lte: end,
      };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.transaction.findMany({
      where,
      include: {
        account: {
          select: { name: true, type: true },
        },
        categoryRel: {
          select: { name: true },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        account: {
          select: { name: true, type: true },
        },
        categoryRel: {
          select: { name: true },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const oldTx = await this.findOne(userId, id);

    // ponytail: If it is a transfer, delete old and recreate to avoid complex nested edits
    if (oldTx.type === 'TRANSFER' || dto.type === 'TRANSFER') {
      await this.remove(userId, id);
      return this.create(userId, {
        type: dto.type ?? (oldTx.type as any),
        amount: dto.amount ?? oldTx.amount,
        title: dto.title ?? oldTx.title,
        description: dto.description ?? oldTx.description,
        accountId: dto.accountId ?? oldTx.accountId,
        categoryId: dto.categoryId ?? oldTx.categoryId,
        transferAccountId: dto.transferAccountId ?? oldTx.transferAccountId,
        date: dto.date ?? oldTx.date?.toISOString(),
      });
    }

    // Revert old transaction, apply new in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Revert old impact on balance
      if (oldTx.type === 'EXPENSE') {
        await tx.account.update({
          where: { id: oldTx.accountId },
          data: { balance: { increment: oldTx.amount } },
        });
      } else if (oldTx.type === 'INCOME') {
        await tx.account.update({
          where: { id: oldTx.accountId },
          data: { balance: { decrement: oldTx.amount } },
        });
      }

      // Update the transaction
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          type: dto.type,
          amount: dto.amount,
          title: dto.title,
          description: dto.description,
          accountId: dto.accountId,
          categoryId: dto.categoryId,
          category: dto.category,
          date: dto.date ? new Date(dto.date) : undefined,
        },
      });

      // Apply new impact on balance
      const newType = dto.type ?? oldTx.type;
      const newAmount = dto.amount ?? oldTx.amount;
      const newAccountId = dto.accountId ?? oldTx.accountId;

      if (newType === 'EXPENSE') {
        await tx.account.update({
          where: { id: newAccountId },
          data: { balance: { decrement: newAmount } },
        });
      } else if (newType === 'INCOME') {
        await tx.account.update({
          where: { id: newAccountId },
          data: { balance: { increment: newAmount } },
        });
      }

      return updated;
    });
  }

  async createBulk(userId: string, dtos: CreateTransactionDto[]) {
    if (!dtos || dtos.length === 0) {
      return [];
    }

    const accountIds = Array.from(new Set(dtos.map(d => d.accountId)));
    const categoryIds = Array.from(new Set(dtos.filter(d => d.categoryId).map(d => d.categoryId)));

    const accounts = await this.prisma.account.findMany({
      where: { id: { in: accountIds }, userId, deletedAt: null },
    });
    const accountsMap = new Map(accounts.map(a => [a.id, a]));

    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds as string[] }, userId, deletedAt: null },
    });
    const categoriesMap = new Map(categories.map(c => [c.id, c]));

    // Validation
    for (const dto of dtos) {
      if (!accountsMap.has(dto.accountId)) {
        throw new BadRequestException(`Account not found or access denied for ID: ${dto.accountId}`);
      }
      if (dto.categoryId && !categoriesMap.has(dto.categoryId)) {
        throw new BadRequestException(`Category not found or access denied for ID: ${dto.categoryId}`);
      }
      if (dto.type === 'TRANSFER') {
        if (!dto.transferAccountId) {
          throw new BadRequestException('transferAccountId is required for transfer transactions');
        }
        const destAccount = await this.prisma.account.findFirst({
          where: { id: dto.transferAccountId, userId, deletedAt: null },
        });
        if (!destAccount) {
          throw new BadRequestException(`Destination account not found or access denied for ID: ${dto.transferAccountId}`);
        }
      }
    }

    // Execute in db transaction
    return this.prisma.$transaction(async (tx) => {
      const createdTransactions = [];
      for (const dto of dtos) {
        if (dto.type === 'TRANSFER') {
          const date = dto.date ? new Date(dto.date) : new Date();
          const sourceTx = await tx.transaction.create({
            data: {
              type: 'TRANSFER',
              amount: dto.amount,
              title: dto.title || `Transfer`,
              description: dto.description,
              accountId: dto.accountId,
              transferAccountId: dto.transferAccountId,
              date,
              userId,
            },
          });

          const destTx = await tx.transaction.create({
            data: {
              type: 'TRANSFER',
              amount: dto.amount,
              title: dto.title || `Transfer`,
              description: dto.description,
              accountId: dto.transferAccountId!,
              transferAccountId: dto.accountId,
              transferPairId: sourceTx.id,
              date,
              userId,
            },
          });

          const updatedSourceTx = await tx.transaction.update({
            where: { id: sourceTx.id },
            data: { transferPairId: destTx.id },
          });

          await tx.account.update({
            where: { id: dto.accountId },
            data: { balance: { decrement: dto.amount } },
          });
          await tx.account.update({
            where: { id: dto.transferAccountId! },
            data: { balance: { increment: dto.amount } },
          });

          createdTransactions.push(updatedSourceTx);
        } else {
          const transaction = await tx.transaction.create({
            data: {
              type: dto.type,
              amount: dto.amount,
              title: dto.title,
              description: dto.description,
              accountId: dto.accountId,
              categoryId: dto.categoryId,
              category: dto.category,
              date: dto.date ? new Date(dto.date) : new Date(),
              userId,
            },
          });

          if (dto.type === 'EXPENSE') {
            await tx.account.update({
              where: { id: dto.accountId },
              data: { balance: { decrement: dto.amount } },
            });
          } else if (dto.type === 'INCOME') {
            await tx.account.update({
              where: { id: dto.accountId },
              data: { balance: { increment: dto.amount } },
            });
          }

          createdTransactions.push(transaction);
        }
      }
      return createdTransactions;
    });
  }

  async remove(userId: string, id: string) {
    const transaction = await this.findOne(userId, id);

    return this.prisma.$transaction(async (tx) => {
      // Revert balance impact
      if (transaction.type === 'EXPENSE') {
        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: transaction.amount } },
        });
      } else if (transaction.type === 'INCOME') {
        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { decrement: transaction.amount } },
        });
      } else if (transaction.type === 'TRANSFER' && transaction.transferPairId) {
        // Revert transfer balances
        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: transaction.amount } }, // source gets refunded
        });
        await tx.account.update({
          where: { id: transaction.transferAccountId },
          data: { balance: { decrement: transaction.amount } }, // destination gets deducted
        });

        // Soft delete the paired transaction
        await tx.transaction.update({
          where: { id: transaction.transferPairId },
          data: { deletedAt: new Date() },
        });
      }

      // Soft delete this transaction
      return tx.transaction.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });
  }
}
