import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-none px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-950",
  {
    variants: {
      variant: {
        default:
          "bg-[#111111] text-white hover:bg-[#333333]",
        red:
          "bg-[#FDEBEC] text-[#9F2F2D] hover:bg-[#fadad9]",
        blue:
          "bg-[#E1F3FE] text-[#1F6C9F] hover:bg-[#cbeaff]",
        green:
          "bg-[#EDF3EC] text-[#346538] hover:bg-[#ddeade]",
        yellow:
          "bg-[#FBF3DB] text-[#956400] hover:bg-[#f6e9be]",
        outline:
          "text-[#2F3437] border border-[#EAEAEA] bg-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
