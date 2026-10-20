import * as React from "react"
import { cn } from "@/lib/utils"

export interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  danger?: boolean
}

const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuItemProps
>(({ className, danger = false, type = "button", ...props }, ref) => {
  return (
    <button
      ref={ref}
      type={type}
      role="menuitem"
      data-dropdown-item
      className={cn(
        "ext-dropdown-item",
        danger && "ext-dropdown-item--danger",
        className
      )}
      {...props}
    />
  )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

export { DropdownMenuItem }
