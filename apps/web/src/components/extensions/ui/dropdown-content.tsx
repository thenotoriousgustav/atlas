import * as React from "react"
import { cn } from "@/lib/utils"
import { useDropdownPill } from "./dropdown-pill"

export type DropdownMenuContentProps = React.HTMLAttributes<HTMLDivElement>

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(({ className, onMouseLeave, ...props }, ref) => {
  const { handlers, pill } = useDropdownPill(onMouseLeave)

  return (
    <div
      ref={ref}
      role="menu"
      className={cn("ext-dropdown-content", className)}
      {...handlers}
      {...props}
    >
      {pill}
      {props.children}
    </div>
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

export { DropdownMenuContent }
