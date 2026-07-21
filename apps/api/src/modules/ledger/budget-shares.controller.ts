import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BudgetSharesService } from './budget-shares.service';
import { CreateBudgetShareDto } from './dto/create-budget-share.dto';

@Controller('v1/budget-shares')
@UseGuards(JwtAuthGuard)
export class BudgetSharesController {
  constructor(private readonly budgetSharesService: BudgetSharesService) {}

  @Post()
  async create(@Request() req: any, @Body() dto: CreateBudgetShareDto) {
    return this.budgetSharesService.create(req.user.id, dto);
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.budgetSharesService.findAll(req.user.id);
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.budgetSharesService.remove(req.user.id, id);
  }
}
