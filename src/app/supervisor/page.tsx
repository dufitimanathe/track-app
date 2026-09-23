"use client";

import { OpsMap } from "@/components/maps/ops-map";
import { Button } from "@/components/ui/button";
import { Card, MetricCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  alerts,
  dashboardStats,
  motorcycles,
  requests,
  riders,
  trips,
} from "@/data/mock";
import { formatKm, formatRwf, greetingForHour } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedMotorcycleId } from "@/store/slices/ui-slice";
import {
  AlertTriangle,
  Check,
  ClipboardList,
  MapPinned,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function SupervisorDashboardPage() {
  const dispatch = useAppDispatch();
  const { userName } = useAppSelector((s) => s.auth);
  const selectedId = useAppSelector((s) => s.ui.selectedMotorcycleId);
  const [pending, setPending] = useState(
    requests.filter((r) => r.status === "pending"),
  );
  const activeTrips = trips.filter(
    (t) => t.status === "in_progress" || t.status === "to_pickup" || t.status === "waiting",
  );
  const availableRiders = riders.filter((r) => r.availability === "available");

  function decide(id: string, _action: "approve" | "reject") {
    setPending((list) => list.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-5 sm:space-y-6 max-w-[1400px] mx-auto">
      <div>
        <p className="text-sm text-text-secondary">
          {greetingForHour()}, {userName.split(" ")[0]}
        </p>
        <h1 className="text-xl sm:text-2xl font-semibold text-text tracking-tight mt-0.5">
          Supervisor dispatch
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Approve requests, monitor active trips, and keep riders moving.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Pending Requests"
          value={pending.length}
          hint="Needs your decision"
          accent="warning"
          icon={<ClipboardList className="size-4" />}
        />
        <MetricCard
          label="Active Trips"
          value={activeTrips.length}
          hint="Live now"
          accent="primary"
          icon={<MapPinned className="size-4" />}
        />
        <MetricCard
          label="Available Riders"
          value={availableRiders.length}
          hint="Ready to assign"
          accent="success"
          icon={<Users className="size-4" />}
        />
        <MetricCard
          label="Trips Today"
          value={dashboardStats.tripsToday}
          hint={`${dashboardStats.completedToday} completed`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card className="xl:col-span-3 p-0 overflow-hidden" padding="none">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <h2 className="text-base font-semibold text-text">Pending requests</h2>
              <p className="text-xs text-text-muted mt-0.5">Approve or reject</p>
            </div>
            <Link href="/supervisor/requests" className="text-xs font-medium text-primary">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {pending.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-text-secondary">
                No pending requests
              </li>
            ) : (
              pending.map((req) => (
                <li key={req.id} className="px-4 py-3">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-text">{req.employeeName}</p>
                        <StatusBadge status="pending" />
                        {req.aiAssisted ? (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary-soft px-1.5 py-0.5 rounded">
                            AI
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-text-secondary mt-1">
                        {req.pickup} → {req.destination}
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        {req.createdAt} · {formatKm(req.estimatedDistanceKm)} ·{" "}
                        {formatRwf(req.estimatedCost)} · {req.channel}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        leftIcon={<Check className="size-3.5" />}
                        onClick={() => decide(req.id, "approve")}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger-outline"
                        leftIcon={<X className="size-3.5" />}
                        onClick={() => decide(req.id, "reject")}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card className="xl:col-span-2 p-0 overflow-hidden" padding="none">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <h2 className="text-base font-semibold text-text">Active trips</h2>
              <p className="text-xs text-text-muted mt-0.5">In field now</p>
            </div>
            <Link
              href="/supervisor/active-trips"
              className="text-xs font-medium text-primary"
            >
              Open
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {activeTrips.map((trip) => (
              <li key={trip.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text">{trip.id}</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {trip.riderName} · {trip.motorcyclePlate}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {trip.pickup} → {trip.destination}
                    </p>
                  </div>
                  <StatusBadge status={trip.status} />
                </div>
                {trip.etaMin != null ? (
                  <p className="text-[11px] text-text-muted mt-2">ETA {trip.etaMin} min</p>
                ) : null}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <Card className="xl:col-span-3 p-0 overflow-hidden" padding="none">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <h2 className="text-base font-semibold text-text">Fleet snapshot</h2>
              <p className="text-xs text-text-muted mt-0.5">Read-only map for supervisors</p>
            </div>
            <Link href="/supervisor/fleet" className="text-xs font-medium text-primary">
              Full view
            </Link>
          </div>
          <div className="p-3 sm:p-4">
            <OpsMap
              motorcycles={motorcycles}
              selectedId={selectedId}
              onSelect={(m) => dispatch(setSelectedMotorcycleId(m.id))}
              className="h-[240px] sm:h-[300px]"
              compact
            />
          </div>
        </Card>

        <Card className="xl:col-span-2 p-0 overflow-hidden" padding="none">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <h2 className="text-base font-semibold text-text">Alerts</h2>
              <p className="text-xs text-text-muted mt-0.5">Needs awareness</p>
            </div>
            <Link
              href="/supervisor/notifications"
              className="text-xs font-medium text-primary"
            >
              All
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {alerts.slice(0, 4).map((alert) => (
              <li key={alert.id} className="px-4 py-3">
                <div className="flex gap-3">
                  <div
                    className={
                      alert.severity === "critical"
                        ? "mt-0.5 rounded-[8px] bg-danger-soft p-1.5 text-danger"
                        : alert.severity === "warning"
                          ? "mt-0.5 rounded-[8px] bg-warning-soft p-1.5 text-warning"
                          : "mt-0.5 rounded-[8px] bg-primary-soft p-1.5 text-primary"
                    }
                  >
                    <AlertTriangle className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text">{alert.title}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{alert.subtitle}</p>
                    <p className="text-[11px] text-text-muted mt-1">{alert.meta}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
