'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import {
  useAuthControllerMe,
  useAuthControllerLogout,
  useTransactionsControllerFindAll,
  useTransactionsControllerCreate,
  useTransactionsControllerUpdate,
  useTransactionsControllerRemove,
  useSubscriptionsControllerFindAll,
  useSubscriptionsControllerCreate,
  useSubscriptionsControllerUpdate,
  useSubscriptionsControllerRemove,
} from '@atlas/api-client';
import { useAuthStore } from '../../store/useAuthStore';
import { WorkspaceHeader } from './components/workspace-header';
import { Badge } from '@atlas/ui/components/badge';
import { Card } from '@atlas/ui/components/card';
import { Button } from '@atlas/ui/components/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@atlas/ui/components/tooltip';
import { Input } from '@atlas/ui/components/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@atlas/ui/components/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@atlas/ui/components/dialog';
import {
  Plus,
  Trash,
  PencilSimple,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  CalendarBlank,
  Coins,
  CreditCard,
  Circle,
} from '@phosphor-icons/react';

export const dynamic = 'force-dynamic';

const PREDEFINED_CATEGORIES = {
  EXPENSE: ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Housing', 'Travel', 'Others'],
  INCOME: ['Salary', 'Freelance', 'Investment', 'Gift', 'Others'],
};

export function LedgerDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Active filter states
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<any | null>(null);

  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionToEdit, setSubscriptionToEdit] = useState<any | null>(null);

  // Sync mount status
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Current User Profile
  const { data: meData, isLoading: isMeLoading } = useAuthControllerMe({
    query: {
      retry: false,
      enabled: true,
    },
  });

  // Sync backend session into Zustand store
  useEffect(() => {
    if (!isMeLoading) {
      if ((meData as any)?.success && (meData as any)?.data) {
        setUser((meData as any).data);
      } else {
        setUser(null);
        router.push('/login');
      }
      setIsLoading(false);
    }
  }, [meData, isMeLoading, setUser, router]);

  // Fetch Transactions and Subscriptions
  const { data: transactionsData } = useTransactionsControllerFindAll({
    type: transactionTypeFilter === 'ALL' ? undefined : transactionTypeFilter,
    category: categoryFilter === 'ALL' ? undefined : categoryFilter,
    search: searchQuery || undefined,
  });

  const { data: subscriptionsData } = useSubscriptionsControllerFindAll({});

  const transactions = (transactionsData as any)?.data || [];
  const subscriptions = (subscriptionsData as any)?.data || [];

  // Mutations
  const createTransactionMutation = useTransactionsControllerCreate();
  const updateTransactionMutation = useTransactionsControllerUpdate();
  const removeTransactionMutation = useTransactionsControllerRemove();

  const createSubscriptionMutation = useSubscriptionsControllerCreate();
  const updateSubscriptionMutation = useSubscriptionsControllerUpdate();
  const removeSubscriptionMutation = useSubscriptionsControllerRemove();

  const logoutMutation = useAuthControllerLogout();

  // Forms management
  const transactionForm = useForm({
    defaultValues: {
      type: 'EXPENSE' as 'EXPENSE' | 'INCOME',
      amount: '',
      title: '',
      description: '',
      category: 'Food',
      date: new Date().toISOString().split('T')[0],
    },
    onSubmit: async ({ value }) => {
      try {
        const amountNum = parseFloat(value.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
          alert('Please enter a valid amount');
          return;
        }

        const payload = {
          type: value.type,
          amount: amountNum,
          title: value.title,
          description: value.description || undefined,
          category: value.category,
          date: new Date(value.date as string).toISOString(),
        };

        if (transactionToEdit) {
          await updateTransactionMutation.mutateAsync({
            id: transactionToEdit.id,
            data: payload,
          });
        } else {
          await createTransactionMutation.mutateAsync({
            data: payload,
          });
        }

        queryClient.invalidateQueries({ queryKey: ['/v1/transactions'] });
        setIsTransactionModalOpen(false);
        resetTransactionForm();
      } catch {
        alert('Failed to save transaction');
      }
    },
  });

  const subscriptionForm = useForm({
    defaultValues: {
      name: '',
      cost: '',
      billingCycle: 'MONTHLY' as 'WEEKLY' | 'MONTHLY' | 'YEARLY',
      startDate: new Date().toISOString().split('T')[0],
      category: 'Entertainment',
      status: 'ACTIVE' as 'ACTIVE' | 'PAUSED' | 'CANCELLED',
    },
    onSubmit: async ({ value }) => {
      try {
        const costNum = parseFloat(value.cost);
        if (isNaN(costNum) || costNum <= 0) {
          alert('Please enter a valid cost');
          return;
        }

        const payload = {
          name: value.name,
          cost: costNum,
          billingCycle: value.billingCycle,
          startDate: new Date(value.startDate as string).toISOString(),
          category: value.category || undefined,
          status: value.status,
        };

        if (subscriptionToEdit) {
          await updateSubscriptionMutation.mutateAsync({
            id: subscriptionToEdit.id,
            data: payload,
          });
        } else {
          await createSubscriptionMutation.mutateAsync({
            data: payload,
          });
        }

        queryClient.invalidateQueries({ queryKey: ['/v1/subscriptions'] });
        setIsSubscriptionModalOpen(false);
        resetSubscriptionForm();
      } catch {
        alert('Failed to save subscription');
      }
    },
  });

  const resetTransactionForm = () => {
    setTransactionToEdit(null);
    transactionForm.reset();
  };

  const resetSubscriptionForm = () => {
    setSubscriptionToEdit(null);
    subscriptionForm.reset();
  };

  const handleEditTransaction = (tx: any) => {
    setTransactionToEdit(tx);
    transactionForm.setFieldValue('type', tx.type);
    transactionForm.setFieldValue('amount', tx.amount.toString());
    transactionForm.setFieldValue('title', tx.title);
    transactionForm.setFieldValue('description', tx.description || '');
    transactionForm.setFieldValue('category', tx.category);
    transactionForm.setFieldValue('date', new Date(tx.date).toISOString().split('T')[0]);
    setIsTransactionModalOpen(true);
  };

  const handleEditSubscription = (sub: any) => {
    setSubscriptionToEdit(sub);
    subscriptionForm.setFieldValue('name', sub.name);
    subscriptionForm.setFieldValue('cost', sub.cost.toString());
    subscriptionForm.setFieldValue('billingCycle', sub.billingCycle);
    subscriptionForm.setFieldValue('startDate', new Date(sub.startDate).toISOString().split('T')[0]);
    subscriptionForm.setFieldValue('category', sub.category || 'Entertainment');
    subscriptionForm.setFieldValue('status', sub.status);
    setIsSubscriptionModalOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await removeTransactionMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ['/v1/transactions'] });
      } catch {
        alert('Failed to delete transaction');
      }
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (confirm('Are you sure you want to cancel/delete this subscription?')) {
      try {
        await removeSubscriptionMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ['/v1/subscriptions'] });
      } catch {
        alert('Failed to delete subscription');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      logout();
      router.push('/login');
    } catch {
      logout();
      router.push('/login');
    }
  };

  // Calculations
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTransactions = transactions.filter((t: any) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalIncome = monthlyTransactions
    .filter((t: any) => t.type === 'INCOME')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const totalExpense = monthlyTransactions
    .filter((t: any) => t.type === 'EXPENSE')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const netCashFlow = totalIncome - totalExpense;

  // Subscription calculation (convert all active subscriptions to monthly cost equivalent)
  const calculateMonthlySubscriptions = () => {
    return subscriptions
      .filter((sub: any) => sub.status === 'ACTIVE')
      .reduce((sum: number, sub: any) => {
        if (sub.billingCycle === 'WEEKLY') return sum + sub.cost * 4.33;
        if (sub.billingCycle === 'YEARLY') return sum + sub.cost / 12;
        return sum + sub.cost;
      }, 0);
  };
  const totalMonthlySubscriptions = calculateMonthlySubscriptions();

  // Helper to format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  // Group expenses by category for visualization
  const getCategoryBreakdown = () => {
    const breakdown: Record<string, number> = {};
    monthlyTransactions
      .filter((t: any) => t.type === 'EXPENSE')
      .forEach((t: any) => {
        breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
      });
    return Object.entries(breakdown)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const categoryBreakdown = getCategoryBreakdown();
  const totalCategoryExpenses = categoryBreakdown.reduce((sum, item) => sum + item.amount, 0);

  // Calculate next renewal date
  const getNextRenewalDate = (startDateStr: string, cycle: string) => {
    const start = new Date(startDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let renewal = new Date(start);
    while (renewal < today) {
      if (cycle === 'WEEKLY') {
        renewal.setDate(renewal.getDate() + 7);
      } else if (cycle === 'YEARLY') {
        renewal.setFullYear(renewal.getFullYear() + 1);
      } else {
        // default MONTHLY
        renewal.setMonth(renewal.getMonth() + 1);
      }
    }
    return renewal;
  };

  // Get renewal warning level / label
  const getRenewalStatus = (renewalDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = renewalDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: 'Renewing Today', color: 'bg-brand-red-bg text-brand-red-text border-[#b3261e]/20' };
    if (diffDays === 1) return { label: 'Renewing Tomorrow', color: 'bg-brand-yellow-bg text-brand-yellow-text border-[#956400]/20' };
    if (diffDays <= 7) return { label: `Renewing in ${diffDays} days`, color: 'bg-[#fff8e1] text-[#b78103] border-none' };
    return { label: `Renewing in ${diffDays} days`, color: 'bg-[#edf7ed] text-[#1e4620] border-none' };
  };

  if (isLoading || isMeLoading || !user) {
    return (
      <div className="min-h-[60dvh] flex flex-col items-center justify-center font-mono text-xs text-[#787774] space-y-4 select-none">
        <Clock className="w-6 h-6 animate-spin text-[#111111]" />
        <span>Syncing Ledger session...</span>
      </div>
    );
  }

  // Layout Design Read: "monospace-editorial minimalist language, sharp corners, warm pastel indicators"
  return (
    <div className="min-h-[100dvh] bg-brand-canvas py-8 px-4 md:px-12 select-none">
      <div className="max-w-8xl mx-auto space-y-8">
        
        {/* Monospace Workspace Header */}
        <WorkspaceHeader user={user} onLogout={handleLogout} />

        {/* Bento Row 1: Unified Metrics Board */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Card 1: Monthly Income */}
          <Card className="border-brand-border bg-white rounded-none p-5 shadow-none space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#787774] flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-[#1e4620]" />
              Income (This Month)
            </span>
            <div className="font-serif text-3xl font-semibold text-[#111111] tracking-tight">
              {formatCurrency(totalIncome)}
            </div>
            <p className="text-[9px] text-[#787774]/70 font-mono">
              Net balance cash inflows logged
            </p>
          </Card>

          {/* Card 2: Monthly Expenses */}
          <Card className="border-brand-border bg-white rounded-none p-5 shadow-none space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#787774] flex items-center gap-1.5">
              <ArrowDownLeft className="w-3.5 h-3.5 text-[#5f2120]" />
              Expenses (This Month)
            </span>
            <div className="font-serif text-3xl font-semibold text-[#111111] tracking-tight">
              {formatCurrency(totalExpense)}
            </div>
            <p className="text-[9px] text-[#787774]/70 font-mono">
              Net balance cash outflows logged
            </p>
          </Card>

          {/* Card 3: Net Cashflow */}
          <Card className="border-brand-border bg-white rounded-none p-5 shadow-none space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#787774] flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-[#111111]" />
              Net Flow / Margin
            </span>
            <div className={`font-serif text-3xl font-semibold tracking-tight ${
              netCashFlow >= 0 ? 'text-[#1e4620]' : 'text-[#5f2120]'
            }`}>
              {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded-none font-semibold ${
                netCashFlow >= 0 ? 'bg-[#edf7ed] text-[#1e4620]' : 'bg-[#fdeded] text-[#5f2120]'
              }`}>
                {netCashFlow >= 0 ? 'Surplus' : 'Deficit'}
              </span>
            </div>
          </Card>

          {/* Card 4: Subscription Commitments */}
          <Card className="border-brand-border bg-white rounded-none p-5 shadow-none space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#787774] flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#111111]" />
              Active Subscriptions
            </span>
            <div className="font-serif text-3xl font-semibold text-[#111111] tracking-tight">
              {formatCurrency(totalMonthlySubscriptions)}
              <span className="text-[10px] text-[#787774] font-mono font-normal"> /mo</span>
            </div>
            <p className="text-[9px] text-[#787774]/70 font-mono">
              Committed recurring cost base
            </p>
          </Card>
        </div>

        {/* Bento Row 2: Charts, Actions (Left) & Ledger Records (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Visual Analytics & Add Actions (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Action Card */}
            <Card className="border-brand-border bg-white rounded-none p-5 shadow-none space-y-4">
              <h2 className="text-xs font-mono text-[#787774] uppercase tracking-wider">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => {
                    resetTransactionForm();
                    setIsTransactionModalOpen(true);
                  }}
                  className="rounded-none bg-[#111111] text-white hover:bg-[#111111]/90 flex items-center justify-center gap-1.5 h-10 text-[10px] font-mono uppercase tracking-tight"
                >
                  <Plus className="w-4 h-4" />
                  Log Transaction
                </Button>
                <Button
                  onClick={() => {
                    resetSubscriptionForm();
                    setIsSubscriptionModalOpen(true);
                  }}
                  variant="outline"
                  className="rounded-none border-brand-border hover:border-[#111111]/30 flex items-center justify-center gap-1.5 h-10 text-[10px] font-mono uppercase tracking-tight"
                >
                  <Plus className="w-4 h-4" />
                  Add Subscription
                </Button>
              </div>
            </Card>

            {/* Category Breakdown list */}
            <Card className="border-brand-border bg-white rounded-none p-5 shadow-none space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono text-[#787774] uppercase tracking-wider">
                  Category Outflows
                </h2>
                <Badge variant="outline" className="font-mono text-[9px] px-2 py-0.5">
                  {categoryBreakdown.length} Categories
                </Badge>
              </div>

              {categoryBreakdown.length === 0 ? (
                <div className="py-6 text-center text-[#787774] text-[10px] font-mono bg-brand-canvas/30 border border-dashed border-brand-border">
                  No expense records logged this month
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {categoryBreakdown.map((item) => {
                    const pct = totalCategoryExpenses > 0 ? (item.amount / totalCategoryExpenses) * 100 : 0;
                    return (
                      <div key={item.name} className="space-y-1 text-[11px]">
                        <div className="flex justify-between items-center text-[11px] font-mono">
                          <span className="flex items-center gap-2">
                            <Circle className="w-2 h-2 text-[#111111] fill-current" />
                            {item.name}
                          </span>
                          <div className="space-x-1.5">
                            <span className="font-semibold text-[#111111]">{formatCurrency(item.amount)}</span>
                            <span className="text-[#787774]/70">({pct.toFixed(0)}%)</span>
                          </div>
                        </div>
                        <div className="h-1 w-full bg-[#111111]/5 rounded-none overflow-hidden">
                          <div
                            className="h-full bg-[#111111]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Ledger Timelines & Records (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Subscriptions Timeline Section */}
            <Card className="border-brand-border bg-white rounded-none p-5 shadow-none space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono text-[#787774] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#111111]" />
                  Subscription Renewal Timeline
                </h2>
                <Badge variant="outline" className="font-mono text-[9px] px-2 py-0.5">
                  {subscriptions.filter((s: any) => s.status === 'ACTIVE').length} Active
                </Badge>
              </div>

              {subscriptions.length === 0 ? (
                <div className="py-8 text-center text-[#787774] text-[10px] font-mono bg-brand-canvas/30 border border-dashed border-brand-border">
                  No subscription records configured
                </div>
              ) : (
                <div className="border border-brand-border divide-y divide-brand-border font-mono text-xs">
                  {subscriptions.map((sub: any) => {
                    const renewalDate = getNextRenewalDate(sub.startDate, sub.billingCycle);
                    const renewalStatus = getRenewalStatus(renewalDate);
                    return (
                      <div
                        key={sub.id}
                        className={`flex items-center justify-between p-3 transition-colors ${
                          sub.status !== 'ACTIVE' ? 'bg-[#111111]/3 opacity-60' : 'bg-white hover:bg-[#111111]/2'
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[#111111] truncate">{sub.name}</span>
                            <Badge
                              variant="outline"
                              className={`text-[8px] px-1.5 py-0 uppercase shrink-0 font-mono ${
                                sub.status === 'ACTIVE'
                                  ? 'bg-[#edf7ed] text-[#1e4620] border-[#1e4620]/20'
                                  : 'bg-brand-red-bg text-brand-red-text border-[#b3261e]/20'
                              }`}
                            >
                              {sub.status}
                            </Badge>
                            {sub.category && (
                              <span className="text-[9px] text-[#787774]/70 px-1 py-0.5 uppercase border border-brand-border bg-[#FBFBFA]">
                                #{sub.category}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2.5 text-[10px] text-[#787774]">
                            <span className="font-semibold text-[#111111]">{formatCurrency(sub.cost)}</span>
                            <span>·</span>
                            <span>{sub.billingCycle.toLowerCase()}</span>
                            {sub.status === 'ACTIVE' && (
                              <>
                                <span>·</span>
                                <span className="font-mono text-[9px]">{renewalStatus.label}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Subscription Actions */}
                        <div className="flex items-center gap-0.5 shrink-0 ml-4">
                          <Tooltip>
                            <TooltipTrigger render={
                              <Button
                                onClick={() => handleEditSubscription(sub)}
                                variant="ghost"
                                size="icon-xs"
                                className="size-7"
                              >
                                <PencilSimple className="w-3.5 h-3.5 text-[#787774]" />
                              </Button>
                            } />
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger render={
                              <Button
                                onClick={() => handleDeleteSubscription(sub.id)}
                                variant="ghost"
                                size="icon-xs"
                                className="size-7 hover:bg-brand-red-bg hover:text-brand-red-text"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </Button>
                            } />
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Transactions Ledger records */}
            <Card className="border-brand-border bg-white rounded-none p-5 shadow-none space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono text-[#787774] uppercase tracking-wider">
                  Transaction Ledger
                </h2>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Search ledger..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-7 px-2 border border-brand-border rounded-none bg-white text-xs font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111]/30 max-w-40"
                  />
                  <Badge variant="outline" className="font-mono text-[9px] px-2 py-0.5">
                    {transactions.length} Records
                  </Badge>
                </div>
              </div>

              {/* Transactions Type Filters */}
              <div className="flex items-center gap-1.5 border-b border-brand-border pb-2.5 font-mono text-[10px]">
                <span
                  onClick={() => setTransactionTypeFilter('ALL')}
                  className={`px-2.5 py-1 border cursor-pointer hover:border-[#111111]/30 ${
                    transactionTypeFilter === 'ALL'
                      ? 'border-[#111111] bg-[#111111] text-white font-semibold'
                      : 'border-brand-border bg-white text-[#787774]'
                  }`}
                >
                  All
                </span>
                <span
                  onClick={() => setTransactionTypeFilter('INCOME')}
                  className={`px-2.5 py-1 border cursor-pointer hover:border-[#111111]/30 ${
                    transactionTypeFilter === 'INCOME'
                      ? 'border-[#1e4620] bg-[#edf7ed] text-[#1e4620] font-semibold'
                      : 'border-brand-border bg-white text-[#787774]'
                  }`}
                >
                  Incomes
                </span>
                <span
                  onClick={() => setTransactionTypeFilter('EXPENSE')}
                  className={`px-2.5 py-1 border cursor-pointer hover:border-[#111111]/30 ${
                    transactionTypeFilter === 'EXPENSE'
                      ? 'border-[#5f2120] bg-[#fdeded] text-[#5f2120] font-semibold'
                      : 'border-brand-border bg-white text-[#787774]'
                  }`}
                >
                  Expenses
                </span>
              </div>

              {transactions.length === 0 ? (
                <div className="py-12 text-center text-[#787774] text-[10px] font-mono bg-brand-canvas/30 border border-dashed border-brand-border">
                  No transaction records matched the current filters
                </div>
              ) : (
                <div className="border border-brand-border divide-y divide-brand-border font-mono text-xs">
                  {transactions.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-white hover:bg-[#111111]/2 transition-colors"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-semibold text-[#111111] truncate">{tx.title}</span>
                          <Badge
                            variant="outline"
                            className={`text-[8px] px-1.5 py-0 uppercase shrink-0 font-mono border-none ${
                              tx.type === 'INCOME' ? 'bg-[#edf7ed] text-[#1e4620]' : 'bg-[#fdeded] text-[#5f2120]'
                            }`}
                          >
                            {tx.type.toLowerCase()}
                          </Badge>
                          <span className="text-[9px] text-[#787774]/70 px-1 py-0.5 uppercase border border-brand-border bg-[#FBFBFA]">
                            #{tx.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5 text-[10px] text-[#787774]/80">
                          <span className="flex items-center gap-1">
                            <CalendarBlank className="w-3 h-3" />
                            {new Date(tx.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          {tx.description && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-64">{tx.description}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Transaction Amount & Action buttons */}
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className={`font-semibold text-sm ${
                          tx.type === 'INCOME' ? 'text-[#1e4620]' : 'text-[#111111]'
                        }`}>
                          {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                        
                        <div className="flex items-center gap-0.5">
                          <Tooltip>
                            <TooltipTrigger render={
                              <Button
                                onClick={() => handleEditTransaction(tx)}
                                variant="ghost"
                                size="icon-xs"
                                className="size-7"
                              >
                                <PencilSimple className="w-3.5 h-3.5 text-[#787774]" />
                              </Button>
                            } />
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger render={
                              <Button
                                onClick={() => handleDeleteTransaction(tx.id)}
                                variant="ghost"
                                size="icon-xs"
                                className="size-7 hover:bg-brand-red-bg hover:text-brand-red-text"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </Button>
                            } />
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog modal for Transactions */}
      <Dialog open={isTransactionModalOpen} onOpenChange={setIsTransactionModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-brand-border rounded-none p-6 text-xs font-mono">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-medium text-[#111111]">
              {transactionToEdit ? 'Edit Transaction' : 'Log New Transaction'}
            </DialogTitle>
            <DialogDescription className="text-xs font-mono mt-1 text-[#787774]">
              Add details of your financial transaction below.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              transactionForm.handleSubmit();
            }}
            className="space-y-4 pt-4"
          >
            {/* Transaction Type */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-[#787774]">Type</label>
              <transactionForm.Field
                name="type"
                children={(field) => (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        field.handleChange('EXPENSE');
                        transactionForm.setFieldValue('category', PREDEFINED_CATEGORIES.EXPENSE[0] as any);
                      }}
                      className={`flex-1 h-9 border text-center font-semibold transition-colors ${
                        field.state.value === 'EXPENSE'
                          ? 'border-[#5f2120] bg-[#fdeded] text-[#5f2120]'
                          : 'border-brand-border bg-white text-[#787774]'
                      }`}
                    >
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        field.handleChange('INCOME');
                        transactionForm.setFieldValue('category', PREDEFINED_CATEGORIES.INCOME[0] as any);
                      }}
                      className={`flex-1 h-9 border text-center font-semibold transition-colors ${
                        field.state.value === 'INCOME'
                          ? 'border-[#1e4620] bg-[#edf7ed] text-[#1e4620]'
                          : 'border-brand-border bg-white text-[#787774]'
                      }`}
                    >
                      Income
                    </button>
                  </div>
                )}
              />
            </div>

            {/* Title / Merchant */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-[#787774]">Title / Merchant</label>
              <transactionForm.Field
                name="title"
                children={(field) => (
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Starbucks, Salary"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full h-9 px-3 border border-brand-border bg-white text-[#111111] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111]/30 font-mono"
                  />
                )}
              />
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-[#787774]">Amount (USD)</label>
              <transactionForm.Field
                name="amount"
                children={(field) => (
                  <Input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full h-9 px-3 border border-brand-border bg-white text-[#111111] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111]/30 font-mono"
                  />
                )}
              />
            </div>

            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-[#787774]">Category</label>
              <transactionForm.Field
                name="category"
                children={(field) => {
                  const type = transactionForm.getFieldValue('type');
                  const list = PREDEFINED_CATEGORIES[type];
                  return (
                    <Select
                      value={field.state.value}
                      onValueChange={(val) => field.handleChange(val || '')}
                    >
                      <SelectTrigger className="w-full h-9 border-brand-border bg-white text-[#111111] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111]/30 rounded-none font-mono text-xs">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {list.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            </div>

            {/* Date Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-[#787774]">Transaction Date</label>
              <transactionForm.Field
                name="date"
                children={(field) => (
                  <Input
                    type="date"
                    required
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full h-9 px-3 border border-brand-border bg-white text-[#111111] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111]/30 font-mono rounded-none"
                  />
                )}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-[#787774]">Description (Optional)</label>
              <transactionForm.Field
                name="description"
                children={(field) => (
                  <textarea
                    rows={2}
                    placeholder="Add extra transaction notes..."
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full p-2.5 border border-brand-border bg-white text-[#111111] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111]/30 font-mono rounded-none resize-none"
                  />
                )}
              />
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="pt-4 flex items-center justify-end gap-2 border-t border-brand-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTransactionModalOpen(false)}
                className="h-9 px-4 rounded-none font-semibold text-[10px] uppercase tracking-tight"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 rounded-none bg-[#111111] text-white hover:bg-[#111111]/90 font-semibold text-[10px] uppercase tracking-tight"
              >
                {transactionToEdit ? 'Save Changes' : 'Log Transaction'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog modal for Subscriptions */}
      <Dialog open={isSubscriptionModalOpen} onOpenChange={setIsSubscriptionModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border border-brand-border rounded-none p-6 text-xs font-mono">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-medium text-[#111111]">
              {subscriptionToEdit ? 'Edit Subscription' : 'Add Subscription'}
            </DialogTitle>
            <DialogDescription className="text-xs font-mono mt-1 text-[#787774]">
              Add recurring cost subscription configurations.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              subscriptionForm.handleSubmit();
            }}
            className="space-y-4 pt-4"
          >
            {/* Service Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-[#787774]">Service Name</label>
              <subscriptionForm.Field
                name="name"
                children={(field) => (
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Netflix, Spotify, Figma"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full h-9 px-3 border border-brand-border bg-white text-[#111111] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111]/30 font-mono"
                  />
                )}
              />
            </div>

            {/* Cost */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-[#787774]">Cost (USD)</label>
              <subscriptionForm.Field
                name="cost"
                children={(field) => (
                  <Input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full h-9 px-3 border border-brand-border bg-white text-[#111111] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111]/30 font-mono"
                  />
                )}
              />
            </div>

            {/* Billing Cycle */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-[#787774]">Billing Cycle</label>
              <subscriptionForm.Field
                name="billingCycle"
                children={(field) => (
                  <Select
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val as any)}
                  >
                    <SelectTrigger className="w-full h-9 border-brand-border bg-white text-[#111111] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111]/30 rounded-none font-mono text-xs">
                      <SelectValue placeholder="Billing Cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-[#787774]">Start / Anchor Date</label>
              <subscriptionForm.Field
                name="startDate"
                children={(field) => (
                  <Input
                    type="date"
                    required
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full h-9 px-3 border border-brand-border bg-white text-[#111111] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111]/30 font-mono rounded-none"
                  />
                )}
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-[#787774]">Category</label>
              <subscriptionForm.Field
                name="category"
                children={(field) => (
                  <Select
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val || '')}
                  >
                    <SelectTrigger className="w-full h-9 border-brand-border bg-white text-[#111111] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111111]/30 rounded-none font-mono text-xs">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Entertainment">Entertainment</SelectItem>
                      <SelectItem value="Software">Software</SelectItem>
                      <SelectItem value="Utilities">Utilities</SelectItem>
                      <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Status (ACTIVE / PAUSED / CANCELLED) */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-[#787774]">Status</label>
              <subscriptionForm.Field
                name="status"
                children={(field) => (
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <button
                      type="button"
                      onClick={() => field.handleChange('ACTIVE')}
                      className={`flex-1 h-8 border text-center font-semibold transition-colors ${
                        field.state.value === 'ACTIVE'
                          ? 'border-[#1e4620] bg-[#edf7ed] text-[#1e4620]'
                          : 'border-brand-border bg-white text-[#787774]'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => field.handleChange('PAUSED')}
                      className={`flex-1 h-8 border text-center font-semibold transition-colors ${
                        field.state.value === 'PAUSED'
                          ? 'border-[#956400] bg-[#fff8e1] text-[#956400]'
                          : 'border-brand-border bg-white text-[#787774]'
                      }`}
                    >
                      Paused
                    </button>
                    <button
                      type="button"
                      onClick={() => field.handleChange('CANCELLED')}
                      className={`flex-1 h-8 border text-center font-semibold transition-colors ${
                        field.state.value === 'CANCELLED'
                          ? 'border-[#b3261e] bg-[#fdeded] text-[#b3261e]'
                          : 'border-brand-border bg-white text-[#787774]'
                      }`}
                    >
                      Cancelled
                    </button>
                  </div>
                )}
              />
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="pt-4 flex items-center justify-end gap-2 border-t border-brand-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSubscriptionModalOpen(false)}
                className="h-9 px-4 rounded-none font-semibold text-[10px] uppercase tracking-tight"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-4 rounded-none bg-[#111111] text-white hover:bg-[#111111]/90 font-semibold text-[10px] uppercase tracking-tight"
              >
                {subscriptionToEdit ? 'Save Changes' : 'Add Subscription'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
