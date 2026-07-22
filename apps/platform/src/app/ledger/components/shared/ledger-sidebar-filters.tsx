import React from 'react';
import Link from 'next/link';
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
  readyToAssign?: number;
  onImportCsv: () => void;
  accountsCount?: number;
  transactionsCount?: number;
  goalsCount?: number;
}

export function LedgerSidebarFilters({
  activeView,
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
    <aside className="space-y-6">
      {/* Overview Group */}
      <div className="space-y-1">
        <h3 className="text-[10px] font-mono text-brand-muted uppercase tracking-wider px-2">
          Overview
        </h3>
        <Link
          href="/ledger/dashboard"
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
        </Link>

        <Link
          href="/ledger/reports"
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
        </Link>
      </div>

      {/* Zero-Based Budget Group */}
      <div className="space-y-1">
        <h3 className="text-[10px] font-mono text-brand-muted uppercase tracking-wider px-2">
          Budgeting
        </h3>
        <Link
          href="/ledger/budget"
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
            <span className="font-mono text-[9px] px-1.5 py-0.2 bg-[#EDF3EC] text-[#346538] font-bold">
              {formatCurrency(readyToAssign)}
            </span>
          )}
        </Link>
      </div>

      {/* Ledger Data Group */}
      <div className="space-y-1">
        <h3 className="text-[10px] font-mono text-brand-muted uppercase tracking-wider px-2">
          Ledger Data
        </h3>
        <Link
          href="/ledger/transactions"
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
            <span className="font-mono text-[10px] text-brand-muted">
              {transactionsCount}
            </span>
          )}
        </Link>

        <Link
          href="/ledger/accounts"
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
            <span className="font-mono text-[10px] text-brand-muted">{accountsCount}</span>
          )}
        </Link>
      </div>

      {/* Planning Group */}
      <div className="space-y-1">
        <h3 className="text-[10px] font-mono text-brand-muted uppercase tracking-wider px-2">
          Planning
        </h3>
        <Link
          href="/ledger/goals"
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
            <span className="font-mono text-[10px] text-brand-muted">{goalsCount}</span>
          )}
        </Link>

        <Link
          href="/ledger/subscriptions"
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
        </Link>
      </div>

      {/* Quick Sync / Utilities */}
      <div className="pt-4 border-t border-brand-border space-y-2">
        <h3 className="text-[10px] font-mono text-brand-muted uppercase tracking-wider px-2">
          Sync
        </h3>
        <Button
          onClick={onImportCsv}
          variant="outline"
          className="w-full justify-start gap-2 h-8 rounded-none border-brand-border text-xs text-brand-charcoal hover:bg-brand-charcoal/5"
        >
          <UploadSimple className="w-3.5 h-3.5" />
          <span>Import CSV</span>
        </Button>
      </div>
    </aside>
  );
}
