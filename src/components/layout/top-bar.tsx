"use client";

import { cn } from "@/lib/utils";
import { Search, Bell, Sun, Moon } from "lucide-react";
import { OwnerAvatar } from "@/components/design-system/owner-avatar";
import { useState, useEffect } from "react";

interface TopBarProps {
  sidebarCollapsed: boolean;
  onCommandPalette: () => void;
}

export function TopBar({ sidebarCollapsed, onCommandPalette }: TopBarProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30",
        "h-[var(--topbar-height)] border-b border-border bg-surface/80 backdrop-blur-md",
        "flex items-center justify-between px-4 gap-4",
        "transition-[left] duration-200 ease-out",
        sidebarCollapsed
          ? "left-[var(--sidebar-collapsed)]"
          : "left-[var(--sidebar-width)]"
      )}
    >
      {/* Search trigger */}
      <button
        onClick={onCommandPalette}
        className={cn(
          "flex items-center gap-2 rounded-lg",
          "bg-background border border-border px-3 py-1.5",
          "text-sm text-muted hover:border-border-hover",
          "transition-all duration-150 w-64 cursor-pointer"
        )}
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="ml-auto text-[10px] font-[family-name:var(--font-mono)] bg-surface-hover rounded px-1.5 py-0.5">
          ⌘K
        </kbd>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all duration-150 cursor-pointer"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button
          className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all duration-150 relative cursor-pointer"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
        </button>

        <div className="h-6 w-px bg-border mx-1" />

        <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-surface-hover transition-all duration-150 cursor-pointer">
          <OwnerAvatar name="User" size="sm" />
        </button>
      </div>
    </header>
  );
}
