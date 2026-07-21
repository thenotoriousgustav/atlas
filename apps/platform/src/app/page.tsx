'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  useAuthControllerMe,
  useAuthControllerLogout,
  useFoldersControllerFindAll,
  useBookmarksControllerFindAll,
  useTransactionsControllerFindAll,
  useSubscriptionsControllerFindAll,
  useVehiclesControllerFindAll,
  useRemindersControllerFindAll,
  useFetchControllerGetHistory,
} from '@atlas/api-client';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '@atlas/ui/components/button';
import { Badge } from '@atlas/ui/components/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  BookmarkSimple,
  Coins,
  Clock,
  ArrowRight,
  SignOut,
  FolderSimple,
  CreditCard,
  User,
  GasPump,
  Gauge,
  Wrench,
  Download,
  Heart,
  Fingerprint,
} from '@phosphor-icons/react';
import { startRegistration } from '@simplewebauthn/browser';

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

  // Fetch Garage Stats
  const { data: vehiclesData } = useVehiclesControllerFindAll({
    query: { enabled: !!user },
  });
  const { data: remindersData } = useRemindersControllerFindAll(undefined, {
    query: { enabled: !!user },
  });

  // Fetch Fetch Stats
  const { data: fetchHistoryData } = useFetchControllerGetHistory(undefined, {
    query: { enabled: !!user },
  });

  const queryClient = useQueryClient();
  const logoutMutation = useAuthControllerLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      queryClient.clear();
      logout();
      router.push('/login');
    } catch {
      queryClient.clear();
      logout();
      router.push('/login');
    }
  };

  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);

  // Check if current user has passkeys registered
  useEffect(() => {
    if (user?.email) {
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/v1/auth/passkey/check?email=${encodeURIComponent(user.email)}`,
        {
          credentials: 'include',
        }
      )
        .then((res) => res.json())
        .then((data) => {
          setHasPasskey(data?.data?.hasPasskey || false);
        })
        .catch(() => {});
    }
  }, [user]);

  const handleRegisterPasskey = async () => {
    setIsRegisteringPasskey(true);
    try {
      const optionsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/v1/auth/passkey/register-options`,
        {
          credentials: 'include',
        }
      );
      if (!optionsRes.ok) {
        throw new Error('Failed to load passkey registration options');
      }
      const options = await optionsRes.json();

      const registrationJSON = await startRegistration({ optionsJSON: options.data });

      const verifyRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/v1/auth/passkey/register-verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            response: registrationJSON,
          }),
        }
      );

      if (!verifyRes.ok) {
        throw new Error('Passkey verification failed');
      }

      setHasPasskey(true);
      alert('Passkey successfully registered on this device!');
    } catch (err: any) {
      alert(`Passkey registration failed: ${err.message}`);
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  // Calculations for Cabinet
  const totalFolders = (foldersData as any)?.data?.length || 0;
  const totalBookmarks =
    ((bookmarksData as any)?.data?.data || (bookmarksData as any)?.data || [])
      .filter((b: any) => !b.deletedAt).length || 0;

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

  // Calculations for Garage
  const totalVehicles = (vehiclesData as any)?.data?.length || 0;
  const totalActiveReminders = (remindersData as any)?.data?.filter((r: any) => r.status === 'ACTIVE').length || 0;

  // Calculations for Fetch
  const totalDownloads = (fetchHistoryData as any)?.data?.length || 0;
  const totalFavoriteDownloads = (fetchHistoryData as any)?.data?.filter((i: any) => i.isFavorite).length || 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(val);
  };

  if (isLoading || isMeLoading || !user) {
    return (
      <div className="min-h-[100dvh] bg-brand-canvas flex flex-col items-center justify-center font-mono text-xs text-brand-muted space-y-4 select-none">
        <Clock className="w-6 h-6 animate-spin text-brand-charcoal" />
        <span>Loading Gustam Platform Portal...</span>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-brand-canvas flex flex-col justify-between py-12 px-4 md:px-12 select-none font-mono">
      {/* Top Bar: Portal Greeting & Profile */}
      <div className="max-w-8xl w-full mx-auto flex items-center justify-between border-b border-brand-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-brand-charcoal animate-pulse rounded-none" />
            <h1 className="text-sm font-semibold uppercase tracking-widest text-brand-charcoal">
              Atlas
            </h1>
          </div>
          <p className="text-[10px] text-brand-muted uppercase">
            Productivity Suite Hub
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right text-[10px] text-brand-muted hidden sm:block">
            <p className="font-semibold text-brand-charcoal">{user.name}</p>
            <p className="text-[9px]">{user.email}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegisterPasskey}
            disabled={isRegisteringPasskey}
            className="flex items-center gap-1.5 font-semibold text-[10px] tracking-tight uppercase rounded-none border-brand-border text-brand-charcoal"
          >
            <Fingerprint className="w-3.5 h-3.5" />
            {isRegisteringPasskey ? 'Registering...' : hasPasskey ? 'Passkey Registered' : 'Setup Passkey'}
          </Button>
          <ThemeToggle />
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
      <div className="max-w-8xl w-full mx-auto py-12 space-y-10 flex-1 flex flex-col justify-center">
        {/* Asymmetric Header */}
        <div className="space-y-3 max-w-xl">
          <div className="text-[10px] uppercase text-brand-muted tracking-widest flex items-center gap-2">
            <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
            <span>·</span>
            <span>{currentTime}</span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl text-brand-charcoal font-medium tracking-tight leading-tight">
            Select a workspace to continue your focus session
          </h2>
        </div>

        {/* Dashboard Grid Picker */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Cabinet Bookmark Vault */}
          <div
            onClick={() => router.push('/cabinet')}
            className="group cursor-pointer border border-brand-border bg-white rounded-none p-6 hover:border-brand-charcoal hover:shadow-xs transition-all duration-200 flex flex-col justify-between min-h-60"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-brand-charcoal/5 flex items-center justify-center text-brand-charcoal">
                  <BookmarkSimple className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="text-[9px] uppercase px-2 py-0.5 tracking-wider font-mono">
                  Module 01
                </Badge>
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-2xl font-semibold tracking-tight text-brand-charcoal">
                  Cabinet
                </h3>
                <p className="text-xs text-brand-muted">
                  Personal knowledge vault, bookmark manager, and tag taxonomies.
                </p>
              </div>
            </div>

            {/* Live Data Summary for Cabinet */}
            <div className="border-t border-brand-charcoal/5 pt-4 mt-6 flex items-center justify-between">
              <div className="flex gap-4 text-[10px] text-brand-muted">
                <div className="space-y-0.5">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wide">Bookmarks</span>
                  <span className="font-semibold text-brand-charcoal flex items-center gap-1">
                    <BookmarkSimple className="w-3.5 h-3.5" />
                    {totalBookmarks} saved
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wide">Folders</span>
                  <span className="font-semibold text-brand-charcoal flex items-center gap-1">
                    <FolderSimple className="w-3.5 h-3.5" />
                    {totalFolders} folders
                  </span>
                </div>
              </div>

              <div className="w-7 h-7 border border-brand-border flex items-center justify-center text-brand-muted group-hover:bg-brand-charcoal group-hover:text-white group-hover:border-brand-charcoal transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Card 2: Ledger Financial Vault */}
          <div
            onClick={() => router.push('/ledger')}
            className="group cursor-pointer border border-brand-border bg-white rounded-none p-6 hover:border-brand-charcoal hover:shadow-xs transition-all duration-200 flex flex-col justify-between min-h-60"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-brand-charcoal/5 flex items-center justify-center text-brand-charcoal">
                  <Coins className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="text-[9px] uppercase px-2 py-0.5 tracking-wider font-mono">
                  Module 02
                </Badge>
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-2xl font-semibold tracking-tight text-brand-charcoal">
                  Ledger
                </h3>
                <p className="text-xs text-brand-muted">
                  Personal finance, cashflow margins, and active recurring subscriptions.
                </p>
              </div>
            </div>

            {/* Live Data Summary for Ledger */}
            <div className="border-t border-brand-charcoal/5 pt-4 mt-6 flex items-center justify-between">
              <div className="flex gap-4 text-[10px] text-brand-muted">
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
                  <span className="font-semibold text-brand-charcoal flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    {totalActiveSubscriptions} active
                  </span>
                </div>
              </div>

              <div className="w-7 h-7 border border-brand-border flex items-center justify-center text-brand-muted group-hover:bg-brand-charcoal group-hover:text-white group-hover:border-brand-charcoal transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Card 3: Garage Vehicle Vault */}
          <div
            onClick={() => router.push('/garage')}
            className="group cursor-pointer border border-brand-border bg-white rounded-none p-6 hover:border-brand-charcoal hover:shadow-xs transition-all duration-200 flex flex-col justify-between min-h-60"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-brand-charcoal/5 flex items-center justify-center text-brand-charcoal">
                  <Wrench className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="text-[9px] uppercase px-2 py-0.5 tracking-wider font-mono">
                  Module 03
                </Badge>
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-2xl font-semibold tracking-tight text-brand-charcoal">
                  Garage
                </h3>
                <p className="text-xs text-brand-muted">
                  Personal vehicle logs, maintenance intervals, refueling efficiency, and papers.
                </p>
              </div>
            </div>

            {/* Live Data Summary for Garage */}
            <div className="border-t border-brand-charcoal/5 pt-4 mt-6 flex items-center justify-between">
              <div className="flex gap-4 text-[10px] text-brand-muted">
                <div className="space-y-0.5">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wide">Vehicles</span>
                  <span className="font-semibold text-brand-charcoal flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5" />
                    {totalVehicles} active
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wide">Reminders</span>
                  <span className="font-semibold text-brand-charcoal flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {totalActiveReminders} active
                  </span>
                </div>
              </div>

              <div className="w-7 h-7 border border-brand-border flex items-center justify-center text-brand-muted group-hover:bg-brand-charcoal group-hover:text-white group-hover:border-brand-charcoal transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Card 4: Fetch Media Downloader */}
          <div
            onClick={() => router.push('/fetch')}
            className="group cursor-pointer border border-brand-border bg-white rounded-none p-6 hover:border-brand-charcoal hover:shadow-xs transition-all duration-200 flex flex-col justify-between min-h-60"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-brand-charcoal/5 flex items-center justify-center text-brand-charcoal">
                  <Download className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="text-[9px] uppercase px-2 py-0.5 tracking-wider font-mono">
                  Module 04
                </Badge>
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-2xl font-semibold tracking-tight text-brand-charcoal">
                  Fetch
                </h3>
                <p className="text-xs text-brand-muted">
                  Social media video, audio, and image downloader with metadata history.
                </p>
              </div>
            </div>

            {/* Live Data Summary for Fetch */}
            <div className="border-t border-brand-charcoal/5 pt-4 mt-6 flex items-center justify-between">
              <div className="flex gap-4 text-[10px] text-brand-muted">
                <div className="space-y-0.5">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wide">Downloads</span>
                  <span className="font-semibold text-brand-charcoal flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    {totalDownloads} items
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wide">Favorites</span>
                  <span className="font-semibold text-brand-charcoal flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-[#b3261e]" />
                    {totalFavoriteDownloads} saved
                  </span>
                </div>
              </div>

              <div className="w-7 h-7 border border-brand-border flex items-center justify-center text-brand-muted group-hover:bg-brand-charcoal group-hover:text-white group-hover:border-brand-charcoal transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Details */}
      <div className="max-w-8xl w-full mx-auto border-t border-brand-border pt-6 flex flex-col sm:flex-row justify-between text-[9px] text-brand-muted uppercase tracking-wider gap-4">
        <span>Gustam Platform v1.0 · Personal Workspaces</span>
        <span className="flex items-center gap-1">
          <User className="w-3 h-3" />
          Seeded Single-User Authorization Active
        </span>
      </div>
    </div>
  );
}
