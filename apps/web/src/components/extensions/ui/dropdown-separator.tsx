import * as React from "react"
import { cn } from "@/lib/utils"

export type DropdownMenuSeparatorProps = React.HTMLAttributes<HTMLDivElement>

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  DropdownMenuSeparatorProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("ext-dropdown-separator", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

export { DropdownMenuSeparator }
