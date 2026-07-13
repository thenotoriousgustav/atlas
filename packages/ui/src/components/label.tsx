import * as React from "react";
import { cn } from "../utils/cn";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-xs font-semibold text-[#2F3437] select-none leading-none tracking-tight",
          className
        )}
        {...props}
      />
    );
  }
);
Label.displayName = "Label";

export { Label };
