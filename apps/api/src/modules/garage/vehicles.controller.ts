import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@ApiTags('vehicles')
@ApiBearerAuth()
@Controller('v1/vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new vehicle' })
  async create(@CurrentUser() user: any, @Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(user.id, createVehicleDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all registered vehicles' })
  async findAll(@CurrentUser() user: any) {
    return this.vehiclesService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific vehicle' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.vehiclesService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update vehicle information' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(user.id, id, updateVehicleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a vehicle record' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.vehiclesService.remove(user.id, id);
  }
}
