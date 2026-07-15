import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [PrismaModule],
  controllers: [TransactionsController, SubscriptionsController],
  providers: [TransactionsService, SubscriptionsService],
  exports: [TransactionsService, SubscriptionsService],
})
export class LedgerModule {}
