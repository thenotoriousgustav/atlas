import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('v1/transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  async create(
    @CurrentUser() user: any,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(user.id, createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get transactions with optional filtering' })
  @ApiQuery({ name: 'type', required: false, enum: ['EXPENSE', 'INCOME'] })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @CurrentUser() user: any,
    @Query('type') type?: 'EXPENSE' | 'INCOME',
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.transactionsService.findAll(user.id, { type, category, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction details by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.transactionsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transaction by ID' })
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(user.id, id, updateTransactionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a transaction by ID' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.transactionsService.remove(user.id, id);
  }
}
