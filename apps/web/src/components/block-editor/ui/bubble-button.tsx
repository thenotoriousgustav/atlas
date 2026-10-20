import * as React from "react"
import { cn } from "@/lib/utils"

export interface BubbleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

const BubbleButton = React.forwardRef<HTMLButtonElement, BubbleButtonProps>(
  ({ className, active = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "block-editor-bubble-btn",
          active && "block-editor-bubble-btn--active",
          className
        )}
        {...props}
      />
    )
  }
)
BubbleButton.displayName = "BubbleButton"

export { BubbleButton }
