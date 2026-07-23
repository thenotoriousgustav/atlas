'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ModuleContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Standardized reusable container for Atlas Platform modules (Cabinet, Ledger, Garage, Fetch, Habit)
 * Guarantees consistent max-width (max-w-8xl), padding, and alignment across all portal screens.
 */
export function ModuleContainer({ children, className, ...props }: ModuleContainerProps) {
  return (
    <div className={cn('max-w-8xl w-full mx-auto px-4 sm:px-6', className)} {...props}>
      {children}
    </div>
  );
}

export function ModuleHeader({ children, className, ...props }: ModuleContainerProps) {
  return (
    <header className={cn('sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur', className)} {...props}>
      <ModuleContainer className="h-16 flex items-center justify-between">
        {children}
      </ModuleContainer>
    </header>
  );
}

export function ModuleMain({ children, className, ...props }: ModuleContainerProps) {
  return (
    <main className={cn('flex-1 py-6 space-y-6', className)} {...props}>
      <ModuleContainer className="space-y-6">
        {children}
      </ModuleContainer>
    </main>
  );
}
