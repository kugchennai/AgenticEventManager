"use client";

import { cn } from "@/lib/utils";

const PRIORITY_CONFIG = {
  LOW: { label: "Low", className: "bg-priority-low/15 text-priority-low border-priority-low/20" },
  MEDIUM: { label: "Medium", className: "bg-priority-medium/15 text-priority-medium border-priority-medium/20" },
  HIGH: { label: "High", className: "bg-priority-high/15 text-priority-high border-priority-high/20" },
  CRITICAL: { label: "Critical", className: "bg-priority-critical/15 text-priority-critical border-priority-critical/20 animate-[pulse-glow_2s_infinite]" },
} as const;

type Priority = keyof typeof PRIORITY_CONFIG;

export function PriorityBadge({
  priority,
  size = "sm",
  className,
}: {
  priority: Priority;
  size?: "sm" | "md";
  className?: string;
}) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium font-[family-name:var(--font-body)]",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
