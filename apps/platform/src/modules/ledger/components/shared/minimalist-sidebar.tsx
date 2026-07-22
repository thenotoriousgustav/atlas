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
  List as MenuIcon,
  X as CloseIcon,
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

interface MinimalistSidebarProps {
  activeView: LedgerView;
  setActiveView: (view: LedgerView) => void;
  user: any;
  onLogout: () => void;
  readyToAssign?: number;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function MinimalistSidebar({
  activeView,
  setActiveView,
  user,
  onLogout,
  readyToAssign = 0,
  mobileOpen,
  setMobileOpen,
}: MinimalistSidebarProps) {
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
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-[#111111]/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed bottom-0 top-0 z-50 flex w-64 flex-col border-r border-[#EAEAEA] bg-[#FFFFFF] transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & App Title */}
        <div className="flex h-16 items-center justify-between border-b border-[#EAEAEA] px-5">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-none border border-[#EAEAEA] bg-[#111111] text-white">
              <Coins className="size-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-sans text-sm font-bold tracking-tight text-[#111111]">
                  Atlas Ledger
                </span>
              </div>
              <p className="text-[10px] font-medium text-[#787774]">
                Zero-Based Finance
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="flex size-7 items-center justify-center rounded-none text-[#787774] hover:bg-[#F7F6F3] md:hidden"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>

        {/* Ready to Assign Mini-Widget in Sidebar */}
        <div className="p-4">
          <div className="flex flex-col gap-1.5 rounded-none border border-[#EAEAEA] bg-[#F7F6F3] p-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#787774]">
              Ready to Assign
            </span>
            <span className="font-mono text-sm font-bold text-[#346538]">
              {formatCurrency(readyToAssign)}
            </span>
          </div>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 space-y-1 px-3 py-2">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setMobileOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-none px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#111111] text-white shadow-2xs'
                    : 'text-[#787774] hover:bg-[#F7F6F3] hover:text-[#111111]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.id === 'budget' && readyToAssign > 0 && (
                  <span className="size-2 rounded-none bg-[#346538]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Footer Section */}
        <div className="border-t border-[#EAEAEA] p-4">
          {user && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-none bg-[#111111] text-xs font-bold text-white">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex flex-col truncate">
                  <span className="truncate text-xs font-semibold text-[#111111]">
                    {user.name || user.email}
                  </span>
                  <span className="truncate text-[10px] text-[#787774]">
                    {user.email}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                className="size-8 shrink-0 rounded-none text-[#787774] hover:bg-[#FDEBEC] hover:text-[#9F2F2D]"
              >
                <SignOut className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
