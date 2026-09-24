"use client";

import { OpsMap } from "@/components/maps/ops-map";
import { RiderAvailabilityCard } from "@/components/rider/availability-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Timeline } from "@/components/ui/overlay";
import { StatusBadge } from "@/components/ui/status-badge";
import { mapRiderMeMotorcycle, mapTrip } from "@/lib/api/mappers";
import {
  arriveTrip,
  completeTrip,
  fetchRiderMe,
  fetchTrips,
  startTrip,
  type RiderMeDto,
} from "@/lib/api/resources";
import { formatKm, formatRwf } from "@/lib/utils";
import { useAppSelector } from "@/store";
import type { Motorcycle, Trip } from "@/types";
import { Flag, MapPinned, Play } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type ActionKind = "arrive" | "start" | "complete" | null;

export default function RiderActiveTripPage() {
  const companyId = useAppSelector((s) => s.auth.companyId);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [rawStatus, setRawStatus] = useState<string>("");
  const [moto, setMoto] = useState<Motorcycle | null>(null);
  const [rider, setRider] = useState<RiderMeDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const [me, trips] = await Promise.all([
        fetchRiderMe(companyId),
        fetchTrips(companyId, { limit: 20, sort: "updatedAt:DESC" }),
      ]);
      setMoto(mapRiderMeMotorcycle(me));
      setRider(me);
      const active =
        trips.items.find((t) =>
          [
            "RIDER_ASSIGNED",
            "RIDER_ACCEPTED",
            "RIDER_TO_PICKUP",
            "RIDER_ARRIVED",
            "IN_PROGRESS",
          ].includes(t.status.toUpperCase()),
        ) ?? null;
      if (active) {
        setTrip(mapTrip(active));
        setRawStatus(active.status);
      } else {
        const last = trips.items[0];
        setTrip(last ? mapTrip(last) : null);
        setRawStatus(last?.status ?? "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load active trip");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const action = useMemo(() => {
    const s = rawStatus.toUpperCase();
    if (s === "RIDER_TO_PICKUP" || s === "RIDER_ACCEPTED") {
      return {
        kind: "arrive" as ActionKind,
        label: "Arrived at pickup",
        icon: <MapPinned className="size-4" />,
      };
    }
    if (s === "RIDER_ARRIVED") {
      return {
        kind: "start" as ActionKind,
        label: "Start Trip",
        icon: <Play className="size-4" />,
      };
    }
    if (s === "IN_PROGRESS") {
      return {
        kind: "complete" as ActionKind,
        label: "Complete Trip",
        icon: <Flag className="size-4" />,
      };
    }
    return null;
  }, [rawStatus]);

  const done = rawStatus.toUpperCase() === "COMPLETED";

  async function runAction(kind: ActionKind) {
    if (!companyId || !trip || !kind) return;
    setBusy(true);
    setError(null);
    try {
      if (kind === "arrive") await arriveTrip(companyId, trip.id);
      if (kind === "start") await startTrip(companyId, trip.id);
      if (kind === "complete") {
        const completed = await completeTrip(companyId, trip.id);
        setTrip(mapTrip(completed));
        setRawStatus(completed.status);
        setRider((current) => current ? { ...current, availabilityStatus: "AWAITING_AVAILABILITY" } : current);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center text-sm text-text-muted">
        Loading active trip…
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-lg py-6 space-y-3">
        <p className="text-sm text-text-secondary">No active trip right now.</p>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        {rider && <RiderAvailabilityCard companyId={companyId} riderId={rider.id}
          status={rider.availabilityStatus} hasMotorcycle={Boolean(moto)}
          onUpdated={(updated) => setRider((current) => current ? { ...current, ...updated } : current)} />}
        <Link href="/rider" className="text-sm font-medium text-primary">
          Back to home
        </Link>
      </div>
    );
  }

  const timeline = [
    {
      label: "Assigned",
      time: trip.assignedAt,
      done: true,
    },
    {
      label: "En route to pickup",
      time: trip.status === "to_pickup" || trip.pickupAt || trip.startedAt ? trip.assignedAt : undefined,
      done: ["waiting", "in_progress", "completed"].includes(trip.status) || Boolean(trip.pickupAt),
      current: trip.status === "to_pickup" || trip.status === "assigned",
    },
    {
      label: "Arrived at pickup",
      time: trip.pickupAt,
      done: ["in_progress", "completed"].includes(trip.status) || Boolean(trip.startedAt),
      current: trip.status === "waiting",
    },
    {
      label: "Trip in progress",
      time: trip.startedAt,
      done: trip.status === "completed",
      current: trip.status === "in_progress",
    },
    {
      label: "Completed",
      time: trip.completedAt,
      done: done,
      current: done,
    },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {done ? "Completed trip" : "Active trip"}
          </p>
          <h1 className="text-xl font-semibold text-text tracking-tight mt-0.5">
            {trip.id.slice(0, 8)}
          </h1>
        </div>
        <StatusBadge status={trip.status} />
      </div>

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      {done && rider ? <RiderAvailabilityCard companyId={companyId} riderId={rider.id}
        status={rider.availabilityStatus} hasMotorcycle={Boolean(moto)}
        onUpdated={(updated) => setRider((current) => current ? { ...current, ...updated } : current)} /> : null}

      {moto && !done ? (
        <OpsMap
          motorcycles={[moto]}
          selectedId={moto.id}
          className="h-[220px]"
          compact
        />
      ) : null}

      <Card padding="md">
        <p className="text-xs text-text-muted uppercase tracking-wide font-semibold">
          Employee
        </p>
        <p className="text-sm font-semibold text-text mt-1">{trip.employeeName}</p>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <div className="rounded-[10px] bg-surface-muted px-3 py-2.5">
            <p className="text-[11px] text-text-muted font-medium">Pickup</p>
            <p className="text-sm font-medium text-text mt-0.5">{trip.pickup}</p>
          </div>
          <div className="rounded-[10px] bg-surface-muted px-3 py-2.5">
            <p className="text-[11px] text-text-muted font-medium">Destination</p>
            <p className="text-sm font-medium text-text mt-0.5">{trip.destination}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
          <span>{formatKm(trip.distanceKm)}</span>
          <span>{formatRwf(trip.cost)}</span>
          {trip.etaMin != null && !done ? <span>ETA {trip.etaMin} min</span> : null}
        </div>
      </Card>

      <Card padding="md">
        <h2 className="text-sm font-semibold text-text mb-3">Timeline</h2>
        <Timeline steps={timeline} />
      </Card>

      {action ? (
        <Button
          size="lg"
          fullWidth
          disabled={busy}
          leftIcon={action.icon}
          onClick={() => void runAction(action.kind)}
        >
          {busy ? "Updating…" : action.label}
        </Button>
      ) : !done ? (
        <Card padding="md">
          <p className="text-sm text-text-secondary">
            Accept this assignment from Home before continuing.
          </p>
          <Link href="/rider" className="mt-2 inline-block text-xs font-medium text-primary">
            Open home
          </Link>
        </Card>
      ) : null}
    </div>
  );
}
