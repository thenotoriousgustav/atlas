import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createTransactionDto: CreateTransactionDto) {
    return this.prisma.transaction.create({
      data: {
        ...createTransactionDto,
        date: createTransactionDto.date ? new Date(createTransactionDto.date) : new Date(),
        userId,
      },
    });
  }

  async findAll(
    userId: string,
    filters: {
      type?: 'EXPENSE' | 'INCOME';
      category?: string;
      search?: string;
    },
  ) {
    const where: any = {
      userId,
      deletedAt: null,
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { category: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.transaction.findMany({
      where,
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
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async update(userId: string, id: string, updateTransactionDto: UpdateTransactionDto) {
    await this.findOne(userId, id); // Ensure it exists and belongs to the user

    return this.prisma.transaction.update({
      where: { id },
      data: {
        ...updateTransactionDto,
        date: updateTransactionDto.date ? new Date(updateTransactionDto.date) : undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.transaction.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
