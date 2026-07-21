import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';

@Injectable()
export class RecurringTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateRecurringTransactionDto) {
    return this.prisma.recurringTransaction.create({
      data: {
        title: dto.title,
        amount: dto.amount,
        type: dto.type,
        frequency: dto.frequency,
        nextDate: new Date(dto.nextDate),
        accountId: dto.accountId,
        categoryId: dto.categoryId,
        transferAccountId: dto.transferAccountId,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    // Process scheduled ones first (lazy execution)
    await this.processRecurringTransactions(userId);

    return this.prisma.recurringTransaction.findMany({
      where: { userId, deletedAt: null },
      include: {
        account: true,
        category: true,
      },
      orderBy: { nextDate: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const rt = await this.prisma.recurringTransaction.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        account: true,
        category: true,
      },
    });
    if (!rt) throw new NotFoundException('Recurring transaction not found');
    return rt;
  }

  async update(userId: string, id: string, dto: UpdateRecurringTransactionDto) {
    const rt = await this.findOne(userId, id);

    return this.prisma.recurringTransaction.update({
      where: { id: rt.id },
      data: {
        title: dto.title,
        amount: dto.amount,
        type: dto.type,
        frequency: dto.frequency,
        nextDate: dto.nextDate ? new Date(dto.nextDate) : undefined,
        accountId: dto.accountId,
        categoryId: dto.categoryId,
        transferAccountId: dto.transferAccountId,
      },
    });
  }

  async remove(userId: string, id: string) {
    const rt = await this.findOne(userId, id);
    return this.prisma.recurringTransaction.update({
      where: { id: rt.id },
      data: { deletedAt: new Date() },
    });
  }

  // Scheduler: process pending recurring transactions
  async processRecurringTransactions(userId: string) {
    const now = new Date();
    const pending = await this.prisma.recurringTransaction.findMany({
      where: {
        userId,
        deletedAt: null,
        nextDate: { lte: now },
      },
    });

    for (const rt of pending) {
      // Create regular transaction
      await this.prisma.transaction.create({
        data: {
          title: rt.title,
          amount: rt.amount,
          type: rt.type,
          date: rt.nextDate,
          accountId: rt.accountId,
          categoryId: rt.categoryId,
          transferAccountId: rt.transferAccountId,
          userId: rt.userId,
        },
      });

      // Update account balance
      if (rt.type === 'EXPENSE') {
        await this.prisma.account.update({
          where: { id: rt.accountId },
          data: { balance: { decrement: rt.amount } },
        });
      } else if (rt.type === 'INCOME') {
        await this.prisma.account.update({
          where: { id: rt.accountId },
          data: { balance: { increment: rt.amount } },
        });
      } else if (rt.type === 'TRANSFER' && rt.transferAccountId) {
        await this.prisma.account.update({
          where: { id: rt.accountId },
          data: { balance: { decrement: rt.amount } },
        });
        await this.prisma.account.update({
          where: { id: rt.transferAccountId },
          data: { balance: { increment: rt.amount } },
        });
      }

      // Calculate next occurrence date
      const nextDate = new Date(rt.nextDate);
      if (rt.frequency === 'DAILY') {
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (rt.frequency === 'WEEKLY') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (rt.frequency === 'MONTHLY') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (rt.frequency === 'YEARLY') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      await this.prisma.recurringTransaction.update({
        where: { id: rt.id },
        data: {
          nextDate,
          lastPostedAt: now,
        },
      });
    }
  }
}
