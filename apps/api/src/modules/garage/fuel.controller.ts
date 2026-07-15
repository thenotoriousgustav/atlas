import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FuelService } from './fuel.service';
import { CreateFuelDto } from './dto/create-fuel.dto';

@ApiTags('fuel')
@ApiBearerAuth()
@Controller('v1/fuel')
@UseGuards(JwtAuthGuard)
export class FuelController {
  constructor(private readonly fuelService: FuelService) {}

  @Post()
  @ApiOperation({ summary: 'Log a new refueling' })
  async create(@CurrentUser() user: any, @Body() createFuelDto: CreateFuelDto) {
    return this.fuelService.create(user.id, createFuelDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get refueling logs' })
  @ApiQuery({ name: 'vehicleId', required: false })
  async findAll(@CurrentUser() user: any, @Query('vehicleId') vehicleId?: string) {
    return this.fuelService.findAll(user.id, vehicleId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a refueling log' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.fuelService.remove(user.id, id);
  }
}
