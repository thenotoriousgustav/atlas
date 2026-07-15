import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';

@ApiTags('reminders')
@ApiBearerAuth()
@Controller('v1/reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new reminder' })
  async create(@CurrentUser() user: any, @Body() createReminderDto: CreateReminderDto) {
    return this.remindersService.create(user.id, createReminderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get active reminders' })
  @ApiQuery({ name: 'vehicleId', required: false })
  async findAll(@CurrentUser() user: any, @Query('vehicleId') vehicleId?: string) {
    return this.remindersService.findAll(user.id, vehicleId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update reminder details' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateReminderDto: UpdateReminderDto,
  ) {
    return this.remindersService.update(user.id, id, updateReminderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a reminder' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.remindersService.remove(user.id, id);
  }
}
