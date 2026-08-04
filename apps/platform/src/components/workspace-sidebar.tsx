"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface WorkspaceSidebarProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  className?: string
}

export interface WorkspaceSidebarGroupProps {
  title?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export interface WorkspaceSidebarItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  label: string
  badge?: React.ReactNode
  isActive?: boolean
  hoverActions?: React.ReactNode
  className?: string
}

export interface WorkspaceSidebarWidgetProps {
  title?: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/**
 * Standardized Reusable WorkspaceSidebar for Atlas Platform (Habit, Ledger, Cabinet, Garage, Fetch)
 * Built with Compound Components (<WorkspaceSidebarGroup>, <WorkspaceSidebarItem>, <WorkspaceSidebarWidget>)
 */
export function WorkspaceSidebar({
  children,
  className,
  ...props
}: WorkspaceSidebarProps) {
  return (
    <aside
      className={cn("space-y-6 text-brand-charcoal select-none", className)}
      {...props}
    >
      {children}
    </aside>
  )
}

export function WorkspaceSidebarAction({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("space-y-2", className)}>{children}</div>
}

export function WorkspaceSidebarGroup({
  title,
  action,
  children,
  className,
}: WorkspaceSidebarGroupProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {title && (
        <div className="flex items-center justify-between pb-1 pl-2">
          <h3 className="font-mono text-[10px] tracking-wider text-brand-muted uppercase">
            {title}
          </h3>
          {action}
        </div>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  )
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
        "group flex w-full cursor-pointer items-center justify-between rounded-none px-2 py-1.5 text-left font-sans text-xs transition-colors",
        isActive
          ? "bg-brand-charcoal/10 font-semibold text-brand-charcoal"
          : "text-brand-muted hover:bg-brand-charcoal/5 hover:text-brand-charcoal",
        className
      )}
      {...props}
    >
      <span className="flex items-center gap-2 truncate">
        {icon && <span className="shrink-0">{icon}</span>}
        <span className="truncate">{label}</span>
      </span>

      <div className="flex shrink-0 items-center gap-1.5">
        {/* Cabinet-style Hover Action Icons */}
        {hoverActions && (
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {hoverActions}
          </div>
        )}

        {badge !== undefined && badge !== null && (
          <span className="ml-1 font-mono text-[10px] text-brand-muted">
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}

export function WorkspaceSidebarWidget({
  title,
  icon,
  children,
  className,
}: WorkspaceSidebarWidgetProps) {
  return (
    <div
      className={cn("space-y-3 border-t border-brand-border pt-4", className)}
    >
      {title && (
        <h3 className="flex items-center gap-1 px-2 font-mono text-[10px] tracking-wider text-brand-muted uppercase">
          {icon}
          <span>{title}</span>
        </h3>
      )}

      <div className="space-y-2 rounded-none border border-brand-border bg-white p-3 font-mono text-xs dark:bg-card">
        {children}
      </div>
    </div>
  )
}
