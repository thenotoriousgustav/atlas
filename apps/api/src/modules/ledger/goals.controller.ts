import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { BudgetShareGuard } from './budget-share.guard';

@ApiTags('goals')
@ApiBearerAuth()
@Controller('v1/goals')
@UseGuards(JwtAuthGuard, BudgetShareGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new financial goal' })
  async create(@CurrentUser() user: any, @Body() createGoalDto: CreateGoalDto) {
    return this.goalsService.create(user.id, createGoalDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all financial goals' })
  async findAll(@CurrentUser() user: any) {
    return this.goalsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get goal details by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.goalsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a financial goal' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateGoalDto: UpdateGoalDto,
  ) {
    return this.goalsService.update(user.id, id, updateGoalDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a financial goal' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.goalsService.remove(user.id, id);
  }
}
