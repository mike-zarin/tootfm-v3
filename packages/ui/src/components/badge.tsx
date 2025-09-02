import * as React from "react";
import { cn } from "../utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-purple-500/20 text-purple-400 border-purple-500/20",
      secondary: "bg-gray-700 text-gray-300 border-gray-600",
      destructive: "bg-red-500/20 text-red-400 border-red-500/20",
      outline: "text-gray-400 border-gray-600",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
