"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { mapRider } from "@/lib/api/mappers";
import {
  assignRiderMotorcycle,
  createMotorcycle,
  fetchRiders,
} from "@/lib/api/resources";
import { useAppSelector } from "@/store";
import type { Rider } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

interface FormState {
  plate: string;
  fleetNumber: string;
  brand: string;
  model: string;
  year: string;
  color: string;
  riderId: string;
  notes: string;
}

const initial: FormState = {
  plate: "",
  fleetNumber: "",
  brand: "TVS",
  model: "",
  year: "2024",
  color: "Black",
  riderId: "",
  notes: "",
};

export default function NewMotorcyclePage() {
  const router = useRouter();
  const companyId = useAppSelector((s) => s.auth.companyId);
  const [form, setForm] = useState<FormState>(initial);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    void fetchRiders(companyId, { limit: 50 })
      .then((res) => setRiders(res.items.map(mapRider)))
      .catch(() => setRiders([]));
  }, [companyId]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!companyId) return;
    setSaving(true);
    setError(null);
    try {
      const yearNum = form.year ? Number(form.year) : undefined;
      const maxYear = new Date().getFullYear() + 5;
      if (yearNum != null && (yearNum < 1980 || yearNum > maxYear)) {
        setError(`Year must be between 1980 and ${maxYear}.`);
        setSaving(false);
        return;
      }
      const moto = await createMotorcycle(companyId, {
        plateNumber: form.plate.trim(),
        internalCode: form.fleetNumber.trim() || undefined,
        brand: form.brand || undefined,
        model: form.model.trim() || undefined,
        year: yearNum,
        color: form.color || undefined,
      });
      if (form.riderId) {
        await assignRiderMotorcycle(companyId, {
          riderId: form.riderId,
          motorcycleId: moto.id,
        });
      }
      router.push(`/admin/fleet/${moto.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save motorcycle");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-3xl mx-auto">
      <PageHeader
        title="Add Motorcycle"
        description="Register a new unit in your fleet"
        actions={
          <Link
            href="/admin/fleet"
            className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 text-xs font-medium text-text hover:bg-surface-muted"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
        }
      />

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <h2 className="text-sm font-semibold text-text mb-4">Identity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Plate number" hint="e.g. RAE 428C">
              <Input
                required
                value={form.plate}
                onChange={(e) => update("plate", e.target.value)}
                placeholder="RAX 000A"
              />
            </Field>
            <Field label="Fleet number" hint="Internal ID">
              <Input
                value={form.fleetNumber}
                onChange={(e) => update("fleetNumber", e.target.value)}
                placeholder="VT-032"
              />
            </Field>
            <Field label="Brand">
              <Select
                value={form.brand}
                onChange={(e) => update("brand", e.target.value)}
              >
                <option value="TVS">TVS</option>
                <option value="Bajaj">Bajaj</option>
                <option value="Honda">Honda</option>
                <option value="Yamaha">Yamaha</option>
                <option value="Other">Other</option>
              </Select>
            </Field>
            <Field label="Model">
              <Input
                required
                value={form.model}
                onChange={(e) => update("model", e.target.value)}
                placeholder="Apache 160"
              />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-text mb-4">Specs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Year" hint={`1980 – ${new Date().getFullYear() + 5}`}>
              <Input
                type="number"
                min={1980}
                max={new Date().getFullYear() + 5}
                value={form.year}
                onChange={(e) => update("year", e.target.value)}
              />
            </Field>
            <Field label="Color">
              <Input
                value={form.color}
                onChange={(e) => update("color", e.target.value)}
              />
            </Field>
          </div>
          <p className="mt-3 text-xs text-text-muted">
            Tracking uses the rider phone app by default. Hardware GPS can be added later.
          </p>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-text mb-4">Assignment</h2>
          <Field label="Assign rider" hint="Optional — can assign later">
            <Select
              value={form.riderId}
              onChange={(e) => update("riderId", e.target.value)}
            >
              <option value="">Unassigned</option>
              {riders.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.phone}
                </option>
              ))}
            </Select>
          </Field>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold text-text mb-4">Notes</h2>
          <Field label="Internal notes">
            <Textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Maintenance history, depot, insurance notes…"
            />
          </Field>
        </Card>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pb-6">
          <Link href="/admin/fleet" className="w-full sm:w-auto">
            <Button type="button" variant="secondary" fullWidth>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving} fullWidth className="sm:w-auto">
            {saving ? "Saving…" : "Save motorcycle"}
          </Button>
        </div>
      </form>
    </div>
  );
}
