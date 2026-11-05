import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "accent" | "destructive" | "outline" | "muted";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-none px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest",
        {
          "bg-primary text-primary-foreground": variant === "default",
          "bg-secondary text-secondary-foreground": variant === "secondary",
          "bg-accent text-accent-foreground": variant === "accent",
          "bg-destructive text-destructive-foreground": variant === "destructive",
          "border border-border bg-background/90 text-foreground":
            variant === "outline",
          "bg-muted text-muted-foreground": variant === "muted",
        },
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
