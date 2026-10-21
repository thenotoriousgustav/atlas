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
 * Cabinet sidebar for folders, tags, and bookmark filters.
 * Built with Compound Components (<WorkspaceSidebarGroup>, <WorkspaceSidebarItem>, <WorkspaceSidebarWidget>)
 */
export function WorkspaceSidebar({
  children,
  className,
  ...props
}: WorkspaceSidebarProps) {
  return (
    <nav
      aria-label="Library navigation"
      className={cn("flex h-full flex-col justify-between text-sidebar-foreground select-none", className)}
      {...props}
    >
      {children}
    </nav>
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
    <div className={cn("flex flex-col gap-1.5", className)}>
      {title && (
        <div className="flex items-center justify-between px-2 pb-1">
          <h3 className="text-xs font-medium text-muted-foreground">
            {title}
          </h3>
          {action}
        </div>
      )}
      <div className="flex flex-col gap-0.5">{children}</div>
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
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-current={isActive ? "page" : undefined}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget || !onClick) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          event.currentTarget.click()
        }
      }}
      className={cn(
        "group/ws flex min-h-11 w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:min-h-9",
        isActive
          ? "bg-secondary font-medium text-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
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
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/ws:opacity-100">
            {hoverActions}
          </div>
        )}

        {badge !== undefined && badge !== null && (
          <span className="ml-1 text-xs tabular-nums text-muted-foreground">
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
        <h3 className="flex items-center gap-1 px-2 text-xs font-medium text-muted-foreground">
          {icon}
          <span>{title}</span>
        </h3>
      )}

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 text-sm">
        {children}
      </div>
    </div>
  )
}
