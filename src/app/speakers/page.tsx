"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  PageHeader,
  Button,
  EmptyState,
  StatusBadge,
  OwnerAvatar,
  BentoCard,
  BentoGrid,
  Modal,
} from "@/components/design-system";
import { Mic2, Plus, Pencil, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Speaker = {
  id: string;
  name: string;
  email: string | null;
  bio: string | null;
  topic: string | null;
  photoUrl: string | null;
  eventCount: number;
  statusCounts: Record<string, number>;
};

type FormData = {
  name: string;
  email: string;
  bio: string;
  topic: string;
};

const INPUT_CLASS =
  "w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all";

const ROLE_LEVEL: Record<string, number> = { VIEWER: 0, VOLUNTEER: 1, EVENT_LEAD: 2, ADMIN: 3, SUPER_ADMIN: 4 };

export default function SpeakersPage() {
  const { data: session, status } = useSession();
  const nav = useRouter();
  const userRole = session?.user?.globalRole ?? "";
  const hasAccess = (ROLE_LEVEL[userRole] ?? 0) >= ROLE_LEVEL.VOLUNTEER;
  const canManage = (ROLE_LEVEL[userRole] ?? 0) >= ROLE_LEVEL.EVENT_LEAD;

  useEffect(() => {
    if (status === "loading") return;
    if (!hasAccess) nav.replace("/dashboard");
  }, [status, hasAccess, nav]);

  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    bio: "",
    topic: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpeakers = useCallback(async () => {
    try {
      const res = await fetch("/api/speakers");
      if (!res.ok) throw new Error("Failed to fetch speakers");
      const data = await res.json();
      setSpeakers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load speakers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpeakers();
  }, [fetchSpeakers]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", email: "", bio: "", topic: "" });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (speaker: Speaker) => {
    setEditingId(speaker.id);
    setFormData({
      name: speaker.name,
      email: speaker.email ?? "",
      bio: speaker.bio ?? "",
      topic: speaker.topic ?? "",
    });
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData({ name: "", email: "", bio: "", topic: "" });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      if (editingId) {
        const res = await fetch(`/api/speakers/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim() || null,
            bio: formData.bio.trim() || null,
            topic: formData.topic.trim() || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to update speaker");
        }
      } else {
        const res = await fetch("/api/speakers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim() || null,
            bio: formData.bio.trim() || null,
            topic: formData.topic.trim() || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to create speaker");
        }
      }
      closeModal();
      await fetchSpeakers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete speaker "${name}"? This will remove them from all event assignments.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/speakers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete speaker");
      }
      await fetchSpeakers();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete speaker");
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Speakers"
        description={canManage ? "Manage your speaker directory" : "Speakers from your assigned events"}
        actions={
          canManage ? (
            <Button size="md" onClick={openAddModal}>
              <Plus className="h-4 w-4" />
              Add Speaker
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
          Loading speakers…
        </div>
      ) : speakers.length === 0 ? (
        <EmptyState
          icon={Mic2}
          title="No speakers yet"
          description={canManage ? "Add speakers to your directory" : "No speakers in your assigned events yet"}
          action={
            canManage ? (
              <Button size="md" onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                Add Speaker
              </Button>
            ) : undefined
          }
        />
      ) : (
        <BentoGrid>
          {speakers.map((speaker) => (
            <BentoCard key={speaker.id} interactive={false}>
              <div className="flex items-start gap-4">
                <OwnerAvatar
                  name={speaker.name}
                  image={speaker.photoUrl}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">{speaker.name}</p>
                    {canManage && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(speaker)}
                          aria-label="Edit speaker"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(speaker.id, speaker.name)}
                          aria-label="Delete speaker"
                          className="text-status-blocked hover:text-status-blocked"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {speaker.email && (
                    <p className="text-sm text-muted truncate">{speaker.email}</p>
                  )}
                  {speaker.topic && (
                    <p className="text-sm text-muted mt-0.5 truncate">
                      {speaker.topic}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted">
                      {speaker.eventCount} event{speaker.eventCount !== 1 ? "s" : ""}
                    </span>
                    {Object.entries(speaker.statusCounts)
                      .filter(([, c]) => c > 0)
                      .map(([status, count]) => (
                        <span
                          key={status}
                          className="inline-flex items-center gap-1 text-xs text-muted"
                        >
                          <StatusBadge
                            type="speaker"
                            status={status}
                            size="sm"
                            className="shrink-0"
                          />
                          <span>×{count}</span>
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </BentoCard>
          ))}
        </BentoGrid>
      )}

      <Modal open={modalOpen} onClose={closeModal} className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {editingId ? "Edit Speaker" : "Add Speaker"}
          </h2>
          <Button variant="ghost" size="icon" onClick={closeModal} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-status-blocked">{error}</p>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Speaker name"
              className={INPUT_CLASS}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="speaker@example.com"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, bio: e.target.value }))
              }
              placeholder="Short bio or description"
              className={cn(INPUT_CLASS, "min-h-[80px] resize-y")}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Topic</label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, topic: e.target.value }))
              }
              placeholder="Speaking topic or area"
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : editingId ? "Save" : "Add Speaker"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
