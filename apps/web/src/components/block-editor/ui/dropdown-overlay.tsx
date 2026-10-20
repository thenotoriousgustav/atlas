import * as React from "react"
import { cn } from "@/lib/utils"

export type DropdownOverlayProps = React.HTMLAttributes<HTMLDivElement>

const DropdownOverlay = React.forwardRef<HTMLDivElement, DropdownOverlayProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="presentation"
      className={cn("block-editor-bubble-overlay", className)}
      {...props}
    />
  )
)
DropdownOverlay.displayName = "DropdownOverlay"

export { DropdownOverlay }
