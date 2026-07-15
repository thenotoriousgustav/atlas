import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { VehiclesService } from './vehicles.service';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehiclesService: VehiclesService,
  ) {}

  async create(userId: string, dto: CreateExpenseDto) {
    await this.vehiclesService.findOne(userId, dto.vehicleId); // Ensure ownership

    return this.prisma.expense.create({
      data: {
        vehicleId: dto.vehicleId,
        category: dto.category,
        amount: dto.amount,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
    });
  }

  async findAll(userId: string, vehicleId?: string, category?: string) {
    const where: any = {
      deletedAt: null,
      vehicle: {
        userId,
      },
    };

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (category) {
      where.category = category;
    }

    return this.prisma.expense.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
    });
  }

  async remove(userId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: {
        id,
        vehicle: {
          userId,
        },
        deletedAt: null,
      },
    });

    if (!expense) {
      throw new NotFoundException(`Expense record with ID ${id} not found`);
    }

    return this.prisma.expense.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
