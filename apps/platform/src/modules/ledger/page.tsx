'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  useAuthControllerMe,
  useAuthControllerLogout,
  useTransactionsControllerFindAll,
  useTransactionsControllerCreate,
  useTransactionsControllerCreateBulk,
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
  useGoalsControllerFindAll,
  useGoalsControllerCreate,
  useGoalsControllerUpdate,
  useGoalsControllerRemove,
} from '@atlas/api-client';
import { useAuthStore } from '../../store/useAuthStore';
import { LedgerWorkspaceHeader } from './components/shared/ledger-workspace-header';
import { LedgerSidebarFilters, LedgerView } from './components/shared/ledger-sidebar-filters';
import { ReadyToAssignBanner } from './components/shared/ready-to-assign-banner';
import { KpiGrid } from './components/dashboard/kpi-grid';
import { CashFlowChart } from './components/dashboard/cash-flow-chart';
import { QuickActions } from './components/dashboard/quick-actions';
import { AccountList } from './components/accounts/account-list';
import { AddAccountDialog } from './components/accounts/add-account-dialog';
import { TransactionTable } from './components/transactions/transaction-table';
import { AddTransactionDialog } from './components/transactions/add-transaction-dialog';
import { CsvImportModal } from './components/transactions/csv-import-modal';
import { ZeroBasedBudgetGrid } from './components/budget/zero-based-budget-grid';
import { AssignMoneyModal } from './components/budget/assign-money-modal';
import { MoveBudgetDialog } from './components/budget/move-budget-dialog';
import { AddCategoryDialog } from './components/budget/add-category-dialog';
import { GoalGrid } from './components/goals/goal-grid';
import { AddGoalDialog } from './components/goals/add-goal-dialog';
import { SubscriptionList } from './components/subscriptions/subscription-list';
import { AddSubscriptionDialog } from './components/subscriptions/add-subscription-dialog';
import { IncomeExpenseReport } from './components/reports/income-expense-report';
import { toast } from 'sonner';
import { useConfirm } from '@atlas/ui/hooks/use-confirm';

export function LedgerDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { user, setUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  // Active View Tab State
  const [activeView, setActiveView] = useState<LedgerView>('dashboard');

  // Month & Year State
  const now = new Date();
  const [budgetMonth] = useState(now.getMonth() + 1);
  const [budgetYear] = useState(now.getFullYear());

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME' | 'TRANSFER'>('ALL');

  // Modal States
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<any | null>(null);

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<any | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<any | null>(null);

  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [subscriptionToEdit, setSubscriptionToEdit] = useState<any | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isMoveBudgetModalOpen, setIsMoveBudgetModalOpen] = useState(false);
  const [moveBudgetSourceId, setMoveBudgetSourceId] = useState<string | undefined>(undefined);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<
    'createGroup' | 'editGroup' | 'createCategory' | 'editCategory'
  >('createGroup');
  const [categoryModalParentGroupId, setCategoryModalParentGroupId] = useState<string | null>(null);
  const [categoryModalTargetItem, setCategoryModalTargetItem] = useState<any | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auth & Session Check
  const { data: meData, isLoading: isMeLoading } = useAuthControllerMe({
    query: { retry: false, enabled: true },
  });

  const logoutMutation = useAuthControllerLogout();

  useEffect(() => {
    if (!isMeLoading) {
      if ((meData as any)?.success && (meData as any)?.data) {
        setUser((meData as any).data);
      } else {
        setUser(null);
        router.push('/login');
      }
    }
  }, [meData, isMeLoading, setUser, router]);

  // Data Queries
  const { data: accountsData } = useAccountsControllerFindAll();
  const { data: categoryGroupsData } = useCategoryGroupsControllerFindAllGroups();
  const { data: budgetData } = useBudgetControllerGetBudget({ month: budgetMonth, year: budgetYear } as any);
  const { data: transactionsData } = useTransactionsControllerFindAll({
    type: typeFilter !== 'ALL' ? typeFilter : undefined,
    search: searchQuery || undefined,
  } as any);
  const { data: goalsData } = useGoalsControllerFindAll();
  const { data: subscriptionsData } = useSubscriptionsControllerFindAll();
  const { data: trendsData } = useBudgetControllerGetTrends({ limit: 6 } as any);

  const accounts = (accountsData as any)?.data || [];
  const categoryGroups = (categoryGroupsData as any)?.data || [];
  const budget = (budgetData as any)?.data || { summary: { readyToAssign: 0 }, groups: [] };
  const transactions = (transactionsData as any)?.data || [];
  const goals = (goalsData as any)?.data || goalsData || [];
  const subscriptions = (subscriptionsData as any)?.data || [];
  const trends = (trendsData as any)?.data || [];

  // Flatten categories for select dropdowns & calculations
  const allCategories = categoryGroups.flatMap((g: any) =>
    (g.categories || []).map((c: any) => ({ ...c, categoryGroup: g }))
  );

  const readyToAssign = budget?.summary?.readyToAssign ?? 0;
  const totalCash = accounts.filter((a: any) => a.isOnBudget).reduce((acc: number, a: any) => acc + (a.balance || 0), 0);
  const totalNetWorth = accounts.reduce((acc: number, a: any) => acc + (a.balance || 0), 0);

  const monthlyIncome = transactions
    .filter((t: any) => t.type === 'INCOME')
    .reduce((acc: number, t: any) => acc + (t.amount || 0), 0);

  const monthlyExpenses = transactions
    .filter((t: any) => t.type === 'EXPENSE')
    .reduce((acc: number, t: any) => acc + (t.amount || 0), 0);

  // Mutations
  const createAccountMutation = useAccountsControllerCreate();
  const updateAccountMutation = useAccountsControllerUpdate();
  const removeAccountMutation = useAccountsControllerRemove();

  const createTransactionMutation = useTransactionsControllerCreate();
  const updateTransactionMutation = useTransactionsControllerUpdate();
  const removeTransactionMutation = useTransactionsControllerRemove();
  const bulkCreateTransactionMutation = useTransactionsControllerCreateBulk();

  const updateBudgetEntryMutation = useBudgetControllerUpdateBudgetEntry();

  const createCategoryGroupMutation = useCategoryGroupsControllerCreateGroup();
  const updateCategoryGroupMutation = useCategoryGroupsControllerUpdateGroup();
  const removeCategoryGroupMutation = useCategoryGroupsControllerRemoveGroup();

  const createCategoryMutation = useCategoriesControllerCreateCategory();
  const updateCategoryMutation = useCategoriesControllerUpdateCategory();
  const removeCategoryMutation = useCategoriesControllerRemoveCategory();

  const createGoalMutation = useGoalsControllerCreate();
  const updateGoalMutation = useGoalsControllerUpdate();
  const removeGoalMutation = useGoalsControllerRemove();

  const createSubscriptionMutation = useSubscriptionsControllerCreate();
  const updateSubscriptionMutation = useSubscriptionsControllerUpdate();
  const removeSubscriptionMutation = useSubscriptionsControllerRemove();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setUser(null);
      router.push('/login');
    } catch {
      setUser(null);
      router.push('/login');
    }
  };

  // Handlers - Accounts
  const handleAccountSubmit = async (data: any) => {
    try {
      if (accountToEdit) {
        await updateAccountMutation.mutateAsync({ id: accountToEdit.id, data });
        toast.success('Account berhasil diperbarui!');
      } else {
        await createAccountMutation.mutateAsync({ data });
        toast.success('Account baru berhasil ditambahkan!');
      }
      setIsAccountModalOpen(false);
      setAccountToEdit(null);
      queryClient.invalidateQueries({ queryKey: ['/v1/accounts'] });
    } catch {
      toast.error('Gagal menyimpan account.');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Account',
      description: 'Apakah Anda yakin ingin menghapus account ini?',
    });
    if (!isConfirmed) return;
    try {
      await removeAccountMutation.mutateAsync({ id });
      toast.success('Account berhasil dihapus.');
      queryClient.invalidateQueries({ queryKey: ['/v1/accounts'] });
    } catch {
      toast.error('Gagal menghapus account.');
    }
  };

  // Handlers - Transactions
  const handleTransactionSubmit = async (data: any) => {
    try {
      if (transactionToEdit) {
        await updateTransactionMutation.mutateAsync({ id: transactionToEdit.id, data });
        toast.success('Transaksi berhasil diperbarui!');
      } else {
        await createTransactionMutation.mutateAsync({ data });
        toast.success('Transaksi baru berhasil dicatat!');
      }
      setIsTransactionModalOpen(false);
      setTransactionToEdit(null);
      queryClient.invalidateQueries({ queryKey: ['/v1/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/v1/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/v1/budget'] });
    } catch {
      toast.error('Gagal menyimpan transaksi.');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Transaksi',
      description: 'Apakah Anda yakin ingin menghapus transaksi ini?',
    });
    if (!isConfirmed) return;
    try {
      await removeTransactionMutation.mutateAsync({ id });
      toast.success('Transaksi berhasil dihapus.');
      queryClient.invalidateQueries({ queryKey: ['/v1/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/v1/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/v1/budget'] });
    } catch {
      toast.error('Gagal menghapus transaksi.');
    }
  };

  const handleImportBulkTransactions = async (txList: any[], accountId: string) => {
    try {
      const payload = txList.map((t) => ({
        title: t.title,
        amount: t.amount,
        type: t.type,
        date: t.date,
        accountId,
      }));
      await bulkCreateTransactionMutation.mutateAsync({ data: payload } as any);
      toast.success(`${txList.length} transaksi berhasil diimpor!`);
      queryClient.invalidateQueries({ queryKey: ['/v1/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/v1/accounts'] });
    } catch {
      toast.error('Gagal mengimpor transaksi dari CSV.');
    }
  };

  // Handlers - Budget & Zero-Based
  const handleUpdateAssigned = async (categoryId: string, assigned: number) => {
    try {
      await updateBudgetEntryMutation.mutateAsync({
        data: { categoryId, month: budgetMonth, year: budgetYear, assigned },
      });
      toast.success('Alokasi anggaran diperbarui.');
      queryClient.invalidateQueries({ queryKey: ['/v1/budget'] });
    } catch {
      toast.error('Gagal memperbarui anggaran.');
    }
  };

  const handleAssignMoneySubmit = async (categoryId: string, additionalAmount: number) => {
    const existing = allCategories.find((c: any) => c.id === categoryId);
    const newAssigned = (existing?.assigned || 0) + additionalAmount;
    await handleUpdateAssigned(categoryId, newAssigned);
  };

  const handleMoveBudgetSubmit = async (fromId: string, toId: string, amount: number) => {
    const fromCat = allCategories.find((c: any) => c.id === fromId);
    const toCat = allCategories.find((c: any) => c.id === toId);

    const newFromAssigned = Math.max(0, (fromCat?.assigned || 0) - amount);
    const newToAssigned = (toCat?.assigned || 0) + amount;

    await handleUpdateAssigned(fromId, newFromAssigned);
    await handleUpdateAssigned(toId, newToAssigned);
    toast.success('Anggaran berhasil dipindahkan (Rule 3)!');
  };

  // Handlers - Category & Category Groups
  const handleGroupSubmit = async (name: string, id?: string) => {
    try {
      if (id) {
        await updateCategoryGroupMutation.mutateAsync({ id, data: { name } });
        toast.success('Category group diperbarui.');
      } else {
        await createCategoryGroupMutation.mutateAsync({ data: { name } });
        toast.success('Category group baru ditambahkan.');
      }
      queryClient.invalidateQueries({ queryKey: ['/v1/category-groups'] });
      queryClient.invalidateQueries({ queryKey: ['/v1/budget'] });
    } catch {
      toast.error('Gagal menyimpan category group.');
    }
  };

  const handleCategorySubmit = async (name: string, groupId: string, targetAmount?: number, id?: string) => {
    try {
      if (id) {
        await updateCategoryMutation.mutateAsync({ id, data: { name, targetAmount } });
        toast.success('Kategori diperbarui.');
      } else {
        await createCategoryMutation.mutateAsync({
          data: { name, categoryGroupId: groupId, targetAmount },
        });
        toast.success('Kategori baru ditambahkan.');
      }
      queryClient.invalidateQueries({ queryKey: ['/v1/category-groups'] });
      queryClient.invalidateQueries({ queryKey: ['/v1/budget'] });
    } catch {
      toast.error('Gagal menyimpan kategori.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Kategori',
      description: 'Apakah Anda yakin ingin menghapus kategori ini?',
    });
    if (!isConfirmed) return;
    try {
      await removeCategoryMutation.mutateAsync({ id });
      toast.success('Kategori dihapus.');
      queryClient.invalidateQueries({ queryKey: ['/v1/category-groups'] });
      queryClient.invalidateQueries({ queryKey: ['/v1/budget'] });
    } catch {
      toast.error('Gagal menghapus kategori.');
    }
  };

  // Handlers - Goals
  const handleGoalSubmit = async (data: any) => {
    try {
      if (goalToEdit) {
        await updateGoalMutation.mutateAsync({ id: goalToEdit.id, data });
        toast.success('Goal diperbarui!');
      } else {
        await createGoalMutation.mutateAsync({ data });
        toast.success('Goal baru berhasil dibuat!');
      }
      setIsGoalModalOpen(false);
      setGoalToEdit(null);
      queryClient.invalidateQueries({ queryKey: ['/v1/goals'] });
    } catch {
      toast.error('Gagal menyimpan goal.');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Goal',
      description: 'Apakah Anda yakin ingin menghapus target finansial ini?',
    });
    if (!isConfirmed) return;
    try {
      await removeGoalMutation.mutateAsync({ id });
      toast.success('Goal berhasil dihapus.');
      queryClient.invalidateQueries({ queryKey: ['/v1/goals'] });
    } catch {
      toast.error('Gagal menghapus goal.');
    }
  };

  // Handlers - Subscriptions
  const handleSubscriptionSubmit = async (data: any) => {
    try {
      if (subscriptionToEdit) {
        await updateSubscriptionMutation.mutateAsync({ id: subscriptionToEdit.id, data });
        toast.success('Subskripsi diperbarui!');
      } else {
        await createSubscriptionMutation.mutateAsync({ data });
        toast.success('Subskripsi baru ditambahkan!');
      }
      setIsSubscriptionModalOpen(false);
      setSubscriptionToEdit(null);
      queryClient.invalidateQueries({ queryKey: ['/v1/subscriptions'] });
    } catch {
      toast.error('Gagal menyimpan subskripsi.');
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Subskripsi',
      description: 'Apakah Anda yakin ingin menghapus langganan ini?',
    });
    if (!isConfirmed) return;
    try {
      await removeSubscriptionMutation.mutateAsync({ id });
      toast.success('Subskripsi dihapus.');
      queryClient.invalidateQueries({ queryKey: ['/v1/subscriptions'] });
    } catch {
      toast.error('Gagal menghapus subskripsi.');
    }
  };

  if (!mounted || isMeLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-canvas">
        <div className="flex flex-col items-center gap-2 text-xs text-brand-muted font-mono">
          <div className="size-6 animate-spin rounded-none border-2 border-brand-charcoal border-t-transparent" />
          <span>Memuat Atlas Ledger...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-brand-canvas overflow-hidden">
      {/* Pinned Top Workspace Nav Header */}
      <div className="shrink-0 px-4 md:px-12 pt-6 pb-4 border-b border-brand-border bg-brand-canvas z-30">
        <div className="max-w-8xl mx-auto">
          <LedgerWorkspaceHeader user={user} onLogout={handleLogout} />
        </div>
      </div>

      {/* Main Body Layout Container */}
      <div className="flex-1 overflow-hidden px-4 md:px-12 py-6">
        <div className="max-w-8xl mx-auto h-full grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* Left Pinned Sidebar (1 col) */}
          <aside className="md:col-span-1 h-full overflow-y-auto pr-2">
            <LedgerSidebarFilters
              activeView={activeView}
              setActiveView={setActiveView}
              readyToAssign={readyToAssign}
              onImportCsv={() => setIsImportModalOpen(true)}
              accountsCount={accounts.length}
              transactionsCount={transactions.length}
              goalsCount={goals.length}
            />
          </aside>

          {/* Main Independent Scrollable Content Area (3 cols) */}
          <section className="md:col-span-3 h-full overflow-y-auto pr-2 space-y-6">
            {/* YNAB Ready to Assign Banner */}
            <ReadyToAssignBanner
              readyToAssign={readyToAssign}
              onOpenAssignModal={() => setIsAssignModalOpen(true)}
            />

            {/* View Switcher */}
            {activeView === 'dashboard' && (
              <div className="flex flex-col gap-6">
                <QuickActions
                  onAddTransaction={() => {
                    setTransactionToEdit(null);
                    setIsTransactionModalOpen(true);
                  }}
                  onAssignMoney={() => setIsAssignModalOpen(true)}
                  onAddGoal={() => {
                    setGoalToEdit(null);
                    setIsGoalModalOpen(true);
                  }}
                  onImportCsv={() => setIsImportModalOpen(true)}
                />
                <KpiGrid
                  totalNetWorth={totalNetWorth}
                  totalCash={totalCash}
                  monthlyIncome={monthlyIncome}
                  monthlyExpenses={monthlyExpenses}
                  readyToAssign={readyToAssign}
                  budgetRemaining={readyToAssign}
                />
                <CashFlowChart trendsData={trends} categoryData={[]} />
              </div>
            )}

            {activeView === 'budget' && (
              <ZeroBasedBudgetGrid
                groups={budget.groups || []}
                readyToAssign={readyToAssign}
                budgetMonth={budgetMonth}
                budgetYear={budgetYear}
                onUpdateAssigned={handleUpdateAssigned}
                onOpenAssignModal={() => setIsAssignModalOpen(true)}
                onOpenMoveBudgetModal={(srcId) => {
                  setMoveBudgetSourceId(srcId);
                  setIsMoveBudgetModalOpen(true);
                }}
                onAddCategoryGroup={() => {
                  setCategoryModalMode('createGroup');
                  setCategoryModalTargetItem(null);
                  setIsCategoryModalOpen(true);
                }}
                onAddCategory={(groupId) => {
                  setCategoryModalMode('createCategory');
                  setCategoryModalParentGroupId(groupId);
                  setCategoryModalTargetItem(null);
                  setIsCategoryModalOpen(true);
                }}
                onEditCategory={(cat) => {
                  setCategoryModalMode('editCategory');
                  setCategoryModalTargetItem(cat);
                  setIsCategoryModalOpen(true);
                }}
                onDeleteCategory={handleDeleteCategory}
              />
            )}

            {activeView === 'transactions' && (
              <TransactionTable
                transactions={transactions}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                onAddTransaction={() => {
                  setTransactionToEdit(null);
                  setIsTransactionModalOpen(true);
                }}
                onEditTransaction={(tx) => {
                  setTransactionToEdit(tx);
                  setIsTransactionModalOpen(true);
                }}
                onDeleteTransaction={handleDeleteTransaction}
                onImportCsv={() => setIsImportModalOpen(true)}
              />
            )}

            {activeView === 'accounts' && (
              <AccountList
                accounts={accounts}
                onAddAccount={() => {
                  setAccountToEdit(null);
                  setIsAccountModalOpen(true);
                }}
                onEditAccount={(acc) => {
                  setAccountToEdit(acc);
                  setIsAccountModalOpen(true);
                }}
                onDeleteAccount={handleDeleteAccount}
              />
            )}

            {activeView === 'goals' && (
              <GoalGrid
                goals={goals}
                onAddGoal={() => {
                  setGoalToEdit(null);
                  setIsGoalModalOpen(true);
                }}
                onEditGoal={(g) => {
                  setGoalToEdit(g);
                  setIsGoalModalOpen(true);
                }}
                onDeleteGoal={handleDeleteGoal}
              />
            )}

            {activeView === 'subscriptions' && (
              <SubscriptionList
                subscriptions={subscriptions}
                onAddSubscription={() => {
                  setSubscriptionToEdit(null);
                  setIsSubscriptionModalOpen(true);
                }}
                onEditSubscription={(sub) => {
                  setSubscriptionToEdit(sub);
                  setIsSubscriptionModalOpen(true);
                }}
                onDeleteSubscription={handleDeleteSubscription}
              />
            )}

            {activeView === 'reports' && (
              <IncomeExpenseReport
                trends={trends}
                totalIncome={monthlyIncome}
                totalExpense={monthlyExpenses}
              />
            )}
          </section>
        </div>
      </div>

      {/* Dialog Modals */}
      <AddAccountDialog
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSubmit={handleAccountSubmit}
        accountToEdit={accountToEdit}
      />

      <AddTransactionDialog
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSubmit={handleTransactionSubmit}
        transactionToEdit={transactionToEdit}
        accounts={accounts}
        categories={allCategories}
      />

      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        accounts={accounts}
        onImportBulk={handleImportBulkTransactions}
      />

      <AssignMoneyModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        readyToAssign={readyToAssign}
        categories={allCategories}
        onAssignSubmit={handleAssignMoneySubmit}
      />

      <MoveBudgetDialog
        isOpen={isMoveBudgetModalOpen}
        onClose={() => setIsMoveBudgetModalOpen(false)}
        categories={allCategories}
        initialSourceId={moveBudgetSourceId}
        onMoveBudgetSubmit={handleMoveBudgetSubmit}
      />

      <AddCategoryDialog
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        mode={categoryModalMode}
        parentGroupId={categoryModalParentGroupId}
        targetItem={categoryModalTargetItem}
        onSubmitGroup={handleGroupSubmit}
        onSubmitCategory={handleCategorySubmit}
      />

      <AddGoalDialog
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSubmit={handleGoalSubmit}
        goalToEdit={goalToEdit}
      />

      <AddSubscriptionDialog
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onSubmit={handleSubscriptionSubmit}
        subscriptionToEdit={subscriptionToEdit}
      />
    </div>
  );
}
