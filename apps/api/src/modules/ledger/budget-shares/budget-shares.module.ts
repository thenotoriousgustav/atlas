import { Module } from '@nestjs/common';
import { BudgetSharesController } from './budget-shares.controller';
import { BudgetSharesService } from './budget-shares.service';

@Module({
  controllers: [BudgetSharesController],
  providers: [BudgetSharesService],
  exports: [BudgetSharesService],
})
export class BudgetSharesModule {}
