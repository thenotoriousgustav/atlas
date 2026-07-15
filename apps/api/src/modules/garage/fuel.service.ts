import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFuelDto } from './dto/create-fuel.dto';
import { VehiclesService } from './vehicles.service';

@Injectable()
export class FuelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehiclesService: VehiclesService,
  ) {}

  async create(userId: string, dto: CreateFuelDto) {
    const vehicle = await this.vehiclesService.findOne(userId, dto.vehicleId);

    const totalCost = dto.liters * dto.price;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create fuel log
      const fuelLog = await tx.fuelLog.create({
        data: {
          vehicleId: dto.vehicleId,
          liters: dto.liters,
          price: dto.price,
          odometer: dto.odometer,
        },
      });

      // 2. Create corresponding fuel expense record
      await tx.expense.create({
        data: {
          vehicleId: dto.vehicleId,
          category: 'Fuel',
          amount: totalCost,
          date: new Date(),
        },
      });

      // 3. Update vehicle odometer if higher
      if (dto.odometer > vehicle.odometer) {
        await tx.vehicle.update({
          where: { id: dto.vehicleId },
          data: { odometer: dto.odometer },
        });
      }

      return fuelLog;
    });
  }

  async findAll(userId: string, vehicleId?: string) {
    const where: any = {
      deletedAt: null,
      vehicle: {
        userId,
      },
    };

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    return this.prisma.fuelLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async remove(userId: string, id: string) {
    const fuelLog = await this.prisma.fuelLog.findFirst({
      where: {
        id,
        vehicle: {
          userId,
        },
        deletedAt: null,
      },
    });

    if (!fuelLog) {
      throw new NotFoundException(`Fuel log with ID ${id} not found`);
    }

    return this.prisma.fuelLog.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
