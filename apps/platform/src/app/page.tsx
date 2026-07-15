'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useAuthControllerMe,
  useAuthControllerLogout,
  useFoldersControllerFindAll,
  useBookmarksControllerFindAll,
  useTransactionsControllerFindAll,
  useSubscriptionsControllerFindAll,
} from '@atlas/api-client';
import { useAuthStore } from '../store/useAuthStore';
import { Card } from '@atlas/ui/components/card';
import { Button } from '@atlas/ui/components/button';
import { Badge } from '@atlas/ui/components/badge';
import {
  BookmarkSimple,
  Coins,
  Clock,
  ArrowRight,
  SignOut,
  FolderSimple,
  CreditCard,
  User,
} from '@phosphor-icons/react';

export const dynamic = 'force-dynamic';

export default function HomePortalPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  // Clock ticks
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Current User
  const { data: meData, isLoading: isMeLoading } = useAuthControllerMe({
    query: {
      retry: false,
      enabled: true,
    },
  });

  // Sync session
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

  // Fetch Cabinet Stats
  const { data: foldersData } = useFoldersControllerFindAll({
    query: { enabled: !!user },
  });
  const { data: bookmarksData } = useBookmarksControllerFindAll(undefined, {
    query: { enabled: !!user },
  });

  // Fetch Ledger Stats
  const { data: transactionsData } = useTransactionsControllerFindAll(undefined, {
    query: { enabled: !!user },
  });
  const { data: subscriptionsData } = useSubscriptionsControllerFindAll(undefined, {
    query: { enabled: !!user },
  });

  const logoutMutation = useAuthControllerLogout();

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

  // Calculations for Cabinet
  const totalFolders = (foldersData as any)?.data?.length || 0;
  const totalBookmarks = (bookmarksData as any)?.data?.filter((b: any) => !b.deletedAt).length || 0;

  // Calculations for Ledger
  const transactions = (transactionsData as any)?.data || [];
  const subscriptions = (subscriptionsData as any)?.data || [];

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

  const totalActiveSubscriptions = subscriptions.filter((s: any) => s.status === 'ACTIVE').length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(val);
  };

  if (isLoading || isMeLoading || !user) {
    return (
      <div className="min-h-[100dvh] bg-brand-canvas flex flex-col items-center justify-center font-mono text-xs text-[#787774] space-y-4 select-none">
        <Clock className="w-6 h-6 animate-spin text-[#111111]" />
        <span>Loading Gustam Platform Portal...</span>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-brand-canvas flex flex-col justify-between py-12 px-4 md:px-12 select-none font-mono">
      {/* Top Bar: Portal Greeting & Profile */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between border-b border-brand-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#111111] animate-pulse rounded-none" />
            <h1 className="text-sm font-semibold uppercase tracking-widest text-[#111111]">
              Gustam Portal
            </h1>
          </div>
          <p className="text-[10px] text-[#787774] uppercase">
            Productivity Suite Hub
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right text-[10px] text-[#787774] hidden sm:block">
            <p className="font-semibold text-[#111111]">{user.name}</p>
            <p className="text-[9px]">{user.email}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1.5 font-semibold text-[10px] tracking-tight uppercase rounded-none border-brand-border"
          >
            <SignOut className="w-3.5 h-3.5" />
            Sign out
          </Button>
        </div>
      </div>

      {/* Main Content: Hub Grid Picker */}
      <div className="max-w-4xl w-full mx-auto py-12 space-y-10 flex-1 flex flex-col justify-center">
        {/* Asymmetric Header */}
        <div className="space-y-3 max-w-xl">
          <div className="text-[10px] uppercase text-[#787774] tracking-widest flex items-center gap-2">
            <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
            <span>·</span>
            <span>{currentTime}</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-[#111111] font-medium tracking-tight leading-tight">
            Select a workspace to continue your focus session
          </h2>
        </div>

        {/* Dashboard Grid Picker */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Cabinet Bookmark Vault */}
          <div
            onClick={() => router.push('/cabinet')}
            className="group cursor-pointer border border-brand-border bg-white rounded-none p-6 hover:border-[#111111] hover:shadow-xs transition-all duration-200 flex flex-col justify-between min-h-60"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-[#111111]/5 flex items-center justify-center text-[#111111]">
                  <BookmarkSimple className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="text-[9px] uppercase px-2 py-0.5 tracking-wider font-mono">
                  Module 01
                </Badge>
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-2xl font-semibold tracking-tight text-[#111111]">
                  Cabinet
                </h3>
                <p className="text-xs text-[#787774]">
                  Personal knowledge vault, bookmark manager, and tag taxonomies.
                </p>
              </div>
            </div>

            {/* Live Data Summary for Cabinet */}
            <div className="border-t border-[#111111]/5 pt-4 mt-6 flex items-center justify-between">
              <div className="flex gap-4 text-[10px] text-[#787774]">
                <div className="space-y-0.5">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wide">Bookmarks</span>
                  <span className="font-semibold text-[#111111] flex items-center gap-1">
                    <BookmarkSimple className="w-3.5 h-3.5" />
                    {totalBookmarks} saved
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wide">Folders</span>
                  <span className="font-semibold text-[#111111] flex items-center gap-1">
                    <FolderSimple className="w-3.5 h-3.5" />
                    {totalFolders} folders
                  </span>
                </div>
              </div>

              <div className="w-7 h-7 border border-brand-border flex items-center justify-center text-[#787774] group-hover:bg-[#111111] group-hover:text-white group-hover:border-[#111111] transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Card 2: Ledger Financial Vault */}
          <div
            onClick={() => router.push('/ledger')}
            className="group cursor-pointer border border-brand-border bg-white rounded-none p-6 hover:border-[#111111] hover:shadow-xs transition-all duration-200 flex flex-col justify-between min-h-60"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-[#111111]/5 flex items-center justify-center text-[#111111]">
                  <Coins className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="text-[9px] uppercase px-2 py-0.5 tracking-wider font-mono">
                  Module 02
                </Badge>
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-2xl font-semibold tracking-tight text-[#111111]">
                  Ledger
                </h3>
                <p className="text-xs text-[#787774]">
                  Personal finance, cashflow margins, and active recurring subscriptions.
                </p>
              </div>
            </div>

            {/* Live Data Summary for Ledger */}
            <div className="border-t border-[#111111]/5 pt-4 mt-6 flex items-center justify-between">
              <div className="flex gap-4 text-[10px] text-[#787774]">
                <div className="space-y-0.5">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wide">Cash Flow</span>
                  <span className={`font-semibold flex items-center gap-0.5 ${
                    netCashFlow >= 0 ? 'text-[#1e4620]' : 'text-[#5f2120]'
                  }`}>
                    {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wide">Subscriptions</span>
                  <span className="font-semibold text-[#111111] flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    {totalActiveSubscriptions} active
                  </span>
                </div>
              </div>

              <div className="w-7 h-7 border border-brand-border flex items-center justify-center text-[#787774] group-hover:bg-[#111111] group-hover:text-white group-hover:border-[#111111] transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Details */}
      <div className="max-w-5xl w-full mx-auto border-t border-brand-border pt-6 flex flex-col sm:flex-row justify-between text-[9px] text-[#787774] uppercase tracking-wider gap-4">
        <span>Gustam Platform v1.0 · Personal Workspaces</span>
        <span className="flex items-center gap-1">
          <User className="w-3 h-3" />
          Seeded Single-User Authorization Active
        </span>
      </div>
    </div>
  );
}
