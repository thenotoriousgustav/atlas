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
  moduleIcon?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Reusable Standard Workspace Header for Atlas Platform modules (Cabinet, Ledger, Garage, Fetch, Habit)
 * Guarantees 100% visual and layout consistency across all workspace modules.
 */
export function StandardWorkspaceHeader({
  moduleName,
  moduleBadge,
  moduleSubtitle = 'Gustam Platform · Workspace',
  moduleIcon,
  actions,
}: WorkspaceHeaderProps) {
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
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Module Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="size-8 border border-border flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-colors"
            title="Back to portal hub"
          >
            <ArrowLeft className="size-4" />
          </Link>

          {moduleIcon && (
            <div className="size-8 bg-foreground flex items-center justify-center text-background text-sm font-semibold">
              {moduleIcon}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl font-semibold tracking-tight text-foreground">
                {moduleName}
              </h1>
              {moduleBadge && (
                <Badge variant="outline" className="text-[9px] font-mono uppercase tracking-wider py-0 px-1.5">
                  {moduleBadge}
                </Badge>
              )}
            </div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-tight">
              {moduleSubtitle}
            </p>
          </div>
        </div>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-3">
          {actions}

          {user && (
            <div className="text-right font-mono hidden sm:block border-l border-border pl-3">
              <p className="text-xs font-semibold text-foreground">{user.name}</p>
              <p className="text-[10px] text-muted-foreground">{user.email}</p>
            </div>
          )}

          <ThemeToggle />

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1.5 font-semibold text-[10px] tracking-tight uppercase rounded-none border-border"
          >
            <SignOut className="size-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
