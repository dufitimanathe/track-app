"use client";

import { OpsMap } from "@/components/maps/ops-map";
import { Card } from "@/components/ui/card";
import { LiveIndicator, PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { motorcycles, trips } from "@/data/mock";
import { formatKm } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedMotorcycleId } from "@/store/slices/ui-slice";
import Link from "next/link";

export default function SupervisorActiveTripsPage() {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((s) => s.ui.selectedMotorcycleId);
  const active = trips.filter(
    (t) =>
      t.status === "in_progress" ||
      t.status === "to_pickup" ||
      t.status === "waiting" ||
      t.status === "assigned",
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      <PageHeader
        title="Active trips"
        description="Live trips under your supervision."
        actions={<LiveIndicator />}
      />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card className="xl:col-span-3 p-0 overflow-hidden" padding="none">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-base font-semibold text-text">Live map</h2>
          </div>
          <div className="p-3 sm:p-4">
            <OpsMap
              motorcycles={motorcycles.filter(
                (m) => m.status === "on_trip" || m.status === "assigned",
              )}
              selectedId={selectedId}
              onSelect={(m) => dispatch(setSelectedMotorcycleId(m.id))}
              className="h-[280px] sm:h-[420px]"
            />
          </div>
        </Card>

        <Card className="xl:col-span-2 p-0 overflow-hidden" padding="none">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-base font-semibold text-text">
              {active.length} in progress
            </h2>
            <Link href="/supervisor/trips" className="text-xs font-medium text-primary">
              History
            </Link>
          </div>
          <ul className="divide-y divide-border max-h-[520px] overflow-y-auto panel-scroll">
            {active.map((trip) => (
              <li key={trip.id} className="px-4 py-3 hover:bg-surface-muted/50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-text">{trip.id}</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {trip.employeeName}
                    </p>
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
                  {trip.currentSpeed != null && trip.currentSpeed > 0 ? (
                    <span>{trip.currentSpeed} km/h</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
