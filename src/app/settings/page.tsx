"use client";

import { PageHeader, Button } from "@/components/design-system";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Users, Save, Check, Type, ClipboardCheck, Mail, Send, AlertCircle, Shield } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/lib/app-settings-context";

const INPUT_CLASS =
  "w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all";

function MeetupNameCard() {
  const { meetupName, setMeetupName } = useAppSettings();
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(meetupName);
  }, [meetupName]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Meetup name cannot be empty");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "meetup_name", value: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      setMeetupName(trimmed);
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
          <Type className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold mb-1">Meetup Name</h3>
          <p className="text-sm text-muted">
            Set the name of your meetup group. This will be displayed in the sidebar and toolbar.
          </p>
        </div>
      </div>
      <div className="flex items-end gap-3">
        <div className="flex-1 max-w-[320px]">
          <label className="block text-sm font-medium mb-1.5">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            placeholder="e.g. React Bangalore"
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

function MinVolunteerTasksCard() {
  const { minVolunteerTasks, setMinVolunteerTasks } = useAppSettings();
  const [value, setValue] = useState("7");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(String(minVolunteerTasks));
  }, [minVolunteerTasks]);

  const handleSave = async () => {
    const num = parseInt(value, 10);
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
        body: JSON.stringify({ key: "min_volunteer_tasks", value: String(num) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to save");
      }
      setMinVolunteerTasks(num);
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
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold mb-1">Minimum Volunteer Tasks</h3>
          <p className="text-sm text-muted">
            Set the minimum number of completed SOP tasks required per volunteer
            for each event. Displayed as a progress badge on the volunteer tab.
          </p>
        </div>
      </div>
      <div className="flex items-end gap-3">
        <div className="flex-1 max-w-[200px]">
          <label className="block text-sm font-medium mb-1.5">
            Minimum Tasks
          </label>
          <input
            type="number"
            min={1}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
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

function TestEmailCard() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [smtpStatus, setSmtpStatus] = useState<{
    configured: boolean;
    connected: boolean;
    error?: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/email/test")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSmtpStatus(data);
      })
      .catch(() => {});
  }, []);

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setResult({ success: false, message: "Please enter an email address" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setResult({ success: false, message: "Invalid email address format" });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ success: true, message: `Test email sent to ${data.sentTo}` });
        setEmail("");
      } else {
        setResult({ success: false, message: data.error ?? "Failed to send" });
      }
    } catch {
      setResult({ success: false, message: "Network error — could not reach server" });
    } finally {
      setSending(false);
    }
  };

  const smtpOk = smtpStatus?.configured && smtpStatus?.connected;

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-accent/10 text-accent">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold mb-1">Test Email</h3>
          <p className="text-sm text-muted">
            Send a test email to verify your SMTP configuration is working.
            Enter any member&apos;s email address below.
          </p>
        </div>
      </div>
      {smtpStatus && !smtpOk && (
        <div className="flex items-center gap-2 mb-4 text-sm text-status-blocked bg-status-blocked/10 rounded-lg px-3 py-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>
            {!smtpStatus.configured
              ? "SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in your .env file."
              : `SMTP connection failed: ${smtpStatus.error}`}
          </span>
        </div>
      )}
      {smtpStatus && smtpOk && (
        <div className="flex items-center gap-2 mb-4 text-sm text-status-done bg-status-done/10 rounded-lg px-3 py-2">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>SMTP connected and ready</span>
        </div>
      )}
      <div className="flex items-end gap-3">
        <div className="flex-1 max-w-[360px]">
          <label className="block text-sm font-medium mb-1.5">
            Recipient Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setResult(null);
            }}
            placeholder="member@example.com"
            className={INPUT_CLASS}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !sending) handleSend();
            }}
          />
        </div>
        <Button
          size="md"
          onClick={handleSend}
          disabled={sending || (smtpStatus !== null && !smtpOk)}
        >
          {sending ? (
            "Sending…"
          ) : (
            <>
              <Send className="h-4 w-4" /> Send Test
            </>
          )}
        </Button>
      </div>
      {result && (
        <p
          className={cn(
            "mt-2 text-sm",
            result.success ? "text-status-done" : "text-status-blocked"
          )}
        >
          {result.message}
        </p>
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
        <Link href="/settings/permissions">
          <div className="bg-surface border border-border rounded-xl p-6 hover:bg-surface-hover transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">Permissions & Access</h3>
              <Shield className="h-4 w-4 text-accent" />
            </div>
            <p className="text-sm text-muted">View the full permission matrix for all roles</p>
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
        {isSuperAdmin && <MeetupNameCard />}
        {isSuperAdmin && <VolunteerThresholdCard />}
        {isSuperAdmin && <MinVolunteerTasksCard />}
        {isAdmin && <TestEmailCard />}
      </div>
    </div>
  );
}
