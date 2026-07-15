import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { VehiclesService } from './vehicles.service';

@Injectable()
export class RemindersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehiclesService: VehiclesService,
  ) {}

  async create(userId: string, dto: CreateReminderDto) {
    await this.vehiclesService.findOne(userId, dto.vehicleId); // Ensure ownership

    return this.prisma.reminder.create({
      data: {
        vehicleId: dto.vehicleId,
        type: dto.type,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        dueMileage: dto.dueMileage || null,
        status: dto.status || 'ACTIVE',
      },
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

    return this.prisma.reminder.findMany({
      where,
      orderBy: [
        { dueDate: 'asc' },
        { dueMileage: 'asc' },
      ],
    });
  }

  async update(userId: string, id: string, dto: UpdateReminderDto) {
    const reminder = await this.prisma.reminder.findFirst({
      where: {
        id,
        vehicle: {
          userId,
        },
        deletedAt: null,
      },
    });

    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }

    return this.prisma.reminder.update({
      where: { id },
      data: {
        type: dto.type,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        dueMileage: dto.dueMileage !== undefined ? dto.dueMileage : undefined,
        status: dto.status,
      },
    });
  }

  async remove(userId: string, id: string) {
    const reminder = await this.prisma.reminder.findFirst({
      where: {
        id,
        vehicle: {
          userId,
        },
        deletedAt: null,
      },
    });

    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }

    return this.prisma.reminder.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
