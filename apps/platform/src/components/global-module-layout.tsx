'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@atlas/ui/components/button';
import { Badge } from '@atlas/ui/components/badge';
import { SignOut, ArrowLeft } from '@phosphor-icons/react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useAuthControllerLogout } from '@atlas/api-client';
import { toast } from 'sonner';
import { cn } from '@atlas/ui/lib/utils';
import { ModuleContainer } from './module-container';

export interface GlobalModuleHeaderProps {
  moduleName: string;
  moduleBadge?: string;
  moduleSubtitle?: string;
  moduleInitial?: string;
  actions?: React.ReactNode;
}

export interface GlobalModuleLayoutProps {
  moduleName: string;
  moduleBadge?: string;
  moduleSubtitle?: string;
  moduleInitial?: string;
  headerActions?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Standardized Global Viewport Layout for all Atlas Platform Modules (Cabinet, Ledger, Garage, Fetch, Habit)
 * Features:
 * - Uses centralized ModuleContainer for global width management across all modules
 * - Fixed height viewport (h-screen overflow-hidden)
 * - Pinned Top Workspace Header (shrink-0)
 * - Pinned Left Sidebar (independent scroll if long)
 * - Scrollable Main Content Area (independent scroll in 3-column section)
 */
export function GlobalModuleHeader({
  moduleName,
  moduleBadge,
  moduleSubtitle = 'Gustam Platform · Workspace',
  moduleInitial = 'H',
  actions,
}: GlobalModuleHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const logoutMutation = useAuthControllerLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      logout();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch {
      logout();
      router.push('/login');
    }
  };

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-brand-border pb-5 gap-4">
      {/* Brand & Module Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="size-7 border border-brand-border flex items-center justify-center text-brand-muted hover:bg-brand-charcoal hover:text-brand-canvas hover:border-brand-charcoal transition-colors rounded-none"
          title="Back to portal hub"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div className="size-7 bg-brand-charcoal flex items-center justify-center rounded-none text-brand-canvas font-serif italic text-sm font-semibold">
          {moduleInitial}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-medium tracking-tight text-brand-charcoal">
              {moduleName}
            </h1>
            {moduleBadge && (
              <Badge
                variant="outline"
                className="border-brand-border text-[10px] font-mono uppercase tracking-wider py-0.5 px-1.5 rounded-none text-brand-muted"
              >
                {moduleBadge}
              </Badge>
            )}
          </div>
          <p className="text-[10px] text-brand-muted font-mono tracking-tight uppercase">
            {moduleSubtitle}
          </p>
        </div>
      </div>

      {/* Action Controls & Profile */}
      <div className="flex items-center gap-4">
        {actions}

        {user && (
          <div className="text-right font-mono hidden sm:block border-l border-brand-border pl-4">
            <p className="text-xs font-semibold text-brand-charcoal">{user.name}</p>
            <p className="text-[10px] text-brand-muted">{user.email}</p>
          </div>
        )}

        <ThemeToggle />

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-1.5 font-semibold text-[10px] tracking-tight uppercase rounded-none border-brand-border"
        >
          <SignOut className="size-3.5" />
          <span className="hidden md:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}

export function GlobalModuleLayout({
  moduleName,
  moduleBadge,
  moduleSubtitle,
  moduleInitial,
  headerActions,
  sidebar,
  children,
  className,
}: GlobalModuleLayoutProps) {
  return (
    <div className={cn('h-screen flex flex-col bg-brand-canvas overflow-hidden text-brand-charcoal', className)}>
      {/* Pinned Top Workspace Nav Header */}
      <div className="shrink-0 pt-6 bg-brand-canvas z-30">
        <ModuleContainer>
          <GlobalModuleHeader
            moduleName={moduleName}
            moduleBadge={moduleBadge}
            moduleSubtitle={moduleSubtitle}
            moduleInitial={moduleInitial}
            actions={headerActions}
          />
        </ModuleContainer>
      </div>

      {/* Main Body Layout Container with Independent Main Section Scroll */}
      <div className="flex-1 overflow-hidden py-6">
        <ModuleContainer className="h-full">
          <div className="h-full grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
            {/* Pinned Left Sidebar (1 col) — Scrollbar hidden so only 1 main scrollbar appears */}
            {sidebar && (
              <aside className="md:col-span-1 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pr-2 space-y-6">
                {sidebar}
              </aside>
            )}

            {/* Main Scrollable Content Area (3 cols or 4 cols if no sidebar) */}
            <section
              className={cn(
                sidebar ? 'md:col-span-3' : 'md:col-span-4',
                'h-full overflow-y-auto pr-2 space-y-6'
              )}
            >
              {children}
            </section>
          </div>
        </ModuleContainer>
      </div>
    </div>
  );
}
