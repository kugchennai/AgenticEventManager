"use client";

import { cn } from "@/lib/utils";
import type { ComponentType, ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ComponentType<{ className?: string }>;
  trend?: { value: number; label: string };
  className?: string;
  children?: ReactNode;
}

export function StatCard({ label, value, icon: Icon, trend, className, children }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-4",
        "transition-all duration-150 hover:-translate-y-[1px] hover:border-border-hover",
        "card-glow",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
          <p className="text-2xl font-semibold font-[family-name:var(--font-display)] tracking-tight">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="rounded-lg bg-accent/10 p-2">
            <Icon className="h-4 w-4 text-accent" />
          </div>
        )}
      </div>
      {trend && (
        <p className={cn(
          "mt-2 text-xs font-medium font-[family-name:var(--font-mono)]",
          trend.value >= 0 ? "text-status-done" : "text-status-blocked"
        )}>
          {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
        </p>
      )}
      {children}
    </div>
  );
}
