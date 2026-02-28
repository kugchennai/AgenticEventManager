"use client";

import { cn } from "@/lib/utils";
import {
  Check,
  Clock,
  Loader2,
  AlertTriangle,
  Send,
  X,
  UserCheck,
  UserX,
  Circle,
} from "lucide-react";
import type { ComponentType } from "react";

interface StatusConfig {
  label: string;
  icon: ComponentType<{ className?: string }>;
  className: string;
}

const TASK_STATUS: Record<string, StatusConfig> = {
  TODO: { label: "To Do", icon: Circle, className: "bg-status-pending/15 text-status-pending border-status-pending/20" },
  IN_PROGRESS: { label: "In Progress", icon: Loader2, className: "bg-status-progress/15 text-status-progress border-status-progress/20" },
  BLOCKED: { label: "Blocked", icon: AlertTriangle, className: "bg-status-blocked/15 text-status-blocked border-status-blocked/20" },
  DONE: { label: "Done", icon: Check, className: "bg-status-done/15 text-status-done border-status-done/20" },
};

const SPEAKER_STATUS: Record<string, StatusConfig> = {
  INVITED: { label: "Invited", icon: Send, className: "bg-status-progress/15 text-status-progress border-status-progress/20" },
  CONFIRMED: { label: "Confirmed", icon: Check, className: "bg-status-done/15 text-status-done border-status-done/20" },
  DECLINED: { label: "Declined", icon: X, className: "bg-status-blocked/15 text-status-blocked border-status-blocked/20" },
  CANCELLED: { label: "Cancelled", icon: X, className: "bg-status-pending/15 text-status-pending border-status-pending/20" },
};

const VOLUNTEER_STATUS: Record<string, StatusConfig> = {
  PENDING: { label: "Pending", icon: Clock, className: "bg-status-pending/15 text-status-pending border-status-pending/20" },
  CONFIRMED: { label: "Confirmed", icon: UserCheck, className: "bg-status-done/15 text-status-done border-status-done/20" },
  ACTIVE: { label: "Active", icon: Check, className: "bg-status-progress/15 text-status-progress border-status-progress/20" },
  NO_SHOW: { label: "No Show", icon: UserX, className: "bg-status-blocked/15 text-status-blocked border-status-blocked/20" },
};

const VENUE_PARTNER_STATUS: Record<string, StatusConfig> = {
  INQUIRY: { label: "Inquiry", icon: Send, className: "bg-status-pending/15 text-status-pending border-status-pending/20" },
  PENDING: { label: "Pending", icon: Clock, className: "bg-status-progress/15 text-status-progress border-status-progress/20" },
  CONFIRMED: { label: "Confirmed", icon: Check, className: "bg-status-done/15 text-status-done border-status-done/20" },
  DECLINED: { label: "Declined", icon: X, className: "bg-status-blocked/15 text-status-blocked border-status-blocked/20" },
  CANCELLED: { label: "Cancelled", icon: UserX, className: "bg-status-pending/15 text-status-pending border-status-pending/20" },
};

const EVENT_STATUS: Record<string, StatusConfig> = {
  DRAFT: { label: "Draft", icon: Circle, className: "bg-status-pending/15 text-status-pending border-status-pending/20" },
  SCHEDULED: { label: "Scheduled", icon: Clock, className: "bg-status-progress/15 text-status-progress border-status-progress/20" },
  LIVE: { label: "Live", icon: Loader2, className: "bg-accent/15 text-accent border-accent/20" },
  COMPLETED: { label: "Completed", icon: Check, className: "bg-status-done/15 text-status-done border-status-done/20" },
};

type StatusType = "task" | "speaker" | "volunteer" | "event" | "venue";

const STATUS_MAPS: Record<StatusType, Record<string, StatusConfig>> = {
  task: TASK_STATUS,
  speaker: SPEAKER_STATUS,
  volunteer: VOLUNTEER_STATUS,
  event: EVENT_STATUS,
  venue: VENUE_PARTNER_STATUS,
};

export function StatusBadge({
  type,
  status,
  size = "sm",
  className: extraClassName,
}: {
  type: StatusType;
  status: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const config = STATUS_MAPS[type]?.[status];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        config.className,
        extraClassName
      )}
    >
      <Icon className={cn("shrink-0", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      {config.label}
    </span>
  );
}
