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
import { RecurringTransactionsService } from './recurring-transactions.service';
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto';
import { UpdateRecurringTransactionDto } from './dto/update-recurring-transaction.dto';
import { BudgetShareGuard } from './budget-share.guard';

@ApiTags('recurring-transactions')
@ApiBearerAuth()
@Controller('v1/recurring-transactions')
@UseGuards(JwtAuthGuard, BudgetShareGuard)
export class RecurringTransactionsController {
  constructor(
    private readonly recurringTransactionsService: RecurringTransactionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new recurring transaction schedule' })
  async create(
    @CurrentUser() user: any,
    @Body() createDto: CreateRecurringTransactionDto,
  ) {
    return this.recurringTransactionsService.create(user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active recurring transaction schedules' })
  async findAll(@CurrentUser() user: any) {
    return this.recurringTransactionsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get recurring transaction details by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.recurringTransactionsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a recurring transaction schedule' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateRecurringTransactionDto,
  ) {
    return this.recurringTransactionsService.update(user.id, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a recurring transaction schedule' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.recurringTransactionsService.remove(user.id, id);
  }
}
