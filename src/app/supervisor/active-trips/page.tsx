"use client";

import { OpsMap } from "@/components/maps/ops-map";
import { Card } from "@/components/ui/card";
import { EmptyState, LiveIndicator, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { useLiveFleet } from "@/hooks/use-live-fleet";
import { mapTrip } from "@/lib/api/mappers";
import { fetchTrips } from "@/lib/api/resources";
import { formatKm } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedMotorcycleId } from "@/store/slices/ui-slice";
import type { Trip } from "@/types";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const ACTIVE_TRIP_UI = new Set(["assigned", "to_pickup", "waiting", "in_progress", "searching", "no_rider"]);

export default function SupervisorActiveTripsPage() {
  const dispatch = useAppDispatch();
  const companyId = useAppSelector((s) => s.auth.companyId);
  const selectedId = useAppSelector((s) => s.ui.selectedMotorcycleId);
  const { motorcycles, connecting } = useLiveFleet(companyId);
  const [active, setActive] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTrips(companyId, {
        page: 1,
        limit: 50,
        sort: "createdAt:DESC",
      });
      setActive(result.items.map(mapTrip).filter((t) => ACTIVE_TRIP_UI.has(t.status)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load active trips");
      setActive([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(id);
  }, [load]);

  const mapBikes = useMemo(
    () =>
      motorcycles.filter(
        (m) => m.status === "on_trip" || m.status === "assigned" || m.speed > 1,
      ),
    [motorcycles],
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <PageHeader
        title="Active trips"
        description="Live trips under your supervision."
        actions={<LiveIndicator />}
      />

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card className="xl:col-span-3 p-0 overflow-hidden" padding="none">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-base font-semibold text-text">Live map</h2>
          </div>
          <div className="p-3 sm:p-4">
            <OpsMap
              motorcycles={mapBikes.length ? mapBikes : motorcycles}
              selectedId={selectedId}
              connecting={connecting}
              onSelect={(m) => dispatch(setSelectedMotorcycleId(m.id))}
              className="h-[280px] sm:h-[420px]"
            />
          </div>
        </Card>

        <Card className="xl:col-span-2 p-0 overflow-hidden" padding="none">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-semibold text-text">
              {loading ? "Loading…" : `${active.length} active`}
            </h2>
            <Link href="/supervisor/trips" className="text-xs font-medium text-primary">
              History
            </Link>
          </div>
          {loading && active.length === 0 ? (
            <EmptyState title="Loading active trips…" />
          ) : active.length === 0 ? (
            <EmptyState title="No active trips" description="Assigned and in-progress trips appear here." />
          ) : (
            <ul className="divide-y divide-border max-h-[520px] overflow-y-auto panel-scroll">
              {active.map((trip) => (
                <li key={trip.id} className="px-4 py-3 hover:bg-surface-muted/50">
                  <Link href={`/supervisor/trips/${trip.id}`} className="block">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-primary">{trip.id.slice(0, 8)}…</p>
                        <p className="text-xs text-text-secondary mt-0.5">{trip.employeeName}</p>
                      </div>
                      <StatusBadge status={trip.status} />
                    </div>
                    <p className="text-sm text-text mt-2">
                      {trip.pickup} → {trip.destination}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted">
                      <span>{trip.riderName}</span>
                      <span>{trip.motorcyclePlate}</span>
                      <span>{formatKm(trip.distanceKm)}</span>
                      {trip.etaMin != null ? <span>ETA {trip.etaMin} min</span> : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
