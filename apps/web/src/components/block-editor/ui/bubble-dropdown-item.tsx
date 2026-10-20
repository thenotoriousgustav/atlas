import * as React from "react"
import { cn } from "@/lib/utils"

export interface BubbleDropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  danger?: boolean
}

const BubbleDropdownItem = React.forwardRef<
  HTMLButtonElement,
  BubbleDropdownItemProps
>(({ className, active = false, danger = false, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      data-dropdown-item
      className={cn(
        "block-editor-bubble-dropdown-item",
        active && "block-editor-bubble-dropdown-item--active",
        danger && "block-editor-bubble-dropdown-item--danger",
        className
      )}
      {...props}
    />
  )
})
BubbleDropdownItem.displayName = "BubbleDropdownItem"

export { BubbleDropdownItem }
