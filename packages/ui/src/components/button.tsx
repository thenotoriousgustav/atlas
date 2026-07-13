import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#111111] text-white hover:bg-[#333333]",
        outline:
          "border border-[#EAEAEA] bg-white text-[#111111] hover:bg-[#F9F9F8]",
        ghost:
          "text-[#2F3437] hover:bg-[#F9F9F8] hover:text-[#111111]",
        pastel:
          "bg-[#E1F3FE] text-[#1F6C9F] hover:bg-[#cbeaff]",
      },
      size: {
        default: "h-9 px-4 py-2 rounded-[6px]",
        sm: "h-8 px-3 text-xs rounded-[4px]",
        lg: "h-10 px-8 rounded-[8px]",
        icon: "h-9 w-9 rounded-[6px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
