'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
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
  useAccountsControllerCreate,
  useAccountsControllerFindAll,
  useAccountsControllerUpdate,
  useAccountsControllerRemove,
  useCategoryGroupsControllerFindAllGroups,
  useCategoryGroupsControllerCreateGroup,
  useCategoryGroupsControllerUpdateGroup,
  useCategoryGroupsControllerRemoveGroup,
  useCategoriesControllerCreateCategory,
  useCategoriesControllerUpdateCategory,
  useCategoriesControllerRemoveCategory,
  useBudgetControllerGetBudget,
  useBudgetControllerUpdateBudgetEntry,
  useBudgetControllerGetTrends,
  useRecurringTransactionsControllerFindAll,
  useRecurringTransactionsControllerCreate,
  useRecurringTransactionsControllerUpdate,
  useRecurringTransactionsControllerRemove,

  useEmailSyncControllerGetConfig,
  useEmailSyncControllerSaveConfig,
  useEmailSyncControllerSyncEmails,
  useEmailSyncControllerTestConnection,
} from '@atlas/api-client';
import { useAuthStore } from '../../store/useAuthStore';
import { WorkspaceHeader } from './components/workspace-header';
import { Badge } from '@atlas/ui/components/badge';
import { Card } from '@atlas/ui/components/card';
import { Button } from '@atlas/ui/components/button';
import { Alert, AlertTitle, AlertDescription } from '@atlas/ui/components/alert';
import { Tooltip, TooltipTrigger, TooltipContent } from '@atlas/ui/components/tooltip';
import { Input } from '@atlas/ui/components/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
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
  Wallet,
  CaretLeft,
  CaretRight,
  List,
  ChartBar,
  Envelope,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { useConfirm } from '@atlas/ui/hooks/use-confirm';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import * as RechartsPrimitive from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@atlas/ui/components/chart';

export const dynamic = 'force-dynamic';

export function LedgerDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { user, setUser, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [activeView, setActiveView] = useState<'budget' | 'transactions' | 'subscriptions' | 'account' | 'analytics' | 'recurring' | 'email-sync'>('budget');
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);

  // Budget Month & Year Selection
  const now = new Date();
  const [budgetMonth, setBudgetMonth] = useState(now.getMonth() + 1);
  const [budgetYear, setBudgetYear] = useState(now.getFullYear());

  // Filter query states for Ledger lists
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<any | null>(null);

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<any | null>(null);

  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionToEdit, setSubscriptionToEdit] = useState<any | null>(null);

  // Recurring Transactions Modal State
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [recurringToEdit, setRecurringToEdit] = useState<any | null>(null);
  const [recurringFormState, setRecurringFormState] = useState({
    title: '',
    amount: '',
    type: 'EXPENSE',
    frequency: 'MONTHLY',
    nextDate: new Date().toISOString().split('T')[0] as string,
    accountId: '',
    categoryId: '',
    transferAccountId: '',
  });

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<'createGroup' | 'editGroup' | 'createCategory' | 'editCategory'>('createGroup');
  const [categoryModalTargetId, setCategoryModalTargetId] = useState<string | null>(null);
  const [categoryModalParentGroupId, setCategoryModalParentGroupId] = useState<string | null>(null);
  const [categoryFormState, setCategoryFormState] = useState({
    name: '',
    targetType: 'NONE',
    targetAmount: '',
  });

  // Email Sync config state
  const [emailSyncHost, setEmailSyncHost] = useState('imap.gmail.com');
  const [emailSyncPort, setEmailSyncPort] = useState(993);
  const [emailSyncUser, setEmailSyncUser] = useState('');
  const [emailSyncPass, setEmailSyncPass] = useState('');
  const [emailSyncActive, setEmailSyncActive] = useState(false);
  const [isEditingEmailConfig, setIsEditingEmailConfig] = useState(false);

  const [syncResults, setSyncResults] = useState<any[]>([]);

  // Sync mount status
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: emailConfig, refetch: refetchEmailConfig } = useEmailSyncControllerGetConfig({
    query: {
      enabled: true,
    }
  });

  useEffect(() => {
    if (emailConfig) {
      const cfg = (emailConfig as any)?.data || emailConfig;
      if (cfg) {
        setEmailSyncHost(cfg.imapHost || 'imap.gmail.com');
        setEmailSyncPort(cfg.imapPort || 993);
        setEmailSyncUser(cfg.username || '');
        setEmailSyncPass(cfg.password || '');
        setEmailSyncActive(cfg.isActive ?? true);
      }
    }
  }, [emailConfig]);

  // Automatic Background Email Reader (Every 2 minutes)
  useEffect(() => {
    if (!emailSyncUser || !emailSyncPass || !emailSyncActive) return;

    const runAutoScan = async () => {
      try {
        const res = (await syncEmailsMutation.mutateAsync({ data: {} } as any)) as any;
        if (res && res.length > 0) {
          toast.success(`[Auto-Sync] ${res.length} transaksi baru otomatis terdeteksi dari email!`);
          queryClient.invalidateQueries({ queryKey: ['/v1/ledger/accounts'] });
          queryClient.invalidateQueries({ queryKey: ['/v1/ledger/transactions'] });
        }
      } catch (err) {
        // Silent error handling for background polling
      }
    };

    // Run background scan on mount
    runAutoScan();

    // Poll every 2 minutes
    const interval = setInterval(runAutoScan, 120000);
    return () => clearInterval(interval);
  }, [emailSyncUser, emailSyncPass, emailSyncActive]);

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

  // --- API DATA FETCHING ---
  const { data: accountsData } = useAccountsControllerFindAll({ budgetId: selectedBudgetId || undefined } as any);
  const { data: categoryGroupsData } = useCategoryGroupsControllerFindAllGroups({ budgetId: selectedBudgetId || undefined } as any);
  const { data: budgetData } = useBudgetControllerGetBudget({
    month: budgetMonth,
    year: budgetYear,
    budgetId: selectedBudgetId || undefined,
  } as any);
  const { data: transactionsData } = useTransactionsControllerFindAll({
    type: activeView === 'transactions' && transactionTypeFilter !== 'ALL' ? transactionTypeFilter : undefined,
    accountId: activeView === 'account' && activeAccountId ? activeAccountId : undefined,
    search: searchQuery || undefined,
    budgetId: selectedBudgetId || undefined,
  } as any);
  const { data: subscriptionsData } = useSubscriptionsControllerFindAll();
  const { data: trendsData } = useBudgetControllerGetTrends({ limit: 6, budgetId: selectedBudgetId || undefined } as any);
  const { data: recurringData } = useRecurringTransactionsControllerFindAll({ budgetId: selectedBudgetId || undefined } as any);

  const accounts = (accountsData as any)?.data || [];
  const categoryGroups = (categoryGroupsData as any)?.data || [];
  const budget = (budgetData as any)?.data || { summary: { readyToAssign: 0 }, groups: [] };
  const transactions = (transactionsData as any)?.data || [];
  const subscriptions = (subscriptionsData as any)?.data || [];
  const trends = (trendsData as any)?.data || [];
  const recurringList = (recurringData as any)?.data || [];

  // --- MUTATIONS ---
  const createAccountMutation = useAccountsControllerCreate();
  const updateAccountMutation = useAccountsControllerUpdate();
  const removeAccountMutation = useAccountsControllerRemove();

  const createTransactionMutation = useTransactionsControllerCreate();
  const updateTransactionMutation = useTransactionsControllerUpdate();
  const removeTransactionMutation = useTransactionsControllerRemove();

  const createSubscriptionMutation = useSubscriptionsControllerCreate();
  const updateSubscriptionMutation = useSubscriptionsControllerUpdate();
  const removeSubscriptionMutation = useSubscriptionsControllerRemove();

  const createRecurringMutation = useRecurringTransactionsControllerCreate();
  const updateRecurringMutation = useRecurringTransactionsControllerUpdate();
  const removeRecurringMutation = useRecurringTransactionsControllerRemove();

  const updateBudgetMutation = useBudgetControllerUpdateBudgetEntry();
  const createGroupMutation = useCategoryGroupsControllerCreateGroup();
  const updateGroupMutation = useCategoryGroupsControllerUpdateGroup();
  const removeGroupMutation = useCategoryGroupsControllerRemoveGroup();

  const createCategoryMutation = useCategoriesControllerCreateCategory();
  const updateCategoryMutation = useCategoriesControllerUpdateCategory();
  const removeCategoryMutation = useCategoriesControllerRemoveCategory();
  const logoutMutation = useAuthControllerLogout();

  // --- UTILITIES ---
  const formatCurrency = (val: number, currency: string = 'IDR') => {
    return new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const convertToIdr = (amount: number, currency: string): number => {
    const rate: Record<string, number> = { IDR: 1, USD: 16000, EUR: 17500, SGD: 12000, JPY: 100 };
    return amount * (rate[currency.toUpperCase()] ?? 1);
  };

  const getMonthName = (m: number) => {
    return new Date(2026, m - 1, 1).toLocaleString('id-ID', { month: 'long' });
  };

  const handlePrevMonth = () => {
    if (budgetMonth === 1) {
      setBudgetMonth(12);
      setBudgetYear((prev) => prev - 1);
    } else {
      setBudgetMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (budgetMonth === 12) {
      setBudgetMonth(1);
      setBudgetYear((prev) => prev + 1);
    } else {
      setBudgetMonth((prev) => prev + 1);
    }
  };

  // --- ACTIONS & SUBMITS ---
  const handleBudgetAssignChange = async (categoryId: string, value: string) => {
    const num = parseFloat(value.replace(/[^0-9.-]+/g, ''));
    if (isNaN(num)) return;
    try {
      await updateBudgetMutation.mutateAsync({
        data: {
          categoryId,
          month: budgetMonth,
          year: budgetYear,
          assigned: num,
        },
      });
      queryClient.invalidateQueries({ queryKey: ['/v1/budget'] });
      queryClient.invalidateQueries({ queryKey: ['/v1/accounts'] });
    } catch {
      toast.error('Failed to allocate budget.');
    }
  };

  // Account Form
  const [accountFormState, setAccountFormState] = useState({
    name: '',
    type: 'CHECKING',
    balance: '',
    currency: 'IDR',
    isOnBudget: true,
  });

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const balanceNum = parseFloat(accountFormState.balance) || 0;
      const payload: any = {
        name: accountFormState.name,
        type: accountFormState.type,
        balance: balanceNum,
        currency: accountFormState.currency,
        isOnBudget: accountFormState.isOnBudget,
      };

      if (accountToEdit) {
        await updateAccountMutation.mutateAsync({
          id: accountToEdit.id,
          data: payload,
        });
      } else {
        await createAccountMutation.mutateAsync({
          data: payload,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['/v1/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/v1/budget'] });
      queryClient.invalidateQueries({ queryKey: ['/v1/transactions'] });
      setIsAccountModalOpen(false);
      setAccountToEdit(null);
      setAccountFormState({ name: '', type: 'CHECKING', balance: '', currency: 'IDR', isOnBudget: true });
      toast.success('Account successfully saved.');
    } catch {
      toast.error('Failed to save account.');
    }
  };

  const handleEditAccount = (acc: any) => {
    setAccountToEdit(acc);
    setAccountFormState({
      name: acc.name,
      type: acc.type,
      balance: acc.balance.toString(),
      currency: acc.currency,
      isOnBudget: acc.isOnBudget,
    });
    setIsAccountModalOpen(true);
  };

  const handleDeleteAccount = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Account',
      description: 'Are you sure you want to delete this account? Money inside will be archived.',
      actionLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });
    if (isConfirmed) {
      try {
        await removeAccountMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ['/v1/accounts'] });
        queryClient.invalidateQueries({ queryKey: ['/v1/budget'] });
        setActiveView('budget');
        toast.success('Account successfully deleted.');
      } catch {
        toast.error('Failed to delete account.');
      }
    }
  };

  // Transaction Form
  const [txFormState, setTxFormState] = useState({
    type: 'EXPENSE' as 'EXPENSE' | 'INCOME' | 'TRANSFER',
    amount: '',
    title: '',
    description: '',
    accountId: '',
    categoryId: '',
    transferAccountId: '',
    date: new Date().toISOString().split('T')[0],
  });

  // ponytail: Automatically set default account if only one exists
  useEffect(() => {
    if (accounts.length > 0 && !txFormState.accountId) {
      setTxFormState((prev) => ({ ...prev, accountId: accounts[0].id }));
    }
  }, [accounts, txFormState.accountId]);

  // Set default category when groups load
  useEffect(() => {
    if (categoryGroups.length > 0 && categoryGroups[0].categories.length > 0 && !txFormState.categoryId) {
      setTxFormState((prev) => ({ ...prev, categoryId: categoryGroups[0].categories[0].id }));
    }
  }, [categoryGroups, txFormState.categoryId]);

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amountNum = parseFloat(txFormState.amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        toast.warning('Please enter a valid transaction amount.');
        return;
      }

      const payload: any = {
        type: txFormState.type,
        amount: amountNum,
        title: txFormState.title,
        description: txFormState.description || undefined,
        accountId: txFormState.accountId,
        categoryId: txFormState.type !== 'TRANSFER' && txFormState.categoryId ? txFormState.categoryId : undefined,
        transferAccountId: txFormState.type === 'TRANSFER' && txFormState.transferAccountId ? txFormState.transferAccountId : undefined,
        date: new Date(txFormState.date!).toISOString(),
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
      queryClient.invalidateQueries({ queryKey: ['/v1/budget'] });
      queryClient.invalidateQueries({ queryKey: ['/v1/accounts'] });
      setIsTransactionModalOpen(false);
      setTransactionToEdit(null);
      setTxFormState({
        type: 'EXPENSE',
        amount: '',
        title: '',
        description: '',
        accountId: accounts[0]?.id || '',
        categoryId: categoryGroups[0]?.categories[0]?.id || '',
        transferAccountId: '',
        date: new Date().toISOString().split('T')[0],
      });
      toast.success('Transaction successfully saved.');
    } catch {
      toast.error('Failed to save transaction.');
    }
  };

  const handleEditTransaction = (tx: any) => {
    setTransactionToEdit(tx);
    setTxFormState({
      type: tx.type,
      amount: tx.amount.toString(),
      title: tx.title,
      description: tx.description || '',
      accountId: tx.accountId,
      categoryId: tx.categoryId || '',
      transferAccountId: tx.transferAccountId || '',
      date: new Date(tx.date).toISOString().split('T')[0],
    });
    setIsTransactionModalOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Transaction',
      description: 'Delete this transaction? Your account balance will be adjusted.',
      actionLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });
    if (isConfirmed) {
      try {
        await removeTransactionMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ['/v1/transactions'] });
        queryClient.invalidateQueries({ queryKey: ['/v1/budget'] });
        queryClient.invalidateQueries({ queryKey: ['/v1/accounts'] });
        toast.success('Transaction successfully deleted.');
      } catch {
        toast.error('Failed to delete transaction.');
      }
    }
  };

  // Subscription Form
  const [subFormState, setSubFormState] = useState({
    name: '',
    cost: '',
    billingCycle: 'MONTHLY' as 'WEEKLY' | 'MONTHLY' | 'YEARLY',
    startDate: new Date().toISOString().split('T')[0],
    category: 'Subscriptions',
    status: 'ACTIVE' as 'ACTIVE' | 'PAUSED' | 'CANCELLED',
  });

  const handleSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const costNum = parseFloat(subFormState.cost);
      if (isNaN(costNum) || costNum <= 0) {
        toast.warning('Please enter a valid subscription value.');
        return;
      }

      const payload = {
        name: subFormState.name,
        cost: costNum,
        billingCycle: subFormState.billingCycle,
        startDate: new Date(subFormState.startDate!).toISOString(),
        category: subFormState.category || undefined,
        status: subFormState.status,
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
      setSubscriptionToEdit(null);
      setSubFormState({
        name: '',
        cost: '',
        billingCycle: 'MONTHLY',
        startDate: new Date().toISOString().split('T')[0],
        category: 'Subscriptions',
        status: 'ACTIVE',
      });
      toast.success('Subscription successfully saved.');
    } catch {
      toast.error('Failed to save subscription.');
    }
  };

  const handleEditSubscription = (sub: any) => {
    setSubscriptionToEdit(sub);
    setSubFormState({
      name: sub.name,
      cost: sub.cost.toString(),
      billingCycle: sub.billingCycle,
      startDate: new Date(sub.startDate).toISOString().split('T')[0],
      category: sub.category || 'Subscriptions',
      status: sub.status,
    });
    setIsSubscriptionModalOpen(true);
  };

  const handleDeleteSubscription = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Subscription',
      description: 'Are you sure you want to delete this subscription?',
      actionLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });
    if (isConfirmed) {
      try {
        await removeSubscriptionMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ['/v1/subscriptions'] });
        toast.success('Subscription successfully deleted.');
      } catch {
        toast.error('Failed to delete subscription.');
      }
    }
  };

  // --- Recurring Transactions Actions ---
  const handleRecurringSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amountNum = parseFloat(recurringFormState.amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        toast.warning('Please enter a valid amount.');
        return;
      }
      if (!recurringFormState.accountId) {
        toast.warning('Please select an account.');
        return;
      }

      const payload = {
        title: recurringFormState.title,
        amount: amountNum,
        type: recurringFormState.type,
        frequency: recurringFormState.frequency,
        nextDate: new Date(recurringFormState.nextDate as string).toISOString(),
        accountId: recurringFormState.accountId,
        categoryId: recurringFormState.type !== 'TRANSFER' && recurringFormState.categoryId ? recurringFormState.categoryId : undefined,
        transferAccountId: recurringFormState.type === 'TRANSFER' && recurringFormState.transferAccountId ? recurringFormState.transferAccountId : undefined,
      };

      if (recurringToEdit) {
        await updateRecurringMutation.mutateAsync({
          id: recurringToEdit.id,
          data: payload as any,
        });
      } else {
        await createRecurringMutation.mutateAsync({
          data: payload as any,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['/v1/recurring-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/v1/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/v1/accounts'] });
      setIsRecurringModalOpen(false);
      setRecurringToEdit(null);
      setRecurringFormState({
        title: '',
        amount: '',
        type: 'EXPENSE',
        frequency: 'MONTHLY',
        nextDate: new Date().toISOString().split('T')[0] as string,
        accountId: accounts[0]?.id || '',
        categoryId: '',
        transferAccountId: '',
      });
      toast.success('Recurring transaction successfully saved.');
    } catch {
      toast.error('Failed to save recurring transaction.');
    }
  };

  const handleEditRecurring = (rt: any) => {
    setRecurringToEdit(rt);
    setRecurringFormState({
      title: rt.title,
      amount: rt.amount.toString(),
      type: rt.type,
      frequency: rt.frequency,
      nextDate: new Date(rt.nextDate).toISOString().split('T')[0] as string,
      accountId: rt.accountId,
      categoryId: rt.categoryId || '',
      transferAccountId: rt.transferAccountId || '',
    });
    setIsRecurringModalOpen(true);
  };

  const handleDeleteRecurring = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Recurring Transaction',
      description: `Apakah Anda yakin ingin menghapus jadwal transaksi berulang "${name}"? Tindakan ini tidak akan menghapus transaksi sebelumnya yang sudah ter-posting secara otomatis.`,
      actionLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });

    if (isConfirmed) {
      try {
        await removeRecurringMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ['/v1/recurring-transactions'] });
        toast.success('Recurring transaction schedule successfully deleted.');
      } catch {
        toast.error('Failed to delete recurring transaction schedule.');
      }
    }
  };



  // --- Category / Group Management Actions ---
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormState.name.trim()) return;

    const targetAmountVal = categoryFormState.targetType !== 'NONE' && categoryFormState.targetAmount
      ? parseFloat(categoryFormState.targetAmount)
      : null;
    const targetTypeVal = categoryFormState.targetType !== 'NONE'
      ? categoryFormState.targetType
      : null;

    try {
      if (categoryModalMode === 'createGroup') {
        await createGroupMutation.mutateAsync({
          data: { name: categoryFormState.name }
        });
        toast.success('Category group successfully created.');
      } else if (categoryModalMode === 'editGroup') {
        await updateGroupMutation.mutateAsync({
          id: categoryModalTargetId!,
          data: { name: categoryFormState.name }
        });
        toast.success('Category group successfully changed.');
      } else if (categoryModalMode === 'createCategory') {
        await createCategoryMutation.mutateAsync({
          data: {
            name: categoryFormState.name,
            categoryGroupId: categoryModalParentGroupId!,
            targetType: targetTypeVal as any,
            targetAmount: targetAmountVal as any,
          }
        });
        toast.success('Category successfully created.');
      } else if (categoryModalMode === 'editCategory') {
        await updateCategoryMutation.mutateAsync({
          id: categoryModalTargetId!,
          data: {
            name: categoryFormState.name,
            targetType: targetTypeVal as any,
            targetAmount: targetAmountVal as any,
          }
        });
        toast.success('Category successfully changed.');
      }

      queryClient.invalidateQueries({ queryKey: ['/v1/category-groups'] });
      queryClient.invalidateQueries({ queryKey: ['/v1/budget'] });
      setIsCategoryModalOpen(false);
      setCategoryFormState({ name: '', targetType: 'NONE', targetAmount: '' });
    } catch {
      toast.error('Failed to save category changes.');
    }
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Category Group?',
      description: `Apakah Anda yakin ingin menghapus grup "${name}" beserta seluruh kategori di dalamnya?`,
      actionLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });
    if (isConfirmed) {
      try {
        await removeGroupMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ['/v1/category-groups'] });
        queryClient.invalidateQueries({ queryKey: ['/v1/budget'] });
        toast.success('Category group successfully deleted.');
      } catch {
        toast.error('Failed to delete category group.');
      }
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Category?',
      description: `Apakah Anda yakin ingin menghapus kategori "${name}"? Seluruh entri anggaran di kategori ini akan ikut terhapus.`,
      actionLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'destructive',
    });
    if (isConfirmed) {
      try {
        await removeCategoryMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: ['/v1/category-groups'] });
        queryClient.invalidateQueries({ queryKey: ['/v1/budget'] });
        toast.success('Category successfully deleted.');
      } catch {
        toast.error('Failed to delete category.');
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

  // --- CALCULATION LOGICS ---
  const activeAccount = accounts.find((acc: any) => acc.id === activeAccountId);

  // Subscriptions renewal calculations
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
        renewal.setMonth(renewal.getMonth() + 1);
      }
    }
    return renewal;
  };

  const getRenewalStatus = (renewalDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = renewalDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: 'Today', color: 'bg-[#FDEBEC] dark:bg-red-950/30 text-[#9F2F2D] dark:text-red-400' };
    if (diffDays === 1) return { label: 'Tomorrow', color: 'bg-[#FBF3DB] dark:bg-amber-950/20 text-[#956400] dark:text-amber-400' };
    if (diffDays <= 7) return { label: `${diffDays} hari lagi`, color: 'bg-[#FBF3DB] dark:bg-amber-950/20 text-[#956400] dark:text-amber-400' };
    return { label: `${diffDays} hari lagi`, color: 'bg-[#EDF3EC] dark:bg-emerald-950/20 text-[#346538] dark:text-emerald-400' };
  };

  const saveEmailConfigMutation = useEmailSyncControllerSaveConfig();
  const syncEmailsMutation = useEmailSyncControllerSyncEmails();

  const handleSaveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveEmailConfigMutation.mutateAsync({
        data: {
          imapHost: emailSyncHost,
          imapPort: emailSyncPort,
          username: emailSyncUser,
          password: emailSyncPass,
          isActive: emailSyncActive,
        }
      });
      toast.success('Email sync configuration successfully saved.');
      setIsEditingEmailConfig(false);
      refetchEmailConfig();
    } catch (err) {
      toast.error('Failed to save configuration.');
    }
  };

  const testConnectionMutation = useEmailSyncControllerTestConnection();

  const handleTestConnection = async () => {
    try {
      await saveEmailConfigMutation.mutateAsync({
        data: {
          imapHost: emailSyncHost,
          imapPort: emailSyncPort,
          username: emailSyncUser,
          password: emailSyncPass,
          isActive: emailSyncActive,
        }
      });
      toast.info('Testing connection to email server...');
      const res = (await testConnectionMutation.mutateAsync()) as any;
      if (res && res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message || 'Connection failed.');
      }
    } catch (err) {
      toast.error('Failed to test email connection.');
    }
  };

  const handleScanRealInbox = async () => {
    try {
      toast.info('Membuat koneksi IMAP & memindai Inbox Gmail Anda...');
      const res = (await syncEmailsMutation.mutateAsync({
        data: {}
      } as any)) as any;
      if (res && res.length > 0) {
        setSyncResults(res);
        toast.success(`Berhasil memindai Inbox! ${res.length} transaksi baru ditambahkan.`);
        queryClient.invalidateQueries({ queryKey: ['/v1/ledger/accounts'] });
        queryClient.invalidateQueries({ queryKey: ['/v1/ledger/transactions'] });
      } else {
        toast.info('Pindaian Inbox selesai. Tidak ada transaksi baru dari Bank Jago / Mandiri.');
      }
    } catch (err) {
      toast.error('Failed to scan Gmail Inbox.');
    }
  };



  // Calculate Net Worth / Total Balance
  const totalBalance = accounts.reduce((sum: number, acc: any) => sum + convertToIdr(acc.balance, acc.currency), 0);

  if (isLoading || isMeLoading || !user) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center font-mono text-[11px] text-[#787774] dark:text-zinc-400 space-y-4 select-none bg-[#FBFBFA] dark:bg-zinc-950">
        <Clock className="w-5 h-5 animate-spin text-[#111111] dark:text-zinc-100" />
        <span>Syncing Ledger Session...</span>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FBFBFA] dark:bg-zinc-950 py-8 px-4 md:px-12 select-none text-[#111111] dark:text-zinc-100 transition-colors">
      <div className="max-w-[1400px] w-full mx-auto space-y-8">
        
        {/* Editorial Workspace Header */}
        <WorkspaceHeader user={user} onLogout={handleLogout} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* SIDEBAR NAVIGATION & ACCOUNTS */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Core Views */}
            <div className="space-y-1">
              <h2 className="text-[10px] font-mono text-[#787774] dark:text-zinc-500 uppercase tracking-wider px-3 mb-2 font-semibold">Main Menu</h2>
              <button
                onClick={() => { setActiveView('budget'); setActiveAccountId(null); }}
                className={`w-full text-left px-3 py-2 text-xs font-mono flex items-center justify-between rounded-none transition-colors ${
                  activeView === 'budget'
                    ? 'bg-[#F3F2EE] dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 font-bold'
                    : 'text-[#787774] dark:text-zinc-400 hover:bg-[#F7F6F3] dark:hover:bg-zinc-800/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Coins className="w-4 h-4" />Budget Allocation</span>
              </button>
              <button
                onClick={() => { setActiveView('transactions'); setActiveAccountId(null); }}
                className={`w-full text-left px-3 py-2 text-xs font-mono flex items-center justify-between rounded-none transition-colors ${
                  activeView === 'transactions'
                    ? 'bg-[#F3F2EE] dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 font-bold'
                    : 'text-[#787774] dark:text-zinc-400 hover:bg-[#F7F6F3] dark:hover:bg-zinc-800/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <List className="w-4 h-4" />All Transactions</span>
              </button>
              <button
                onClick={() => { setActiveView('subscriptions'); setActiveAccountId(null); }}
                className={`w-full text-left px-3 py-2 text-xs font-mono flex items-center justify-between rounded-none transition-colors ${
                  activeView === 'subscriptions'
                    ? 'bg-[#F3F2EE] dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 font-bold'
                    : 'text-[#787774] dark:text-zinc-400 hover:bg-[#F7F6F3] dark:hover:bg-zinc-800/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />Subscription List</span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  {subscriptions.length}
                </span>
              </button>
              <button
                onClick={() => { setActiveView('analytics'); setActiveAccountId(null); }}
                className={`w-full text-left px-3 py-2 text-xs font-mono flex items-center justify-between rounded-none transition-colors ${
                  activeView === 'analytics'
                    ? 'bg-[#F3F2EE] dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 font-bold'
                    : 'text-[#787774] dark:text-zinc-400 hover:bg-[#F7F6F3] dark:hover:bg-zinc-800/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ChartBar className="w-4 h-4" />Report Analysis</span>
              </button>
              <button
                onClick={() => { setActiveView('recurring'); setActiveAccountId(null); }}
                className={`w-full text-left px-3 py-2 text-xs font-mono flex items-center justify-between rounded-none transition-colors ${
                  activeView === 'recurring'
                    ? 'bg-[#F3F2EE] dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 font-bold'
                    : 'text-[#787774] dark:text-zinc-400 hover:bg-[#F7F6F3] dark:hover:bg-zinc-800/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />Recurring Transactions</span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  {recurringList.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveView('email-sync'); setActiveAccountId(null); }}
                className={`w-full text-left px-3 py-2 text-xs font-mono flex items-center justify-between rounded-none transition-colors ${
                  activeView === 'email-sync'
                    ? 'bg-[#F3F2EE] dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 font-bold'
                    : 'text-[#787774] dark:text-zinc-400 hover:bg-[#F7F6F3] dark:hover:bg-zinc-800/50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Envelope className="w-4 h-4" />Email Sync</span>
              </button>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 my-4" />

            {/* Account List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-3">
                <h2 className="text-[10px] font-mono text-[#787774] dark:text-zinc-500 uppercase tracking-wider font-semibold">Your Account</h2>
                <button
                  onClick={() => { setAccountToEdit(null); setIsAccountModalOpen(true); }}
                  className="p-1 hover:bg-[#F3F2EE] dark:hover:bg-zinc-800 text-[#787774] dark:text-zinc-400 rounded-none transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1 font-mono text-xs">
                {accounts.length === 0 ? (
                  <div className="text-[10px] text-[#787774] dark:text-zinc-500 text-center py-4 border border-dashed border-zinc-200 dark:border-zinc-800">No accounts yet.</div>
                ) : (
                  accounts.map((acc: any) => (
                    <div
                      key={acc.id}
                      onClick={() => {
                        setActiveView('account');
                        setActiveAccountId(acc.id);
                      }}
                      className={`w-full px-3 py-2 flex items-center justify-between cursor-pointer transition-colors ${
                        activeView === 'account' && activeAccountId === acc.id
                          ? 'bg-[#F3F2EE] dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 font-bold'
                          : 'text-[#787774] dark:text-zinc-400 hover:bg-[#F7F6F3] dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      <span className="truncate pr-2 flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 shrink-0" />
                        {acc.name}
                      </span>
                      <span className="shrink-0 text-[10.5px]">
                        {formatCurrency(acc.balance, acc.currency)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 px-3 flex justify-between items-center text-[10px] font-mono text-[#787774] dark:text-zinc-500">
                <span>Total Wealth</span>
                <span className="font-semibold text-[#111111] dark:text-zinc-100">{formatCurrency(totalBalance)}</span>
              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 my-4" />

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button
                onClick={() => setIsTransactionModalOpen(true)}
                className="w-full rounded-none bg-transparent hover:bg-[#F7F6F3] dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-[#111111] dark:text-zinc-100 flex items-center justify-center gap-1.5 h-9 text-[10px] font-mono uppercase tracking-tight shadow-none font-semibold"
              >
                <Plus className="w-4 h-4" />Record Transaction</Button>
              <Button
                onClick={() => setIsSubscriptionModalOpen(true)}
                className="w-full rounded-none bg-transparent hover:bg-[#F7F6F3] dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-[#111111] dark:text-zinc-100 flex items-center justify-center gap-1.5 h-9 text-[10px] font-mono uppercase tracking-tight shadow-none font-semibold"
              >
                <Plus className="w-4 h-4" />Add Subscription</Button>
              <Button
                onClick={() => {
                  setRecurringToEdit(null);
                  setRecurringFormState({
                    title: '',
                    amount: '',
                    type: 'EXPENSE',
                    frequency: 'MONTHLY',
                    nextDate: new Date().toISOString().split('T')[0] as string,
                    accountId: accounts[0]?.id || '',
                    categoryId: '',
                    transferAccountId: '',
                  });
                  setIsRecurringModalOpen(true);
                }}
                className="w-full rounded-none bg-transparent hover:bg-[#F7F6F3] dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-[#111111] dark:text-zinc-100 flex items-center justify-center gap-1.5 h-9 text-[10px] font-mono uppercase tracking-tight shadow-none font-semibold"
              >
                <Plus className="w-4 h-4" />Recurring Transactions</Button>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* VIEW: BUDGET ALLOCATION */}
            {activeView === 'budget' && (
              <div className="space-y-6">
                
                {/* Left-Aligned Editorial Header Card */}
                <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none p-6 shadow-none flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <h1 className="font-serif text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Budget Allocation</h1>
                    </div>
                    <p className="text-xs font-mono text-[#787774] dark:text-zinc-500">Allocate every penny for your needs, bills, and savings categories.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">

                    {/* Left-Aligned Month Switcher Controls */}
                    <div className="flex items-center border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-0.5">
                      <button
                        onClick={handlePrevMonth}
                        className="p-1.5 hover:bg-white dark:hover:bg-zinc-800 transition-colors text-[#111111] dark:text-zinc-100"
                        title="Previous Month"
                      >
                        <CaretLeft className="w-4 h-4" />
                      </button>
                      <span className="font-serif text-sm font-bold tracking-tight px-3 text-left min-w-[130px] text-zinc-900 dark:text-zinc-100 select-none">
                        {getMonthName(budgetMonth)} {budgetYear}
                      </span>
                      <button
                        onClick={handleNextMonth}
                        className="p-1.5 hover:bg-white dark:hover:bg-zinc-800 transition-colors text-[#111111] dark:text-zinc-100"
                        title="Next Month"
                      >
                        <CaretRight className="w-4 h-4" />
                      </button>
                    </div>

                    <Button
                      onClick={() => {
                        setCategoryModalMode('createGroup');
                        setCategoryFormState({ name: '', targetType: 'NONE', targetAmount: '' });
                        setIsCategoryModalOpen(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="font-mono text-xs rounded-none border-zinc-200 dark:border-zinc-800 text-[#111111] dark:text-zinc-100 h-9"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />Category Group</Button>
                  </div>
                </Card>

                {/* Ready to Assign & YNAB Metrics Banners */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Age of Money */}
                  <div className="px-3.5 py-2 border font-mono text-xs flex items-center gap-2 rounded-none bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800">
                    <span className="text-[#787774] dark:text-zinc-500">Umur Uang:</span>
                    <span className="font-bold">{budget.summary?.ageOfMoney ?? 0} Hari</span>
                  </div>

                  {/* Days of Buffering */}
                  <div className="px-3.5 py-2 border font-mono text-xs flex items-center gap-2 rounded-none bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800">
                    <span className="text-[#787774] dark:text-zinc-500">Cadangan:</span>
                    <span className="font-bold">
                      {budget.summary?.daysOfBuffering === 999 ? '∞' : `${budget.summary?.daysOfBuffering ?? 0} Hari`}
                    </span>
                  </div>

                  {/* Ready to Assign Banner */}
                  <div className={`px-4 py-2 border font-mono text-xs flex items-center gap-3 rounded-none ${
                    budget.summary?.readyToAssign >= 0
                      ? 'bg-[#EDF3EC] dark:bg-emerald-950/30 text-[#346538] dark:text-emerald-400 border-[#346538]/20 dark:border-emerald-500/20'
                      : 'bg-[#FDEBEC] dark:bg-red-950/30 text-[#9F2F2D] dark:text-red-400 border-[#9F2F2D]/20 dark:border-red-500/20'
                  }`}>
                    <span>Siap Dialokasikan:</span>
                    <span className="font-bold text-sm">
                      {formatCurrency(budget.summary?.readyToAssign ?? 0)}
                    </span>
                  </div>
                </div>

                {/* YNAB Budget Table */}
                <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none p-6 shadow-none overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[#787774] dark:text-zinc-400 text-left">
                        <th className="pb-3 font-normal uppercase tracking-wider">Category</th>
                        <th className="pb-3 font-normal uppercase tracking-wider text-right w-36">Allocated</th>
                        <th className="pb-3 font-normal uppercase tracking-wider text-right w-32">Activity</th>
                        <th className="pb-3 font-normal uppercase tracking-wider text-right w-32">Available</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {budget.groups?.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-[#787774] dark:text-zinc-500 text-[10px]">Loading category list...</td>
                        </tr>
                      ) : (
                        budget.groups?.map((group: any) => (
                          <React.Fragment key={group.id}>
                            {/* Group Row */}
                            <tr className="bg-[#FBFBFA] dark:bg-zinc-900/60 group/row">
                              <td colSpan={4} className="py-2.5 px-3 font-bold uppercase tracking-wider text-[10px] text-[#787774] dark:text-zinc-400">
                                <div className="flex items-center justify-between">
                                  <span>{group.name}</span>
                                  <div className="opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center gap-1">
                                    <button
                                      title="Add Category"
                                      onClick={() => {
                                        setCategoryModalMode('createCategory');
                                        setCategoryModalParentGroupId(group.id);
                                        setCategoryFormState({ name: '', targetType: 'NONE', targetAmount: '' });
                                        setIsCategoryModalOpen(true);
                                      }}
                                      className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-[#111111] dark:text-zinc-300 rounded-none transition-colors"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      title="Edit Group Name"
                                      onClick={() => {
                                        setCategoryModalMode('editGroup');
                                        setCategoryModalTargetId(group.id);
                                        setCategoryFormState({ name: group.name, targetType: 'NONE', targetAmount: '' });
                                        setIsCategoryModalOpen(true);
                                      }}
                                      className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-[#111111] dark:text-zinc-300 rounded-none transition-colors"
                                    >
                                      <PencilSimple className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      title="Delete Category Group"
                                      onClick={() => handleDeleteGroup(group.id, group.name)}
                                      className="p-0.5 hover:bg-red-100 dark:hover:bg-red-950/30 text-zinc-600 hover:text-red-600 dark:text-zinc-400 rounded-none transition-colors"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                            {/* Categories under group */}
                            {group.categories?.map((cat: any) => (
                              <tr key={cat.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group/catrow">
                                <td className="py-2.5 pl-4 pr-3 text-xs font-normal text-zinc-800 dark:text-zinc-200">
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">{cat.name}</span>
                                      <div className="opacity-0 group-hover/catrow:opacity-100 transition-opacity flex items-center gap-1.5 shrink-0 mr-4">
                                        <button
                                          title="Edit Category & Target"
                                          onClick={() => {
                                            setCategoryModalMode('editCategory');
                                            setCategoryModalTargetId(cat.id);
                                            setCategoryFormState({
                                              name: cat.name,
                                              targetType: cat.targetType || 'NONE',
                                              targetAmount: cat.targetAmount ? cat.targetAmount.toString() : '',
                                            });
                                            setIsCategoryModalOpen(true);
                                          }}
                                          className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-none transition-colors"
                                        >
                                          <PencilSimple className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          title="Delete Category"
                                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                          className="p-0.5 hover:bg-red-100 dark:hover:bg-red-950/30 text-zinc-500 hover:text-red-600 dark:text-zinc-450 rounded-none transition-colors"
                                        >
                                          <Trash className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                    {cat.targetType && cat.targetType !== 'NONE' && (
                                      <div className="text-[9px] font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[#787774] dark:text-zinc-500">
                                          Target: {cat.targetType === 'MONTHLY_BUILDER'
                                            ? `${formatCurrency(cat.targetAmount)}/bln`
                                            : `Kumpul ${formatCurrency(cat.targetAmount)}`}
                                        </span>
                                        {cat.targetType === 'MONTHLY_BUILDER' && (
                                          (cat.assigned || 0) < cat.targetAmount ? (
                                            <span className="text-[#9F2F2D] dark:text-red-400 font-semibold bg-[#FDEBEC] dark:bg-red-950/30 px-1 py-0.2 border border-[#9F2F2D]/10 dark:border-red-500/20">
                                              Kurang {formatCurrency(cat.targetAmount - (cat.assigned || 0))}
                                            </span>
                                          ) : (
                                            <span className="text-[#346538] dark:text-emerald-400 font-semibold bg-[#EDF3EC] dark:bg-emerald-950/30 px-1 py-0.2 border border-[#346538]/10 dark:border-emerald-500/20">Fulfilled</span>
                                          )
                                        )}
                                        {cat.targetType === 'SAVINGS_BALANCE' && (
                                          (cat.available || 0) < cat.targetAmount ? (
                                            <span className="text-[#9F2F2D] dark:text-red-400 font-semibold bg-[#FDEBEC] dark:bg-red-950/30 px-1 py-0.2 border border-[#9F2F2D]/10 dark:border-red-500/20">
                                              Kurang {formatCurrency(cat.targetAmount - (cat.available || 0))}
                                            </span>
                                          ) : (
                                            <span className="text-[#346538] dark:text-emerald-400 font-semibold bg-[#EDF3EC] dark:bg-emerald-950/30 px-1 py-0.2 border border-[#346538]/10 dark:border-emerald-500/20">Fulfilled</span>
                                          )
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-1 text-right">
                                  {/* ponytail: inline budget editor */}
                                  <input
                                    type="text"
                                    defaultValue={cat.assigned || 0}
                                    onBlur={(e) => handleBudgetAssignChange(cat.id, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        (e.target as HTMLInputElement).blur();
                                      }
                                    }}
                                    className="w-28 text-right bg-transparent hover:bg-[#F7F6F3] dark:hover:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800 focus:ring-1 focus:ring-[#111111] dark:focus:ring-zinc-100 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 rounded-none py-1 px-2 focus:outline-none transition-all font-mono text-[#111111] dark:text-zinc-100"
                                  />
                                </td>
                                <td className={`py-2.5 text-right font-mono ${
                                  cat.activity < 0 ? 'text-red-600 dark:text-red-400' : cat.activity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#787774] dark:text-zinc-500'
                                }`}>
                                  {cat.activity !== 0 ? (cat.activity > 0 ? '+' : '') + formatCurrency(cat.activity) : '-'}
                                </td>
                                <td className="py-2.5 text-right font-mono">
                                  <span className={`px-2 py-0.5 rounded-none font-semibold text-[10px] border ${
                                    cat.available > 0
                                      ? 'bg-[#EDF3EC] dark:bg-emerald-950/30 text-[#346538] dark:text-emerald-400 border-[#346538]/10 dark:border-emerald-500/20'
                                      : cat.available < 0
                                      ? 'bg-[#FDEBEC] dark:bg-red-950/30 text-[#9F2F2D] dark:text-red-400 border-[#9F2F2D]/10 dark:border-red-500/20'
                                      : 'bg-[#F7F6F3] dark:bg-zinc-800 text-[#787774] dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                                  }`}>
                                    {formatCurrency(cat.available)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </Card>
              </div>
            )}

            {/* VIEW: TRANSACTIONS LIST */}
            {activeView === 'transactions' && (
              <div className="space-y-6">
                <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none p-6 shadow-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1 text-left">
                    <h1 className="font-serif text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">All Transactions</h1>
                    <p className="text-xs font-mono text-[#787774] dark:text-zinc-500">History of your expense, income, and transfer records between accounts.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 px-3 border border-zinc-200 dark:border-zinc-800 rounded-none bg-white dark:bg-zinc-900 text-xs font-mono text-[#111111] dark:text-zinc-100 w-52"
                    />
                    <Badge variant="outline" className="font-mono text-xs px-2.5 py-1.5 rounded-none border-zinc-200 dark:border-zinc-800 text-[#787774] dark:text-zinc-400">
                      {transactions.length} Catatan
                    </Badge>
                  </div>
                </Card>

                <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none p-6 shadow-none space-y-4">

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-2.5 font-mono text-[10px]">
                  <span
                    onClick={() => setTransactionTypeFilter('ALL')}
                    className={`px-2.5 py-1 border cursor-pointer hover:border-black/30 dark:hover:border-white/30 ${
                      transactionTypeFilter === 'ALL'
                        ? 'border-[#111111] dark:border-zinc-100 bg-[#111111] dark:bg-zinc-100 text-white dark:text-zinc-950 font-semibold'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[#787774] dark:text-zinc-400'
                    }`}
                  >All</span>
                  <span
                    onClick={() => setTransactionTypeFilter('INCOME')}
                    className={`px-2.5 py-1 border cursor-pointer hover:border-black/30 dark:hover:border-white/30 ${
                      transactionTypeFilter === 'INCOME'
                        ? 'border-[#346538] dark:border-[#346538]/50 bg-[#EDF3EC] dark:bg-emerald-950/20 text-[#346538] dark:text-emerald-400 font-semibold'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[#787774] dark:text-zinc-400'
                    }`}
                  >Income</span>
                  <span
                    onClick={() => setTransactionTypeFilter('EXPENSE')}
                    className={`px-2.5 py-1 border cursor-pointer hover:border-black/30 dark:hover:border-white/30 ${
                      transactionTypeFilter === 'EXPENSE'
                        ? 'border-[#9F2F2D] dark:border-[#9F2F2D]/50 bg-[#FDEBEC] dark:bg-red-950/20 text-[#9F2F2D] dark:text-red-400 font-semibold'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[#787774] dark:text-zinc-400'
                    }`}
                  >Expenses</span>
                  <span
                    onClick={() => setTransactionTypeFilter('TRANSFER')}
                    className={`px-2.5 py-1 border cursor-pointer hover:border-black/30 dark:hover:border-white/30 ${
                      transactionTypeFilter === 'TRANSFER'
                        ? 'border-[#1f6c9f] dark:border-[#1f6c9f]/50 bg-[#E1F3FE] dark:bg-blue-950/20 text-[#1f6c9f] dark:text-blue-400 font-semibold'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[#787774] dark:text-zinc-400'
                    }`}
                  >Transfer</span>
                </div>

                {/* Transactions Table/List */}
                {transactions.length === 0 ? (
                  <div className="py-12 text-center text-[#787774] dark:text-zinc-500 text-[10px] font-mono border border-dashed border-zinc-200 dark:border-zinc-800">No transactions found.</div>
                ) : (
                  <div className="border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-xs">
                    {transactions.map((tx: any) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 hover:bg-[#F7F6F3]/30 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[#111111] dark:text-zinc-100 truncate">{tx.title}</span>
                            <Badge
                              variant="outline"
                              className={`text-[8px] px-1.5 py-0 uppercase shrink-0 font-mono border-none ${
                                tx.type === 'INCOME'
                                  ? 'bg-[#EDF3EC] dark:bg-emerald-950/20 text-[#346538] dark:text-emerald-400'
                                  : tx.type === 'EXPENSE'
                                  ? 'bg-[#FDEBEC] dark:bg-red-950/20 text-[#9F2F2D] dark:text-red-400'
                                  : 'bg-[#E1F3FE] dark:bg-blue-950/20 text-[#1f6c9f] dark:text-blue-400'
                              }`}
                            >
                              {tx.type}
                            </Badge>
                            {tx.categoryRel?.name && (
                              <span className="text-[9px] text-[#787774] dark:text-zinc-400 px-1 py-0.5 uppercase border border-zinc-200 dark:border-zinc-800 bg-[#F7F6F3] dark:bg-zinc-800">
                                #{tx.categoryRel.name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2.5 text-[10px] text-[#787774] dark:text-zinc-500">
                            <span className="flex items-center gap-1">
                              <CalendarBlank className="w-3 h-3" />
                              {new Date(tx.date).toLocaleDateString('id-ID', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Wallet className="w-3 h-3" />
                              {tx.account?.name}
                            </span>
                            {tx.description && (
                              <>
                                <span>·</span>
                                <span className="truncate max-w-64">{tx.description}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="flex items-center gap-4 shrink-0 ml-4">
                          <span className={`font-semibold text-sm ${
                            tx.type === 'INCOME'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : tx.type === 'TRANSFER'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-[#111111] dark:text-zinc-100'
                          }`}>
                            {tx.type === 'INCOME' ? '+' : tx.type === 'TRANSFER' ? '⇄ ' : '-'}{formatCurrency(tx.amount)}
                          </span>

                          <div className="flex items-center gap-0.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => handleEditTransaction(tx)}
                                  variant="ghost"
                                  size="icon-xs"
                                  className="size-7"
                                >
                                  <PencilSimple className="w-3.5 h-3.5 text-[#787774] dark:text-zinc-400" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() => handleDeleteTransaction(tx.id)}
                                  variant="ghost"
                                  size="icon-xs"
                                  className="size-7 hover:bg-[#FDEBEC] dark:hover:bg-red-950/20 hover:text-[#9F2F2D] dark:hover:text-red-400"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </Button>
                              </TooltipTrigger>
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
            )}

            {/* VIEW: SINGLE ACCOUNT TRANSACTIONS */}
            {activeView === 'account' && activeAccount && (
              <div className="space-y-6">
                
                {/* Account Details Header */}
                <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none p-6 shadow-none flex justify-between items-center flex-row flex-wrap gap-4">
                  <div className="space-y-1">
                    <h1 className="font-serif text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{activeAccount.name}</h1>
                    <div className="flex items-center gap-2 text-xs font-mono text-[#787774] dark:text-zinc-500">
                      <span>Tipe: {activeAccount.type}</span>
                      <span>·</span>
                      <span>Mata Uang: {activeAccount.currency}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-[#787774] dark:text-zinc-500 uppercase tracking-wider">Current Balance</div>
                      <div className="font-serif text-3xl font-bold text-[#111111] dark:text-zinc-100">
                        {formatCurrency(activeAccount.balance, activeAccount.currency)}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <Button
                        onClick={() => {
                          setAccountToEdit(activeAccount);
                          setAccountFormState({
                            name: activeAccount.name,
                            type: activeAccount.type,
                            balance: activeAccount.balance.toString(),
                            currency: activeAccount.currency,
                            isOnBudget: activeAccount.isOnBudget,
                          });
                          setIsAccountModalOpen(true);
                        }}
                        variant="outline"
                        className="rounded-none border-zinc-200 dark:border-zinc-800 hover:bg-[#F7F6F3] dark:hover:bg-zinc-800 text-xs font-mono px-3 py-1 text-[#111111] dark:text-zinc-100 h-8"
                      >Edit Account</Button>
                      <Button
                        onClick={() => handleDeleteAccount(activeAccount.id)}
                        className="rounded-none bg-[#9F2F2D] text-white hover:bg-[#7D2624] text-xs font-mono px-3 py-1 h-8"
                      >Delete Account</Button>
                    </div>
                  </div>
                </Card>

                {/* Scoped Transactions List */}
                <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none p-6 shadow-none space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-mono text-[#787774] dark:text-zinc-500 uppercase tracking-wider">Account Transaction History</h2>
                    <Badge variant="outline" className="font-mono text-[9px] px-2 py-0.5 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                      {transactions.length} Transaksi
                    </Badge>
                  </div>

                  {transactions.length === 0 ? (
                    <div className="py-12 text-center text-[#787774] dark:text-zinc-500 text-[10px] font-mono border border-dashed border-zinc-200 dark:border-zinc-800">No transactions in this account yet.</div>
                  ) : (
                    <div className="border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-xs">
                      {transactions.map((tx: any) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 hover:bg-[#F7F6F3]/30 dark:hover:bg-zinc-800/30 transition-colors"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-[#111111] dark:text-zinc-100 truncate">{tx.title}</span>
                              <Badge
                                variant="outline"
                                className={`text-[8px] px-1.5 py-0 uppercase shrink-0 font-mono border-none ${
                                  tx.type === 'INCOME' ? 'bg-[#EDF3EC] dark:bg-emerald-950/20 text-[#346538] dark:text-emerald-400' : tx.type === 'EXPENSE' ? 'bg-[#FDEBEC] dark:bg-red-950/20 text-[#9F2F2D] dark:text-red-400' : 'bg-[#E1F3FE] dark:bg-blue-950/20 text-[#1f6c9f] dark:text-blue-400'
                                }`}
                              >
                                {tx.type}
                              </Badge>
                              {tx.categoryRel?.name && (
                                <span className="text-[9px] text-[#787774] dark:text-zinc-400 px-1 py-0.5 uppercase border border-zinc-200 dark:border-zinc-800 bg-[#F7F6F3] dark:bg-zinc-800">
                                  #{tx.categoryRel.name}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2.5 text-[10px] text-[#787774] dark:text-zinc-500">
                              <span className="flex items-center gap-1">
                                <CalendarBlank className="w-3 h-3" />
                                {new Date(tx.date).toLocaleDateString('id-ID', {
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

                          <div className="flex items-center gap-4 shrink-0 ml-4">
                            <span className={`font-semibold text-sm ${
                              tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : tx.type === 'TRANSFER' ? 'text-blue-600 dark:text-blue-400' : 'text-[#111111] dark:text-zinc-100'
                            }`}>
                              {tx.type === 'INCOME' ? '+' : tx.type === 'TRANSFER' ? '⇄ ' : '-'}{formatCurrency(tx.amount, activeAccount.currency)}
                            </span>

                            <div className="flex items-center gap-0.5">
                              <Button
                                onClick={() => handleEditTransaction(tx)}
                                variant="ghost"
                                size="icon-xs"
                                className="size-7"
                              >
                                <PencilSimple className="w-3.5 h-3.5 text-[#787774] dark:text-zinc-400" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteTransaction(tx.id)}
                                variant="ghost"
                                size="icon-xs"
                                className="size-7 hover:bg-[#FDEBEC] dark:hover:bg-red-950/20 hover:text-[#9F2F2D] dark:hover:text-red-400"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* VIEW: SUBSCRIPTIONS */}
            {activeView === 'subscriptions' && (
              <div className="space-y-6">
                
                {/* Header Card */}
                <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none p-6 shadow-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1 text-left">
                    <h1 className="font-serif text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Subscription List</h1>
                    <p className="text-xs font-mono text-[#787774] dark:text-zinc-500">Manage your list of monthly and annual routine subscription services.</p>
                  </div>
                  <Button
                    onClick={() => setIsSubscriptionModalOpen(true)}
                    variant="default"
                    size="sm"
                    className="rounded-none font-mono text-xs bg-[#111111] dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center gap-1.5 h-9"
                  >
                    <Plus className="w-3.5 h-3.5" />Add Subscription</Button>
                </Card>
                
                {/* Subscription cost equivalent metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none p-5 shadow-none space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#787774] dark:text-zinc-500 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      Langganan Aktif Bulanan (Setara)
                    </span>
                    <div className="font-serif text-3xl font-semibold text-[#111111] dark:text-zinc-100 tracking-tight">
                      {/* Calculate total cost base */}
                      {formatCurrency(
                        subscriptions
                          .filter((s: any) => s.status === 'ACTIVE')
                          .reduce((sum: number, s: any) => {
                            if (s.billingCycle === 'WEEKLY') return sum + s.cost * 4.33;
                            if (s.billingCycle === 'YEARLY') return sum + s.cost / 12;
                            return sum + s.cost;
                          }, 0)
                      )}
                    </div>
                    <p className="text-[9px] text-[#787774] dark:text-zinc-500 font-mono">Monthly mandatory expenses from active subscriptions.</p>
                  </Card>
                  
                  <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none p-5 shadow-none space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#787774] dark:text-zinc-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />Subscription Amount</span>
                    <div className="font-serif text-3xl font-semibold text-[#111111] dark:text-zinc-100 tracking-tight">
                      {subscriptions.length} Services
                    </div>
                    <p className="text-[9px] text-[#787774] dark:text-zinc-500 font-mono">
                      Total subscriptions configured ({subscriptions.filter((s: any) => s.status === 'ACTIVE').length} Active, {subscriptions.filter((s: any) => s.status !== 'ACTIVE').length} Paused/Cancelled).
                    </p>
                  </Card>
                </div>

                {/* Subscriptions Timeline List */}
                <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none p-6 shadow-none space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-mono text-[#787774] dark:text-zinc-500 uppercase tracking-wider">Subscription Payment Schedule</h2>
                    <Badge variant="outline" className="font-mono text-[9px] px-2 py-0.5 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                      {subscriptions.length} Services
                    </Badge>
                  </div>

                  {subscriptions.length === 0 ? (
                    <div className="py-12 text-center text-[#787774] dark:text-zinc-500 text-[10px] font-mono border border-dashed border-zinc-200 dark:border-zinc-800">No subscriptions yet.</div>
                  ) : (
                    <div className="border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-xs">
                      {subscriptions.map((sub: any) => {
                        const renewalDate = getNextRenewalDate(sub.startDate, sub.billingCycle);
                        const renewalStatus = getRenewalStatus(renewalDate);
                        return (
                          <div
                            key={sub.id}
                            className={`flex items-center justify-between p-3 transition-colors ${
                              sub.status !== 'ACTIVE' ? 'bg-[#F7F6F3]/50 dark:bg-zinc-800/20 opacity-60' : 'bg-white dark:bg-zinc-900 hover:bg-[#F7F6F3]/30 dark:hover:bg-zinc-800/30'
                            }`}
                          >
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-[#111111] dark:text-zinc-100 truncate">{sub.name}</span>
                                <Badge
                                  variant="outline"
                                  className={`text-[8px] px-1.5 py-0 uppercase shrink-0 font-mono border ${
                                    sub.status === 'ACTIVE'
                                      ? 'bg-[#EDF3EC] dark:bg-emerald-950/20 text-[#346538] dark:text-emerald-400 border-[#346538]/10'
                                      : 'bg-[#FDEBEC] dark:bg-red-950/20 text-[#9F2F2D] dark:text-red-400 border-[#9F2F2D]/10'
                                  }`}
                                >
                                  {sub.status}
                                </Badge>
                                {sub.category && (
                                  <span className="text-[9px] text-[#787774] dark:text-zinc-400 px-1 py-0.5 uppercase border border-zinc-200 dark:border-zinc-800 bg-[#F7F6F3] dark:bg-zinc-850">
                                    #{sub.category}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2.5 text-[10px] text-[#787774] dark:text-zinc-500">
                                <span className="font-semibold text-[#111111] dark:text-zinc-100">{formatCurrency(sub.cost)}</span>
                                <span>·</span>
                                <span>{sub.billingCycle.toLowerCase()}</span>
                                {sub.status === 'ACTIVE' && (
                                  <>
                                    <span>·</span>
                                    <span className="font-mono text-[9px]">Perpanjangan: {renewalStatus.label}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-0.5 shrink-0 ml-4">
                              <Button
                                onClick={() => handleEditSubscription(sub)}
                                variant="ghost"
                                size="icon-xs"
                                className="size-7"
                              >
                                <PencilSimple className="w-3.5 h-3.5 text-[#787774] dark:text-zinc-400" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteSubscription(sub.id)}
                                variant="ghost"
                                size="icon-xs"
                                className="size-7 hover:bg-[#FDEBEC] dark:hover:bg-red-950/20 hover:text-[#9F2F2D] dark:hover:text-red-400"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* VIEW: RECURRING TRANSACTIONS */}
            {activeView === 'recurring' && (
              <div className="space-y-6">
                
                {/* Header Card */}
                <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none p-6 shadow-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1 text-left">
                    <h1 className="font-serif text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Recurring Transaction Schedule</h1>
                    <p className="text-xs font-mono text-[#787774] dark:text-zinc-500">Manage routine transaction templates that are auto-posted to your account.</p>
                  </div>
                  <Button
                    onClick={() => {
                      setRecurringToEdit(null);
                      setRecurringFormState({
                        title: '',
                        amount: '',
                        type: 'EXPENSE',
                        frequency: 'MONTHLY',
                        nextDate: new Date().toISOString().split('T')[0] as string,
                        accountId: accounts[0]?.id || '',
                        categoryId: '',
                        transferAccountId: '',
                      });
                      setIsRecurringModalOpen(true);
                    }}
                    variant="default"
                    size="sm"
                    className="rounded-none font-mono text-xs bg-[#111111] dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />Add Schedule</Button>
                </Card>

                {/* List Container */}
                <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none p-6 shadow-none">
                  {recurringList.length === 0 ? (
                    <div className="text-center py-12 text-[#787774] dark:text-zinc-500 font-mono text-xs space-y-2">
                      <Clock className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-700" />
                      <p>No recurring transaction schedules yet.</p>
                      <p className="text-[10px] text-zinc-400">Create a new schedule to automate your recurring expense or income records.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[#787774] dark:text-zinc-400 text-left">
                            <th className="pb-3 font-normal uppercase tracking-wider">Transaction Name</th>
                            <th className="pb-3 font-normal uppercase tracking-wider text-right w-32">Amount</th>
                            <th className="pb-3 font-normal uppercase tracking-wider w-28 pl-4">Frequency</th>
                            <th className="pb-3 font-normal uppercase tracking-wider pl-4">Accounts & Categories</th>
                            <th className="pb-3 font-normal uppercase tracking-wider w-36 pl-4">Next Date</th>
                            <th className="pb-3 font-normal uppercase tracking-wider text-right w-24">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                          {recurringList.map((rt: any) => {
                            const sourceAcc = accounts.find((a: any) => a.id === rt.accountId);
                            const destAcc = rt.type === 'TRANSFER' && rt.transferAccountId ? accounts.find((a: any) => a.id === rt.transferAccountId) : null;
                            const targetCat = rt.type !== 'TRANSFER' && rt.categoryId ? categoryGroups.flatMap((g: any) => g.categories || []).find((c: any) => c.id === rt.categoryId) : null;

                            return (
                              <tr key={rt.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors">
                                <td className="py-3 pr-2 max-w-[200px] truncate">
                                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                    <span className={`size-1.5 rounded-full shrink-0 ${
                                      rt.type === 'EXPENSE'
                                        ? 'bg-red-500'
                                        : rt.type === 'INCOME'
                                        ? 'bg-emerald-500'
                                        : 'bg-blue-500'
                                    }`} />
                                    {rt.title}
                                  </div>
                                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                    {rt.type === 'EXPENSE' ? 'Expenses' : rt.type === 'INCOME' ? 'Income' : 'Transfer'}
                                  </span>
                                </td>
                                <td className={`py-3 text-right font-semibold ${
                                  rt.type === 'EXPENSE'
                                    ? 'text-[#9F2F2D] dark:text-red-400'
                                    : rt.type === 'INCOME'
                                    ? 'text-[#346538] dark:text-emerald-400'
                                    : 'text-zinc-700 dark:text-zinc-300'
                                }`}>
                                  {rt.type === 'EXPENSE' ? '-' : rt.type === 'INCOME' ? '+' : ''}
                                  {formatCurrency(rt.amount)}
                                </td>
                                <td className="py-3 pl-4">
                                  <span className="px-1.5 py-0.5 text-[9px] font-semibold tracking-wider rounded-none uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-350 border border-zinc-200/50 dark:border-zinc-750">
                                    {rt.frequency === 'DAILY' ? 'Harian' : rt.frequency === 'WEEKLY' ? 'Weekly' : rt.frequency === 'MONTHLY' ? 'Monthly' : 'Annually'}
                                  </span>
                                </td>
                                <td className="py-3 pl-4 space-y-0.5">
                                  <div className="text-[11px] text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                                    <span className="text-zinc-400">Dari:</span> {sourceAcc?.name || 'Account Not Found'}
                                  </div>
                                  <div className="text-[10px] text-[#787774] dark:text-zinc-500 flex items-center gap-1">
                                    {rt.type === 'TRANSFER' ? (
                                      <>
                                        <span className="text-zinc-400">Ke:</span> {destAcc?.name || 'Destination Not Found'}
                                      </>
                                    ) : (
                                      <>
                                        <span className="text-zinc-400">Kat:</span> {targetCat?.name || 'Uncategorized'}
                                      </>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 pl-4 text-zinc-650 dark:text-zinc-400 text-[11px]">
                                  <div>{new Date(rt.nextDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                  {rt.lastPostedAt && (
                                    <div className="text-[9px] text-zinc-400 dark:text-zinc-500">
                                      Diposting: {new Date(rt.lastPostedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button
                                      onClick={() => handleEditRecurring(rt)}
                                      variant="ghost"
                                      size="icon-xs"
                                      className="size-7 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                                    >
                                      <PencilSimple className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      onClick={() => handleDeleteRecurring(rt.id, rt.title)}
                                      variant="ghost"
                                      size="icon-xs"
                                      className="size-7 hover:bg-[#FDEBEC] dark:hover:bg-red-950/20 hover:text-[#9F2F2D] dark:hover:text-red-400"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>

              </div>
            )}



            {activeView === 'email-sync' && (
              <div className="space-y-6">
                
                {/* Header Card */}
                <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none p-6 shadow-none flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1 text-left">
                    <h1 className="font-serif text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Envelope className="w-6 h-6" />
                      Sinkronisasi Email (Auto-Sync)
                    </h1>
                    <p className="text-xs font-mono text-[#787774] dark:text-zinc-500">Automatically sync transaction mutations for your Bank Jago and Bank Mandiri accounts from incoming email notifications.</p>
                  </div>
                  <Button
                    onClick={handleScanRealInbox}
                    disabled={syncEmailsMutation.isPending}
                    className="rounded-none font-mono text-xs bg-[#111111] dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center gap-1.5 h-9 shrink-0"
                  >
                    <Envelope className="w-3.5 h-3.5" />
                    {syncEmailsMutation.isPending ? 'Scanning Inbox...' : 'Scan Gmail Inbox Now'}
                  </Button>
                </Card>

                {/* IMAP Configurations Card */}
                <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none p-6 shadow-none space-y-4 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800/60 pb-3">
                    <div>
                      <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        Konfigurasi Akses IMAP Email
                        {emailSyncUser && (
                          <Badge variant="outline" className="bg-[#EDF3EC] dark:bg-emerald-950/40 text-[#346538] dark:text-emerald-400 border-[#346538]/30 font-normal text-[10px] rounded-none py-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#346538] dark:bg-emerald-400 inline-block mr-1 animate-pulse" />
                            Terkonfigurasi & Aktif
                          </Badge>
                        )}
                      </h2>
                      <p className="text-[11px] font-mono text-[#787774] dark:text-zinc-500 mt-1">
                        {emailSyncUser
                          ? 'IMAP access to your email has been successfully set up and is actively scanning notifications automatically.'
                          : 'Enter your IMAP server access details and email App Password below.'}
                      </p>
                    </div>

                    {emailSyncUser && (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => setIsEditingEmailConfig(!isEditingEmailConfig)}
                        className="rounded-none font-mono text-[11px] h-8 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shrink-0 self-start sm:self-auto"
                      >
                        {isEditingEmailConfig ? 'Hide Form' : 'Change Credentials'}
                      </Button>
                    )}
                  </div>

                  {/* Configured Status Summary Banner */}
                  {emailSyncUser && !isEditingEmailConfig && (
                    <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-[#FBFBFA] dark:bg-zinc-900/50 space-y-4 font-mono text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 dark:divide-zinc-800">
                        <div className="space-y-1">
                          <p className="text-[10px] text-[#787774] uppercase font-semibold">Email Address</p>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{emailSyncUser}</p>
                        </div>
                        <div className="sm:pl-4 space-y-1">
                          <p className="text-[10px] text-[#787774] uppercase font-semibold">Server Host & Port</p>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{emailSyncHost}:{emailSyncPort}</p>
                        </div>
                        <div className="sm:pl-4 space-y-1">
                          <p className="text-[10px] text-[#787774] uppercase font-semibold">Auto-Sync Status</p>
                          <p className="font-semibold text-[#346538] dark:text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#346538] dark:bg-emerald-400" />
                            {emailSyncActive ? 'Aktif (Auto 2 Mnt)' : 'Inactive'}
                          </p>
                        </div>
                        <div className="sm:pl-4 space-y-1">
                          <p className="text-[10px] text-[#787774] uppercase font-semibold">App Password</p>
                          <p className="font-mono text-zinc-400">••••••••••••••••</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10.5px] text-[#787774] dark:text-zinc-500">
                          Koneksi server email tersimpan secara permanen dan siap mendeteksi mutasi Bank Jago & Mandiri.
                        </span>
                        <Button
                          type="button"
                          onClick={handleTestConnection}
                          disabled={testConnectionMutation.isPending}
                          variant="outline"
                          className="h-8 rounded-none font-mono text-[11px] border-zinc-200 dark:border-zinc-800"
                        >
                          {testConnectionMutation.isPending ? 'Testing...' : 'Retest Connection'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Config Form (Visible if new or editing) */}
                  {(!emailSyncUser || isEditingEmailConfig) && (
                    <form onSubmit={handleSaveEmailConfig} className="space-y-3 font-mono text-xs max-w-xl pt-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#787774] uppercase font-semibold">IMAP Host</label>
                        <Input
                          type="text"
                          value={emailSyncHost}
                          onChange={(e) => setEmailSyncHost(e.target.value)}
                          className="h-9 rounded-none text-xs"
                          placeholder="imap.gmail.com"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#787774] uppercase font-semibold">IMAP Port</label>
                        <Input
                          type="number"
                          value={emailSyncPort}
                          onChange={(e) => setEmailSyncPort(parseInt(e.target.value) || 993)}
                          className="h-9 rounded-none text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#787774] uppercase font-semibold">Alamat Email / Username</label>
                        <Input
                          type="email"
                          value={emailSyncUser}
                          onChange={(e) => setEmailSyncUser(e.target.value)}
                          className="h-9 rounded-none text-xs"
                          placeholder="nama@email.com"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#787774] uppercase font-semibold">Password Aplikasi (App Password)</label>
                        <Input
                          type="password"
                          value={emailSyncPass}
                          onChange={(e) => setEmailSyncPass(e.target.value)}
                          className="h-9 rounded-none text-xs"
                          placeholder="••••••••••••••••"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="emailSyncActive"
                          checked={emailSyncActive}
                          onChange={(e) => setEmailSyncActive(e.target.checked)}
                          className="rounded-none border-zinc-300"
                        />
                        <label htmlFor="emailSyncActive" className="text-[10.5px] cursor-pointer text-zinc-900 dark:text-zinc-100">Enable automatic background sync</label>
                      </div>
                      <div className="flex gap-2 w-full pt-1">
                        <Button
                          type="submit"
                          disabled={saveEmailConfigMutation.isPending}
                          className="flex-1 h-9 rounded-none bg-[#111111] dark:bg-zinc-100 text-white dark:text-zinc-900 font-mono text-xs"
                        >
                          {saveEmailConfigMutation.isPending ? 'Saving...' : 'Save Credentials'}
                        </Button>
                        <Button
                          type="button"
                          onClick={handleTestConnection}
                          disabled={testConnectionMutation.isPending}
                          variant="outline"
                          className="flex-1 h-9 rounded-none font-mono text-xs border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                        >
                          {testConnectionMutation.isPending ? 'Testing...' : 'Test Connection'}
                        </Button>
                      </div>
                    </form>
                  )}
                </Card>

                {/* Real-time sync log/results using shadcn Alert */}
                {syncResults.length > 0 && (
                  <div className="space-y-4 text-left">
                    <Alert variant="success">
                      <Circle className="w-3 h-3 fill-[#346538] dark:fill-emerald-400 text-[#346538] dark:text-emerald-400 animate-pulse mt-0.5" />
                      <div>
                        <AlertTitle className="font-bold font-mono text-xs">
                          Synchronization Successful — {syncResults.length} New Transactions Automatically Added
                        </AlertTitle>
                        <AlertDescription className="font-mono text-[11px] text-[#346538]/90 dark:text-emerald-300">
                          Your Bank Jago / Mandiri transaction email notifications were successfully scanned and entered directly into the account balance records.
                        </AlertDescription>
                      </div>
                    </Alert>

                    <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none p-6 shadow-none space-y-4 text-left">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">Scanned Email Transaction Details</h3>
                      <div className="border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-xs">
                        {syncResults.map((tx: any) => (
                          <div key={tx.id} className="p-3 flex items-center justify-between hover:bg-[#FBFBFA] dark:hover:bg-zinc-900/50">
                            <div>
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{tx.title}</p>
                              <p className="text-[10px] text-[#787774] dark:text-zinc-500">
                                Account: {tx.account?.name} • Type: {tx.type} • Status: Verified
                              </p>
                            </div>
                            <span className={`font-semibold ${tx.type === 'INCOME' ? 'text-[#346538] dark:text-emerald-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                              {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}

              </div>
            )}

            {activeView === 'analytics' && (
              <div className="space-y-6">
                {/* Header */}
                <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none p-6 shadow-none ">
                  <div className="space-y-1 text-left">
                    <h1 className="font-serif text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Analisis & Laporan Keuangan</h1>
                    <p className="text-xs font-mono text-[#787774] dark:text-zinc-500">Visualization of your cash flow, net worth, and spending structure.</p>
                  </div>
                </Card>

                {/* 2-Column Trends Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Income vs Expense Bar Chart */}
                  <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none p-6 shadow-none space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-xs font-mono text-[#787774] dark:text-zinc-500 uppercase tracking-wider">
                        Arus Kas Bulanan (Pemasukan vs Pengeluaran)
                      </h2>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">Comparison of total income and expenses for the last 6 months.</p>
                    </div>

                    {!mounted || trends.length === 0 ? (
                      <div className="h-[260px] flex items-center justify-center text-[10px] font-mono text-[#787774] dark:text-zinc-500">Loading chart data...</div>
                    ) : (
                      <div style={{ width: '100%', height: 260 }}>
                        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
                          <BarChart data={trends} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                              dataKey="month"
                              tickLine={false}
                              axisLine={false}
                              tick={{ fontSize: 10, fontFamily: 'monospace' }}
                            />
                            <YAxis
                              tickLine={false}
                              axisLine={false}
                              tick={{ fontSize: 10, fontFamily: 'monospace' }}
                              tickFormatter={(value) => {
                                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
                                if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
                                return value;
                              }}
                            />
                            <RechartsPrimitive.Tooltip
                              formatter={(value: any, name: any) => [
                                formatCurrency(Number(value)),
                                name === 'income' ? 'Income' : 'Expenses'
                              ]}
                            />
                            <RechartsPrimitive.Legend />
                            <Bar dataKey="income" name="income" fill="#4e8052" radius={[2, 2, 0, 0]} />
                            <Bar dataKey="expense" name="expense" fill="#c25a58" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </RechartsPrimitive.ResponsiveContainer>
                      </div>
                    )}
                  </Card>

                  {/* Net Worth Line Chart */}
                  <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none p-6 shadow-none space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-xs font-mono text-[#787774] dark:text-zinc-500 uppercase tracking-wider">
                        Perkembangan Kekayaan Bersih (Net Worth)
                      </h2>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">Accumulated total balance of all your active accounts.</p>
                    </div>

                    {!mounted || trends.length === 0 ? (
                      <div className="h-[260px] flex items-center justify-center text-[10px] font-mono text-[#787774] dark:text-zinc-500">Loading chart data...</div>
                    ) : (
                      <div style={{ width: '100%', height: 260 }}>
                        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trends} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                              dataKey="month"
                              tickLine={false}
                              axisLine={false}
                              tick={{ fontSize: 10, fontFamily: 'monospace' }}
                            />
                            <YAxis
                              tickLine={false}
                              axisLine={false}
                              tick={{ fontSize: 10, fontFamily: 'monospace' }}
                              tickFormatter={(value) => {
                                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
                                if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
                                return value;
                              }}
                            />
                            <RechartsPrimitive.Tooltip
                              formatter={(value: any) => [
                                formatCurrency(Number(value)),
                                'Net Worth'
                              ]}
                            />
                            <RechartsPrimitive.Legend />
                            <Line
                              type="monotone"
                              dataKey="netWorth"
                              name="Net Worth"
                              stroke="#111111"
                              strokeWidth={2}
                              dot={{ r: 3, strokeWidth: 1 }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </RechartsPrimitive.ResponsiveContainer>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Spending by Category Group (Current Selected Month) */}
                <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none p-6 shadow-none space-y-6">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="space-y-1">
                      <h2 className="text-xs font-mono text-[#787774] dark:text-zinc-500 uppercase tracking-wider">
                        Struktur Pengeluaran Kategori ({getMonthName(budgetMonth)} {budgetYear})
                      </h2>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">Actual expense distribution by budget category group this month.</p>
                    </div>
                    <Badge variant="outline" className="font-mono text-[9px] px-2 py-0.5 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                      Total Pengeluaran: {formatCurrency(
                        budget.groups?.reduce((sum: number, group: any) => {
                          return sum + (group.categories?.reduce((gSum: number, cat: any) => {
                            return gSum + (cat.activity < 0 ? Math.abs(cat.activity) : 0);
                          }, 0) || 0);
                        }, 0) || 0
                      )}
                    </Badge>
                  </div>

                  {(() => {
                    const spendingData = budget.groups?.map((group: any, idx: number) => {
                      const totalSpend = group.categories?.reduce((sum: number, cat: any) => {
                        if (cat.activity < 0) {
                          return sum + Math.abs(cat.activity);
                        }
                        return sum;
                      }, 0) || 0;
                      return {
                        name: group.name,
                        value: totalSpend,
                        color: ['#8c92ac', '#9fa298', '#bfa5a4', '#c9b097', '#a4b5bf', '#b2a4bf'][idx % 6],
                      };
                    }).filter((d: any) => d.value > 0) || [];

                    const totalSpendSum = spendingData.reduce((sum: number, d: any) => sum + d.value, 0);

                    if (!mounted) {
                      return (
                        <div className="py-12 text-center text-[#787774] dark:text-zinc-500 text-[10px] font-mono border border-dashed border-zinc-200 dark:border-zinc-800">
                          Loading chart...
                        </div>
                      );
                    }

                    if (spendingData.length === 0) {
                      return (
                        <div className="py-12 text-center text-[#787774] dark:text-zinc-500 text-[10px] font-mono border border-dashed border-zinc-200 dark:border-zinc-800">
                          Tidak ada transaksi pengeluaran tercatat pada bulan {getMonthName(budgetMonth)} {budgetYear}.
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                        {/* Donut Chart */}
                        <div className="md:col-span-5 h-64 flex justify-center">
                          <ChartContainer
                            config={
                              spendingData.reduce((acc: any, d: any) => {
                                acc[d.name] = { label: d.name, color: d.color };
                                return acc;
                              }, {})
                            }
                            className="aspect-square h-[240px] w-full max-w-64"
                          >
                            <PieChart>
                              <Pie
                                data={spendingData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={85}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {spendingData.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <ChartTooltip
                                content={
                                  <ChartTooltipContent
                                    hideIndicator
                                    formatter={(value) => (
                                      <div className="font-mono text-[10px]">
                                        <span className="font-semibold">{formatCurrency(Number(value))}</span>
                                        <span className="text-zinc-400 dark:text-zinc-500 ml-1">
                                          ({((Number(value) / totalSpendSum) * 100).toFixed(1)}%)
                                        </span>
                                      </div>
                                    )}
                                  />
                                }
                              />
                            </PieChart>
                          </ChartContainer>
                        </div>

                        {/* Text Legend and Percentages list */}
                        <div className="md:col-span-7 space-y-3 font-mono text-xs">
                          <div className="grid grid-cols-12 border-b border-zinc-200 dark:border-zinc-800 pb-2 text-[10px] text-[#787774] dark:text-zinc-500 uppercase tracking-wider">
                            <span className="col-span-6">Category Group</span>
                            <span className="col-span-3 text-right">Expenses</span>
                            <span className="col-span-3 text-right">Percentage</span>
                          </div>

                          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {spendingData.map((d: any, index: number) => (
                              <div key={index} className="grid grid-cols-12 py-2 items-center">
                                <span className="col-span-6 flex items-center gap-2 truncate pr-2">
                                  <div className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: d.color }} />
                                  <span className="text-[#111111] dark:text-zinc-100 font-semibold">{d.name}</span>
                                </span>
                                <span className="col-span-3 text-right text-zinc-700 dark:text-zinc-300">
                                  {formatCurrency(d.value)}
                                </span>
                                <span className="col-span-3 text-right text-[#787774] dark:text-zinc-400 font-semibold">
                                  {((d.value / totalSpendSum) * 100).toFixed(1)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </Card>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* DIALOG: CATEGORY MODAL */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none p-6 text-xs font-mono text-[#111111] dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-medium text-[#111111] dark:text-zinc-100">
              {categoryModalMode === 'createGroup' && 'Add Category Group'}
              {categoryModalMode === 'editGroup' && 'Edit Category Group'}
              {categoryModalMode === 'createCategory' && 'Add Category'}
              {categoryModalMode === 'editCategory' && 'Edit Category'}
            </DialogTitle>
            <DialogDescription className="text-xs font-mono mt-1 text-[#787774] dark:text-zinc-500">
              {categoryModalMode === 'createGroup' && 'Create a new category group to hold your budget items.'}
              {categoryModalMode === 'editGroup' && 'Change budget category group name.'}
              {categoryModalMode === 'createCategory' && 'Add new category under this group.'}
              {categoryModalMode === 'editCategory' && 'Change budget category name.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCategorySubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="categoryName" className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-400 font-semibold">
                {categoryModalMode.includes('Group') ? 'Category Group Name' : 'Category Name'}
              </label>
              <input
                id="categoryName"
                type="text"
                required
                placeholder="Contoh: Makanan & Minuman, Tagihan Listrik..."
                value={categoryFormState.name}
                onChange={(e) => setCategoryFormState({ ...categoryFormState, name: e.target.value })}
                className="w-full bg-[#F7F6F3] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-none py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-zinc-100 font-mono text-xs text-[#111111] dark:text-zinc-100"
              />
            </div>

            {categoryModalMode.includes('Category') && (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="targetType" className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-400 font-semibold">
                    Tipe Target Tabungan (Opsional)
                  </label>
                  <select
                    id="targetType"
                    value={categoryFormState.targetType}
                    onChange={(e) => setCategoryFormState({ ...categoryFormState, targetType: e.target.value })}
                    className="w-full bg-[#F7F6F3] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-none py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-zinc-100 font-mono text-xs text-[#111111] dark:text-zinc-100"
                  >
                    <option value="NONE">No Target</option>
                    <option value="MONTHLY_BUILDER">Monthly Savings Builder (Tabung X setiap bulan)</option>
                    <option value="SAVINGS_BALANCE">Savings Balance (Capai saldo total X)</option>
                  </select>
                </div>

                {categoryFormState.targetType !== 'NONE' && (
                  <div className="space-y-1.5">
                    <label htmlFor="targetAmount" className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-400 font-semibold">
                      Jumlah Target Uang (IDR)
                    </label>
                    <input
                      id="targetAmount"
                      type="number"
                      required
                      placeholder="Contoh: 500000"
                      value={categoryFormState.targetAmount}
                      onChange={(e) => setCategoryFormState({ ...categoryFormState, targetAmount: e.target.value })}
                      className="w-full bg-[#F7F6F3] dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-none py-2 px-3 focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-zinc-100 font-mono text-xs text-[#111111] dark:text-zinc-100"
                    />
                  </div>
                )}
              </>
            )}

            <DialogFooter className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCategoryModalOpen(false)}
                className="rounded-none font-mono text-xs text-[#787774] dark:text-zinc-400"
              >Cancel</Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                className="rounded-none font-mono text-xs bg-[#111111] dark:bg-zinc-100 text-white dark:text-zinc-900"
              >Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: ACCOUNT MODAL */}
      <Dialog open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none p-6 text-xs font-mono text-[#111111] dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-medium text-[#111111] dark:text-zinc-100">
              {accountToEdit ? 'Edit Account' : 'Create New Account'}
            </DialogTitle>
            <DialogDescription className="text-xs font-mono mt-1 text-[#787774] dark:text-zinc-500">Enter your account or wallet details to track the starting balance.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAccountSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">Account Name</label>
              <Input
                type="text"
                required
                placeholder="misal: Bank BCA, Dompet Tunai"
                value={accountFormState.name}
                onChange={(e) => setAccountFormState({ ...accountFormState, name: e.target.value })}
                className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 text-xs font-mono h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">Account Type</label>
                <Select
                  value={accountFormState.type}
                  onValueChange={(val) => setAccountFormState({ ...accountFormState, type: val })}
                >
                  <SelectTrigger className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 h-9 text-xs font-mono">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 font-mono text-xs">
                    <SelectItem value="CHECKING">Main Account</SelectItem>
                    <SelectItem value="SAVINGS">Savings</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                    <SelectItem value="E_WALLET">E-Wallet / Dompet Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">Currency</label>
                <Select
                  value={accountFormState.currency}
                  onValueChange={(val) => setAccountFormState({ ...accountFormState, currency: val })}
                >
                  <SelectTrigger className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 h-9 text-xs font-mono">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 font-mono text-xs">
                    <SelectItem value="IDR">IDR (Rp)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!accountToEdit && (
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">Saldo Awal / Saat Ini</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={accountFormState.balance}
                  onChange={(e) => setAccountFormState({ ...accountFormState, balance: e.target.value })}
                  className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 text-xs font-mono h-9"
                />
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAccountModalOpen(false)}
                className="rounded-none text-xs font-mono text-[#787774] dark:text-zinc-400 h-9 hover:bg-[#F7F6F3] dark:hover:bg-zinc-800"
              >Cancel</Button>
              <Button
                type="submit"
                className="rounded-none bg-[#111111] dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-[#333333] dark:hover:bg-zinc-200 text-xs font-mono h-9"
              >Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: TRANSACTION MODAL */}
      <Dialog open={isTransactionModalOpen} onOpenChange={setIsTransactionModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none p-6 text-xs font-mono text-[#111111] dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-medium text-[#111111] dark:text-zinc-100">
              {transactionToEdit ? 'Edit Transaction' : 'Record New Transaction'}
            </DialogTitle>
            <DialogDescription className="text-xs font-mono mt-1 text-[#787774] dark:text-zinc-500">Save history of income, expenses, or money transfers between accounts.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTransactionSubmit} className="space-y-4 pt-2">
            
            {/* Type toggle */}
            <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-3 text-[10px] font-mono">
              <span
                onClick={() => setTxFormState({ ...txFormState, type: 'EXPENSE' })}
                className={`px-3 py-1.5 border cursor-pointer hover:border-black/30 dark:hover:border-white/30 transition-colors ${
                  txFormState.type === 'EXPENSE'
                    ? 'border-[#9F2F2D] dark:border-[#9F2F2D]/75 bg-[#FDEBEC] dark:bg-red-950/20 text-[#9F2F2D] dark:text-red-400 font-bold'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[#787774] dark:text-zinc-400'
                }`}
              >Expenses</span>
              <span
                onClick={() => setTxFormState({ ...txFormState, type: 'INCOME' })}
                className={`px-3 py-1.5 border cursor-pointer hover:border-black/30 dark:hover:border-white/30 transition-colors ${
                  txFormState.type === 'INCOME'
                    ? 'border-[#346538] dark:border-[#346538]/75 bg-[#EDF3EC] dark:bg-emerald-950/20 text-[#346538] dark:text-emerald-400 font-bold'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[#787774] dark:text-zinc-400'
                }`}
              >Income</span>
              <span
                onClick={() => setTxFormState({ ...txFormState, type: 'TRANSFER' })}
                className={`px-3 py-1.5 border cursor-pointer hover:border-black/30 dark:hover:border-white/30 transition-colors ${
                  txFormState.type === 'TRANSFER'
                    ? 'border-[#1f6c9f] dark:border-[#1f6c9f]/75 bg-[#E1F3FE] dark:bg-blue-950/20 text-[#1f6c9f] dark:text-blue-400 font-bold'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[#787774] dark:text-zinc-400'
                }`}
              >
                Transfer Saldo
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">
                  Nominal ({accounts.find((a: any) => a.id === txFormState.accountId)?.currency || 'IDR'})
                </label>
                <Input
                  type="number"
                  required
                  placeholder="0"
                  value={txFormState.amount}
                  onChange={(e) => setTxFormState({ ...txFormState, amount: e.target.value })}
                  className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 text-xs font-mono h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">Date</label>
                <Input
                  type="date"
                  required
                  value={txFormState.date}
                  onChange={(e) => setTxFormState({ ...txFormState, date: e.target.value })}
                  className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 text-xs font-mono h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">Nama Transaksi / Penerima</label>
              <Input
                type="text"
                required
                placeholder="misal: Kopi, Gaji Bulanan, Top-up"
                value={txFormState.title}
                onChange={(e) => setTxFormState({ ...txFormState, title: e.target.value })}
                className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 text-xs font-mono h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">
                  {txFormState.type === 'TRANSFER' ? 'Source Account' : 'Account'}
                </label>
                <Select
                  value={txFormState.accountId}
                  onValueChange={(val) => setTxFormState({ ...txFormState, accountId: val })}
                >
                  <SelectTrigger className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 h-9 text-xs font-mono">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 font-mono text-xs">
                    {accounts.map((acc: any) => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {txFormState.type === 'TRANSFER' ? (
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">Destination Account</label>
                  <Select
                    value={txFormState.transferAccountId}
                    onValueChange={(val) => setTxFormState({ ...txFormState, transferAccountId: val })}
                  >
                    <SelectTrigger className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 h-9 text-xs font-mono">
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 font-mono text-xs">
                      {accounts.filter((acc: any) => acc.id !== txFormState.accountId).map((acc: any) => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">Budget Category</label>
                  <Select
                    value={txFormState.categoryId}
                    onValueChange={(val) => setTxFormState({ ...txFormState, categoryId: val })}
                  >
                    <SelectTrigger className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 h-9 text-xs font-mono">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[#111111] dark:text-zinc-100 font-mono text-xs max-h-60 overflow-y-auto">
                      {categoryGroups.map((group: any) => (
                        <SelectGroup key={group.id}>
                          <SelectLabel className="px-2 py-1 font-bold text-[9px] uppercase tracking-wider text-[#787774] dark:text-zinc-500 bg-[#F7F6F3] dark:bg-zinc-800">
                            {group.name}
                          </SelectLabel>
                          {group.categories.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">Keterangan (Opsional)</label>
              <textarea
                value={txFormState.description}
                onChange={(e) => setTxFormState({ ...txFormState, description: e.target.value })}
                placeholder="Additional notes..."
                className="w-full min-h-16 border border-zinc-200 dark:border-zinc-700 rounded-none p-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#111111] dark:focus:ring-zinc-100 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 resize-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsTransactionModalOpen(false)}
                className="rounded-none text-xs font-mono text-[#787774] dark:text-zinc-400 h-9 hover:bg-[#F7F6F3] dark:hover:bg-zinc-800"
              >Cancel</Button>
              <Button
                type="submit"
                className="rounded-none bg-[#111111] dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-[#333333] dark:hover:bg-zinc-200 text-xs font-mono h-9"
              >Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: SUBSCRIPTION MODAL */}
      <Dialog open={isSubscriptionModalOpen} onOpenChange={setIsSubscriptionModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none p-6 text-xs font-mono text-[#111111] dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-medium text-[#111111] dark:text-zinc-100">
              {subscriptionToEdit ? 'Edit Subscription Service' : 'Register New Subscription'}
            </DialogTitle>
            <DialogDescription className="text-xs font-mono mt-1 text-[#787774] dark:text-zinc-500">Save your monthly or annual subscription info to track fixed expenses.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubscriptionSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">Service Name</label>
              <Input
                type="text"
                required
                placeholder="misal: Netflix, Spotify, AWS"
                value={subFormState.name}
                onChange={(e) => setSubFormState({ ...subFormState, name: e.target.value })}
                className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 text-xs font-mono h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">Bill Cost</label>
                <Input
                  type="number"
                  required
                  placeholder="0"
                  value={subFormState.cost}
                  onChange={(e) => setSubFormState({ ...subFormState, cost: e.target.value })}
                  className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 text-xs font-mono h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">Billing Cycle</label>
                <Select
                  value={subFormState.billingCycle}
                  onValueChange={(val: any) => setSubFormState({ ...subFormState, billingCycle: val })}
                >
                  <SelectTrigger className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 h-9 text-xs font-mono">
                    <SelectValue placeholder="Cycle" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 font-mono text-xs">
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="YEARLY">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">Start Subscription</label>
                <Input
                  type="date"
                  required
                  value={subFormState.startDate}
                  onChange={(e) => setSubFormState({ ...subFormState, startDate: e.target.value })}
                  className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 text-xs font-mono h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">Status</label>
                <Select
                  value={subFormState.status}
                  onValueChange={(val: any) => setSubFormState({ ...subFormState, status: val })}
                >
                  <SelectTrigger className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 h-9 text-xs font-mono">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 font-mono text-xs">
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Jeda / Berhenti Sementara</SelectItem>
                    <SelectItem value="CANCELLED">Cancel / Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsSubscriptionModalOpen(false)}
                className="rounded-none text-xs font-mono text-[#787774] dark:text-zinc-400 h-9 hover:bg-[#F7F6F3] dark:hover:bg-zinc-800"
              >Cancel</Button>
              <Button
                type="submit"
                className="rounded-none bg-[#111111] dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-[#333333] dark:hover:bg-zinc-200 text-xs font-mono h-9"
              >Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: RECURRING TRANSACTION MODAL */}
      <Dialog open={isRecurringModalOpen} onOpenChange={setIsRecurringModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none p-6 text-xs font-mono text-[#111111] dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-medium text-[#111111] dark:text-zinc-100">
              {recurringToEdit ? 'Edit Recurring Transaction' : 'Create New Recurring Transaction'}
            </DialogTitle>
            <DialogDescription className="text-xs font-mono mt-1 text-[#787774] dark:text-zinc-500">
              Konfigurasikan detail nominal, frekuensi, dan akun asal/tujuan transaksi rutin Anda.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecurringSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">Transaction Name</label>
              <Input
                type="text"
                required
                placeholder="misal: Gaji Bulanan, Sewa Kos, Listrik"
                value={recurringFormState.title}
                onChange={(e) => setRecurringFormState({ ...recurringFormState, title: e.target.value })}
                className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 text-xs font-mono h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">
                  Nominal ({accounts.find((a: any) => a.id === recurringFormState.accountId)?.currency || 'IDR'})
                </label>
                <Input
                  type="number"
                  required
                  placeholder="0"
                  value={recurringFormState.amount}
                  onChange={(e) => setRecurringFormState({ ...recurringFormState, amount: e.target.value })}
                  className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 text-xs font-mono h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">Transaction Type</label>
                <Select
                  value={recurringFormState.type}
                  onValueChange={(val: any) => setRecurringFormState({ ...recurringFormState, type: val })}
                >
                  <SelectTrigger className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 h-9 text-xs font-mono">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 font-mono text-xs">
                    <SelectItem value="EXPENSE">Expenses</SelectItem>
                    <SelectItem value="INCOME">Income</SelectItem>
                    <SelectItem value="TRANSFER">Transfer Between Accounts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">Frequency</label>
                <Select
                  value={recurringFormState.frequency}
                  onValueChange={(val: any) => setRecurringFormState({ ...recurringFormState, frequency: val })}
                >
                  <SelectTrigger className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 h-9 text-xs font-mono">
                    <SelectValue placeholder="Select Frequency" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 font-mono text-xs">
                    <SelectItem value="DAILY">Harian</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="YEARLY">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">Next Start Date</label>
                <Input
                  type="date"
                  required
                  value={recurringFormState.nextDate}
                  onChange={(e) => setRecurringFormState({ ...recurringFormState, nextDate: e.target.value })}
                  className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 text-xs font-mono h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">
                  {recurringFormState.type === 'TRANSFER' ? 'Source Account' : 'Account'}
                </label>
                <Select
                  value={recurringFormState.accountId}
                  onValueChange={(val: any) => setRecurringFormState({ ...recurringFormState, accountId: val })}
                >
                  <SelectTrigger className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 h-9 text-xs font-mono">
                    <SelectValue placeholder="Select Account" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 font-mono text-xs">
                    {accounts.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {recurringFormState.type === 'TRANSFER' ? (
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">Destination Account</label>
                  <Select
                    value={recurringFormState.transferAccountId}
                    onValueChange={(val: any) => setRecurringFormState({ ...recurringFormState, transferAccountId: val })}
                  >
                    <SelectTrigger className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 h-9 text-xs font-mono">
                      <SelectValue placeholder="Destination Account" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 font-mono text-xs">
                      {accounts
                        .filter((a: any) => a.id !== recurringFormState.accountId)
                        .map((a: any) => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase tracking-wider text-[#787774] dark:text-zinc-500">Budget Category</label>
                  <Select
                    value={recurringFormState.categoryId}
                    onValueChange={(val: any) => setRecurringFormState({ ...recurringFormState, categoryId: val })}
                  >
                    <SelectTrigger className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 h-9 text-xs font-mono">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[#111111] dark:text-zinc-100 font-mono text-xs max-h-60 overflow-y-auto">
                      {categoryGroups.map((group: any) => (
                        <SelectGroup key={group.id}>
                          <SelectLabel className="px-2 py-1 text-[9px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-50 dark:bg-zinc-900/50">
                            {group.name}
                          </SelectLabel>
                          {group.categories?.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id} className="pl-4">
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsRecurringModalOpen(false)}
                className="rounded-none text-xs font-mono text-[#787774] dark:text-zinc-400 h-9 hover:bg-[#F7F6F3] dark:hover:bg-zinc-800"
              >Cancel</Button>
              <Button
                type="submit"
                className="rounded-none bg-[#111111] dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-[#333333] dark:hover:bg-zinc-200 text-xs font-mono h-9"
              >Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
