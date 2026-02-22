"use client";

import { cn } from "@/lib/utils";
import type { ComponentType, ReactNode } from "react";

interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div className="rounded-2xl bg-surface-hover p-4 mb-4">
        <Icon className="h-8 w-8 text-muted" />
      </div>
      <h3 className="text-base font-semibold font-[family-name:var(--font-display)] mb-1">{title}</h3>
      <p className="text-sm text-muted max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
