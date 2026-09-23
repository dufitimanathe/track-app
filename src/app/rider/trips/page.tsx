"use client";

import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, Tabs } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { mapTrip } from "@/lib/api/mappers";
import { fetchTrips } from "@/lib/api/resources";
import { formatKm, formatRwf } from "@/lib/utils";
import { useAppSelector } from "@/store";
import type { Trip } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function RiderTripsPage() {
  const companyId = useAppSelector((s) => s.auth.companyId);
  const [tab, setTab] = useState("all");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTrips(companyId, {
        limit: 50,
        sort: "createdAt:DESC",
      });
      setTrips(result.items.map(mapTrip));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trips");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (tab === "all") return trips;
    if (tab === "active") {
      return trips.filter((t) =>
        ["in_progress", "to_pickup", "waiting", "assigned"].includes(t.status),
      );
    }
    return trips.filter((t) => t.status === tab);
  }, [tab, trips]);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageHeader
        title="Trip history"
        description="Your completed and active trips."
      />

      {error ? (
        <p className="text-sm text-danger bg-danger-soft rounded-[8px] px-3 py-2">{error}</p>
      ) : null}

      <Tabs
        tabs={[
          { id: "all", label: "All", count: trips.length },
          {
            id: "active",
            label: "Active",
            count: trips.filter((t) =>
              ["in_progress", "to_pickup", "waiting", "assigned"].includes(t.status),
            ).length,
          },
          {
            id: "completed",
            label: "Done",
            count: trips.filter((t) => t.status === "completed").length,
          },
        ]}
        active={tab}
        onChange={setTab}
      />

      {loading ? (
        <EmptyState title="Loading trips…" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No trips in this view" />
      ) : (
        <div className="space-y-3">
          {filtered.map((trip) => (
            <Card key={trip.id} padding="md">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-text">{trip.id.slice(0, 8)}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{trip.employeeName}</p>
                </div>
                <StatusBadge status={trip.status} />
              </div>
              <p className="mt-2 text-sm text-text">
                {trip.pickup} → {trip.destination}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted">
                <span>{formatKm(trip.distanceKm)}</span>
                <span>{formatRwf(trip.cost)}</span>
                {trip.completedAt ? <span>{trip.completedAt}</span> : null}
                {trip.startedAt && !trip.completedAt ? <span>{trip.startedAt}</span> : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
