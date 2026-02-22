"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function BentoGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
  interactive = true,
}: {
  children: ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2;
  interactive?: boolean;
}) {
  const colSpanClass = {
    1: "",
    2: "md:col-span-2",
    3: "md:col-span-2 lg:col-span-3",
    4: "md:col-span-2 lg:col-span-3 xl:col-span-4",
  }[colSpan];

  const rowSpanClass = rowSpan === 2 ? "row-span-2" : "";

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-5",
        "transition-all duration-150 ease-out",
        interactive && "card-glow hover:-translate-y-[1px] hover:border-border-hover hover:shadow-lg hover:shadow-black/10",
        colSpanClass,
        rowSpanClass,
        className
      )}
    >
      {children}
    </div>
  );
}
