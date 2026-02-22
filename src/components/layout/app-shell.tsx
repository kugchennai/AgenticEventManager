"use client";

import { cn } from "@/lib/utils";
import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { CommandPalette } from "./command-palette";
import type { ReactNode } from "react";

const SHELL_EXCLUDED_ROUTES = ["/"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const isShellHidden = SHELL_EXCLUDED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  const toggleCommandPalette = useCallback(() => {
    setCommandPaletteOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isShellHidden) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleCommandPalette();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCommandPalette, isShellHidden]);

  if (isShellHidden) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <TopBar
        sidebarCollapsed={sidebarCollapsed}
        onCommandPalette={toggleCommandPalette}
      />
      <main
        className={cn(
          "pt-[var(--topbar-height)] min-h-screen",
          "transition-[padding-left] duration-200 ease-out",
          sidebarCollapsed
            ? "pl-[var(--sidebar-collapsed)]"
            : "pl-[var(--sidebar-width)]"
        )}
      >
        <div className="max-w-[1400px] mx-auto p-6">
          {children}
        </div>
      </main>
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
