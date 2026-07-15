import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createSubscriptionDto: CreateSubscriptionDto) {
    return this.prisma.subscription.create({
      data: {
        ...createSubscriptionDto,
        startDate: new Date(createSubscriptionDto.startDate),
        userId,
      },
    });
  }

  async findAll(
    userId: string,
    filters: {
      status?: 'ACTIVE' | 'PAUSED' | 'CANCELLED';
      billingCycle?: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
      search?: string;
    },
  ) {
    const where: any = {
      userId,
      deletedAt: null,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.billingCycle) {
      where.billingCycle = filters.billingCycle;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { category: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.subscription.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return subscription;
  }

  async update(userId: string, id: string, updateSubscriptionDto: UpdateSubscriptionDto) {
    await this.findOne(userId, id); // Ensure it exists and belongs to the user

    return this.prisma.subscription.update({
      where: { id },
      data: {
        ...updateSubscriptionDto,
        startDate: updateSubscriptionDto.startDate ? new Date(updateSubscriptionDto.startDate) : undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.subscription.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
