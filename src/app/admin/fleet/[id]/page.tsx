"use client";

import { OpsMap } from "@/components/maps/ops-map";
import { Button } from "@/components/ui/button";
import { Card, MetricCard } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar, Timeline } from "@/components/ui/overlay";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select } from "@/components/ui/input";
import { fetchLiveFleet, fleetLiveToMotorcycle } from "@/lib/api/locations";
import { mapMotorcycle, mapRider, mapTrip } from "@/lib/api/mappers";
import {
  assignRiderMotorcycle,
  fetchAssignments,
  fetchMotorcycle,
  fetchRiders,
  fetchTrips,
  unassignRiderMotorcycle,
  updateMotorcycleStatus,
  type AssignmentDto,
} from "@/lib/api/resources";
import { formatKm, initials } from "@/lib/utils";
import { useAppSelector } from "@/store";
import type { Motorcycle, Rider, Trip } from "@/types";
import {
  ArrowLeft,
  Bike,
  MapPin,
  Route,
  UserMinus,
  UserPlus,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function MotorcycleDetailPage() {
  const params = useParams<{ id: string }>();
  const companyId = useAppSelector((s) => s.auth.companyId);
  const [moto, setMoto] = useState<Motorcycle | null>(null);
  const [rider, setRider] = useState<Rider | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<AssignmentDto | null>(null);
  const [history, setHistory] = useState<AssignmentDto[]>([]);
  const [relatedTrips, setRelatedTrips] = useState<Trip[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [assignRiderId, setAssignRiderId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!companyId || !params.id) return;
    setLoading(true);
    setError(null);
    try {
      const dto = await fetchMotorcycle(companyId, params.id);
      let mapped = mapMotorcycle(dto);
      try {
        const fleet = await fetchLiveFleet(companyId);
        const live = fleet.find((f) => f.motorcycleId === params.id);
        if (live) {
          mapped = { ...mapped, ...fleetLiveToMotorcycle(live), brand: mapped.brand, model: mapped.model, year: mapped.year, color: mapped.color, fleetNumber: mapped.fleetNumber };
        }
      } catch {
        // live optional
      }
      setMoto(mapped);

      const [assignments, tripsResult, ridersResult] = await Promise.all([
        fetchAssignments(companyId, {
          motorcycleId: params.id,
          limit: 20,
          sort: "assignedAt:DESC",
        }),
        fetchTrips(companyId, {
          motorcycleId: params.id,
          limit: 5,
          sort: "createdAt:DESC",
        }),
        fetchRiders(companyId, { limit: 50, sort: "createdAt:DESC" }),
      ]);

      setHistory(assignments.items);
      const active = assignments.items.find((a) => a.active) ?? null;
      setActiveAssignment(active);
      setRelatedTrips(tripsResult.items.map(mapTrip));
      const mappedRiders = ridersResult.items.map(mapRider);
      setRiders(mappedRiders);
      if (active) {
        const r = mappedRiders.find((x) => x.id === active.riderId);
        setRider(r ?? null);
        if (!r) {
          // rider may not be on first page — leave null
        }
      } else {
        setRider(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load motorcycle");
      setMoto(null);
    } finally {
      setLoading(false);
    }
  }, [companyId, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onAssign() {
    if (!companyId || !params.id || !assignRiderId) return;
    setBusy(true);
    try {
      await assignRiderMotorcycle(companyId, {
        riderId: assignRiderId,
        motorcycleId: params.id,
      });
      setAssignRiderId("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assign failed");
    } finally {
      setBusy(false);
    }
  }

  async function onUnassign() {
    if (!companyId || !activeAssignment) return;
    setBusy(true);
    try {
      await unassignRiderMotorcycle(companyId, activeAssignment.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unassign failed");
    } finally {
      setBusy(false);
    }
  }

  async function onMaintenance() {
    if (!companyId || !params.id) return;
    setBusy(true);
    try {
      await updateMotorcycleStatus(companyId, params.id, "MAINTENANCE");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto py-16 text-center text-sm text-text-muted">
        Loading motorcycle…
      </div>
    );
  }

  if (!moto) {
    return (
      <div className="max-w-[1400px] mx-auto py-16 text-center space-y-3">
        <h1 className="text-xl font-semibold text-text">Motorcycle not found</h1>
        <p className="text-sm text-text-secondary">
          {error ?? `No unit matches ${params.id}.`}
        </p>
        <Link
          href="/admin/fleet"
          className="inline-flex h-10 items-center rounded-[8px] border border-border bg-surface px-4 text-sm font-medium text-text hover:bg-surface-muted"
        >
          Back to fleet
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 max-w-[1400px] mx-auto">
      <PageHeader
        title={moto.plate}
        description={`${moto.fleetNumber} · ${moto.brand} ${moto.model}${moto.year ? ` (${moto.year})` : ""}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              status={moto.status === "unauthorized" ? "unauthorized" : moto.status}
            />
            <Link
              href="/admin/fleet"
              className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-border bg-surface px-3 text-xs font-medium text-text hover:bg-surface-muted"
            >
              <ArrowLeft className="size-3.5" />
              Fleet
            </Link>
          </div>
        }
      />

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Trips today"
          value={moto.tripsToday}
          accent="primary"
          icon={<Route className="size-4" />}
        />
        <MetricCard
          label="Distance today"
          value={formatKm(moto.distanceTodayKm)}
          icon={<MapPin className="size-4" />}
        />
        <MetricCard
          label="Speed"
          value={moto.speed > 0 ? `${moto.speed} km/h` : "Stopped"}
        />
        <MetricCard
          label="GPS"
          value={moto.gpsStatus}
          accent={
            moto.gpsStatus === "online"
              ? "success"
              : moto.gpsStatus === "delayed"
                ? "warning"
                : "danger"
          }
          icon={<Bike className="size-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-0 overflow-hidden" padding="none">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-text">Live position</h2>
              <p className="text-xs text-text-muted mt-0.5">
                {moto.location} · {moto.lastSeen}
              </p>
            </div>
            <div className="p-3 sm:p-4">
              <OpsMap
                motorcycles={[moto]}
                selectedId={moto.id}
                className="h-[260px] sm:h-[360px]"
                compact
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-text mb-4">Unit details</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <Info label="Plate" value={moto.plate} />
              <Info label="Fleet number" value={moto.fleetNumber} />
              <Info label="Brand / model" value={`${moto.brand} ${moto.model}`} />
              <Info label="Year" value={moto.year ? String(moto.year) : "—"} />
              <Info label="Color" value={moto.color} />
              <Info label="Last seen" value={moto.lastSeen} />
            </dl>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-text mb-4">Recent trips</h2>
            {relatedTrips.length === 0 ? (
              <p className="text-sm text-text-muted">No recent trips for this motorcycle.</p>
            ) : (
              <ul className="divide-y divide-border -mx-1">
                {relatedTrips.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/admin/trips/${t.id}`}
                      className="flex items-center justify-between gap-3 px-1 py-3 hover:bg-surface-muted/50 rounded-[8px] transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-primary">{t.id.slice(0, 8)}</p>
                        <p className="text-xs text-text-secondary mt-0.5 truncate">
                          {t.pickup} → {t.destination}
                        </p>
                      </div>
                      <StatusBadge status={t.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <h2 className="text-sm font-semibold text-text mb-4">Current assignment</h2>
            {rider ? (
              <div className="flex items-center gap-3">
                <Avatar initials={initials(rider.name)} size="lg" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text">{rider.name}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{rider.phone}</p>
                  <div className="mt-2">
                    <StatusBadge status={rider.availability} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted">No rider assigned.</p>
            )}
            <div className="mt-4 space-y-2">
              <Select
                value={assignRiderId}
                onChange={(e) => setAssignRiderId(e.target.value)}
              >
                <option value="">Select rider…</option>
                {riders.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {r.phone}
                  </option>
                ))}
              </Select>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy || !assignRiderId}
                  leftIcon={<UserPlus className="size-3.5" />}
                  onClick={() => void onAssign()}
                >
                  Assign rider
                </Button>
                {activeAssignment ? (
                  <Button
                    size="sm"
                    variant="danger-outline"
                    disabled={busy}
                    leftIcon={<UserMinus className="size-3.5" />}
                    onClick={() => void onUnassign()}
                  >
                    Unassign
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-text mb-4">Assignment history</h2>
            {history.length === 0 ? (
              <p className="text-sm text-text-muted">No assignment history yet.</p>
            ) : (
              <ul className="space-y-3">
                {history.map((h) => {
                  const r = riders.find((x) => x.id === h.riderId);
                  return (
                    <li
                      key={h.id}
                      className="rounded-[8px] border border-border px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-text">
                          {r?.name ?? h.riderId.slice(0, 8)}
                        </p>
                        <span className="text-[11px] text-text-muted whitespace-nowrap">
                          {new Date(h.assignedAt).toLocaleDateString()}
                          {h.unassignedAt
                            ? ` – ${new Date(h.unassignedAt).toLocaleDateString()}`
                            : " – Present"}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-1">
                        {h.active ? "Active assignment" : "Previous"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-text mb-4">Status</h2>
            <Timeline
              steps={[
                {
                  label: "Registered in fleet",
                  time: moto.lastSeen,
                  done: true,
                },
                {
                  label: "Assigned to current rider",
                  time: activeAssignment
                    ? new Date(activeAssignment.assignedAt).toLocaleDateString()
                    : undefined,
                  done: Boolean(activeAssignment),
                  current: moto.status !== "maintenance" && Boolean(activeAssignment),
                },
                {
                  label: "Maintenance",
                  time: moto.status === "maintenance" ? "Active" : undefined,
                  done: moto.status === "maintenance",
                  current: moto.status === "maintenance",
                },
              ]}
            />
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={busy}
              leftIcon={<Wrench className="size-3.5" />}
              onClick={() => void onMaintenance()}
            >
              Mark maintenance
            </Button>
            <Link href="/admin/live">
              <Button size="sm">View on live map</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-border px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium text-text">{value}</dd>
    </div>
  );
}
