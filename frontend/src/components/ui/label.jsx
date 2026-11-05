"use strict";
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";
const Label = React.forwardRef(({ className, ...props }, ref) => <LabelPrimitive.Root
  ref={ref}
  className={cn(
    "text-xs font-medium uppercase tracking-widest text-foreground",
    className
  )}
  {...props}
/>);
Label.displayName = "Label";
export { Label };
