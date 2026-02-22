"use client";

import { PageHeader, Button } from "@/components/design-system";
import { ArrowLeft, Calendar, MapPin, FileText, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SOPTemplate {
  id: string;
  name: string;
  description: string | null;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [templates, setTemplates] = useState<SOPTemplate[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    venue: "",
    templateId: "",
  });

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => (r.ok ? r.json() : []))
      .then(setTemplates)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const event = await res.json();
        router.push(`/events/${event.id}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-6">
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Events
        </Link>
        <PageHeader title="Create Event" description="Set up a new meetup" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="React Bangalore Meetup #13"
              className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What's this meetup about?"
              rows={3}
              className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all resize-none"
            />
          </div>

          {/* Date & Venue */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">
                <Calendar className="h-3 w-3" /> Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all"
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">
                <MapPin className="h-3 w-3" /> Venue
              </label>
              <input
                type="text"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="WeWork, Koramangala"
                className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all"
              />
            </div>
          </div>

          {/* SOP Template */}
          {templates.length > 0 && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted mb-1.5">
                <ClipboardCheck className="h-3 w-3" /> SOP Template
              </label>
              <select
                value={form.templateId}
                onChange={(e) => setForm({ ...form, templateId: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm focus:border-accent outline-none transition-all cursor-pointer"
              >
                <option value="">No template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-muted">
                Pre-fill the SOP checklist from a template
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Event"}
          </Button>
          <Link href="/events">
            <Button variant="ghost" type="button">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
