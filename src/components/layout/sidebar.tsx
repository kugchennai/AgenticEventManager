"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Mic2,
  Users,
  ClipboardCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Speakers", href: "/speakers", icon: Mic2 },
  { label: "Volunteers", href: "/volunteers", icon: Users },
];

const SETTINGS_ITEMS = [
  { label: "SOP Templates", href: "/settings/templates", icon: ClipboardCheck },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard" || href === "/settings") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-40 h-screen",
        "bg-surface border-r border-border",
        "flex flex-col",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-[var(--sidebar-collapsed)]" : "w-[var(--sidebar-width)]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-[var(--topbar-height)] border-b border-border shrink-0">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-amber-600 flex items-center justify-center shrink-0">
          <Zap className="h-4 w-4 text-accent-fg" />
        </div>
        {!collapsed && (
          <span className="font-semibold font-[family-name:var(--font-display)] text-sm truncate">
            Meetup Manager
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        <p className={cn(
          "text-[10px] font-semibold uppercase tracking-widest text-muted px-3 mb-2",
          collapsed && "sr-only"
        )}>
          Main
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                "transition-all duration-150",
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:text-foreground hover:bg-surface-hover",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active && "text-accent")} />
              {!collapsed && <span>{item.label}</span>}
              {active && !collapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
              )}
            </Link>
          );
        })}

        <div className="h-px bg-border mx-2 my-3" />

        <p className={cn(
          "text-[10px] font-semibold uppercase tracking-widest text-muted px-3 mb-2",
          collapsed && "sr-only"
        )}>
          Manage
        </p>
        {SETTINGS_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium",
                "transition-all duration-150",
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:text-foreground hover:bg-surface-hover",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active && "text-accent")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-2 shrink-0">
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center justify-center rounded-lg p-2 w-full",
            "text-muted hover:text-foreground hover:bg-surface-hover",
            "transition-all duration-150 cursor-pointer"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
