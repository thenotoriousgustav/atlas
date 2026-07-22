import React from 'react';
import Link from 'next/link';
import { Button } from '@atlas/ui/components/button';
import { SignOut, ArrowLeft } from '@phosphor-icons/react';
import { ThemeToggle } from '@/components/theme-toggle';

interface LedgerWorkspaceHeaderProps {
  user: {
    name?: string;
    email?: string;
  } | null;
  onLogout: () => void;
}

export function LedgerWorkspaceHeader({ user, onLogout }: LedgerWorkspaceHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-brand-border pb-5 gap-4">
      <div className="flex items-center gap-3">
        <Link 
          href="/"
          className="w-7 h-7 border border-brand-border flex items-center justify-center text-brand-muted hover:bg-brand-charcoal hover:text-brand-canvas hover:border-brand-charcoal transition-colors"
          title="Back to portal"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-7 h-7 bg-brand-charcoal flex items-center justify-center rounded-none text-brand-canvas font-serif italic text-sm font-semibold">
          L
        </div>
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-brand-charcoal">Ledger</h1>
          <p className="text-[10px] text-brand-muted font-mono tracking-tight uppercase">
            Gustam platform · Workspace
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
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
          onClick={onLogout}
          className="flex items-center gap-1.5 font-semibold text-[10px] tracking-tight uppercase rounded-none border-brand-border h-8"
        >
          <SignOut className="w-3.5 h-3.5" />
          Sign out
        </Button>
      </div>
    </header>
  );
}
