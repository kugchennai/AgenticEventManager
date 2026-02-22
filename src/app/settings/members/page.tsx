"use client";

import { PageHeader, Button, EmptyState, OwnerAvatar, Modal } from "@/components/design-system";
import { Users, Shield, ChevronDown, Plus, Mail } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  globalRole: string;
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  EVENT_LEAD: "Event Lead",
  VOLUNTEER: "Volunteer",
  VIEWER: "Viewer",
};

const ASSIGNABLE_ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  EVENT_LEAD: "Event Lead",
  VOLUNTEER: "Volunteer",
  VIEWER: "Viewer",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "text-rose-400",
  ADMIN: "text-accent",
  EVENT_LEAD: "text-status-progress",
  VOLUNTEER: "text-status-done",
  VIEWER: "text-muted",
};

function RoleDropdown({
  currentRole,
  onSelect,
  disabled,
}: {
  currentRole: string;
  onSelect: (role: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.right - 160,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  if (disabled) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
          "border border-border",
          ROLE_COLORS[currentRole]
        )}
      >
        <Shield className="h-3 w-3" />
        {ROLE_LABELS[currentRole] ?? currentRole}
      </span>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
          "border border-border hover:border-border-hover transition-all cursor-pointer",
          ROLE_COLORS[currentRole]
        )}
      >
        <Shield className="h-3 w-3" />
        {ROLE_LABELS[currentRole] ?? currentRole}
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] w-40 bg-surface border border-border rounded-lg shadow-xl py-1 animate-fade-in"
            style={{ top: pos.top, left: pos.left }}
          >
            {Object.entries(ASSIGNABLE_ROLE_LABELS).map(([role, label]) => (
              <button
                key={role}
                onClick={() => {
                  onSelect(role);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-xs font-medium cursor-pointer",
                  "hover:bg-surface-hover transition-colors",
                  role === currentRole ? "text-accent" : "text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

const INPUT_CLASS =
  "w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all";

function AddMemberModal({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (member: Member) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("VIEWER");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSaving(true);
    setError(null);

    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        name: name.trim() || undefined,
        globalRole: role,
      }),
    });

    if (res.ok) {
      const member = await res.json();
      onAdded(member);
      setEmail("");
      setName("");
      setRole("VIEWER");
      onClose();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Failed to add member");
    }
    setSaving(false);
  };

  return (
    <Modal open={open} onClose={onClose} className="p-6">
      <h2 className="text-lg font-semibold font-[family-name:var(--font-display)] mb-4">
        Add Member
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Email *</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              required
              autoFocus
              className={cn(INPUT_CLASS, "pl-9")}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name (optional)"
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={INPUT_CLASS}
          >
            {Object.entries(ASSIGNABLE_ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {error && (
          <p className="text-sm text-status-blocked bg-status-blocked/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Adding…" : "Add Member"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function MembersPage() {
  const { data: session } = useSession();
  const myRole = session?.user?.globalRole ?? "VIEWER";
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/members")
      .then((r) => (r.ok ? r.json() : []))
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const updateRole = async (userId: string, globalRole: string) => {
    const prev = members.find((m) => m.id === userId)?.globalRole;
    setMembers((ms) =>
      ms.map((m) => (m.id === userId ? { ...m, globalRole } : m))
    );

    const res = await fetch("/api/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, globalRole }),
    });

    if (res.ok) {
      const updated = await res.json();
      setMembers((ms) =>
        ms.map((m) => (m.id === updated.id ? { ...m, globalRole: updated.globalRole } : m))
      );
      setToast({ message: `Role updated to ${ROLE_LABELS[globalRole] ?? globalRole}`, type: "success" });
    } else {
      setMembers((ms) =>
        ms.map((m) => (m.id === userId ? { ...m, globalRole: prev ?? m.globalRole } : m))
      );
      const data = await res.json().catch(() => null);
      setToast({ message: data?.error ?? "Failed to update role", type: "error" });
    }
  };

  return (
    <div className="animate-fade-in">
      {toast && (
        <div
          className={cn(
            "fixed top-4 right-4 z-[200] rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg animate-fade-in",
            toast.type === "success"
              ? "bg-status-done/15 text-status-done border border-status-done/20"
              : "bg-status-blocked/15 text-status-blocked border border-status-blocked/20"
          )}
        >
          {toast.message}
        </div>
      )}

      <PageHeader
        title="Members"
        description="Manage user roles and permissions"
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Member
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border">
              <div className="h-8 w-8 rounded-full animate-shimmer" />
              <div className="h-4 w-32 rounded animate-shimmer" />
              <div className="ml-auto h-6 w-20 rounded animate-shimmer" />
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members yet"
          description="Add team members by email to get started."
          action={
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Member
            </Button>
          }
        />
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-5 py-3 border-b border-border text-[10px] font-semibold uppercase tracking-widest text-muted">
            <span />
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Joined</span>
          </div>
          {members.map((member) => (
            <div
              key={member.id}
              className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 items-center px-5 py-3 border-b border-border last:border-0 hover:bg-surface-hover transition-colors"
            >
              <OwnerAvatar name={member.name} image={member.image} size="md" />
              <span className="text-sm font-medium truncate">{member.name ?? "—"}</span>
              <span className="text-sm text-muted truncate">{member.email ?? "—"}</span>
              <RoleDropdown
                currentRole={member.globalRole}
                onSelect={(role) => updateRole(member.id, role)}
                disabled={
                  member.globalRole === "SUPER_ADMIN" ||
                  member.id === session?.user?.id ||
                  (myRole === "ADMIN" && member.globalRole === "ADMIN")
                }
              />
              <span className="text-[11px] font-[family-name:var(--font-mono)] text-muted">
                {new Date(member.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          ))}
        </div>
      )}

      <AddMemberModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={(member) => setMembers((prev) => [member, ...prev])}
      />
    </div>
  );
}
