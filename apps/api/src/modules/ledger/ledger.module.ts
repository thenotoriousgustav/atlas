import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { RecurringTransactionsModule } from './recurring-transactions/recurring-transactions.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { BudgetModule } from './budget/budget.module';
import { BudgetSharesModule } from './budget-shares/budget-shares.module';
import { CategoriesModule } from './categories/categories.module';
import { CategoryGroupsModule } from './category-groups/category-groups.module';
import { GoalsModule } from './goals/goals.module';
import { EmailSyncModule } from './email-sync/email-sync.module';

@Module({
  imports: [
    PrismaModule,
    AccountsModule,
    TransactionsModule,
    RecurringTransactionsModule,
    SubscriptionsModule,
    BudgetModule,
    BudgetSharesModule,
    CategoriesModule,
    CategoryGroupsModule,
    GoalsModule,
    EmailSyncModule,
  ],
  exports: [
    AccountsModule,
    TransactionsModule,
    RecurringTransactionsModule,
    SubscriptionsModule,
    BudgetModule,
    BudgetSharesModule,
    CategoriesModule,
    GoalsModule,
    EmailSyncModule,
  ],
})
export class LedgerModule {}
