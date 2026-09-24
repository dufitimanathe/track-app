"use client";

import { Button } from "@/components/ui/button";
import { Card, MetricCard } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar, Modal } from "@/components/ui/overlay";
import { Select } from "@/components/ui/input";
import { mapMotorcycle, mapRider, mapTrip } from "@/lib/api/mappers";
import {
  assignRiderMotorcycle,
  deactivateRider,
  fetchAssignments,
  fetchMotorcycle,
  fetchMotorcycles,
  fetchRider,
  fetchTrips,
  type AssignmentDto,
} from "@/lib/api/resources";
import { initials } from "@/lib/utils";
import { opsBasePath } from "@/lib/navigation";
import { useAppSelector } from "@/store";
import type { Motorcycle, Rider, Trip } from "@/types";
import { ArrowLeft, Bike, MapPin, Phone, Smartphone } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function RiderDetailPage() {
  const params = useParams<{ id: string }>();
  const companyId = useAppSelector((s) => s.auth.companyId);
  const role = useAppSelector((s) => s.auth.role);
  const base = opsBasePath(role);
  const canManage = role === "COMPANY_ADMIN";
  const backHref = role === "SUPERVISOR" ? `${base}/fleet` : `${base}/riders`;
  const backLabel = role === "SUPERVISOR" ? "Back to fleet" : "Back to riders";
  const [rider, setRider] = useState<Rider | null>(null);
  const [motorcycle, setMotorcycle] = useState<Motorcycle | null>(null);
  const [history, setHistory] = useState<
    Array<AssignmentDto & { plate?: string; fleetNumber?: string }>
  >([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [fleetOptions, setFleetOptions] = useState<Motorcycle[]>([]);
  const [assignMotoId, setAssignMotoId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const load = useCallback(async () => {
    if (!companyId || !params.id) return;
    setLoading(true);
    setError(null);
    try {
      const [riderDto, assignments, tripsResult, fleet] = await Promise.all([
        fetchRider(companyId, params.id),
        fetchAssignments(companyId, {
          riderId: params.id,
          limit: 20,
          sort: "assignedAt:DESC",
        }),
        fetchTrips(companyId, {
          riderId: params.id,
          limit: 50,
          sort: "createdAt:DESC",
        }),
        fetchMotorcycles(companyId, { limit: 50 }),
      ]);

      setRider(mapRider(riderDto));
      setTrips(tripsResult.items.map(mapTrip));
      setFleetOptions(fleet.items.map(mapMotorcycle));

      const enriched = await Promise.all(
        assignments.items.map(async (a) => {
          try {
            const m = await fetchMotorcycle(companyId, a.motorcycleId);
            return {
              ...a,
              plate: m.plateNumber,
              fleetNumber: m.internalCode ?? m.plateNumber,
            };
          } catch {
            return { ...a, plate: a.motorcycleId.slice(0, 8), fleetNumber: "—" };
          }
        }),
      );
      setHistory(enriched);

      const active = enriched.find((a) => a.active);
      if (active) {
        try {
          const m = await fetchMotorcycle(companyId, active.motorcycleId);
          setMotorcycle(mapMotorcycle(m));
        } catch {
          setMotorcycle(null);
        }
      } else {
        setMotorcycle(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rider");
      setRider(null);
    } finally {
      setLoading(false);
    }
  }, [companyId, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const completed = useMemo(
    () => trips.filter((t) => t.status === "completed").length,
    [trips],
  );
  const cancelled = useMemo(
    () => trips.filter((t) => t.status === "cancelled").length,
    [trips],
  );
  const activeTrips = useMemo(
    () =>
      trips.filter((t) =>
        ["in_progress", "to_pickup", "waiting", "assigned"].includes(t.status),
      ).length,
    [trips],
  );

  async function onAssign() {
    if (!companyId || !params.id || !assignMotoId) return;
    setBusy(true);
    try {
      await assignRiderMotorcycle(companyId, {
        riderId: params.id,
        motorcycleId: assignMotoId,
      });
      setAssignMotoId("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assign failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDeactivate() {
    if (!companyId || !params.id) return;
    setBusy(true);
    try {
      await deactivateRider(companyId, params.id);
      setConfirmDeactivate(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deactivate failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-[1100px] mx-auto py-16 text-center text-sm text-text-muted">
        Loading rider…
      </div>
    );
  }

  if (!rider) {
    return (
      <div className="max-w-[1100px] mx-auto py-16 text-center space-y-3">
        <h1 className="text-xl font-semibold text-text">Rider not found</h1>
        <p className="text-sm text-text-secondary">{error ?? "No rider for this id."}</p>
        <Link href={backHref} className="text-sm text-primary">
          {backLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 max-w-[1100px] mx-auto">
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text mb-3"
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </Link>
        <PageHeader
          title={rider.name}
          description="Rider profile, motorcycle assignment, and phone-based location tracking."
          actions={
            <div className="flex flex-wrap gap-2">
              {canManage ? (
                <Button
                  variant="danger-outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => setConfirmDeactivate(true)}
                >
                  Deactivate
                </Button>
              ) : null}
              {rider.phone ? (
                <a href={`tel:${rider.phone}`}>
                  <Button size="sm" leftIcon={<Phone className="size-3.5" />}>
                    Contact
                  </Button>
                </a>
              ) : null}
            </div>
          }
        />
      </div>

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      <div className="flex items-start gap-2 rounded-[10px] border border-border bg-primary-soft/40 px-3 py-2.5 text-sm text-text-secondary">
        <Smartphone className="size-4 mt-0.5 shrink-0 text-primary" />
        <p>
          Live location comes from the rider&apos;s phone after they are assigned a motorcycle.
          Hardware GPS devices are optional and not required.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <div className="flex items-start gap-3">
            <Avatar initials={initials(rider.name)} size="lg" />
            <div className="min-w-0">
              <p className="text-lg font-semibold text-text">{rider.name}</p>
              <div className="mt-2">
                <StatusBadge status={rider.availability} />
              </div>
            </div>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <Phone className="size-4 shrink-0 text-text-muted" />
              <span>{rider.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <MapPin className="size-4 shrink-0 text-text-muted" />
              <span>{rider.location}</span>
            </div>
            <p className="text-xs text-text-muted">Last phone fix {rider.lastActive}</p>
          </dl>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="text-base font-semibold text-text">Motorcycle assignment</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Unit linked for trips; phone pings attribute to this motorcycle
          </p>
          {motorcycle ? (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide">Plate</p>
                <p className="mt-1 font-medium text-text">{motorcycle.plate}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide">Fleet #</p>
                <p className="mt-1 font-medium text-text">{motorcycle.fleetNumber}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide">Unit</p>
                <p className="mt-1 font-medium text-text">
                  {motorcycle.brand} {motorcycle.model}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide">Phone tracking</p>
                <div className="mt-1">
                  <StatusBadge status={motorcycle.gpsStatus} />
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wide">Fleet status</p>
                <div className="mt-1">
                  <StatusBadge status={motorcycle.status} />
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-text-secondary">No motorcycle currently assigned.</p>
          )}
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Select
              value={assignMotoId}
              onChange={(e) => setAssignMotoId(e.target.value)}
              className="flex-1"
            >
              <option value="">Select motorcycle…</option>
              {fleetOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.plate} · {m.fleetNumber}
                </option>
              ))}
            </Select>
            <Button
              size="sm"
              variant="secondary"
              disabled={busy || !assignMotoId}
              leftIcon={<Bike className="size-3.5" />}
              onClick={() => void onAssign()}
            >
              Assign
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard label="Active trips" value={activeTrips} accent="primary" />
        <MetricCard label="Completed" value={completed} accent="success" />
        <MetricCard label="Cancelled" value={cancelled} />
        <MetricCard label="Total loaded" value={trips.length} />
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-base font-semibold text-text">Assignment history</h2>
        </div>
        {history.length === 0 ? (
          <p className="px-4 py-8 text-sm text-text-muted text-center">No assignments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted/50 text-left text-xs uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3 font-medium">Plate</th>
                  <th className="px-4 py-3 font-medium">Fleet #</th>
                  <th className="px-4 py-3 font-medium">Assigned</th>
                  <th className="px-4 py-3 font-medium">Released</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-text">{item.plate}</td>
                    <td className="px-4 py-3 text-text-secondary">{item.fleetNumber}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {new Date(item.assignedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {item.unassignedAt
                        ? new Date(item.unassignedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {item.active ? (
                        <StatusBadge status="assigned" label="Current" />
                      ) : (
                        <StatusBadge status="completed" label="Previous" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={confirmDeactivate}
        onClose={() => {
          if (!busy) setConfirmDeactivate(false);
        }}
        title="Deactivate rider?"
        description={`${rider.name} will be suspended and taken offline for assignments.`}
        footer={
          <>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setConfirmDeactivate(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" disabled={busy} onClick={() => void onDeactivate()}>
              {busy ? "Working…" : "Deactivate"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Confirm before applying. Active trips must be finished or reassigned first.
        </p>
      </Modal>
    </div>
  );
}
