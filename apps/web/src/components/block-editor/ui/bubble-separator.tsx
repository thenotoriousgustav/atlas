import * as React from "react"
import { cn } from "@/lib/utils"

export type BubbleSeparatorProps = React.HTMLAttributes<HTMLDivElement>

const BubbleSeparator = React.forwardRef<HTMLDivElement, BubbleSeparatorProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("block-editor-bubble-separator", className)}
      {...props}
    />
  )
)
BubbleSeparator.displayName = "BubbleSeparator"

export { BubbleSeparator }
