"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { createPortal } from "react-dom";
import {
  Calendar,
  LayoutDashboard,
  Mic2,
  Users,
  Settings,
  ClipboardCheck,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Command = { label: string; href: string; icon: LucideIcon; group: string; minRole?: string };

const ROLE_LEVEL: Record<string, number> = {
  VIEWER: 0,
  VOLUNTEER: 1,
  EVENT_LEAD: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

const COMMANDS: Command[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Navigate" },
  { label: "Events", href: "/events", icon: Calendar, group: "Navigate" },
  { label: "Speakers", href: "/speakers", icon: Mic2, group: "Navigate", minRole: "EVENT_LEAD" },
  { label: "Volunteers", href: "/volunteers", icon: Users, group: "Navigate", minRole: "EVENT_LEAD" },
  { label: "SOP Templates", href: "/settings/templates", icon: ClipboardCheck, group: "Navigate", minRole: "EVENT_LEAD" },
  { label: "Settings", href: "/settings", icon: Settings, group: "Navigate", minRole: "ADMIN" },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = session?.user?.globalRole;

  const roleLevel = ROLE_LEVEL[userRole ?? ""] ?? 0;
  const available = COMMANDS.filter(
    (cmd) => !cmd.minRole || roleLevel >= (ROLE_LEVEL[cmd.minRole] ?? 0)
  );

  const filtered = available.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (open) onClose();
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      router.push(filtered[selectedIndex].href);
      onClose();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-lg",
          "bg-surface border border-border rounded-xl shadow-2xl shadow-black/30",
          "overflow-hidden",
          "animate-fade-in"
        )}
      >
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="h-4 w-4 text-muted shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-muted"
          />
          <kbd className="text-[10px] font-[family-name:var(--font-mono)] text-muted bg-surface-hover rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">No results found.</p>
          ) : (
            filtered.map((cmd, i) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.href}
                  onClick={() => {
                    router.push(cmd.href);
                    onClose();
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 w-full text-left text-sm",
                    "transition-colors duration-75 cursor-pointer",
                    i === selectedIndex
                      ? "bg-accent/10 text-accent"
                      : "text-foreground hover:bg-surface-hover"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-60" />
                  <span>{cmd.label}</span>
                  <span className="ml-auto text-[10px] text-muted">{cmd.group}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
