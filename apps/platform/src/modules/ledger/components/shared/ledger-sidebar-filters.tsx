import React from 'react';
import { Button } from '@atlas/ui/components/button';
import {
  ChartBar,
  List,
  CreditCard,
  Coins,
  Shield,
  Clock,
  UploadSimple,
  Vault,
} from '@phosphor-icons/react';

export type LedgerView =
  | 'dashboard'
  | 'budget'
  | 'transactions'
  | 'accounts'
  | 'goals'
  | 'subscriptions'
  | 'reports';

interface LedgerSidebarFiltersProps {
  activeView: LedgerView;
  setActiveView: (view: LedgerView) => void;
  readyToAssign?: number;
  onImportCsv: () => void;
  accountsCount?: number;
  transactionsCount?: number;
  goalsCount?: number;
}

export function LedgerSidebarFilters({
  activeView,
  setActiveView,
  readyToAssign = 0,
  onImportCsv,
  accountsCount = 0,
  transactionsCount = 0,
  goalsCount = 0,
}: LedgerSidebarFiltersProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <aside className="md:col-span-1 space-y-6">
      {/* Overview Group */}
      <div className="space-y-1">
        <h3 className="text-[10px] font-mono text-brand-muted uppercase tracking-wider px-2">
          Overview
        </h3>
        <button
          onClick={() => setActiveView('dashboard')}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-none text-xs transition-colors text-left ${
            activeView === 'dashboard'
              ? 'bg-brand-charcoal/5 text-brand-charcoal font-semibold'
              : 'text-brand-muted hover:bg-brand-charcoal/5 hover:text-brand-charcoal'
          }`}
        >
          <span className="flex items-center gap-2">
            <ChartBar className="w-3.5 h-3.5" />
            Dashboard
          </span>
        </button>

        <button
          onClick={() => setActiveView('reports')}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-none text-xs transition-colors text-left ${
            activeView === 'reports'
              ? 'bg-brand-charcoal/5 text-brand-charcoal font-semibold'
              : 'text-brand-muted hover:bg-brand-charcoal/5 hover:text-brand-charcoal'
          }`}
        >
          <span className="flex items-center gap-2">
            <Vault className="w-3.5 h-3.5" />
            Cash Flow & Reports
          </span>
        </button>
      </div>

      {/* Zero-Based Budget Group */}
      <div className="space-y-1">
        <h3 className="text-[10px] font-mono text-brand-muted uppercase tracking-wider px-2">
          Budgeting
        </h3>
        <button
          onClick={() => setActiveView('budget')}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-none text-xs transition-colors text-left ${
            activeView === 'budget'
              ? 'bg-brand-charcoal/5 text-brand-charcoal font-semibold'
              : 'text-brand-muted hover:bg-brand-charcoal/5 hover:text-brand-charcoal'
          }`}
        >
          <span className="flex items-center gap-2">
            <Coins className="w-3.5 h-3.5" />
            Zero-Based Budget
          </span>
          {readyToAssign > 0 && (
            <span className="font-mono text-[9px] px-1 text-emerald-700 bg-emerald-50 border border-emerald-200">
              {formatCurrency(readyToAssign)}
            </span>
          )}
        </button>
      </div>

      {/* Transactions & Accounts Group */}
      <div className="space-y-1">
        <h3 className="text-[10px] font-mono text-brand-muted uppercase tracking-wider px-2">
          Ledger Data
        </h3>
        <button
          onClick={() => setActiveView('transactions')}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-none text-xs transition-colors text-left ${
            activeView === 'transactions'
              ? 'bg-brand-charcoal/5 text-brand-charcoal font-semibold'
              : 'text-brand-muted hover:bg-brand-charcoal/5 hover:text-brand-charcoal'
          }`}
        >
          <span className="flex items-center gap-2">
            <List className="w-3.5 h-3.5" />
            Transactions
          </span>
          {transactionsCount > 0 && (
            <span className="text-brand-muted/70 font-mono text-[10px] px-1">
              {transactionsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveView('accounts')}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-none text-xs transition-colors text-left ${
            activeView === 'accounts'
              ? 'bg-brand-charcoal/5 text-brand-charcoal font-semibold'
              : 'text-brand-muted hover:bg-brand-charcoal/5 hover:text-brand-charcoal'
          }`}
        >
          <span className="flex items-center gap-2">
            <CreditCard className="w-3.5 h-3.5" />
            Accounts
          </span>
          {accountsCount > 0 && (
            <span className="text-brand-muted/70 font-mono text-[10px] px-1">
              {accountsCount}
            </span>
          )}
        </button>
      </div>

      {/* Goals & Subscriptions Group */}
      <div className="space-y-1">
        <h3 className="text-[10px] font-mono text-brand-muted uppercase tracking-wider px-2">
          Planning
        </h3>
        <button
          onClick={() => setActiveView('goals')}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-none text-xs transition-colors text-left ${
            activeView === 'goals'
              ? 'bg-brand-charcoal/5 text-brand-charcoal font-semibold'
              : 'text-brand-muted hover:bg-brand-charcoal/5 hover:text-brand-charcoal'
          }`}
        >
          <span className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            Financial Goals
          </span>
          {goalsCount > 0 && (
            <span className="text-brand-muted/70 font-mono text-[10px] px-1">
              {goalsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveView('subscriptions')}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-none text-xs transition-colors text-left ${
            activeView === 'subscriptions'
              ? 'bg-brand-charcoal/5 text-brand-charcoal font-semibold'
              : 'text-brand-muted hover:bg-brand-charcoal/5 hover:text-brand-charcoal'
          }`}
        >
          <span className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Subscriptions
          </span>
        </button>
      </div>

      {/* Import & Export Sync */}
      <div className="border-t border-brand-border pt-4 px-2 space-y-2">
        <h3 className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">
          Sync
        </h3>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onImportCsv}
            className="w-full flex items-center gap-1.5 justify-center font-mono text-[10px] uppercase h-8 rounded-none border-brand-border"
          >
            <UploadSimple className="w-3.5 h-3.5" />
            Import CSV
          </Button>
        </div>
      </div>
    </aside>
  );
}
