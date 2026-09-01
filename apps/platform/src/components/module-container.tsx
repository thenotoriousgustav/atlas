"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface ModuleContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

/**
 * Standardized reusable container for Atlas Platform modules (Cabinet, Garage, Fetch, Habit)
 * Centralized width management — change max-width here to update ALL platform modules globally!
 */
export function ModuleContainer({
  children,
  className,
  ...props
}: ModuleContainerProps) {
  return (
    <div
      className={cn(
        "max-w-8xl mx-auto w-full px-4 sm:px-6 md:px-12",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function ModuleHeader({
  children,
  className,
  ...props
}: ModuleContainerProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur",
        className
      )}
      {...props}
    >
      <ModuleContainer className="flex h-16 items-center justify-between">
        {children}
      </ModuleContainer>
    </header>
  )
}

export function ModuleMain({
  children,
  className,
  ...props
}: ModuleContainerProps) {
  return (
    <main className={cn("flex-1 space-y-6 py-6", className)} {...props}>
      <ModuleContainer className="space-y-6">{children}</ModuleContainer>
    </main>
  )
}
