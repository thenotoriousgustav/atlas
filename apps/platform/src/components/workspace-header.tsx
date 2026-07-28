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

export interface WorkspaceHeaderProps {
  moduleName: string;
  moduleBadge?: string;
  moduleSubtitle?: string;
  moduleInitial?: React.ReactNode;
  user?: {
    name?: string;
    email?: string;
  } | null;
  onLogout?: () => void;
  actions?: React.ReactNode;
}

/**
 * Reusable WorkspaceHeader for all Atlas Platform modules (Cabinet, Ledger, Garage, Fetch, Habit)
 * ponytail: single source of truth for workspace headers across all frontend modules.
 */
export function WorkspaceHeader({
  moduleName,
  moduleBadge,
  moduleSubtitle = 'Gustam Platform · Workspace',
  moduleInitial,
  user: userProp,
  onLogout: onLogoutProp,
  actions,
}: WorkspaceHeaderProps) {
  const router = useRouter();
  const { user: storeUser, logout } = useAuthStore();
  const logoutMutation = useAuthControllerLogout();

  const user = userProp !== undefined ? userProp : storeUser;

  const handleLogout = async () => {
    if (onLogoutProp) {
      onLogoutProp();
      return;
    }
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

  const initial = moduleInitial || moduleName.charAt(0).toUpperCase();

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-brand-border pb-5 gap-4">
      {/* Brand & Module Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="size-7 border border-brand-border flex items-center justify-center text-brand-muted hover:bg-brand-charcoal hover:text-brand-canvas hover:border-brand-charcoal transition-colors"
          title="Back to portal hub"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div className="size-7 bg-brand-charcoal flex items-center justify-center rounded-none text-brand-canvas font-serif italic text-sm font-semibold">
          {initial}
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
          <div className="text-right font-mono hidden sm:block">
            <p className="text-xs font-semibold text-brand-charcoal">{user.name || user.email}</p>
            <p className="text-[10px] text-brand-muted">{user.email}</p>
          </div>
        )}

        <ThemeToggle />

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-1.5 font-semibold text-[10px] tracking-tight uppercase rounded-none border-brand-border h-8"
        >
          <SignOut className="size-3.5" />
          <span className="hidden md:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}

export const StandardWorkspaceHeader = WorkspaceHeader;
