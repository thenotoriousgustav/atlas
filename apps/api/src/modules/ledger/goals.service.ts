import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  // ponytail: Direct CRUD for financial goals
  async create(userId: string, createGoalDto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: {
        name: createGoalDto.name,
        type: createGoalDto.type,
        targetAmount: createGoalDto.targetAmount,
        currentAmount: createGoalDto.currentAmount ?? 0,
        monthlyContribution: createGoalDto.monthlyContribution ?? 0,
        targetDate: createGoalDto.targetDate ? new Date(createGoalDto.targetDate) : null,
        icon: createGoalDto.icon,
        color: createGoalDto.color,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.goal.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const goal = await this.prisma.goal.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }

    return goal;
  }

  async update(userId: string, id: string, updateGoalDto: UpdateGoalDto) {
    await this.findOne(userId, id);

    return this.prisma.goal.update({
      where: { id },
      data: {
        name: updateGoalDto.name,
        type: updateGoalDto.type,
        targetAmount: updateGoalDto.targetAmount,
        currentAmount: updateGoalDto.currentAmount,
        monthlyContribution: updateGoalDto.monthlyContribution,
        targetDate: updateGoalDto.targetDate ? new Date(updateGoalDto.targetDate) : undefined,
        icon: updateGoalDto.icon,
        color: updateGoalDto.color,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.goal.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
