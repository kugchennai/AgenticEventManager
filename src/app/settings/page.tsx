"use client";

import { PageHeader, Button } from "@/components/design-system";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Users, Save, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const INPUT_CLASS =
  "w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all";

function VolunteerThresholdCard() {
  const [threshold, setThreshold] = useState("5");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: Record<string, string>) => {
        if (data.volunteer_promotion_threshold) {
          setThreshold(data.volunteer_promotion_threshold);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    const num = parseInt(threshold, 10);
    if (isNaN(num) || num < 1) {
      setError("Must be a number greater than 0");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "volunteer_promotion_threshold", value: String(num) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-accent/10 text-accent">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold mb-1">Volunteer Promotion</h3>
          <p className="text-sm text-muted">
            Set the minimum number of event contributions required before a volunteer
            becomes eligible for conversion to a member.
          </p>
        </div>
      </div>
      <div className="flex items-end gap-3">
        <div className="flex-1 max-w-[200px]">
          <label className="block text-sm font-medium mb-1.5">
            Minimum Events
          </label>
          <input
            type="number"
            min={1}
            value={threshold}
            onChange={(e) => {
              setThreshold(e.target.value);
              setSaved(false);
            }}
            className={INPUT_CLASS}
          />
        </div>
        <Button
          size="md"
          onClick={handleSave}
          disabled={saving}
          className={cn(saved && "bg-status-done/15 text-status-done border-status-done/20")}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" /> Saved
            </>
          ) : saving ? (
            "Saving…"
          ) : (
            <>
              <Save className="h-4 w-4" /> Save
            </>
          )}
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-status-blocked">{error}</p>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const role = session?.user?.globalRole;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isSuperAdmin = role === "SUPER_ADMIN";

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Settings"
        description="Configure your workspace"
      />
      <div className="space-y-4">
        <Link href="/settings/discord">
          <div className="bg-surface border border-border rounded-xl p-6 hover:bg-surface-hover transition-colors">
            <h3 className="font-semibold mb-1">Discord</h3>
            <p className="text-sm text-muted">Bot and notification channels</p>
          </div>
        </Link>
        <Link href="/settings/members">
          <div className="bg-surface border border-border rounded-xl p-6 hover:bg-surface-hover transition-colors">
            <h3 className="font-semibold mb-1">Members</h3>
            <p className="text-sm text-muted">User roles and permissions</p>
          </div>
        </Link>
        {isAdmin && (
          <Link href="/settings/audit-log">
            <div className="bg-surface border border-border rounded-xl p-6 hover:bg-surface-hover transition-colors">
              <h3 className="font-semibold mb-1">Audit Log</h3>
              <p className="text-sm text-muted">Track changes across your workspace</p>
            </div>
          </Link>
        )}
        {isSuperAdmin && <VolunteerThresholdCard />}
      </div>
    </div>
  );
}
