/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 hover:ring-2 hover:ring-primary/30",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-muted hover:text-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:ring-2 hover:ring-destructive/30",
        outline: "text-foreground hover:bg-muted",
        success:
          "border-transparent bg-emerald-100 text-emerald-800 hover:bg-emerald-200 hover:text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60",
        warning:
          "border-transparent bg-amber-100 text-amber-800 hover:bg-amber-200 hover:text-amber-900 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/60",
        info:
          "border-transparent bg-sky-100 text-sky-800 hover:bg-sky-200 hover:text-sky-900 dark:bg-sky-950/50 dark:text-sky-300 dark:hover:bg-sky-900/60",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
