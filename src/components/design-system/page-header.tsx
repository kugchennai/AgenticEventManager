"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-6", className)}>
      <div className="space-y-1 min-w-0">
        <h1 className="text-2xl font-semibold font-[family-name:var(--font-display)] tracking-tight truncate">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
