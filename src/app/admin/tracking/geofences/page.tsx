"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/overlay";
import {
  createGeofence,
  deleteGeofence,
  fetchGeofences,
  updateGeofence,
  type CreateGeofencePayload,
  type GeofenceDto,
  type GeofenceType,
} from "@/lib/api/tracking";
import { useAppSelector } from "@/store";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";

const GEOFENCE_TYPES: GeofenceType[] = [
  "HEAD_OFFICE",
  "WAREHOUSE",
  "CUSTOMER",
  "PARKING",
  "DEPOT",
  "CHECKPOINT",
  "DELIVERY_ZONE",
  "OTHER",
];

const emptyForm: CreateGeofencePayload = {
  name: "",
  type: "OTHER",
  latitude: -1.9441,
  longitude: 30.0619,
  radiusMeters: 100,
};

function typeLabel(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function GeofencesPage() {
  const companyId = useAppSelector((s) => s.auth.companyId);
  const [items, setItems] = useState<GeofenceDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GeofenceDto | null>(null);
  const [form, setForm] = useState<CreateGeofencePayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GeofenceDto | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await fetchGeofences(companyId);
      setItems(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load geofences");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(g: GeofenceDto) {
    setEditing(g);
    setForm({
      name: g.name,
      type: g.type,
      latitude: g.latitude,
      longitude: g.longitude,
      radiusMeters: g.radiusMeters,
    });
    setModalOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!companyId) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updateGeofence(companyId, editing.id, form);
      } else {
        await createGeofence(companyId, form);
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!companyId || !deleteTarget) return;
    setSaving(true);
    try {
      await deleteGeofence(companyId, deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[1200px] mx-auto">
      <PageHeader
        title="Geofences"
        description="Define zones for enter/exit alerts on live tracking."
        actions={
          <Button size="sm" leftIcon={<Plus className="size-3.5" />} onClick={openCreate}>
            Add geofence
          </Button>
        }
      />

      {error ? (
        <div className="rounded-[10px] border border-red-200 bg-danger-soft px-4 py-2.5 text-sm text-red-900">
          {error}
        </div>
      ) : null}

      <Card className="p-0 overflow-hidden" padding="none">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text">Company geofences</h2>
            <p className="text-xs text-text-muted mt-0.5">
              {loading ? "Loading…" : `${items.length} zone${items.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        {items.length === 0 && !loading ? (
          <EmptyState
            icon={<MapPin className="size-6" />}
            title="No geofences yet"
            description="Create a named circle (office, depot, parking) to get enter/exit events."
            action={
              <Button size="sm" leftIcon={<Plus className="size-3.5" />} onClick={openCreate}>
                Add geofence
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((g) => (
              <li
                key={g.id}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-text">{g.name}</p>
                    <StatusBadge
                      status={g.active ? "available" : "offline"}
                      label={g.active ? "Active" : "Inactive"}
                    />
                    <StatusBadge status="info" label={typeLabel(g.type)} showDot={false} />
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {g.latitude.toFixed(5)}, {g.longitude.toFixed(5)} · radius{" "}
                    {g.radiusMeters} m
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    leftIcon={<Pencil className="size-3.5" />}
                    onClick={() => openEdit(g)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger-outline"
                    leftIcon={<Trash2 className="size-3.5" />}
                    onClick={() => setDeleteTarget(g)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit geofence" : "Create geofence"}
        description="Name, type, center coordinates, and radius in meters."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                void onSubmit(e);
              }}
              disabled={saving}
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Create"}
            </Button>
          </>
        }
      >
        <form className="space-y-3" onSubmit={onSubmit}>
          <Field label="Name">
            <Input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Head office"
            />
          </Field>
          <Field label="Type">
            <Select
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value as GeofenceType }))
              }
            >
              {GEOFENCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {typeLabel(t)}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude">
              <Input
                required
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) =>
                  setForm((f) => ({ ...f, latitude: Number(e.target.value) }))
                }
              />
            </Field>
            <Field label="Longitude">
              <Input
                required
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) =>
                  setForm((f) => ({ ...f, longitude: Number(e.target.value) }))
                }
              />
            </Field>
          </div>
          <Field label="Radius (meters)" hint="10–5000">
            <Input
              required
              type="number"
              min={10}
              max={5000}
              value={form.radiusMeters ?? 100}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  radiusMeters: Number(e.target.value),
                }))
              }
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete geofence?"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" will be removed. Enter/exit history is kept.`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => void confirmDelete()}
              disabled={saving}
            >
              {saving ? "Deleting…" : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">This cannot be undone.</p>
      </Modal>
    </div>
  );
}
