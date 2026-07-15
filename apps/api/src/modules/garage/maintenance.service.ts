import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { VehiclesService } from './vehicles.service';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehiclesService: VehiclesService,
  ) {}

  async create(userId: string, dto: CreateMaintenanceDto) {
    // Validate vehicle ownership
    const vehicle = await this.vehiclesService.findOne(userId, dto.vehicleId);

    const serviceDate = dto.date ? new Date(dto.date) : new Date();

    // Use Prisma transaction to create maintenance, items, and register parts
    return this.prisma.$transaction(async (tx) => {
      // 1. Create Maintenance
      const maintenance = await tx.maintenance.create({
        data: {
          vehicleId: dto.vehicleId,
          date: serviceDate,
          odometer: dto.odometer,
          workshop: dto.workshop || null,
          notes: dto.notes || null,
          totalCost: dto.totalCost,
        },
      });

      // 2. Create MaintenanceItems
      if (dto.items && dto.items.length > 0) {
        await tx.maintenanceItem.createMany({
          data: dto.items.map((item) => ({
            maintenanceId: maintenance.id,
            type: item.type,
            cost: item.cost,
          })),
        });
      }

      // 3. Register Parts Replaced
      if (dto.parts && dto.parts.length > 0) {
        for (const part of dto.parts) {
          await tx.part.create({
            data: {
              vehicleId: dto.vehicleId,
              maintenanceId: maintenance.id,
              name: part.name,
              brand: part.brand || null,
              installedAt: serviceDate,
              installedMileage: dto.odometer,
              expectedLife: part.expectedLife || null,
            },
          });
        }
      }

      // 4. Update vehicle odometer if the new odometer is larger
      if (dto.odometer > vehicle.odometer) {
        await tx.vehicle.update({
          where: { id: dto.vehicleId },
          data: { odometer: dto.odometer },
        });
      }

      // 5. Create general maintenance expense automatically
      await tx.expense.create({
        data: {
          vehicleId: dto.vehicleId,
          category: 'Maintenance',
          amount: dto.totalCost,
          date: serviceDate,
        },
      });

      return tx.maintenance.findUnique({
        where: { id: maintenance.id },
        include: {
          items: true,
          parts: true,
        },
      });
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

    return this.prisma.maintenance.findMany({
      where,
      include: {
        items: true,
        parts: true,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async remove(userId: string, id: string) {
    const maintenance = await this.prisma.maintenance.findFirst({
      where: {
        id,
        vehicle: {
          userId,
        },
        deletedAt: null,
      },
    });

    if (!maintenance) {
      throw new NotFoundException(`Maintenance record with ID ${id} not found`);
    }

    return this.prisma.maintenance.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
