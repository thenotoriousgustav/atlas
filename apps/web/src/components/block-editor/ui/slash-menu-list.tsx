import * as React from "react"
import { cn } from "@/lib/utils"

export type SlashMenuListProps = React.HTMLAttributes<HTMLDivElement>

const SlashMenuList = React.forwardRef<HTMLDivElement, SlashMenuListProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("block-editor-slash-menu-list", className)}
      {...props}
    />
  )
)
SlashMenuList.displayName = "SlashMenuList"

export { SlashMenuList }
