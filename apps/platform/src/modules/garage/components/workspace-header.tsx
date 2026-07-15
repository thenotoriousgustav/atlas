import React from 'react';
import Link from 'next/link';
import { Button } from '@atlas/ui/components/button';
import { SignOut, ArrowLeft } from '@phosphor-icons/react';

interface WorkspaceHeaderProps {
  user: {
    name: string;
    email: string;
  };
  onLogout: () => void;
}

export function WorkspaceHeader({ user, onLogout }: WorkspaceHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-brand-border pb-5 gap-4">
      <div className="flex items-center gap-3">
        <Link 
          href="/"
          className="w-7 h-7 border border-brand-border flex items-center justify-center text-[#787774] hover:bg-[#111111] hover:text-white hover:border-[#111111] transition-colors"
          title="Back to portal"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-7 h-7 bg-[#111111] flex items-center justify-center rounded-none text-white font-serif italic text-sm font-semibold">
          G
        </div>
        <div>
          <h1 className="font-serif text-2xl font-medium tracking-tight text-[#111111]">Garage</h1>
          <p className="text-[10px] text-[#787774] font-mono tracking-tight uppercase">
            Gustam platform · Garage
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right font-mono hidden sm:block">
          <p className="text-xs font-semibold text-[#111111]">{user.name}</p>
          <p className="text-[10px] text-[#787774]">{user.email}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="flex items-center gap-1.5 font-semibold text-[10px] tracking-tight uppercase"
        >
          <SignOut className="w-3.5 h-3.5" />
          Sign out
        </Button>
      </div>
    </header>
  );
}
