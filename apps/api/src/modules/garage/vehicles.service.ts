import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createVehicleDto: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: {
        ...createVehicleDto,
        purchaseDate: createVehicleDto.purchaseDate ? new Date(createVehicleDto.purchaseDate) : undefined,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.vehicle.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(userId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        maintenances: {
          where: { deletedAt: null },
          include: { items: true },
        },
        parts: {
          where: { deletedAt: null },
        },
        fuelLogs: {
          where: { deletedAt: null },
        },
        expenses: {
          where: { deletedAt: null },
        },
        reminders: {
          where: { deletedAt: null },
        },
        documents: {
          where: { deletedAt: null },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    return vehicle;
  }

  async update(userId: string, id: string, updateVehicleDto: UpdateVehicleDto) {
    await this.findOne(userId, id); // Ensure existence and ownership

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        ...updateVehicleDto,
        purchaseDate: updateVehicleDto.purchaseDate ? new Date(updateVehicleDto.purchaseDate) : undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
