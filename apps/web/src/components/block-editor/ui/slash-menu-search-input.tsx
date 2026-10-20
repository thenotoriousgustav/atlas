import * as React from "react"
import { cn } from "@/lib/utils"

export type SlashMenuSearchInputProps =
  React.InputHTMLAttributes<HTMLInputElement>

const SlashMenuSearchInput = React.forwardRef<
  HTMLInputElement,
  SlashMenuSearchInputProps
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="text"
    className={cn("block-editor-slash-menu-search-input", className)}
    {...props}
  />
))
SlashMenuSearchInput.displayName = "SlashMenuSearchInput"

export { SlashMenuSearchInput }
