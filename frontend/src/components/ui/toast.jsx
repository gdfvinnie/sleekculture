"use strict";
import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
const ToastProvider = ToastPrimitives.Provider;
const ToastViewport = React.forwardRef(({ className, ...props }, ref) => <ToastPrimitives.Viewport
  ref={ref}
  className={cn(
    "fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-sm",
    className
  )}
  {...props}
/>);
ToastViewport.displayName = "ToastViewport";
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start justify-between space-x-2 overflow-hidden rounded-sm border p-4 pr-8 shadow-lg transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:fade-in-0",
  {
    variants: {
      variant: {
        default: "border-border bg-background text-foreground",
        destructive: "border-destructive bg-destructive text-destructive-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
const Toast = React.forwardRef(({ className, variant, ...props }, ref) => <ToastPrimitives.Root
  ref={ref}
  className={cn(toastVariants({ variant }), className)}
  {...props}
/>);
Toast.displayName = "Toast";
const ToastAction = React.forwardRef(({ className, ...props }, ref) => <ToastPrimitives.Action
  ref={ref}
  className={cn(
    "inline-flex h-8 shrink-0 items-center justify-center rounded-sm border bg-transparent px-3 text-xs font-medium transition-colors hover:bg-secondary focus:outline-none",
    className
  )}
  {...props}
/>);
ToastAction.displayName = "ToastAction";
const ToastClose = React.forwardRef(({ className, ...props }, ref) => <ToastPrimitives.Close
  ref={ref}
  className={cn(
    "absolute right-1 top-1 rounded-sm p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none",
    className
  )}
  {...props}
/>);
ToastClose.displayName = "ToastClose";
const ToastContext = React.createContext(
  void 0
);
export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
export function ToastProviderWithViewport({
  children
}) {
  const [toasts, setToasts] = React.useState([]);
  const toast = React.useCallback(
    ({
      title,
      description,
      variant
    }) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [
        ...prev.slice(-2),
        { id, title, description, variant, open: true }
      ]);
    },
    []
  );
  const dismiss = (id) => setToasts((state) => state.filter((t) => t.id !== id));
  return <ToastProvider swipeDirection="right"><ToastContext.Provider value={{ toast }}>{toasts.map((t) => <Toast
    key={t.id}
    variant={t.variant}
    open
    onOpenChange={(open) => {
      if (!open) dismiss(t.id);
    }}
  ><div className="grid gap-1">{t.title && <div className="font-display text-sm tracking-widest">{t.title}</div>}{t.description && <div className="text-sm text-muted-foreground">{t.description}</div>}</div><ToastClose /></Toast>)}<ToastViewport />{children}</ToastContext.Provider></ToastProvider>;
}
