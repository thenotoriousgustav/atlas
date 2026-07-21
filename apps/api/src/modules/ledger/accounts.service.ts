import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  // ponytail: Keep CRUD simple and direct
  async create(userId: string, createAccountDto: CreateAccountDto) {
    const account = await this.prisma.account.create({
      data: {
        name: createAccountDto.name,
        type: createAccountDto.type,
        balance: createAccountDto.balance ?? 0,
        currency: createAccountDto.currency ?? 'IDR',
        isOnBudget: createAccountDto.isOnBudget ?? true,
        userId,
      },
    });

    if (createAccountDto.balance && createAccountDto.balance > 0) {
      await this.prisma.transaction.create({
        data: {
          type: 'INCOME',
          amount: createAccountDto.balance,
          title: 'Starting Balance',
          description: `Initial balance for ${createAccountDto.name}`,
          accountId: account.id,
          userId,
        },
      });
    }

    return account;
  }

  async findAll(userId: string) {
    return this.prisma.account.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const account = await this.prisma.account.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return account;
  }

  async update(userId: string, id: string, updateAccountDto: UpdateAccountDto) {
    await this.findOne(userId, id); // check ownership

    return this.prisma.account.update({
      where: { id },
      data: {
        name: updateAccountDto.name,
        type: updateAccountDto.type,
        balance: updateAccountDto.balance,
        currency: updateAccountDto.currency,
        isOnBudget: updateAccountDto.isOnBudget,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id); // check ownership

    // ponytail: soft delete
    return this.prisma.account.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
