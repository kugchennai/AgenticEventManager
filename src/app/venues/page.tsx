"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  PageHeader,
  Button,
  EmptyState,
  StatusBadge,
  BentoCard,
  BentoGrid,
  Modal,
} from "@/components/design-system";
import { Building2, Plus, Pencil, Trash2, X, MapPin, Users2, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

type VenuePartner = {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  capacity: number | null;
  notes: string | null;
  website: string | null;
  photoUrl: string | null;
  eventCount: number;
  statusCounts: Record<string, number>;
};

type FormData = {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  capacity: string;
  notes: string;
  website: string;
};

const INPUT_CLASS =
  "w-full bg-background border border-border rounded-lg px-3.5 py-2.5 text-sm placeholder:text-muted/50 focus:border-accent focus:ring-1 focus:ring-accent/30 outline-none transition-all";

const ROLE_LEVEL: Record<string, number> = { VIEWER: 0, VOLUNTEER: 1, EVENT_LEAD: 2, ADMIN: 3, SUPER_ADMIN: 4 };

const EMPTY_FORM: FormData = {
  name: "",
  contactName: "",
  email: "",
  phone: "",
  address: "",
  capacity: "",
  notes: "",
  website: "",
};

export default function VenuePartnersPage() {
  const { data: session, status } = useSession();
  const nav = useRouter();
  const userRole = session?.user?.globalRole ?? "";
  const hasAccess = (ROLE_LEVEL[userRole] ?? 0) >= ROLE_LEVEL.VOLUNTEER;
  const canManage = (ROLE_LEVEL[userRole] ?? 0) >= ROLE_LEVEL.EVENT_LEAD;

  useEffect(() => {
    if (status === "loading") return;
    if (!hasAccess) nav.replace("/dashboard");
  }, [status, hasAccess, nav]);

  const [venues, setVenues] = useState<VenuePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVenues = useCallback(async () => {
    try {
      const res = await fetch("/api/venues");
      if (!res.ok) throw new Error("Failed to fetch venue partners");
      const data = await res.json();
      setVenues(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load venue partners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (venue: VenuePartner) => {
    setEditingId(venue.id);
    setFormData({
      name: venue.name,
      contactName: venue.contactName ?? "",
      email: venue.email ?? "",
      phone: venue.phone ?? "",
      address: venue.address ?? "",
      capacity: venue.capacity?.toString() ?? "",
      notes: venue.notes ?? "",
      website: venue.website ?? "",
    });
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError("Name is required"); return; }
    if (!formData.address.trim()) { setError("Address is required"); return; }
    if (!formData.contactName.trim()) { setError("Contact person is required"); return; }
    if (!formData.email.trim()) { setError("Email is required"); return; }
    if (!formData.capacity.trim()) { setError("Capacity is required"); return; }

    setSubmitting(true);
    setError(null);

    const payload = {
      name: formData.name.trim(),
      contactName: formData.contactName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || null,
      address: formData.address.trim(),
      capacity: Number(formData.capacity),
      notes: formData.notes.trim() || null,
      website: formData.website.trim() || null,
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/venues/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to update venue partner");
        }
      } else {
        const res = await fetch("/api/venues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to create venue partner");
        }
      }
      closeModal();
      await fetchVenues();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete venue partner "${name}"? This will remove them from all event assignments.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/venues/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete venue partner");
      }
      await fetchVenues();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete venue partner");
    }
  };

  const setField = (field: keyof FormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Venue Partners"
        description={canManage ? "Manage your venue partner directory" : "Venue partners from your assigned events"}
        actions={
          canManage ? (
            <Button size="md" onClick={openAddModal}>
              <Plus className="h-4 w-4" />
              Add Venue Partner
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
          Loading venue partners…
        </div>
      ) : venues.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No venue partners yet"
          description={canManage ? "Add venue partners to your directory" : "No venue partners in your assigned events yet"}
          action={
            canManage ? (
              <Button size="md" onClick={openAddModal}>
                <Plus className="h-4 w-4" />
                Add Venue Partner
              </Button>
            ) : undefined
          }
        />
      ) : (
        <BentoGrid>
          {venues.map((venue) => (
            <BentoCard key={venue.id} interactive={false}>
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium truncate">{venue.name}</p>
                    {canManage && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(venue)}
                          aria-label="Edit venue partner"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(venue.id, venue.name)}
                          aria-label="Delete venue partner"
                          className="text-status-blocked hover:text-status-blocked"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {venue.address && (
                    <p className="text-sm text-muted truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {venue.address}
                    </p>
                  )}
                  {venue.capacity && (
                    <p className="text-sm text-muted truncate flex items-center gap-1 mt-0.5">
                      <Users2 className="h-3 w-3 shrink-0" />
                      Capacity: {venue.capacity}
                    </p>
                  )}
                  {venue.contactName && (
                    <p className="text-sm text-muted truncate mt-0.5">
                      {venue.contactName}
                    </p>
                  )}
                  {venue.email && (
                    <p className="text-xs text-muted truncate flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3 shrink-0" />
                      {venue.email}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted">
                      {venue.eventCount} event{venue.eventCount !== 1 ? "s" : ""}
                    </span>
                    {Object.entries(venue.statusCounts)
                      .filter(([, c]) => c > 0)
                      .map(([status, count]) => (
                        <span
                          key={status}
                          className="inline-flex items-center gap-1 text-xs text-muted"
                        >
                          <StatusBadge
                            type="venue"
                            status={status}
                            size="sm"
                            className="shrink-0"
                          />
                          <span>&times;{count}</span>
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
            {editingId ? "Edit Venue Partner" : "Add Venue Partner"}
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
            <label className="block text-sm font-medium mb-1.5">Venue Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. Grand Convention Center"
              className={INPUT_CLASS}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Address *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setField("address", e.target.value)}
                placeholder="123 Main St, City"
                className={INPUT_CLASS}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Capacity *</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setField("capacity", e.target.value)}
                placeholder="e.g. 200"
                className={INPUT_CLASS}
                min={1}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Contact Person *</label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setField("contactName", e.target.value)}
                placeholder="John Doe"
                className={INPUT_CLASS}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="contact@venue.com"
                className={INPUT_CLASS}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setField("website", e.target.value)}
                placeholder="https://venue.com"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="Additional information about the venue"
              className={cn(INPUT_CLASS, "min-h-[80px] resize-y")}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : editingId ? "Save" : "Add Venue Partner"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
