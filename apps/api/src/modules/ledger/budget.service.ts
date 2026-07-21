import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateBudgetEntryDto } from './dto/update-budget-entry.dto';
import { CategoriesService } from './categories.service';

const CONVERSION_RATES: Record<string, number> = {
  IDR: 1,
  USD: 16000,
  EUR: 17500,
  SGD: 12000,
  JPY: 100,
};

export function convertToIdr(amount: number, currency: string): number {
  const rate = CONVERSION_RATES[currency.toUpperCase()] ?? 1;
  return amount * rate;
}

@Injectable()
export class BudgetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async getBudgetSummary(userId: string, month: number, year: number) {
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // ponytail: Total Income all time up to M/Y (converted to base IDR)
    const incomeTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: 'INCOME',
        deletedAt: null,
        date: { lte: endOfMonth },
      },
      include: {
        account: true,
      },
    });
    const totalIncome = incomeTransactions.reduce((sum, t) => {
      return sum + convertToIdr(t.amount, t.account.currency);
    }, 0);

    // Total Assigned all time
    const assignedAgg = await this.prisma.budgetEntry.aggregate({
      where: {
        userId,
      },
      _sum: { assigned: true },
    });
    const totalAssignedValue = assignedAgg._sum.assigned ?? 0;

    const readyToAssign = totalIncome - totalAssignedValue;

    const ageOfMoney = await this.calculateAgeOfMoney(userId);
    const daysOfBuffering = await this.calculateDaysOfBuffering(userId);

    return {
      readyToAssign,
      totalIncome,
      totalAssigned: totalAssignedValue,
      ageOfMoney,
      daysOfBuffering,
    };
  }

  async getBudgetDetails(userId: string, month: number, year: number) {
    // Ensure user has default categories first
    await this.categoriesService.ensureDefaultCategories(userId);

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Fetch all category groups and categories
    const groups = await this.prisma.categoryGroup.findMany({
      where: { userId, deletedAt: null },
      include: {
        categories: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Fetch all budget entries for this month
    const thisMonthEntries = await this.prisma.budgetEntry.findMany({
      where: { userId, month, year },
    });

    // Fetch all budget entries up to this month (for cumulative assigned)
    const cumulativeEntries = await this.prisma.budgetEntry.findMany({
      where: {
        userId,
        OR: [
          { year: { lt: year } },
          { year, month: { lte: month } },
        ],
      },
    });

    // Fetch all transactions up to this month (for cumulative activity)
    const cumulativeTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        date: { lte: endOfMonth },
      },
      include: {
        account: true,
      },
    });

    // Process summary
    const summary = await this.getBudgetSummary(userId, month, year);

    // Map categories with assigned, activity, and available (rollover)
    const mappedGroups = groups.map((group) => {
      const mappedCategories = group.categories.map((category) => {
        const thisMonthEntry = thisMonthEntries.find((e) => e.categoryId === category.id);
        const assignedThisMonth = thisMonthEntry?.assigned ?? 0;

        // Calculate cumulative assigned for this category
        const catCumulativeAssigned = cumulativeEntries
          .filter((e) => e.categoryId === category.id)
          .reduce((sum, e) => sum + e.assigned, 0);

        // Calculate cumulative activity for this category
        const catCumulativeActivity = cumulativeTransactions
          .filter((t) => t.categoryId === category.id)
          .reduce((sum, t) => {
            const amtIdr = convertToIdr(t.amount, t.account.currency);
            if (t.type === 'EXPENSE') return sum - amtIdr;
            if (t.type === 'INCOME') return sum + amtIdr;
            return sum; // Transfers do not affect budget category balance
          }, 0);

        // Calculate activity in the CURRENT month specifically
        const activityThisMonth = cumulativeTransactions
          .filter((t) => t.categoryId === category.id && t.date >= startOfMonth && t.date <= endOfMonth)
          .reduce((sum, t) => {
            const amtIdr = convertToIdr(t.amount, t.account.currency);
            if (t.type === 'EXPENSE') return sum - amtIdr;
            if (t.type === 'INCOME') return sum + amtIdr;
            return sum;
          }, 0);

        // available = cumulative assigned + cumulative activity
        const available = catCumulativeAssigned + catCumulativeActivity;

        return {
          ...category,
          assigned: assignedThisMonth,
          activity: activityThisMonth,
          available,
        };
      });

      return {
        ...group,
        categories: mappedCategories,
      };
    });

    return {
      summary,
      groups: mappedGroups,
    };
  }

  async updateBudgetEntry(userId: string, dto: UpdateBudgetEntryDto) {
    // Check if category exists
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, userId, deletedAt: null },
    });
    if (!category) {
      throw new NotFoundException(`Category not found`);
    }

    return this.prisma.budgetEntry.upsert({
      where: {
        categoryId_month_year: {
          categoryId: dto.categoryId,
          month: dto.month,
          year: dto.year,
        },
      },
      update: {
        assigned: dto.assigned,
      },
      create: {
        categoryId: dto.categoryId,
        month: dto.month,
        year: dto.year,
        assigned: dto.assigned,
        userId,
      },
    });
  }

  async getBudgetTrends(userId: string, limit = 6) {
    const trends = [];
    const now = new Date();
    
    const accounts = await this.prisma.account.findMany({
      where: { userId, deletedAt: null },
    });
    const currentTotalBalance = accounts.reduce((sum, acc) => sum + convertToIdr(acc.balance, acc.currency), 0);

    const allTransactions = await this.prisma.transaction.findMany({
      where: { userId, deletedAt: null },
      include: { account: true },
      orderBy: { date: 'asc' },
    });

    const allBudgetEntries = await this.prisma.budgetEntry.findMany({
      where: { userId },
    });

    for (let i = limit - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      
      const startOfMonth = new Date(y, m - 1, 1);
      const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);

      const monthIncome = allTransactions
        .filter((t) => t.type === 'INCOME' && t.date >= startOfMonth && t.date <= endOfMonth)
        .reduce((sum, t) => sum + convertToIdr(t.amount, t.account.currency), 0);

      const monthExpense = allTransactions
        .filter((t) => t.type === 'EXPENSE' && t.date >= startOfMonth && t.date <= endOfMonth)
        .reduce((sum, t) => sum + convertToIdr(t.amount, t.account.currency), 0);

      const monthAssigned = allBudgetEntries
        .filter((e) => e.month === m && e.year === y)
        .reduce((sum, e) => sum + e.assigned, 0);

      const netWorthAfter = allTransactions
        .filter((t) => t.date > endOfMonth)
        .reduce((sum, t) => {
          const amtIdr = convertToIdr(t.amount, t.account.currency);
          if (t.type === 'INCOME') return sum + amtIdr;
          if (t.type === 'EXPENSE') return sum - amtIdr;
          return sum;
        }, 0);

      const netWorth = currentTotalBalance - netWorthAfter;
      const monthLabel = d.toLocaleString('id-ID', { month: 'short' }) + ' ' + (y % 100);

      trends.push({
        month: monthLabel,
        rawMonth: `${y}-${String(m).padStart(2, '0')}`,
        income: monthIncome,
        expense: monthExpense,
        assigned: monthAssigned,
        netWorth,
      });
    }

    return trends;
  }

  async calculateAgeOfMoney(userId: string): Promise<number> {
    // 1. Fetch all INCOME and EXPENSE transactions (exclude TRANSFER)
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        deletedAt: null,
        type: { in: ['INCOME', 'EXPENSE'] },
      },
      include: { account: true },
      orderBy: { date: 'asc' },
    });

    const inflows = transactions.filter(t => t.type === 'INCOME');
    const outflows = transactions.filter(t => t.type === 'EXPENSE');

    if (inflows.length === 0 || outflows.length === 0) {
      return 0; // Not enough data
    }

    // Inflow queue: { date: Date, amount: number, remaining: number }
    const queue = inflows.map(inf => ({
      date: inf.date,
      amount: convertToIdr(inf.amount, inf.account.currency),
      remaining: convertToIdr(inf.amount, inf.account.currency),
    }));

    let lastInflowDate: Date | null = null;
    let lastExpenseDate: Date | null = null;

    for (const exp of outflows) {
      let expenseAmount = convertToIdr(exp.amount, exp.account.currency);

      while (expenseAmount > 0 && queue.length > 0) {
        const inflow = queue[0];
        if (inflow.remaining >= expenseAmount) {
          inflow.remaining -= expenseAmount;
          expenseAmount = 0;
          lastInflowDate = inflow.date;
          lastExpenseDate = exp.date;
        } else {
          expenseAmount -= inflow.remaining;
          queue.shift(); // fully consumed
          lastInflowDate = inflow.date;
          lastExpenseDate = exp.date;
        }
      }
    }

    if (!lastInflowDate || !lastExpenseDate) {
      return 0;
    }

    // Difference in days
    const diffTime = lastExpenseDate.getTime() - lastInflowDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  async calculateDaysOfBuffering(userId: string): Promise<number> {
    // 1. Get current total balance across all active accounts (converted to IDR)
    const accounts = await this.prisma.account.findMany({
      where: { userId, deletedAt: null },
    });
    const totalBalance = accounts.reduce((sum, a) => sum + convertToIdr(a.balance, a.currency), 0);

    if (totalBalance <= 0) return 0;

    // 2. Get first transaction date to calculate daily average outflow
    const firstTx = await this.prisma.transaction.findFirst({
      where: { userId, deletedAt: null },
      orderBy: { date: 'asc' },
    });

    if (!firstTx) return 0;

    const earliestDate = firstTx.date;
    const now = new Date();
    const diffDays = Math.max(15, Math.ceil((now.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)));

    // 3. Sum of all expenses (converted to IDR)
    const expenseTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        deletedAt: null,
      },
      include: { account: true },
    });
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + convertToIdr(t.amount, t.account.currency), 0);

    if (totalExpenses === 0) return 999; // infinite buffer if no expenses

    const averageDailyOutflow = totalExpenses / diffDays;
    if (averageDailyOutflow === 0) return 999;

    const dob = Math.ceil(totalBalance / averageDailyOutflow);
    return Math.min(999, Math.max(0, dob));
  }
}
