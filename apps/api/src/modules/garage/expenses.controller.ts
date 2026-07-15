import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@ApiTags('expenses')
@ApiBearerAuth()
@Controller('v1/expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiOperation({ summary: 'Log a new vehicle expense' })
  async create(@CurrentUser() user: any, @Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.create(user.id, createExpenseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get vehicle expense history' })
  @ApiQuery({ name: 'vehicleId', required: false })
  @ApiQuery({ name: 'category', required: false })
  async findAll(
    @CurrentUser() user: any,
    @Query('vehicleId') vehicleId?: string,
    @Query('category') category?: string,
  ) {
    return this.expensesService.findAll(user.id, vehicleId, category);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an expense record' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.expensesService.remove(user.id, id);
  }
}
