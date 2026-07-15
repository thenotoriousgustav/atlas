import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { VehiclesService } from './vehicles.service';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehiclesService: VehiclesService,
  ) {}

  async create(userId: string, dto: CreateDocumentDto) {
    await this.vehiclesService.findOne(userId, dto.vehicleId); // Ensure ownership

    return this.prisma.vehicleDocument.create({
      data: {
        vehicleId: dto.vehicleId,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        expirationDate: dto.expirationDate ? new Date(dto.expirationDate) : null,
        notes: dto.notes || null,
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

    return this.prisma.vehicleDocument.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async remove(userId: string, id: string) {
    const doc = await this.prisma.vehicleDocument.findFirst({
      where: {
        id,
        vehicle: {
          userId,
        },
        deletedAt: null,
      },
    });

    if (!doc) {
      throw new NotFoundException(`Document record with ID ${id} not found`);
    }

    return this.prisma.vehicleDocument.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
