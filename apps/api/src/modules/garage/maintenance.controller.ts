import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';

@ApiTags('maintenance')
@ApiBearerAuth()
@Controller('v1/maintenance')
@UseGuards(JwtAuthGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @ApiOperation({ summary: 'Log a new maintenance service' })
  async create(@CurrentUser() user: any, @Body() createMaintenanceDto: CreateMaintenanceDto) {
    return this.maintenanceService.create(user.id, createMaintenanceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get maintenance service history' })
  @ApiQuery({ name: 'vehicleId', required: false })
  async findAll(@CurrentUser() user: any, @Query('vehicleId') vehicleId?: string) {
    return this.maintenanceService.findAll(user.id, vehicleId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a maintenance record' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.maintenanceService.remove(user.id, id);
  }
}
