import * as React from "react"
import { cn } from "@/lib/utils"

export type BubbleDropdownIconProps = React.HTMLAttributes<HTMLSpanElement>

const BubbleDropdownIcon = React.forwardRef<
  HTMLSpanElement,
  BubbleDropdownIconProps
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("block-editor-bubble-dropdown-icon", className)}
    {...props}
  />
))
BubbleDropdownIcon.displayName = "BubbleDropdownIcon"

export { BubbleDropdownIcon }
