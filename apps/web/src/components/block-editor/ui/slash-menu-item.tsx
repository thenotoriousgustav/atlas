import * as React from "react"
import { cn } from "@/lib/utils"

export interface SlashMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

const SlashMenuItem = React.forwardRef<HTMLButtonElement, SlashMenuItemProps>(
  ({ className, selected = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "block-editor-slash-menu-item",
          selected && "block-editor-slash-menu-item--selected",
          className
        )}
        {...props}
      />
    )
  }
)
SlashMenuItem.displayName = "SlashMenuItem"

export { SlashMenuItem }
