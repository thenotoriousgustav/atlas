import * as React from "react"
import { cn } from "@/lib/utils"

export type SlashMenuProps = React.HTMLAttributes<HTMLDivElement>

const SlashMenu = React.forwardRef<HTMLDivElement, SlashMenuProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("block-editor-slash-menu", className)}
      {...props}
    />
  )
)
SlashMenu.displayName = "SlashMenu"

export { SlashMenu }
