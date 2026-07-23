import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { HabitService } from './habit.service';
import { CreateHabitTrackerDto } from './dto/create-habit-tracker.dto';
import { UpdateHabitTrackerDto } from './dto/update-habit-tracker.dto';
import { LogHabitEntryDto } from './dto/log-habit-entry.dto';

@ApiTags('habits')
@ApiBearerAuth()
@Controller('v1/habits')
@UseGuards(JwtAuthGuard)
export class HabitController {
  constructor(private readonly habitService: HabitService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new habit tracker' })
  async create(
    @CurrentUser() user: any,
    @Body() createDto: CreateHabitTrackerDto,
  ) {
    return this.habitService.create(user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all habit trackers for current user' })
  @ApiQuery({ name: 'category', required: false })
  async findAll(
    @CurrentUser() user: any,
    @Query('category') category?: string,
  ) {
    return this.habitService.findAll(user.id, category);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get habit dashboard overview with aggregated heatmap & stats' })
  async getDashboardSummary(@CurrentUser() user: any) {
    return this.habitService.getDashboardSummary(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get habit tracker detail with 365-day stats & heatmap' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.habitService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update habit tracker metadata or archive' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateHabitTrackerDto,
  ) {
    return this.habitService.update(user.id, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete habit tracker' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.habitService.remove(user.id, id);
  }

  @Post(':id/entries')
  @ApiOperation({ summary: 'Upsert daily check-in entry for habit' })
  async logEntry(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() logDto: LogHabitEntryDto,
  ) {
    return this.habitService.logEntry(user.id, id, logDto);
  }

  @Delete(':id/entries/:date')
  @ApiOperation({ summary: 'Delete entry for specific date (YYYY-MM-DD)' })
  async deleteEntry(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('date') date: string,
  ) {
    return this.habitService.deleteEntry(user.id, id, date);
  }

  @Get('categories/list')
  @ApiOperation({ summary: 'Get custom habit categories' })
  async getCategories(@CurrentUser() user: any) {
    return this.habitService.getCategories(user.id);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create custom habit category' })
  async createCategory(@CurrentUser() user: any, @Body() dto: any) {
    return this.habitService.createCategory(user.id, dto);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update custom habit category' })
  async updateCategory(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.habitService.updateCategory(user.id, id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete custom habit category' })
  async deleteCategory(@CurrentUser() user: any, @Param('id') id: string) {
    return this.habitService.deleteCategory(user.id, id);
  }
}
