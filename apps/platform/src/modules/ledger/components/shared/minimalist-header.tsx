import React from 'react';
import { Badge } from '@atlas/ui/components/badge';
import { Button } from '@atlas/ui/components/button';
import {
  ChartBar,
  List,
  CreditCard,
  Coins,
  Shield,
  Clock,
  Envelope,
  SignOut,
  Vault,
} from '@phosphor-icons/react';

export type LedgerView =
  | 'dashboard'
  | 'budget'
  | 'transactions'
  | 'accounts'
  | 'goals'
  | 'subscriptions'
  | 'reports'
  | 'email-sync';

interface MinimalistHeaderProps {
  activeView: LedgerView;
  setActiveView: (view: LedgerView) => void;
  user: any;
  onLogout: () => void;
  readyToAssign?: number;
}

export function MinimalistHeader({
  activeView,
  setActiveView,
  user,
  onLogout,
  readyToAssign = 0,
}: MinimalistHeaderProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  const navItems: Array<{ id: LedgerView; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <ChartBar className="size-4" /> },
    { id: 'budget', label: 'Budget', icon: <Coins className="size-4" /> },
    { id: 'transactions', label: 'Transactions', icon: <List className="size-4" /> },
    { id: 'accounts', label: 'Accounts', icon: <CreditCard className="size-4" /> },
    { id: 'goals', label: 'Goals', icon: <Shield className="size-4" /> },
    { id: 'subscriptions', label: 'Subscriptions', icon: <Clock className="size-4" /> },
    { id: 'reports', label: 'Reports', icon: <Vault className="size-4" /> },
    { id: 'email-sync', label: 'Email Sync', icon: <Envelope className="size-4" /> },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-[#EAEAEA] bg-[#F7F6F3]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Brand & Platform Identity */}
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg border border-[#EAEAEA] bg-[#111111] text-white">
            <Coins className="size-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-sm font-semibold tracking-tight text-[#111111]">
                Atlas Ledger
              </span>
              <Badge
                variant="outline"
                className="border-[#EAEAEA] bg-[#F9F9F8] px-1.5 py-0 text-[10px] uppercase tracking-wider text-[#787774]"
              >
                Zero-Based
              </Badge>
            </div>
            <p className="text-[11px] font-medium text-[#787774]">
              Give every rupiah a purpose
            </p>
          </div>
        </div>

        {/* Dynamic Navigation */}
        <nav className="flex items-center gap-1 rounded-lg border border-[#EAEAEA] bg-[#FFFFFF] p-1 shadow-2xs">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#111111] text-white shadow-xs'
                    : 'text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.id === 'budget' && readyToAssign > 0 && (
                  <span className="ml-1 rounded-full bg-[#EDF3EC] px-1.5 py-0.2 text-[10px] font-mono font-semibold text-[#346538]">
                    {formatCurrency(readyToAssign)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2 border-r border-[#EAEAEA] pr-3">
              <div className="flex size-7 items-center justify-center rounded-full bg-[#111111] text-[11px] font-semibold text-white">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="hidden font-sans text-xs font-medium text-[#111111] md:inline">
                {user.name || user.email}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="h-8 gap-1.5 px-2.5 text-xs text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111]"
          >
            <SignOut className="size-3.5" />
            <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
