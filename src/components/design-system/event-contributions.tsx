"use client";

import { useState } from "react";
import { StatusBadge } from "./status-badge";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type StatusType = "speaker" | "volunteer" | "event" | "venue";

interface EventItem {
  event: {
    id: string;
    title: string;
    date: string;
  };
  status: string;
  roleLabel?: string;
}

interface EventContributionsProps {
  events: EventItem[];
  statusType: StatusType;
  className?: string;
}

export function EventContributions({
  events,
  statusType,
  className,
}: EventContributionsProps) {
  const [expanded, setExpanded] = useState(false);
  const count = events.length;

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => count > 0 && setExpanded(!expanded)}
        className={cn(
          "inline-flex items-center gap-1.5 text-sm tabular-nums transition-colors",
          count > 0
            ? "text-accent hover:text-accent/80 cursor-pointer"
            : "text-muted cursor-default"
        )}
        disabled={count === 0}
      >
        <Calendar className="h-3.5 w-3.5" />
        {count} event{count !== 1 ? "s" : ""}
        {count > 0 &&
          (expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          ))}
      </button>

      {expanded && count > 0 && (
        <div className="mt-2 space-y-1.5 animate-fade-in">
          {events
            .sort(
              (a, b) =>
                new Date(b.event.date).getTime() -
                new Date(a.event.date).getTime()
            )
            .map((item) => (
              <div
                key={item.event.id}
                className="flex items-center gap-2 text-sm"
              >
                <Link
                  href={`/events/${item.event.id}`}
                  className="text-foreground hover:text-accent transition-colors truncate font-medium"
                >
                  {item.event.title}
                </Link>
                <span className="text-[11px] text-muted shrink-0 font-[family-name:var(--font-mono)]">
                  {new Date(item.event.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <StatusBadge
                  type={statusType}
                  status={item.status}
                  size="sm"
                />
                {item.roleLabel && (
                  <span className="text-[11px] text-muted shrink-0 rounded-full bg-surface-hover px-2 py-0.5">
                    {item.roleLabel}
                  </span>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
