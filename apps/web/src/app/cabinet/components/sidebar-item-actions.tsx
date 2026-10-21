"use client"

import React from "react"
import { DotsThree } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * The "⋯" trigger shared by folder and tag rows in the sidebar.
 * Always visible on touch screens; on desktop it appears when its row is hovered or focused
 * (the row passes that reveal rule through className, since each row names its own group).
 */
export const SidebarItemActionsButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button> & { label: string }
>(function SidebarItemActionsButton({ label, className, onClick, ...props }, ref) {
  return (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.(event)
      }}
      className={cn(
        "size-9 shrink-0 rounded-md text-muted-foreground hover:bg-foreground/10 hover:text-foreground md:size-6 md:opacity-0",
        "focus-visible:opacity-100 data-[state=open]:bg-foreground/10 data-[state=open]:text-foreground data-[state=open]:opacity-100",
        className
      )}
      {...props}
    >
      <DotsThree weight="bold" />
    </Button>
  )
})
