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
  EnvelopeSimple,
} from '@phosphor-icons/react';
import {
  WorkspaceSidebar,
  WorkspaceSidebarGroup,
  WorkspaceSidebarItem,
} from '@/components/workspace-sidebar';

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
  onSyncEmail?: () => void;
  accountsCount?: number;
  transactionsCount?: number;
  goalsCount?: number;
}

export function LedgerSidebarFilters({
  activeView,
  readyToAssign = 0,
  onImportCsv,
  onSyncEmail,
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
    <WorkspaceSidebar>
      {/* Overview Group */}
      <WorkspaceSidebarGroup title="Overview">
        <Link href="/ledger/dashboard" className="block w-full">
          <WorkspaceSidebarItem
            icon={<ChartBar className="w-3.5 h-3.5" />}
            label="Dashboard"
            isActive={activeView === 'dashboard'}
          />
        </Link>

        <Link href="/ledger/reports" className="block w-full">
          <WorkspaceSidebarItem
            icon={<Vault className="w-3.5 h-3.5" />}
            label="Cash Flow & Reports"
            isActive={activeView === 'reports'}
          />
        </Link>
      </WorkspaceSidebarGroup>

      {/* Zero-Based Budget Group */}
      <WorkspaceSidebarGroup title="Budgeting">
        <Link href="/ledger/budget" className="block w-full">
          <WorkspaceSidebarItem
            icon={<Coins className="w-3.5 h-3.5" />}
            label="Zero-Based Budget"
            isActive={activeView === 'budget'}
            badge={
              readyToAssign > 0 ? (
                <span className="font-mono text-[9px] px-1.5 py-0.2 bg-[#EDF3EC] text-[#346538] font-bold">
                  {formatCurrency(readyToAssign)}
                </span>
              ) : undefined
            }
          />
        </Link>
      </WorkspaceSidebarGroup>

      {/* Ledger Data Group */}
      <WorkspaceSidebarGroup title="Ledger Data">
        <Link href="/ledger/transactions" className="block w-full">
          <WorkspaceSidebarItem
            icon={<List className="w-3.5 h-3.5" />}
            label="Transactions"
            isActive={activeView === 'transactions'}
            badge={transactionsCount > 0 ? transactionsCount : undefined}
          />
        </Link>

        <Link href="/ledger/accounts" className="block w-full">
          <WorkspaceSidebarItem
            icon={<CreditCard className="w-3.5 h-3.5" />}
            label="Accounts"
            isActive={activeView === 'accounts'}
            badge={accountsCount > 0 ? accountsCount : undefined}
          />
        </Link>
      </WorkspaceSidebarGroup>

      {/* Planning Group */}
      <WorkspaceSidebarGroup title="Planning">
        <Link href="/ledger/goals" className="block w-full">
          <WorkspaceSidebarItem
            icon={<Shield className="w-3.5 h-3.5" />}
            label="Financial Goals"
            isActive={activeView === 'goals'}
            badge={goalsCount > 0 ? goalsCount : undefined}
          />
        </Link>

        <Link href="/ledger/subscriptions" className="block w-full">
          <WorkspaceSidebarItem
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Subscriptions"
            isActive={activeView === 'subscriptions'}
          />
        </Link>
      </WorkspaceSidebarGroup>

      {/* Quick Sync / Utilities Group */}
      <WorkspaceSidebarGroup title="Sync & Import">
        <div className="flex flex-col gap-2 pt-1">
          <Button
            onClick={onSyncEmail}
            variant="outline"
            className="w-full justify-start gap-2 h-8 rounded-none border-brand-border text-xs text-brand-charcoal hover:bg-brand-charcoal/5"
          >
            <EnvelopeSimple className="w-3.5 h-3.5" />
            <span>Sync Email</span>
          </Button>
          <Button
            onClick={onImportCsv}
            variant="outline"
            className="w-full justify-start gap-2 h-8 rounded-none border-brand-border text-xs text-brand-charcoal hover:bg-brand-charcoal/5"
          >
            <UploadSimple className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </Button>
        </div>
      </WorkspaceSidebarGroup>
    </WorkspaceSidebar>
  );
}
