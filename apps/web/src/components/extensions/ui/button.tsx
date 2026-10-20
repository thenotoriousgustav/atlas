import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  danger?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      active = false,
      danger = false,
      type = "button",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "ext-btn",
          active && "ext-btn--active",
          danger && "ext-btn--danger",
          className
        )}
        data-state={active ? "on" : "off"}
        aria-pressed={active}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
