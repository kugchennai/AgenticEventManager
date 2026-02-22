"use client";

import { PageHeader } from "@/components/design-system";
import Link from "next/link";

export default function SettingsPage() {
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
        <Link href="/settings/audit-log">
          <div className="bg-surface border border-border rounded-xl p-6 hover:bg-surface-hover transition-colors">
            <h3 className="font-semibold mb-1">Audit Log</h3>
            <p className="text-sm text-muted">Track changes across your workspace</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
