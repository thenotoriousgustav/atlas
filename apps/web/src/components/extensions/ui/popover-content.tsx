import * as React from "react"
import { cn } from "@/lib/utils"
import { useDropdownPill } from "./dropdown-pill"

export type PopoverContentProps = React.HTMLAttributes<HTMLDivElement>

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, onMouseLeave, ...props }, ref) => {
    const { handlers, pill } = useDropdownPill(onMouseLeave)

    return (
      <div
        ref={ref}
        className={cn("ext-popover-content", className)}
        {...handlers}
        {...props}
      >
        {pill}
        {props.children}
      </div>
    )
  }
)
PopoverContent.displayName = "PopoverContent"

export { PopoverContent }
