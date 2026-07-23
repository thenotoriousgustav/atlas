'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface WorkspaceSidebarProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
}

export interface WorkspaceSidebarGroupProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export interface WorkspaceSidebarItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
  isActive?: boolean;
  hoverActions?: React.ReactNode;
  className?: string;
}

export interface WorkspaceSidebarWidgetProps {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Standardized Reusable WorkspaceSidebar for Atlas Platform (Habit, Ledger, Cabinet, Garage, Fetch)
 * Built with Compound Components (<WorkspaceSidebarGroup>, <WorkspaceSidebarItem>, <WorkspaceSidebarWidget>)
 */
export function WorkspaceSidebar({ children, className, ...props }: WorkspaceSidebarProps) {
  return (
    <aside className={cn('space-y-6 text-brand-charcoal select-none', className)} {...props}>
      {children}
    </aside>
  );
}

export function WorkspaceSidebarAction({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('space-y-2', className)}>{children}</div>;
}

export function WorkspaceSidebarGroup({ title, action, children, className }: WorkspaceSidebarGroupProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {title && (
        <div className="flex items-center justify-between px-2 pb-1">
          <h3 className="text-[10px] font-mono text-brand-muted uppercase tracking-wider">
            {title}
          </h3>
          {action}
        </div>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function WorkspaceSidebarItem({
  icon,
  label,
  badge,
  isActive = false,
  hoverActions,
  className,
  onClick,
  ...props
}: WorkspaceSidebarItemProps) {
  return (
    <div
      onClick={onClick as any}
      className={cn(
        'group w-full flex items-center justify-between px-2 py-1.5 rounded-none text-xs transition-colors text-left font-sans cursor-pointer',
        isActive
          ? 'bg-brand-charcoal/10 text-brand-charcoal font-semibold'
          : 'text-brand-muted hover:bg-brand-charcoal/5 hover:text-brand-charcoal',
        className
      )}
      {...props}
    >
      <span className="flex items-center gap-2 truncate">
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate">{label}</span>
      </span>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Cabinet-style Hover Action Icons */}
        {hoverActions && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            {hoverActions}
          </div>
        )}

        {badge !== undefined && badge !== null && (
          <span className="font-mono text-[10px] text-brand-muted ml-1">{badge}</span>
        )}
      </div>
    </div>
  );
}

export function WorkspaceSidebarWidget({ title, icon, children, className }: WorkspaceSidebarWidgetProps) {
  return (
    <div className={cn('pt-4 border-t border-brand-border space-y-3', className)}>
      {title && (
        <h3 className="text-[10px] font-mono text-brand-muted uppercase tracking-wider px-2 flex items-center gap-1">
          {icon}
          <span>{title}</span>
        </h3>
      )}

      <div className="p-3 border border-brand-border bg-white dark:bg-card space-y-2 font-mono text-xs rounded-none">
        {children}
      </div>
    </div>
  );
}
