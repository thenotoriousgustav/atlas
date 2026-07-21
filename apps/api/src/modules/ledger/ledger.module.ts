import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { CategoryGroupsController } from './category-groups.controller';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { RecurringTransactionsController } from './recurring-transactions.controller';
import { RecurringTransactionsService } from './recurring-transactions.service';
import { BudgetSharesController } from './budget-shares.controller';
import { BudgetSharesService } from './budget-shares.service';
import { BudgetShareGuard } from './budget-share.guard';
import { EmailSyncController } from './email-sync.controller';
import { EmailSyncService } from './email-sync.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    TransactionsController,
    SubscriptionsController,
    AccountsController,
    CategoryGroupsController,
    CategoriesController,
    BudgetController,
    RecurringTransactionsController,
    BudgetSharesController,
    EmailSyncController,
  ],
  providers: [
    TransactionsService,
    SubscriptionsService,
    AccountsService,
    CategoriesService,
    BudgetService,
    RecurringTransactionsService,
    BudgetSharesService,
    BudgetShareGuard,
    EmailSyncService,
  ],
  exports: [
    TransactionsService,
    SubscriptionsService,
    AccountsService,
    CategoriesService,
    BudgetService,
    RecurringTransactionsService,
    BudgetSharesService,
    EmailSyncService,
  ],
})
export class LedgerModule {}
