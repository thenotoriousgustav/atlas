import * as React from "react"
import { cn } from "@/lib/utils"

export type SlashMenuSearchProps = React.HTMLAttributes<HTMLDivElement>

const SlashMenuSearch = React.forwardRef<HTMLDivElement, SlashMenuSearchProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("block-editor-slash-menu-search", className)}
      {...props}
    />
  )
)
SlashMenuSearch.displayName = "SlashMenuSearch"

export { SlashMenuSearch }
