"use client";

import {
  PageHeader, Button, StatusBadge, PriorityBadge,
  OwnerAvatar, EmptyState, BentoGrid, BentoCard, StatCard, Modal,
} from "@/components/design-system";
import {
  ArrowLeft, Calendar, MapPin, Mic2, Users, ClipboardCheck,
  Check, Pencil, Trash2, Plus, CalendarDays, UserPlus, X, Search,
  ChevronDown, ChevronsUpDown,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDate, formatRelativeDate, cn } from "@/lib/utils";

type VolunteerOption = { id: string; name: string; email: string | null; role: string | null };
type SpeakerOption = { id: string; name: string; email: string | null; topic: string | null };

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  date: string;
  venue: string | null;
  status: string;
  createdBy: { id: string; name: string | null; image: string | null };
  members: { eventRole: string; user: { id: string; name: string | null; image: string | null } }[];
  speakers: {
    id: string;
    status: string;
    priority: string;
    speaker: { id: string; name: string; email: string | null; topic: string | null };
    owner: { id: string; name: string | null; image: string | null } | null;
  }[];
  volunteers: {
    id: string;
    status: string;
    priority: string;
    assignedRole: string | null;
    volunteer: { id: string; name: string; email: string | null };
    owner: { id: string; name: string | null; image: string | null } | null;
  }[];
  checklists: {
    id: string;
    title: string;
    tasks: {
      id: string;
      title: string;
      status: string;
      priority: string;
      deadline: string | null;
      owner: { id: string; name: string | null; image: string | null } | null;
      assignee: { id: string; name: string | null; image: string | null } | null;
      volunteerAssignee: { id: string; name: string } | null;
    }[];
  }[];
}

type TaskItem = EventDetail["checklists"][number]["tasks"][number];
type EventVolunteerItem = EventDetail["volunteers"][number];

const INPUT_CLASS =
  "w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all";

function VolunteerPicker({
  open,
  onClose,
  volunteers,
  linkedIds,
  onLink,
}: {
  open: boolean;
  onClose: () => void;
  volunteers: VolunteerOption[];
  linkedIds: string[];
  onLink: (id: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const available = volunteers.filter(
    (v) => !linkedIds.includes(v.id) && v.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal open={open} onClose={onClose} className="max-w-md max-h-[70vh] flex flex-col">
      <div className="px-5 py-4 border-b border-border shrink-0">
        <h2 className="text-lg font-semibold font-[family-name:var(--font-display)] mb-3">
          Add Volunteer to Event
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search volunteers..."
            className={cn(INPUT_CLASS, "pl-9")}
            autoFocus
          />
        </div>
      </div>
      <div className="overflow-y-auto flex-1 py-1">
        {available.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            {volunteers.length === 0
              ? "No volunteers in directory yet. Add some first."
              : query
                ? "No matching volunteers found."
                : "All volunteers are already linked."}
          </p>
        ) : (
          available.map((v) => (
            <button
              key={v.id}
              onClick={async () => {
                await onLink(v.id);
                onClose();
              }}
              className="flex items-center gap-3 w-full px-5 py-3 text-left hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <OwnerAvatar name={v.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{v.name}</p>
                <p className="text-xs text-muted truncate">
                  {v.role ?? v.email ?? "No role"}
                </p>
              </div>
              <Plus className="h-4 w-4 text-muted shrink-0" />
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}

function SpeakerPicker({
  open,
  onClose,
  speakers,
  linkedIds,
  onLink,
}: {
  open: boolean;
  onClose: () => void;
  speakers: SpeakerOption[];
  linkedIds: string[];
  onLink: (id: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const available = speakers.filter(
    (s) => !linkedIds.includes(s.id) && s.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal open={open} onClose={onClose} className="max-w-md max-h-[70vh] flex flex-col">
      <div className="px-5 py-4 border-b border-border shrink-0">
        <h2 className="text-lg font-semibold font-[family-name:var(--font-display)] mb-3">
          Add Speaker to Event
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search speakers..."
            className={cn(INPUT_CLASS, "pl-9")}
            autoFocus
          />
        </div>
      </div>
      <div className="overflow-y-auto flex-1 py-1">
        {available.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            {speakers.length === 0
              ? "No speakers in directory yet. Add some first."
              : query
                ? "No matching speakers found."
                : "All speakers are already linked."}
          </p>
        ) : (
          available.map((s) => (
            <button
              key={s.id}
              onClick={async () => {
                await onLink(s.id);
                onClose();
              }}
              className="flex items-center gap-3 w-full px-5 py-3 text-left hover:bg-surface-hover transition-colors cursor-pointer"
            >
              <OwnerAvatar name={s.name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.name}</p>
                <p className="text-xs text-muted truncate">
                  {s.topic ?? s.email ?? "—"}
                </p>
              </div>
              <Plus className="h-4 w-4 text-muted shrink-0" />
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}

function TaskRow({
  task,
  checklistId,
  eventVolunteers,
  onUpdate,
}: {
  task: TaskItem;
  checklistId: string;
  eventVolunteers: EventVolunteerItem[];
  onUpdate: (checklistId: string, taskId: string, data: Record<string, unknown>) => Promise<void>;
}) {
  const [showAssignee, setShowAssignee] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState(false);
  const [deadlineValue, setDeadlineValue] = useState(
    task.deadline ? task.deadline.slice(0, 10) : ""
  );

  const toggleDone = () => {
    onUpdate(checklistId, task.id, {
      status: task.status === "DONE" ? "TODO" : "DONE",
    });
  };

  const assignVolunteer = (volunteerId: string | null) => {
    onUpdate(checklistId, task.id, { volunteerAssigneeId: volunteerId });
    setShowAssignee(false);
  };

  const saveDeadline = () => {
    onUpdate(checklistId, task.id, {
      deadline: deadlineValue || null,
    });
    setEditingDeadline(false);
  };

  const isOverdue =
    task.deadline &&
    task.status !== "DONE" &&
    new Date(task.deadline) < new Date();

  const currentAssignee = task.volunteerAssignee ?? task.assignee;
  const currentVolAssigneeId = task.volunteerAssignee?.id;

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors group">
      {/* Checkbox */}
      <button
        onClick={toggleDone}
        className={cn(
          "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer",
          task.status === "DONE"
            ? "bg-status-done border-status-done"
            : "border-border hover:border-accent"
        )}
      >
        {task.status === "DONE" && <Check className="h-3 w-3 text-white" />}
      </button>

      {/* Title */}
      <span
        className={cn(
          "text-sm flex-1 min-w-0 truncate",
          task.status === "DONE" && "line-through text-muted"
        )}
      >
        {task.title}
      </span>

      {/* Assignee */}
      <div className="relative shrink-0">
        <button
          onClick={() => setShowAssignee(!showAssignee)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors cursor-pointer",
            currentAssignee
              ? "bg-surface-hover text-foreground"
              : "text-muted hover:bg-surface-hover hover:text-foreground opacity-0 group-hover:opacity-100"
          )}
          title={currentAssignee ? `Assigned to ${currentAssignee.name}` : "Assign volunteer"}
        >
          {currentAssignee ? (
            <>
              <OwnerAvatar name={currentAssignee.name} size="sm" />
              <span className="max-w-[80px] truncate">{currentAssignee.name}</span>
            </>
          ) : (
            <>
              <UserPlus className="h-3.5 w-3.5" />
              <span>Assign</span>
            </>
          )}
        </button>

        {showAssignee && (
          <div className="absolute top-full right-0 mt-1 z-30 w-52 bg-surface border border-border rounded-lg shadow-xl py-1 animate-fade-in">
            {currentAssignee && (
              <button
                onClick={() => assignVolunteer(null)}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-status-blocked hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                Unassign
              </button>
            )}
            {eventVolunteers.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted">
                No volunteers linked. Add some in the Volunteers tab.
              </p>
            ) : (
              eventVolunteers.map((ev) => (
                <button
                  key={ev.volunteer.id}
                  onClick={() => assignVolunteer(ev.volunteer.id)}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-surface-hover transition-colors cursor-pointer",
                    currentVolAssigneeId === ev.volunteer.id && "bg-accent/10 text-accent"
                  )}
                >
                  <OwnerAvatar name={ev.volunteer.name} size="sm" />
                  <span className="truncate">{ev.volunteer.name}</span>
                  {ev.assignedRole && (
                    <span className="ml-auto text-[10px] text-muted">{ev.assignedRole}</span>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Priority */}
      <PriorityBadge priority={task.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"} />

      {/* Status */}
      <StatusBadge type="task" status={task.status} />

      {/* Deadline */}
      <div className="shrink-0 w-28 text-right">
        {editingDeadline ? (
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={deadlineValue}
              onChange={(e) => setDeadlineValue(e.target.value)}
              onBlur={saveDeadline}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveDeadline();
                if (e.key === "Escape") setEditingDeadline(false);
              }}
              autoFocus
              className="w-full bg-background border border-border rounded px-1.5 py-0.5 text-[11px] font-[family-name:var(--font-mono)] outline-none focus:border-accent"
            />
          </div>
        ) : (
          <button
            onClick={() => {
              setDeadlineValue(task.deadline ? task.deadline.slice(0, 10) : "");
              setEditingDeadline(true);
            }}
            className={cn(
              "text-[11px] font-[family-name:var(--font-mono)] transition-colors cursor-pointer rounded px-1.5 py-0.5",
              task.deadline
                ? isOverdue
                  ? "text-status-blocked bg-status-blocked/10"
                  : "text-muted hover:bg-surface-hover"
                : "text-muted/40 hover:bg-surface-hover hover:text-muted opacity-0 group-hover:opacity-100"
            )}
            title="Click to edit deadline"
          >
            {task.deadline ? (
              <>
                <CalendarDays className="h-3 w-3 inline mr-1" />
                {formatDate(task.deadline)}
              </>
            ) : (
              <>
                <CalendarDays className="h-3 w-3 inline mr-1" />
                Set date
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

const CHECKLIST_COLORS: Record<string, { accent: string; bg: string; border: string; dot: string }> = {
  "Pre-Event":  { accent: "text-blue-400",    bg: "bg-blue-400/10",    border: "border-blue-400/20",  dot: "bg-blue-400" },
  "On-Day":     { accent: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/20", dot: "bg-amber-400" },
  "Post-Event": { accent: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", dot: "bg-emerald-400" },
};

function ChecklistTab({
  checklists,
  eventVolunteers,
  onUpdateTask,
}: {
  checklists: EventDetail["checklists"];
  eventVolunteers: EventVolunteerItem[];
  onUpdateTask: (checklistId: string, taskId: string, data: Record<string, unknown>) => Promise<void>;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const allCollapsed = checklists.length > 0 && checklists.every((c) => collapsed[c.id]);

  const toggleAll = () => {
    const next: Record<string, boolean> = {};
    for (const c of checklists) next[c.id] = !allCollapsed;
    setCollapsed(next);
  };

  const toggle = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  if (checklists.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No checklists yet"
        description="Create a checklist or apply an SOP template to track tasks."
      />
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={toggleAll}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <ChevronsUpDown className="h-3.5 w-3.5" />
          {allCollapsed ? "Expand All" : "Collapse All"}
        </button>
      </div>

      <div className="space-y-4">
        {checklists.map((checklist) => {
          const colors = CHECKLIST_COLORS[checklist.title];
          const isCollapsed = !!collapsed[checklist.id];
          const done = checklist.tasks.filter((t) => t.status === "DONE").length;
          const total = checklist.tasks.length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <div
              key={checklist.id}
              className="bg-surface border border-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggle(checklist.id)}
                className="w-full px-5 py-3 flex items-center gap-3 cursor-pointer hover:bg-surface-hover/50 transition-colors"
              >
                {colors && (
                  <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", colors.dot)} />
                )}
                <h4
                  className={cn(
                    "text-sm font-semibold font-[family-name:var(--font-display)]",
                    colors?.accent ?? "text-foreground"
                  )}
                >
                  {checklist.title}
                </h4>

                <div className="flex items-center gap-2 ml-auto">
                  {/* mini progress bar */}
                  <div className="w-16 h-1.5 rounded-full bg-surface-active overflow-hidden hidden sm:block">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        colors ? colors.dot : "bg-accent"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-[family-name:var(--font-mono)] text-muted">
                    {done}/{total}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted transition-transform duration-200",
                      isCollapsed && "-rotate-90"
                    )}
                  />
                </div>
              </button>

              {!isCollapsed && (
                <div className={cn("border-t", colors?.border ?? "border-border")}>
                  {checklist.tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      checklistId={checklist.id}
                      eventVolunteers={eventVolunteers}
                      onUpdate={onUpdateTask}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type Tab = "overview" | "speakers" | "volunteers" | "checklist";

const TABS: { id: Tab; label: string; icon: typeof Calendar }[] = [
  { id: "overview", label: "Overview", icon: Calendar },
  { id: "speakers", label: "Speakers", icon: Mic2 },
  { id: "volunteers", label: "Volunteers", icon: Users },
  { id: "checklist", label: "SOP Checklist", icon: ClipboardCheck },
];

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const fetchEvent = useCallback(() => {
    fetch(`/api/events/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setEvent)
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const updateTask = async (
    checklistId: string,
    taskId: string,
    data: Record<string, unknown>
  ) => {
    const res = await fetch(`/api/checklists/${checklistId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) fetchEvent();
  };

  // --- Volunteer & Speaker linking ---
  const [volPickerOpen, setVolPickerOpen] = useState(false);
  const [spkPickerOpen, setSpkPickerOpen] = useState(false);
  const [allVolunteers, setAllVolunteers] = useState<VolunteerOption[]>([]);
  const [allSpeakers, setAllSpeakers] = useState<SpeakerOption[]>([]);

  const loadVolunteers = useCallback(async () => {
    const res = await fetch("/api/volunteers");
    if (res.ok) setAllVolunteers(await res.json());
  }, []);

  const loadSpeakers = useCallback(async () => {
    const res = await fetch("/api/speakers");
    if (res.ok) setAllSpeakers(await res.json());
  }, []);

  const linkVolunteer = async (volunteerId: string) => {
    await fetch(`/api/events/${id}/volunteers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ volunteerId }),
    });
    fetchEvent();
  };

  const unlinkVolunteer = async (volunteerId: string) => {
    await fetch(`/api/events/${id}/volunteers?volunteerId=${volunteerId}`, {
      method: "DELETE",
    });
    fetchEvent();
  };

  const linkSpeaker = async (speakerId: string) => {
    await fetch(`/api/events/${id}/speakers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ speakerId }),
    });
    fetchEvent();
  };

  const unlinkSpeaker = async (speakerId: string) => {
    await fetch(`/api/events/${id}/speakers?speakerId=${speakerId}`, {
      method: "DELETE",
    });
    fetchEvent();
  };

  // --- Edit event ---
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    date: "",
    venue: "",
    description: "",
  });
  const [editSaving, setEditSaving] = useState(false);

  if (loading) {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="h-8 w-64 rounded animate-shimmer" />
        <div className="h-4 w-96 rounded animate-shimmer" />
        <div className="h-64 rounded-xl animate-shimmer" />
      </div>
    );
  }

  if (!event) {
    return (
      <EmptyState
        icon={Calendar}
        title="Event not found"
        description="This event may have been deleted."
        action={
          <Link href="/events">
            <Button variant="secondary">Back to Events</Button>
          </Link>
        }
      />
    );
  }

  const allTasks = event.checklists.flatMap((c) => c.tasks);
  const doneTasks = allTasks.filter((t) => t.status === "DONE").length;
  const progress = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/events");
  };

  const openEdit = () => {
    setEditForm({
      title: event.title,
      date: event.date.slice(0, 10),
      venue: event.venue ?? "",
      description: event.description ?? "",
    });
    setEditOpen(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title.trim() || !editForm.date) return;
    setEditSaving(true);
    const res = await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editForm.title.trim(),
        date: editForm.date,
        venue: editForm.venue.trim() || null,
        description: editForm.description.trim() || null,
      }),
    });
    setEditSaving(false);
    if (res.ok) {
      setEditOpen(false);
      fetchEvent();
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="h-3 w-3" /> Events
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold font-[family-name:var(--font-display)] tracking-tight">
              {event.title}
            </h1>
            {new Date(event.date) >= new Date(new Date().toDateString()) ? (
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium bg-status-progress/15 text-status-progress border-status-progress/20">
                <Calendar className="h-3.5 w-3.5" />
                Upcoming
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium bg-surface-hover text-muted border-border">
                Ended
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(event.date)} ({formatRelativeDate(event.date)})
            </span>
            {event.venue && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {event.venue}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={openEdit}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} className="p-6 max-w-md">
        <h2 className="text-lg font-semibold font-[family-name:var(--font-display)] mb-4">Edit Event</h2>
        <form onSubmit={saveEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Title *</label>
            <input
              type="text"
              value={editForm.title}
              onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
              required
              className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Date *</label>
            <input
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
              required
              className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Venue</label>
            <input
              type="text"
              value={editForm.venue}
              onChange={(e) => setEditForm((f) => ({ ...f, venue: e.target.value }))}
              placeholder="e.g. Community Hall, Room 101"
              className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Event description"
              rows={3}
              className="w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all min-h-[80px] resize-y"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={editSaving}>
              {editSaving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 border-b border-border mb-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const count =
            tab.id === "speakers" ? event.speakers.length :
            tab.id === "volunteers" ? event.volunteers.length :
            tab.id === "checklist" ? allTasks.length : undefined;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all cursor-pointer",
                activeTab === tab.id
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {count !== undefined && (
                <span className="text-[10px] font-[family-name:var(--font-mono)] bg-surface-hover rounded-full px-1.5 py-0.5">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <BentoGrid className="lg:grid-cols-3">
          <BentoCard colSpan={2}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted mb-2">About</h3>
            <p className="text-sm text-foreground/80">
              {event.description || "No description provided."}
            </p>
          </BentoCard>

          <StatCard label="SOP Progress" value={`${progress}%`}>
            <div className="mt-2 h-2 rounded-full bg-surface-active overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-amber-400 transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] font-[family-name:var(--font-mono)] text-muted">
              {doneTasks}/{allTasks.length} tasks done
            </p>
          </StatCard>

          <StatCard label="Speakers" value={event.speakers.length} icon={Mic2} />
          <StatCard label="Volunteers" value={event.volunteers.length} icon={Users} />
          <StatCard
            label="Lead"
            value={event.createdBy.name ?? "Unknown"}
          >
            <div className="mt-2">
              <OwnerAvatar name={event.createdBy.name} image={event.createdBy.image} size="md" />
            </div>
          </StatCard>
        </BentoGrid>
      )}

      {activeTab === "speakers" && (
        <div>
          <div className="flex justify-end mb-4">
            <Button
              size="sm"
              onClick={() => {
                loadSpeakers();
                setSpkPickerOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Add Speaker
            </Button>
          </div>

          {event.speakers.length === 0 ? (
            <EmptyState
              icon={Mic2}
              title="No speakers assigned"
              description="Click 'Add Speaker' to link speakers from your directory."
            />
          ) : (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              {event.speakers.map((es) => (
                <div
                  key={es.id}
                  className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0 hover:bg-surface-hover transition-colors group"
                >
                  <OwnerAvatar name={es.speaker.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{es.speaker.name}</p>
                    <p className="text-xs text-muted">{es.speaker.topic ?? es.speaker.email}</p>
                  </div>
                  <StatusBadge type="speaker" status={es.status} />
                  <button
                    onClick={() => unlinkSpeaker(es.speaker.id)}
                    className="p-1.5 rounded-lg text-muted hover:text-status-blocked hover:bg-status-blocked/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove speaker"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <SpeakerPicker
            open={spkPickerOpen}
            onClose={() => setSpkPickerOpen(false)}
            speakers={allSpeakers}
            linkedIds={event.speakers.map((s) => s.speaker.id)}
            onLink={linkSpeaker}
          />
        </div>
      )}

      {activeTab === "volunteers" && (
        <div>
          <div className="flex justify-end mb-4">
            <Button
              size="sm"
              onClick={() => {
                loadVolunteers();
                setVolPickerOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" /> Add Volunteer
            </Button>
          </div>

          {event.volunteers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No volunteers assigned"
              description="Click 'Add Volunteer' to link volunteers from your directory."
            />
          ) : (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              {event.volunteers.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0 hover:bg-surface-hover transition-colors group"
                >
                  <OwnerAvatar name={ev.volunteer.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{ev.volunteer.name}</p>
                    <p className="text-xs text-muted">{ev.assignedRole ?? "No role assigned"}</p>
                  </div>
                  <StatusBadge type="volunteer" status={ev.status} />
                  <button
                    onClick={() => unlinkVolunteer(ev.volunteer.id)}
                    className="p-1.5 rounded-lg text-muted hover:text-status-blocked hover:bg-status-blocked/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove volunteer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <VolunteerPicker
            open={volPickerOpen}
            onClose={() => setVolPickerOpen(false)}
            volunteers={allVolunteers}
            linkedIds={event.volunteers.map((v) => v.volunteer.id)}
            onLink={linkVolunteer}
          />
        </div>
      )}

      {activeTab === "checklist" && (
        <ChecklistTab
          checklists={event.checklists}
          eventVolunteers={event.volunteers}
          onUpdateTask={updateTask}
        />
      )}
    </div>
  );
}
