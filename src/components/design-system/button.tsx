"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  children: ReactNode;
}

const VARIANT_STYLES = {
  primary:
    "bg-accent text-accent-fg hover:brightness-110 active:brightness-95 shadow-sm shadow-accent/20",
  secondary:
    "bg-surface border border-border text-foreground hover:bg-surface-hover hover:border-border-hover",
  ghost:
    "text-muted hover:text-foreground hover:bg-surface-hover",
  danger:
    "bg-status-blocked/10 text-status-blocked border border-status-blocked/20 hover:bg-status-blocked/20",
};

const SIZE_STYLES = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-9 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-6 text-sm gap-2 rounded-xl",
  icon: "h-9 w-9 rounded-lg flex items-center justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium",
          "transition-all duration-150 ease-out",
          "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          "cursor-pointer",
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
