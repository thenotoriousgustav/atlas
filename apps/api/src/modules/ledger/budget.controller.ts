import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BudgetService } from './budget.service';
import { UpdateBudgetEntryDto } from './dto/update-budget-entry.dto';
import { BudgetShareGuard } from './budget-share.guard';

@ApiTags('budget')
@ApiBearerAuth()
@Controller('v1/budget')
@UseGuards(JwtAuthGuard, BudgetShareGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get()
  @ApiOperation({ summary: 'Get budget entries and calculation details' })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  async getBudget(
    @CurrentUser() user: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const now = new Date();
    const m = month ? parseInt(month, 10) : now.getMonth() + 1;
    const y = year ? parseInt(year, 10) : now.getFullYear();
    return this.budgetService.getBudgetDetails(user.id, m, y);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get budget and spending trends for the last N months' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTrends(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    const lim = limit ? parseInt(limit, 10) : 6;
    return this.budgetService.getBudgetTrends(user.id, lim);
  }

  @Put()
  @ApiOperation({ summary: 'Update or create a budget allocation entry' })
  async updateBudgetEntry(
    @CurrentUser() user: any,
    @Body() dto: UpdateBudgetEntryDto,
  ) {
    return this.budgetService.updateBudgetEntry(user.id, dto);
  }
}
