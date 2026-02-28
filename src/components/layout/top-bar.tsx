"use client";

import { cn } from "@/lib/utils";
import { Search, Bell, Sun, Moon, LogOut } from "lucide-react";
import { OwnerAvatar } from "@/components/design-system/owner-avatar";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

interface TopBarProps {
  sidebarCollapsed: boolean;
  onCommandPalette: () => void;
}

export function TopBar({ sidebarCollapsed, onCommandPalette }: TopBarProps) {
  const { data: session } = useSession();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const handler = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notificationsOpen]);

  const handleNotificationsClick = () => {
    setNotificationsOpen((prev) => !prev);
  };

  const userName = session?.user?.name ?? "User";
  const userEmail = session?.user?.email;
  const userImage = session?.user?.image;

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

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={handleNotificationsClick}
            className={cn(
              "p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-all duration-150 relative cursor-pointer",
              notificationsOpen && "bg-surface-hover text-foreground"
            )}
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-surface border border-border rounded-xl shadow-xl animate-fade-in z-50">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold">Notifications</h3>
                <span className="text-xs text-muted bg-surface-hover rounded-full px-2 py-0.5">0 new</span>
              </div>
              <div className="py-10 flex flex-col items-center justify-center gap-2 text-center px-4">
                <Bell className="h-8 w-8 text-muted opacity-40" />
                <p className="text-sm font-medium text-muted">You&apos;re all caught up</p>
                <p className="text-xs text-muted opacity-70">No new notifications right now</p>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-border mx-1" />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-surface-hover transition-all duration-150 cursor-pointer"
          >
            <OwnerAvatar name={userName} image={userImage} size="sm" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-surface border border-border rounded-xl shadow-xl py-1 animate-fade-in z-50">
              <div className="px-3 py-2.5 border-b border-border">
                <p className="text-sm font-medium truncate">{userName}</p>
                {userEmail && (
                  <p className="text-xs text-muted truncate">{userEmail}</p>
                )}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
